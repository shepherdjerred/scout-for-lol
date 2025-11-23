import type { CompetitionWithCriteria } from "@scout-for-lol/data";
import { parseCompetition } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { createSnapshotsForAllParticipants } from "@scout-for-lol/backend/league/competition/snapshots.js";
import { calculateLeaderboard, type RankedLeaderboardEntry } from "@scout-for-lol/backend/league/competition/leaderboard.js";
import { send as sendChannelMessage, ChannelSendError } from "@scout-for-lol/backend/league/discord/channel.js";
import type { PrismaClient } from "@scout-for-lol/backend/generated/prisma/client/index.js";
import { z } from "zod";
import { logNotification } from "@scout-for-lol/backend/utils/notification-logger.js";

// ============================================================================
// Discord Notifications
// ============================================================================

/**
 * Post "competition started" notification to the competition's channel
 */
async function postCompetitionStarted(competition: CompetitionWithCriteria): Promise<void> {
  const message = `🎯 **Competition Started!**

**${competition.title}**
${competition.description}

The competition has officially begun! All participants' starting stats have been captured.

Players can still join with:
\`/competition join competition-id:${competition.id.toString()}\`

Good luck! 🍀`;

  try {
    logNotification("COMPETITION_STARTED", "lifecycle:handleCompetitionStarts", {
      competitionId: competition.id,
      competitionTitle: competition.title,
      channelId: competition.channelId,
      serverId: competition.serverId,
    });
    await sendChannelMessage(message, competition.channelId, competition.serverId);
    console.log(`[CompetitionLifecycle] ✅ Posted start notification for competition ${competition.id.toString()}`);
  } catch (error) {
    // Handle permission errors gracefully - they're expected in some cases
    const channelSendError = z.instanceof(ChannelSendError).safeParse(error);
    if (channelSendError.success && channelSendError.data.isPermissionError) {
      console.warn(
        `[CompetitionLifecycle] ⚠️  Cannot post start notification for competition ${competition.id.toString()} - missing permissions in channel ${competition.channelId}. Server owner has been notified.`,
      );
    } else {
      console.warn(
        `[CompetitionLifecycle] ⚠️  Failed to post start notification for competition ${competition.id.toString()}: ${String(error)}`,
      );
    }
    // Don't throw - notification failure shouldn't stop the lifecycle transition
  }
}

/**
 * Format a leaderboard entry for display
 */
function formatLeaderboardEntry(entry: RankedLeaderboardEntry): string {
  const rankEmoji =
    entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `${entry.rank.toString()}.`;

  let scoreDisplay: string;
  // eslint-disable-next-line no-restricted-syntax -- this is okay because we're narrowing the type
  if (typeof entry.score === "number") {
    scoreDisplay = entry.score.toString();
  } else {
    // It's a Rank object
    scoreDisplay = `${entry.score.tier} ${String(entry.score.division)} ${entry.score.lp.toString()} LP`;
  }

  return `${rankEmoji} **${entry.playerName}** - ${scoreDisplay}`;
}

/**
 * Post final leaderboard to the competition's channel
 */
async function postFinalLeaderboard(
  competition: CompetitionWithCriteria,
  leaderboard: RankedLeaderboardEntry[],
): Promise<void> {
  // Take top 10 entries
  const topEntries = leaderboard.slice(0, 10);

  let message = `🏆 **Competition Ended!**

**${competition.title}**

**Final Leaderboard:**
`;

  if (topEntries.length === 0) {
    message += "\nNo participants completed the competition.";
  } else {
    message += "\n" + topEntries.map(formatLeaderboardEntry).join("\n");

    if (leaderboard.length > 10) {
      message += `\n\n_...and ${(leaderboard.length - 10).toString()} more participants_`;
    }
  }

  message += `\n\nThank you for participating! 🎉`;

  try {
    logNotification("COMPETITION_ENDED", "lifecycle:handleCompetitionEnds", {
      competitionId: competition.id,
      competitionTitle: competition.title,
      channelId: competition.channelId,
      serverId: competition.serverId,
    });
    await sendChannelMessage(message, competition.channelId, competition.serverId);
    console.log(`[CompetitionLifecycle] ✅ Posted final leaderboard for competition ${competition.id.toString()}`);
  } catch (error) {
    // Handle permission errors gracefully - they're expected in some cases
    const channelSendError = z.instanceof(ChannelSendError).safeParse(error);
    if (channelSendError.success && channelSendError.data.isPermissionError) {
      console.warn(
        `[CompetitionLifecycle] ⚠️  Cannot post final leaderboard for competition ${competition.id.toString()} - missing permissions in channel ${competition.channelId}. Server owner has been notified.`,
      );
    } else {
      console.warn(
        `[CompetitionLifecycle] ⚠️  Failed to post final leaderboard for competition ${competition.id.toString()}: ${String(error)}`,
      );
    }
    // Don't throw - notification failure shouldn't stop the lifecycle transition
  }
}

