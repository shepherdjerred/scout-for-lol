import { MatchListingDto } from '../../../models-dto/matches/match-listing/match-listing.dto.d.ts';
import { Regions } from '../../../constants/index.d.ts';
import { MatchDto } from '../../../models-dto/matches/match/match.dto.d.ts';
import { MatchTimelineDto } from '../../../models-dto/matches/match-timeline/match-timeline.dto.d.ts';
import { MatchQueryDTO } from '../../../models-dto/matches/query/match-query.dto.d.ts';
import { ApiResponseDTO } from '../../../models-dto/index.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
/**
 * Match methods
 */
export declare class MatchApi extends BaseApiLol {
    private generateResponse;
    private map;
    /**
     * Get match details
     * @param matchId Match id
     * @param region
     * @deprecated
     */
    get(matchId: number, region: Regions): Promise<ApiResponseDTO<MatchDto>>;
    /**
     * Summoner match listing
     * @param encryptedAccountId Encrypted summoner ID. Max length 63 characters.
     * @param region
     * @deprecated
     */
    list(encryptedAccountId: string, region: Regions, query?: MatchQueryDTO): Promise<ApiResponseDTO<MatchListingDto>>;
    /**
     * Timeline
     * @param matchId
     * @param region
     * @deprecated
     */
    timeline(matchId: number, region: Regions): Promise<ApiResponseDTO<MatchTimelineDto>>;
}
