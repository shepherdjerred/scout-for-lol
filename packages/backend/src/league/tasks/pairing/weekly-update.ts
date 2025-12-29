import { createLogger } from "@scout-for-lol/backend/logger.ts";
import { MY_SERVER } from "@scout-for-lol/backend/configuration/flags.ts";
import { send as sendChannelMessage } from "@scout-for-lol/backend/league/discord/channel.ts";
import {
  type ServerPairingStats,
  type PairingStatsEntry,
  type IndividualPlayerStats,
  DiscordChannelIdSchema,
} from "@scout-for-lol/data/index";
import { getServerPlayers } from "./get-server-players.ts";
import { calculatePairingStats } from "./calculate-pairings.ts";
import { getCurrentWeekInfo } from "./s3-cache.ts";
import { startTask, finishTask, isRunning, getTaskInfo } from "./pairing-task-state.ts";
import { subWeeks, startOfISOWeek, endOfISOWeek } from "date-fns";
import * as Sentry from "@sentry/bun";

// Channel ID for Common Denominator updates
const COMMON_DENOMINATOR_CHANNEL_ID = DiscordChannelIdSchema.parse("1337631455085334650");

const logger = createLogger("pairing-weekly-update");

// Minimum games required for a pairing to be included in rankings
const MIN_GAMES_FOR_RANKING = 3;

// Maximum entries to show in the full leaderboard (Discord has a 4000 char limit)
const MAX_LEADERBOARD_ENTRIES = 25;

/**
 * Format win rate as percentage string
 */
function formatWinRate(winRate: number): string {
  return `${(winRate * 100).toFixed(1)}%`;
}

/**
 * Format pairing for display (e.g., "Alice + Bob")
 */
function formatPairing(entry: PairingStatsEntry): string {
  return entry.players.join(" + ");
}

/**
 * Generate the Common Denominator message content
 */
function generateMessage(stats: ServerPairingStats): string {
  const lines: string[] = [];

  lines.push("# COMMON DENOMINATOR UPDATE");
  lines.push("");

  // Find the player who surrenders the most
  const surrenderLeader = findSurrenderLeader(stats.individualStats);
  if (surrenderLeader && surrenderLeader.surrenders > 0) {
    lines.push(`**${surrenderLeader.alias}** surrenders the most (${surrenderLeader.surrenders.toString()} times)`);
    lines.push("");
  }

  // Get pairings with enough games, sorted by win rate
  const qualifiedPairings = stats.pairings
    .filter((p) => p.totalGames >= MIN_GAMES_FOR_RANKING && p.players.length >= 2)
    .sort((a, b) => b.winRate - a.winRate);

  if (qualifiedPairings.length === 0) {
    lines.push("*Not enough games played together to calculate pairings (minimum 3 games required)*");
    return lines.join("\n");
  }

  // Top 3 highest win rate pairings
  lines.push("## Best Pairings");
  const topPairings = qualifiedPairings.slice(0, 3);
  topPairings.forEach((entry, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    lines.push(
      `${medal} ${rank.toString()}. **${formatPairing(entry)}** - ${formatWinRate(entry.winRate)} (${entry.totalGames.toString()} games)`,
    );
  });

  lines.push("");

  // Bottom 3 lowest win rate pairings (reversed for worst first)
  lines.push("## Worst Pairings");
  const bottomPairings = qualifiedPairings.slice(-3).reverse();
  bottomPairings.forEach((entry, index) => {
    const rank = qualifiedPairings.length - index;
    lines.push(
      `${rank.toString()}. **${formatPairing(entry)}** - ${formatWinRate(entry.winRate)} (${entry.totalGames.toString()} games)`,
    );
  });

  lines.push("");

  // Full leaderboard (limited to avoid Discord character limit)
  lines.push("## Full Leaderboard");
  const leaderboardEntries = qualifiedPairings.slice(0, MAX_LEADERBOARD_ENTRIES);
  leaderboardEntries.forEach((entry, index) => {
    const rank = index + 1;
    lines.push(
      `${rank.toString()}. ${formatPairing(entry)} - ${formatWinRate(entry.winRate)} (W: ${entry.wins.toString()}, L: ${entry.losses.toString()})`,
    );
  });

  // Show count of remaining pairings if there are more
  const remainingCount = qualifiedPairings.length - MAX_LEADERBOARD_ENTRIES;
  if (remainingCount > 0) {
    lines.push(`*...and ${remainingCount.toString()} more pairings*`);
  }

  lines.push("");
  lines.push(
    `*Based on ${stats.totalMatchesAnalyzed.toString()} ranked games (Solo/Flex) from the past month. Pairings require ${MIN_GAMES_FOR_RANKING.toString()}+ games to be ranked.*`,
  );

  return lines.join("\n");
}

