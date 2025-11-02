import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import { api } from "../../api/api.js";
import { getRecentMatchIds, filterNewMatches } from "../../api/match-history.js";
import {
  getAccountsWithState,
  updateLastProcessedMatch,
  getChannelsSubscribedToPlayers,
  getLastProcessedMatch,
  updateLastMatchTime,
  updateLastCheckedAt,
} from "../../../database/index.js";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.js";
import type { PlayerConfigEntry, LeaguePuuid, Region, MatchId } from "@scout-for-lol/data";
import { MatchIdSchema } from "@scout-for-lol/data";
import { getPlayer } from "../../model/player.js";
import { send } from "../../discord/channel.js";
import { AttachmentBuilder, EmbedBuilder, MessageCreateOptions } from "discord.js";
import { matchToSvg, arenaMatchToSvg, svgToPng } from "@scout-for-lol/report";
import { saveMatchToS3, saveImageToS3, saveSvgToS3 } from "../../../storage/s3.js";
import { toMatch, toArenaMatch } from "../../model/match.js";
import { generateMatchReview } from "../../review/generator.js";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import { shouldCheckPlayer, calculatePollingInterval } from "../../../utils/polling-intervals.js";

type PlayerWithMatchIds = {
  player: PlayerConfigEntry;
  matchIds: MatchId[];
};

/**
 * Fetch match data from Riot API
 */
async function fetchMatchData(matchId: MatchId, playerRegion: Region): Promise<MatchV5DTOs.MatchDto | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    console.log(`[fetchMatchData] 📥 Fetching match data for ${matchId}`);
    const response = await api.MatchV5.get(matchId, regionGroup);

    return response.response;
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(`[fetchMatchData] ℹ️  Match ${matchId} not found (404) - may still be processing`);
        return undefined;
      }
      console.error(`[fetchMatchData] ❌ HTTP Error ${result.data.status.toString()} for match ${matchId}`);
    } else {
      console.error(`[fetchMatchData] ❌ Error fetching match ${matchId}:`, e);
    }
    return undefined;
  }
}

/**
 * Create image attachments for Discord message
 */
async function createMatchImage(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  const isArena = match.queueType === "arena";
  const svg = isArena ? await arenaMatchToSvg(match) : await matchToSvg(match);
  const image = svgToPng(svg);

  // Save both PNG and SVG to S3
  try {
    const queueTypeForStorage = isArena ? "arena" : (match.queueType ?? "unknown");
    await saveImageToS3(matchId, image, queueTypeForStorage);
    await saveSvgToS3(matchId, svg, queueTypeForStorage);
  } catch (error) {
    console.error(`[createMatchImage] Failed to save images to S3:`, error);
  }

  const attachment = new AttachmentBuilder(image).setName("match.png");
  if (!attachment.name) {
    throw new Error("[createMatchImage] Attachment name is null");
  }

  const embed = {
    image: {
      url: `attachment://${attachment.name}`,
    },
  };

  return [attachment, new EmbedBuilder(embed)];
}

/**
 * Process a completed match and send Discord notifications
 */
async function processMatch(matchData: MatchV5DTOs.MatchDto, trackedPlayers: PlayerConfigEntry[]): Promise<void> {
  const matchId = MatchIdSchema.parse(matchData.metadata.matchId);
  console.log(`[processMatch] 🎮 Processing match ${matchId}`);

  try {
    // Save match data to S3
    try {
      await saveMatchToS3(matchData);
    } catch (error) {
      console.error(`[processMatch] Error saving match ${matchId} to S3:`, error);
      // Continue processing even if S3 storage fails
    }

    // Determine which tracked players are in this match
    const playersInMatch = trackedPlayers.filter((player) =>
      matchData.metadata.participants.includes(player.league.leagueAccount.puuid),
    );

    if (playersInMatch.length === 0) {
      console.log(`[processMatch] ⚠️  No tracked players found in match ${matchId}`);
      return;
    }

    console.log(
      `[processMatch] 👥 Found ${playersInMatch.length.toString()} tracked player(s) in match: ${playersInMatch.map((p) => p.alias).join(", ")}`,
    );

    // Get full player data with ranks
    const players = await Promise.all(playersInMatch.map((playerConfig) => getPlayer(playerConfig)));

    // Check if it's an arena match
    const isArena = matchData.info.queueId === 1700;

    if (isArena) {
      console.log(`[processMatch] 🎯 Processing as arena match`);
      const arenaMatch = await toArenaMatch(players, matchData);

      // Create Discord message for arena
      const [attachment, embed] = await createMatchImage(arenaMatch, matchId);

      const message: MessageCreateOptions = {
        files: [attachment],
        embeds: [embed],
      };

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
    } else {
      console.log(`[processMatch] ⚔️  Processing as standard match`);
      // For non-arena, we process match for the first tracked player
      // (multiple tracked players in same match will get separate notifications)
      const player = players[0];
      if (!player) {
        throw new Error("No player data available");
      }
      const completedMatch = toMatch(player, matchData, undefined, undefined);

      // Generate AI review
      let aiReview: string | undefined;
      try {
        aiReview = generateMatchReview(completedMatch);
      } catch (error) {
        console.error(`[processMatch] Error generating AI review:`, error);
      }

      // Create Discord message
      const [attachment, embed] = await createMatchImage(completedMatch, matchId);

      const message: MessageCreateOptions = {
        files: [attachment],
        embeds: [embed],
        ...(aiReview && { content: aiReview }),
      };

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
