import { SummonerLeagueDto } from '../../../models-dto/league/summoner-league/summoner-league.dto.d.ts';
import { LeagueEntryDTO } from '../../../models-dto/league/league-exp/league-entry.dto.d.ts';
import { Queues, Tiers, Divisions, Regions } from '../../../constants/index.d.ts';
import { LeagueListDTO } from '../../../models-dto/league/league-item/league-list.dto.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
/**
 * League methods
 */
export declare class LeagueApi extends BaseApiLol {
    /**
     * Get summoner leagues by PUUID
     * @param puuid
     * @param region
     */
    byPUUID(puuid: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<SummonerLeagueDto[]>>;
    /**
     * Get summoner leagues
     * @param encryptedSummonerId Encrypted summoner ID. Max length 63 characters.
     * @param region
     */
    bySummoner(encryptedSummonerId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<SummonerLeagueDto[]>>;
    /**
     * Top league exp
     * @param queue Note that the queue value must be a valid ranked queue.
     * @param tier
     * @param division
     * @param region
     */
    exp(queue: Queues, tier: Tiers, division: Divisions, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueEntryDTO[]>>;
    /**
     * League entries
     * @param queue Note that the queue value must be a valid ranked queue.
     * @param tier
     * @param division
     * @param region
     * @param page defaults to 1
     */
    entries(queue: Queues, tier: Tiers, division: Divisions, region: Regions, page?: number): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueEntryDTO[]>>;
    /**
     * Get league by id
     * @param leagueId
     * @param region
     */
    get(leagueId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get challenger league by queue
     * @param queue Note that the queue value must be a valid ranked queue.
     * @param region
     */
    getChallengerLeaguesByQueue(queue: Queues, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get grandmaster league by queue
     * @param queue Note that the queue value must be a valid ranked queue.
     * @param region
     */
    getGrandMasterLeagueByQueue(queue: Queues, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
    /**
     * Get master league by queue
     * @param queue Note that the queue value must be a valid ranked queue.
     * @param region
     */
    getMasterLeagueByQueue(queue: Queues, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LeagueListDTO>>;
}
