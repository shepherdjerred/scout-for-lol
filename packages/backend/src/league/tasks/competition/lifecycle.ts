import type { CompetitionWithCriteria } from "@scout-for-lol/data";
import { CompetitionIdSchema, parseCompetition } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { createSnapshotsForAllParticipants } from "../../competition/snapshots.js";
import { calculateLeaderboard, type RankedLeaderboardEntry } from "../../competition/leaderboard.js";
import { send as sendChannelMessage, ChannelSendError } from "../../discord/channel.js";
import type { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { z } from "zod";

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
 */
async function handleCompetitionStarts(prismaClient: PrismaClient, now: Date): Promise<void> {
  console.log("[CompetitionLifecycle] Checking for competitions to start...");

  // Find competitions that:
  // 1. Are not cancelled
  // 2. Have a start date that has passed
  // 3. Don't have any START snapshots yet (indicates not started)
  const competitionsToStart = await prismaClient.competition.findMany({
    where: {
      isCancelled: false,
      startDate: {
        lte: now,
      },
      // No START snapshots yet
      snapshots: {
        none: {
          snapshotType: "START",
        },
      },
    },
  });

  if (competitionsToStart.length === 0) {
    console.log("[CompetitionLifecycle] No competitions to start");
    return;
  }

  console.log(`[CompetitionLifecycle] Found ${competitionsToStart.length.toString()} competition(s) to start`);

  // Process each competition
  for (const rawCompetition of competitionsToStart) {
    try {
      console.log(
        `[CompetitionLifecycle] Starting competition ${rawCompetition.id.toString()}: ${rawCompetition.title}`,
      );

      const competition = parseCompetition(rawCompetition);

      // Create START snapshots for all participants
      await createSnapshotsForAllParticipants(
        prismaClient,
        CompetitionIdSchema.parse(competition.id),
        "START",
        competition.criteria,
      );

      // Post start notification to channel
      await postCompetitionStarted(competition);

      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id.toString()} started successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error starting competition ${rawCompetition.id.toString()}:`, error);
      // Continue with other competitions
    }
  }
}

/**
 * Handle competitions that need to end
 * Finds ACTIVE competitions where endDate <= now and creates END snapshots
 */
async function handleCompetitionEnds(prismaClient: PrismaClient, now: Date): Promise<void> {
  console.log("[CompetitionLifecycle] Checking for competitions to end...");

  // Find competitions that:
  // 1. Are not cancelled
  // 2. Have an end date that has passed
  // 3. Have START snapshots (indicates started)
  // 4. Don't have END snapshots yet (indicates not ended)
  const competitionsToEnd = await prismaClient.competition.findMany({
    where: {
      isCancelled: false,
      endDate: {
        lte: now,
      },
      // Have START snapshots (started)
      snapshots: {
        some: {
          snapshotType: "START",
        },
      },
      // Don't have END snapshots yet
      NOT: {
        snapshots: {
          some: {
            snapshotType: "END",
          },
        },
      },
    },
  });

  if (competitionsToEnd.length === 0) {
    console.log("[CompetitionLifecycle] No competitions to end");
    return;
  }

  console.log(`[CompetitionLifecycle] Found ${competitionsToEnd.length.toString()} competition(s) to end`);

  // Process each competition
  for (const rawCompetition of competitionsToEnd) {
    try {
      console.log(`[CompetitionLifecycle] Ending competition ${rawCompetition.id.toString()}: ${rawCompetition.title}`);

      const competition = parseCompetition(rawCompetition);

      // Create END snapshots for all participants
      await createSnapshotsForAllParticipants(
        prismaClient,
        CompetitionIdSchema.parse(competition.id),
        "END",
        competition.criteria,
      );

      // Calculate and post final leaderboard
      const leaderboard = await calculateLeaderboard(prismaClient, competition);
      await postFinalLeaderboard(competition, leaderboard);

      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id.toString()} ended successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error ending competition ${rawCompetition.id.toString()}:`, error);
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
