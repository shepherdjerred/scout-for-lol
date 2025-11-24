import type { MatchDto , PlayerConfigEntry, LeaguePuuid, MatchId } from "@scout-for-lol/data";
import { getRecentMatchIds, filterNewMatches } from "@scout-for-lol/backend/league/api/match-history.js";
import {
  getAccountsWithState,
  updateLastProcessedMatch,
  getChannelsSubscribedToPlayers,
  getLastProcessedMatch,
  updateLastMatchTime,
  updateLastCheckedAt,
} from "@scout-for-lol/backend/database/index.js";
import { MatchIdSchema } from "@scout-for-lol/data";
import { send } from "@scout-for-lol/backend/league/discord/channel.js";
import { shouldCheckPlayer, calculatePollingInterval } from "@scout-for-lol/backend/utils/polling-intervals.js";
import {
  fetchMatchData,
  generateMatchReport,
} from "@scout-for-lol/backend/league/tasks/postmatch/match-report-generator.js";

type PlayerWithMatchIds = {
  player: PlayerConfigEntry;
  matchIds: MatchId[];
};

/**
 * Process a completed match and send Discord notifications
 */
async function processMatch(matchData: MatchDto, trackedPlayers: PlayerConfigEntry[]): Promise<void> {
  const matchId = MatchIdSchema.parse(matchData.metadata.matchId);
  console.log(`[processMatch] 🎮 Processing match ${matchId}`);

  try {
    // Generate the match report message
    const message = await generateMatchReport(matchData, trackedPlayers);

    if (!message) {
      console.log(`[processMatch] ⚠️  No message generated for match ${matchId}`);
      return;
    }

    // Determine which tracked players are in this match
    const playersInMatch = trackedPlayers.filter((player) =>
      matchData.metadata.participants.includes(player.league.leagueAccount.puuid),
    );

    // Get channels to notify
    const puuids: LeaguePuuid[] = playersInMatch.map((p) => p.league.leagueAccount.puuid);
    const channels = await getChannelsSubscribedToPlayers(puuids);

    console.log(`[processMatch] 📢 Sending notifications to ${channels.length.toString()} channel(s)`);

    // Send to all subscribed channels
    for (const { channel } of channels) {
      try {
        await send(message, channel);
        console.log(`[processMatch] ✅ Sent notification to channel ${channel}`);
      } catch (error) {
        console.error(`[processMatch] ❌ Failed to send notification to channel ${channel}:`, error);
      }
    }

    console.log(`[processMatch] ✅ Successfully processed match ${matchId}`);
  } catch (error) {
    console.error(`[processMatch] ❌ Error processing match ${matchId}:`, error);
    throw error;
  }
}

/**
 * Main function to check for new matches via match history polling
 */
