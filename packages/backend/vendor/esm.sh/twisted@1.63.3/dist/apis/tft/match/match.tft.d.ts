import { RegionGroups } from '../../../constants/index.d.ts';
import { BaseApiTft } from '../base/base.api.tft.d.ts';
import { MatchTFTDTO } from '../../../models-dto/matches/tft-matches/match-tft.dto.d.ts';
import { MatchTFTQueryDTO } from '../../../models-dto/matches/tft-matches/match-tft-query.dto.d.ts';
export declare class MatchTFTApi extends BaseApiTft {
    /**
     * Get match by id
     * @param matchId
     * @param region
     */
    get(matchId: string, region: RegionGroups): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<MatchTFTDTO>>;
    /**
     * Get match listing
     * @param summonerPUUID
     * @param region
     */
    list(summonerPUUID: string, region: RegionGroups, query?: MatchTFTQueryDTO): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<string[]>>;
    /**
     * Get match listing (with details)
     */
    listWithDetails(summonerPUUID: string, region: RegionGroups, query?: MatchTFTQueryDTO): Promise<MatchTFTDTO[]>;
}
