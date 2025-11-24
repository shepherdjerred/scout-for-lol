import type { Region, RiotId } from "@scout-for-lol/data";
import { riotApi } from "@scout-for-lol/backend/league/api/api.js";
import { mapRegionToEnum } from "@scout-for-lol/backend/league/model/region.js";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";

export type PuuidResolutionSuccess = {
  success: true;
  puuid: string;
  lookupTime: number;
};

export type PuuidResolutionFailure = {
  success: false;
  error: string;
};

export type PuuidResolutionResult = PuuidResolutionSuccess | PuuidResolutionFailure;

/**
 * Resolve a Riot ID to a PUUID using Riot's Account API
 * Handles region mapping and error handling
 */
export async function resolvePuuidFromRiotId(riotId: RiotId, region: Region): Promise<PuuidResolutionResult> {
  console.log(`🔍 Looking up Riot ID: ${riotId.game_name}#${riotId.tag_line} in region ${region}`);

  try {
    const apiStartTime = Date.now();
    const regionGroup = regionToRegionGroupForAccountAPI(mapRegionToEnum(region));

    console.log(`🌐 Using region group: ${regionGroup}`);

    const account = await riotApi.Account.getByRiotId(riotId.game_name, riotId.tag_line, regionGroup);

    const lookupTime = Date.now() - apiStartTime;
    const puuid = account.response.puuid;

    console.log(`✅ Successfully resolved Riot ID to PUUID: ${puuid} (${lookupTime.toString()}ms)`);

    return { success: true, puuid, lookupTime };
  } catch (error) {
    console.error(`❌ Failed to resolve Riot ID ${riotId.game_name}#${riotId.tag_line}:`, error);
    return { success: false, error: getErrorMessage(error) };
  }
}
