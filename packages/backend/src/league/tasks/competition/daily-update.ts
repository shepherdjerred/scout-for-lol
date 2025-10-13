import { getCompetitionStatus } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { getActiveCompetitions } from "../../../database/competition/queries.js";
import { calculateLeaderboard } from "../../competition/leaderboard.js";
import { generateLeaderboardEmbed } from "../../../discord/embeds/competition.js";
import { send as sendChannelMessage } from "../../discord/channel.js";

// ============================================================================
// Daily Leaderboard Update
// ============================================================================

/**
 * Post daily leaderboard updates for all active competitions
 *
 * This function:
 * 1. Finds all ACTIVE competitions across all servers
 * 2. For each competition:
 *    - Calculates current leaderboard
 *    - Generates formatted embed
 *    - Posts to competition channel
 * 3. Handles errors per-competition (doesn't fail all if one fails)
 * 4. Respects rate limits with delays between posts
 *
 * Called by cron job daily at midnight UTC
 */
export async function runDailyLeaderboardUpdate(): Promise<void> {
  console.log("[DailyLeaderboard] Running daily leaderboard update");

  try {
    // Get all active competitions (across all servers)
    const activeCompetitions = await getActiveCompetitions(prisma);

    console.log(`[DailyLeaderboard] Found ${activeCompetitions.length.toString()} active competition(s)`);

    if (activeCompetitions.length === 0) {
      console.log("[DailyLeaderboard] No active competitions to update");
      return;
    }

    // Process each competition
    let successCount = 0;
    let failureCount = 0;

    for (const competition of activeCompetitions) {
      try {
        console.log(`[DailyLeaderboard] Updating competition ${competition.id.toString()}: ${competition.title}`);

        // Verify competition is actually ACTIVE (not DRAFT, ENDED, or CANCELLED)
        const status = getCompetitionStatus(competition);
        if (status !== "ACTIVE") {
          console.log(
            `[DailyLeaderboard] Skipping competition ${competition.id.toString()} - status is ${status}, not ACTIVE`,
          );
          continue;
        }

        // Calculate current leaderboard
        const leaderboard = await calculateLeaderboard(prisma, competition);

        // Generate embed for the leaderboard
        const embed = generateLeaderboardEmbed(competition, leaderboard);

        // Post to competition channel
        await sendChannelMessage(
          {
            content: `📊 **Daily Leaderboard Update** - ${competition.title}`,
            embeds: [embed],
          },
          competition.channelId,
        );

        console.log(`[DailyLeaderboard] ✅ Updated competition ${competition.id.toString()}`);
        successCount++;

        // Small delay to avoid rate limits (1 second between posts)
        // Discord rate limit is 5 messages per 5 seconds per channel
        // But we're posting to different channels, so 1 second is conservative
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[DailyLeaderboard] ❌ Error updating competition ${competition.id.toString()}:`, error);
        failureCount++;
        // Continue with other competitions - don't let one failure stop all updates
      }
    }

    console.log(
      `[DailyLeaderboard] Daily update complete - ${successCount.toString()} succeeded, ${failureCount.toString()} failed`,
    );
  } catch (error) {
    console.error("[DailyLeaderboard] ❌ Fatal error during daily update:", error);
    throw error; // Re-throw so cron job can track failures
  }
}