// ============================================================================
// Competition State Transitions
// ============================================================================

/**
 * Handle competitions that need to start
 * Finds DRAFT competitions where startDate <= now and creates START snapshots
 *
 * Note: Season-based competitions have startDate: null in DB, so we must query
 * all unprocessed competitions and filter client-side after parseCompetition()
 * populates dates from seasonId
 */
async function handleCompetitionStarts(prismaClient: PrismaClient, now: Date): Promise<void> {
  console.log("[CompetitionLifecycle] Checking for competitions to start...");

  // Query all competitions that haven't been started yet
  // We can't filter by startDate in the DB query because season-based
  // competitions have startDate: null until parseCompetition() populates it
  const unprocessedCompetitions = await prismaClient.competition.findMany({
    where: {
      isCancelled: false,
      startProcessedAt: null, // Not yet processed
    },
  });

  // Parse to get client-side dates from seasonId, then filter by date
  const competitionsToStart = unprocessedCompetitions
    .map(parseCompetition)
    .filter((comp) => comp.startDate !== null && comp.startDate <= now);

  if (competitionsToStart.length === 0) {
    console.log("[CompetitionLifecycle] No competitions to start");
    return;
  }

  console.log(`[CompetitionLifecycle] Found ${competitionsToStart.length.toString()} competition(s) to start`);

  // Process each competition (already parsed with dates populated)
  for (const competition of competitionsToStart) {
    try {
      console.log(`[CompetitionLifecycle] Starting competition ${competition.id.toString()}: ${competition.title}`);

      // Mark as processed immediately to prevent re-processing
      // This happens before snapshot creation so failures don't cause repeated notifications
      await prismaClient.competition.update({
        where: { id: competition.id },
        data: { startProcessedAt: now },
      });

      // Create START snapshots for all participants
      await createSnapshotsForAllParticipants(prismaClient, competition.id, "START", competition.criteria);

      // Post start notification to channel
      await postCompetitionStarted(competition);

      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id.toString()} started successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error starting competition ${competition.id.toString()}:`, error);
      // Continue with other competitions
    }
  }
}

/**
 * Handle competitions that need to end
 * Finds ACTIVE competitions where endDate <= now and creates END snapshots
 *
 * Note: Season-based competitions have endDate: null in DB, so we must query
 * all unended competitions and filter client-side after parseCompetition()
 * populates dates from seasonId
 */
async function handleCompetitionEnds(prismaClient: PrismaClient, now: Date): Promise<void> {
  console.log("[CompetitionLifecycle] Checking for competitions to end...");

  // Query all competitions that have been started but not ended yet
  // We can't filter by endDate in the DB query because season-based
  // competitions have endDate: null until parseCompetition() populates it
  const unendedCompetitions = await prismaClient.competition.findMany({
    where: {
      isCancelled: false,
      startProcessedAt: { not: null }, // Has been started
      endProcessedAt: null, // Not yet ended
    },
  });

  // Parse to get client-side dates from seasonId, then filter by date
  const competitionsToEnd = unendedCompetitions
    .map(parseCompetition)
    .filter((comp) => comp.endDate !== null && comp.endDate <= now);

  if (competitionsToEnd.length === 0) {
    console.log("[CompetitionLifecycle] No competitions to end");
    return;
  }

  console.log(`[CompetitionLifecycle] Found ${competitionsToEnd.length.toString()} competition(s) to end`);

  // Process each competition (already parsed with dates populated)
  for (const competition of competitionsToEnd) {
    try {
      console.log(`[CompetitionLifecycle] Ending competition ${competition.id.toString()}: ${competition.title}`);

      // Mark as processed immediately to prevent re-processing
      await prismaClient.competition.update({
        where: { id: competition.id },
        data: { endProcessedAt: now },
      });

      // Create END snapshots for all participants
      await createSnapshotsForAllParticipants(prismaClient, competition.id, "END", competition.criteria);

      // Calculate and post final leaderboard
      const leaderboard = await calculateLeaderboard(prismaClient, competition);
      await postFinalLeaderboard(competition, leaderboard);

      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id.toString()} ended successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error ending competition ${competition.id.toString()}:`, error);
      // Continue with other competitions
    }
  }
}

// ============================================================================
// Main Lifecycle Check
// ============================================================================

/**
 * Run lifecycle check for all competitions
 * This function is called by the cron job
 */
export async function runLifecycleCheck(): Promise<void> {
  console.log("[CompetitionLifecycle] Running lifecycle check");

  const now = new Date();

  try {
    // Handle competitions that need to start
    await handleCompetitionStarts(prisma, now);

    // Handle competitions that need to end
    await handleCompetitionEnds(prisma, now);

    console.log("[CompetitionLifecycle] ✅ Lifecycle check complete");
  } catch (error) {
    console.error("[CompetitionLifecycle] ❌ Lifecycle check failed:", error);
    throw error; // Re-throw so cron job can track failures
  }
}