export async function checkMatchHistory(): Promise<void> {
  console.log("🔍 Starting match history polling check");
  const startTime = Date.now();

  try {
    // Get all tracked player accounts with their polling state
    const accountsWithState = await getAccountsWithState();
    console.log(`📊 Found ${accountsWithState.length.toString()} total player account(s)`);

    if (accountsWithState.length === 0) {
      console.log("⏸️  No players to check");
      return;
    }

    const currentTime = new Date();

    // Track distribution of players across polling intervals for monitoring
    const intervalDistribution = new Map<number, number>();
    for (const { lastMatchTime } of accountsWithState) {
      const interval = calculatePollingInterval(lastMatchTime, currentTime);
      intervalDistribution.set(interval, (intervalDistribution.get(interval) ?? 0) + 1);
    }

    // Log interval distribution
    for (const [interval, count] of intervalDistribution.entries()) {
      console.log(`📊 Polling interval ${interval.toString()}min: ${count.toString()} account(s)`);
    }

    // Filter to only players that should be checked this cycle
    const playersToCheck = accountsWithState.filter(({ lastMatchTime, lastCheckedAt }) =>
      shouldCheckPlayer(lastMatchTime, lastCheckedAt, currentTime),
    );

    console.log(
      `📊 ${playersToCheck.length.toString()} / ${accountsWithState.length.toString()} account(s) should be checked this cycle`,
    );

    if (playersToCheck.length === 0) {
      console.log("⏸️  No players to check this cycle (based on polling intervals)");
      return;
    }

    // Fetch recent match IDs for each player
    const playersWithMatches: PlayerWithMatchIds[] = [];

    for (const { config: player, lastMatchTime, lastCheckedAt } of playersToCheck) {
      const puuid = player.league.leagueAccount.puuid;
      const interval = calculatePollingInterval(lastMatchTime, currentTime);

      console.log(
        `[${player.alias}] 🔍 Checking match history (interval: ${interval.toString()}min, last match: ${lastMatchTime ? lastMatchTime.toISOString() : "never"}, last checked: ${lastCheckedAt ? lastCheckedAt.toISOString() : "never"})`,
      );

      try {
        // Query the last processed match ID from the database
        const lastProcessedMatchId = await getLastProcessedMatch(puuid);

        const recentMatchIds = await getRecentMatchIds(player, 5);

        // Update lastCheckedAt regardless of whether we found matches
        await updateLastCheckedAt(puuid, currentTime);

        if (!recentMatchIds || recentMatchIds.length === 0) {
          console.log(`[${player.alias}] ℹ️  No recent matches found`);
          continue;
        }

        // Filter to only new matches
        const newMatchIds = filterNewMatches(recentMatchIds, lastProcessedMatchId);

        if (newMatchIds.length === 0) {
          console.log(`[${player.alias}] ✅ No new matches to process`);
          continue;
        }

        console.log(
          `[${player.alias}] 🆕 Found ${newMatchIds.length.toString()} new match(es): ${newMatchIds.join(", ")}`,
        );
        playersWithMatches.push({ player, matchIds: newMatchIds });
      } catch (error) {
        console.error(`[${player.alias}] ❌ Error checking match history:`, error);
        // Continue with next player even if this one fails
      }
    }

    if (playersWithMatches.length === 0) {
      console.log("✅ No new matches found for any players");
      const totalTime = Date.now() - startTime;
      console.log(`⏱️  Match history check completed in ${totalTime.toString()}ms`);
      return;
    }

    console.log(
      `🎮 Processing ${playersWithMatches.reduce((sum, p) => sum + p.matchIds.length, 0).toString()} new match(es) from ${playersWithMatches.length.toString()} player(s)`,
    );

    // Get all player configs for match processing (we need all configs, not just the ones we checked)
    const allPlayerConfigs = accountsWithState.map((a) => a.config);

    // Process each match
    // We need to deduplicate matches since multiple tracked players might be in the same game
    const processedMatchIds = new Set<MatchId>();

    for (const { player, matchIds } of playersWithMatches) {
      for (const matchId of matchIds) {
        try {
          // Skip if we've already processed this match in this run
          if (processedMatchIds.has(matchId)) {
            console.log(`[${player.alias}] ⏭️  Match ${matchId} already processed in this run`);
            continue;
          }

          // Fetch match data
          const matchData = await fetchMatchData(matchId, player.league.leagueAccount.region);

          if (!matchData) {
            console.log(`[${player.alias}] ⚠️  Could not fetch match data for ${matchId}, skipping`);
            continue;
          }

          // Get all tracked players in this match
          const allTrackedPlayers = allPlayerConfigs.filter((p) =>
            matchData.metadata.participants.includes(p.league.leagueAccount.puuid),
          );

          // Process the match
          await processMatch(matchData, allTrackedPlayers);

          // Mark as processed
          processedMatchIds.add(matchId);

          // Get match creation time for activity tracking
          const matchCreationTime = new Date(matchData.info.gameCreation);

          // Update lastProcessedMatchId and lastMatchTime for all players in this match
          for (const trackedPlayer of allTrackedPlayers) {
            const playerPuuid = trackedPlayer.league.leagueAccount.puuid;
            await updateLastProcessedMatch(playerPuuid, matchId);
            await updateLastMatchTime(playerPuuid, matchCreationTime);
            console.log(
              `[${trackedPlayer.alias}] 📝 Updated lastProcessedMatchId to ${matchId}, lastMatchTime to ${matchCreationTime.toISOString()}`,
            );
          }
        } catch (error) {
          console.error(`[${player.alias}] ❌ Error processing match ${matchId}:`, error);
          // Continue with next match even if this one fails
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Match history check completed in ${totalTime.toString()}ms`);
    console.log(`📊 Processed ${processedMatchIds.size.toString()} unique match(es)`);
  } catch (error) {
    console.error("❌ Error in match history check:", error);
    throw error;
  }
}
