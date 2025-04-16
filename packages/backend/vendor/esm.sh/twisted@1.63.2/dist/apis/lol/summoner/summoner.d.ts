import { SummonerV4DTO } from '../../../models-dto/summoners/summoner.dto.d.ts';
import { Regions } from '../../../constants/index.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
/**
 * Summoner methods
 */
export declare class SummonerApi extends BaseApiLol {
    private parsePath;
    private genericRequest;
    /**
     * Get by id
     * @param id Summoner id
     * @param region Riot region
     */
    getById(id: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<SummonerV4DTO>>;
    /**
     * Get by PUUID
     * @param puuid
     * @param region Riot region
     */
    getByPUUID(puuid: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<SummonerV4DTO>>;
    /**
     * Get by PUUID
     * @param puuid
     * @param region Riot region
     */
    getByAccountID(accountId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<SummonerV4DTO>>;
}
