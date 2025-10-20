import { api } from "./api.js";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../model/region.js";
import type { PlayerConfigEntry, MatchId } from "@scout-for-lol/data";
import { MatchIdSchema } from "@scout-for-lol/data";
import { z } from "zod";

/**
 * Fetch recent match IDs for a player
 * Returns up to `count` most recent match IDs
 */
export async function getRecentMatchIds(player: PlayerConfigEntry, count = 5): Promise<MatchId[] | undefined> {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;
  const playerRegion = player.league.leagueAccount.region;

  console.log(`📜 Fetching recent match IDs for player: ${playerAlias} (${playerPuuid}) in region ${playerRegion}`);

  try {
    const startTime = Date.now();
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    const response = await api.MatchV5.list(playerPuuid, regionGroup, { count });

    const apiTime = Date.now() - startTime;

    // The response should be an ApiResponseDTO with a response property containing an array of match IDs
    const matchIdsResult = z.array(MatchIdSchema).safeParse(response.response);

    if (!matchIdsResult.success) {
      console.error(`❌ Failed to parse match IDs for ${playerAlias}:`, matchIdsResult.error);
      return undefined;
    }

    const matchIds = matchIdsResult.data;
    console.log(
      `✅ Successfully fetched ${matchIds.length.toString()} match IDs for ${playerAlias} (${apiTime.toString()}ms)`,
    );

    return matchIds;
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(`ℹ️  Player ${playerAlias} has no match history (404)`);
        return undefined;
      }
      console.error(`❌ HTTP Error ${result.data.status.toString()} for ${playerAlias}`);
    } else {
      console.error(`❌ Error fetching match history for ${playerAlias}:`, e);
    }
    return undefined;
  }
}

/**
 * Filter out match IDs that have already been processed
 * Returns only new matches that come after the lastProcessedMatchId
 */
export function filterNewMatches(matchIds: MatchId[], lastProcessedMatchId: MatchId | undefined | null): MatchId[] {
  if (!lastProcessedMatchId) {
    // If no last processed match, return the most recent match only to avoid spam
    return matchIds.slice(0, 1);
  }

  // Find the index of the last processed match
  const lastProcessedIndex = matchIds.indexOf(lastProcessedMatchId);

  if (lastProcessedIndex === -1) {
    // Last processed match not found in recent history
    // This could happen if player played many games since last check
    // Return only the most recent match to avoid spam
    console.log(
      `⚠️  Last processed match ${lastProcessedMatchId} not found in recent history, returning most recent match only`,
    );
    return matchIds.slice(0, 1);
  }

  if (lastProcessedIndex === 0) {
    // Last processed match is the most recent, no new matches
    return [];
  }

  // Return all matches that come before the last processed match in the array
  // (newer matches have lower indices since the API returns them in descending order)
  return matchIds.slice(0, lastProcessedIndex);
}
