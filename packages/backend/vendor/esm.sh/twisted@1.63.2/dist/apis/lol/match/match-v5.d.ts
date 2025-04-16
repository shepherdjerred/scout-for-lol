import { RegionGroups } from '../../../constants/index.d.ts';
import { ApiResponseDTO } from '../../../models-dto/index.d.ts';
import { MatchV5DTOs, MatchV5TimelineDTOs } from '../../../models-dto/matches/match-v5/index.d.ts';
import { MatchQueryV5DTO } from '../../../models-dto/matches/query-v5/index.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
/**
 * Match methods
 */
export declare class MatchV5Api extends BaseApiLol {
    private generateResponse;
    /**
     * Get match details
     * @param matchId Match id
     * @param region
     */
    get(matchId: string, region: RegionGroups): Promise<ApiResponseDTO<MatchV5DTOs.MatchDto>>;
    /**
     * Summoner match listing
     * @param puuid Puuid
     * @param region
     * @returns A list of match ids
     */
    list(puuid: string, region: RegionGroups, query?: MatchQueryV5DTO): Promise<ApiResponseDTO<string[]>>;
    timeline(matchId: string, region: RegionGroups): Promise<ApiResponseDTO<MatchV5TimelineDTOs.MatchTimelineDto>>;
}