/**
 * Find the player who surrenders the most
 */
function findSurrenderLeader(individualStats: IndividualPlayerStats[]): IndividualPlayerStats | null {
  if (individualStats.length === 0) {
    return null;
  }

  return individualStats.reduce((leader, current) => (current.surrenders > leader.surrenders ? current : leader));
}

/**
 * Run the weekly Common Denominator update
 * Returns information about whether the task ran and any error message
 */
export async function runWeeklyPairingUpdate(): Promise<{ success: boolean; message: string }> {
  const serverId = MY_SERVER;
  const channelId = COMMON_DENOMINATOR_CHANNEL_ID;

  // Check if already running
  if (isRunning()) {
    const taskInfo = getTaskInfo();
    const runningFor = taskInfo.startedAt ? Math.round((Date.now() - taskInfo.startedAt.getTime()) / 1000) : 0;
    const message = `Pairing update is already running (started ${runningFor.toString()}s ago)`;
    logger.warn(`[WeeklyPairing] ${message}`);
    return { success: false, message };
  }

  // Start the task and get abort signal
  startTask();

  logger.info(`[WeeklyPairing] Running weekly pairing update for server ${serverId}`);

  try {
    // Get all players for the server
    const players = await getServerPlayers(serverId);

    if (players.length === 0) {
      logger.warn("[WeeklyPairing] No players found for server, skipping");
      return { success: true, message: "No players found for server" };
    }

    logger.info(`[WeeklyPairing] Found ${players.length.toString()} players`);

    // Calculate stats for the past month (last 4 weeks)
    // We'll aggregate stats from the past 4 weeks
    const { year: currentYear, weekNumber: currentWeek } = getCurrentWeekInfo();

    logger.info(`[WeeklyPairing] Current week: ${currentYear.toString()}-W${currentWeek.toString()}`);

    // Calculate for the past month (4 weeks before current week)
    const now = new Date();
    const monthAgo = subWeeks(now, 4);
    const startDate = startOfISOWeek(monthAgo);
    const endDate = endOfISOWeek(now);

    logger.info(`[WeeklyPairing] Calculating stats from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Calculate stats directly for the full period
    // Note: We use per-week caching for individual weeks if needed, but for the monthly report
    // we calculate the full period
    const stats = await calculatePairingStats(players, startDate, endDate, serverId);

    logger.info(
      `[WeeklyPairing] Calculated stats: ${stats.totalMatchesAnalyzed.toString()} matches, ${stats.pairings.length.toString()} pairings`,
    );

    // Generate and send the message
    const message = generateMessage(stats);

    // Log the full message for debugging
    logger.info("[WeeklyPairing] Generated message:");
    logger.info(message);

    // Log all qualified pairings to console for debugging
    const qualifiedPairings = stats.pairings
      .filter((p) => p.totalGames >= MIN_GAMES_FOR_RANKING && p.players.length >= 2)
      .sort((a, b) => b.winRate - a.winRate);

    logger.info(`[WeeklyPairing] Full pairings list (${qualifiedPairings.length.toString()} total):`);
    qualifiedPairings.forEach((entry, index) => {
      const rank = index + 1;
      logger.info(
        `  ${rank.toString()}. ${entry.players.join(" + ")} - ${(entry.winRate * 100).toFixed(1)}% (W: ${entry.wins.toString()}, L: ${entry.losses.toString()})`,
      );
    });

    logger.info("[WeeklyPairing] Sending message to Discord");

    await sendChannelMessage(
      {
        content: `@everyone\n\n${message}`,
      },
      channelId,
      serverId,
    );

    logger.info("[WeeklyPairing] Successfully posted weekly Common Denominator update");
    return { success: true, message: `Completed: ${stats.totalMatchesAnalyzed.toString()} matches analyzed` };
  } catch (error) {
    logger.error("[WeeklyPairing] Error running weekly pairing update:", error);
    Sentry.captureException(error, { tags: { source: "weekly-pairing-update", serverId } });
    throw error;
  } finally {
    finishTask();
  }
}
