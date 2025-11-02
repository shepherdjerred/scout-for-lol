import { api } from "./api.js";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../model/region.js";
import type { PlayerConfigEntry, LeaguePuuid } from "@scout-for-lol/data";
import { updateLastMatchTime } from "../../database/index.js";
import { getRecentMatchIds } from "./match-history.js";

/**
 * Backfill the lastMatchTime for a newly added player.
 *
 * This fetches the player's most recent match and updates their lastMatchTime
 * in the database. This helps prevent newly added players from being stuck on
 * the 1-minute polling interval when they may be inactive.
 *
 * @param player - Player configuration entry with puuid and region
 * @param puuid - Player's PUUID for database update
 * @returns The timestamp of the most recent match, or undefined if no matches found
 */
export async function backfillLastMatchTime(player: PlayerConfigEntry, puuid: LeaguePuuid): Promise<Date | undefined> {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;
  const playerRegion = player.league.leagueAccount.region;

  console.log(`🔄 Backfilling match history for ${playerAlias} (${playerPuuid})`);

  try {
    // Fetch most recent match ID
    const recentMatchIds = await getRecentMatchIds(player, 1);

    if (!recentMatchIds || recentMatchIds.length === 0) {
      console.log(`ℹ️  No match history found for ${playerAlias}, will use MAX polling interval`);
      return undefined;
    }

    const mostRecentMatchId = recentMatchIds[0];
    if (!mostRecentMatchId) {
      console.log(`ℹ️  No match history found for ${playerAlias}, will use MAX polling interval`);
      return undefined;
    }

    console.log(`📜 Most recent match ID for ${playerAlias}: ${mostRecentMatchId}`);

    // Fetch match details to get game creation time
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);
    const response = await api.MatchV5.get(mostRecentMatchId, regionGroup);
    const matchData = response.response;
    const gameCreationTime = new Date(matchData.info.gameCreation);

    console.log(`✅ Found most recent match for ${playerAlias} at ${gameCreationTime.toISOString()}`);

    // Update the database
    await updateLastMatchTime(puuid, gameCreationTime);

    return gameCreationTime;
  } catch (error) {
    console.error(`❌ Error backfilling match history for ${playerAlias}:`, error);
    return undefined;
  }
}
