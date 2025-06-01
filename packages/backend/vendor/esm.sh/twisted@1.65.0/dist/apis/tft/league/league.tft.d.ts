import { Regions, Tiers, Divisions } from '../../../constants/index.d.ts';
import { BaseApiTft } from '../base/base.api.tft.d.ts';
import { LeagueEntryDTO } from '../../../models-dto/league/tft-league/index.d.ts';
import { LeagueListDTO } from '../../../models-dto/index.d.ts';
export declare class LeagueTFTApi extends BaseApiTft {
    /**
     * Get league entries for a given summoner ID
     * @param encryptedSummonerId
     * @param region
     */
    get(encryptedSummonerId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueEntryDTO[]>>;
    /**
     * Get the master league
     * @param region
     */
    getMasterLeague(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get the grandmaster league
     * @param region
     */
    getGrandMasterLeague(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get the challenger league
     * @param region
     */
    getChallengerLeague(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get league entries for given tier and division
     * @param region
     * @param tier
     * @param division
     * @param page defaults to 1
     * @param queue defaults to RANKED_TFT
     */
    getByTierDivision(region: Regions, tier: Tiers, division: Divisions, page?: number, queue?: string): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueEntryDTO[]>>;
}
