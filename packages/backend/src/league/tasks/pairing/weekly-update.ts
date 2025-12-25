import { createLogger } from "@scout-for-lol/backend/logger.ts";
import configuration from "@scout-for-lol/backend/configuration.ts";
import { send as sendChannelMessage } from "@scout-for-lol/backend/league/discord/channel.ts";
import {
  type ServerPairingStats,
  type PairingStatsEntry,
  type IndividualPlayerStats,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
} from "@scout-for-lol/data/index";
import { getServerPlayers } from "./get-server-players.ts";
import { calculatePairingStats } from "./calculate-pairings.ts";
import { getCurrentWeekInfo } from "./s3-cache.ts";
import { subWeeks, startOfISOWeek, endOfISOWeek } from "date-fns";
import * as Sentry from "@sentry/bun";

const logger = createLogger("pairing-weekly-update");

// Minimum games required for a pairing to be included in rankings
const MIN_GAMES_FOR_RANKING = 3;

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
    const rank = qualifiedPairings.length - 2 + index;
    lines.push(
      `${rank.toString()}. **${formatPairing(entry)}** - ${formatWinRate(entry.winRate)} (${entry.totalGames.toString()} games)`,
    );
  });

  lines.push("");

  // Full leaderboard
  lines.push("## Full Leaderboard");
  qualifiedPairings.forEach((entry, index) => {
    const rank = index + 1;
    lines.push(
      `${rank.toString()}. ${formatPairing(entry)} - ${formatWinRate(entry.winRate)} (W: ${entry.wins.toString()}, L: ${entry.losses.toString()})`,
    );
  });

  lines.push("");
  lines.push(`*Based on ${stats.totalMatchesAnalyzed.toString()} ranked games (Solo/Flex) from the past month*`);

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
 */
export async function runWeeklyPairingUpdate(): Promise<void> {
  const serverIdRaw = configuration.commonDenominatorServerId;
  const channelIdRaw = configuration.commonDenominatorChannelId;

  if (!serverIdRaw || !channelIdRaw) {
    logger.info(
      "[WeeklyPairing] Common Denominator not configured (missing COMMON_DENOMINATOR_SERVER_ID or COMMON_DENOMINATOR_CHANNEL_ID), skipping",
    );
    return;
  }

  // Validate the IDs using Zod schemas
  const serverIdResult = DiscordGuildIdSchema.safeParse(serverIdRaw);
  const channelIdResult = DiscordChannelIdSchema.safeParse(channelIdRaw);

  if (!serverIdResult.success) {
    logger.error(`[WeeklyPairing] Invalid COMMON_DENOMINATOR_SERVER_ID: ${serverIdRaw}`);
    return;
  }

  if (!channelIdResult.success) {
    logger.error(`[WeeklyPairing] Invalid COMMON_DENOMINATOR_CHANNEL_ID: ${channelIdRaw}`);
    return;
  }

  const serverId = serverIdResult.data;
  const channelId = channelIdResult.data;

  logger.info(`[WeeklyPairing] Running weekly pairing update for server ${serverId}`);

  try {
    // Get all players for the server
    const players = await getServerPlayers(serverId);

    if (players.length === 0) {
      logger.warn("[WeeklyPairing] No players found for server, skipping");
      return;
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

    logger.info("[WeeklyPairing] Sending message to Discord");

    await sendChannelMessage(
      {
        content: `@everyone\n\n${message}`,
      },
      channelId,
      serverId,
    );

    logger.info("[WeeklyPairing] Successfully posted weekly Common Denominator update");
  } catch (error) {
    logger.error("[WeeklyPairing] Error running weekly pairing update:", error);
    Sentry.captureException(error, { tags: { source: "weekly-pairing-update", serverId } });
    throw error;
  }
}
