import { Regions } from '../../../constants/index.d.ts';
import { ChampionMasteryDTO } from '../../../models-dto/champion/champion-mastery.dto.d.ts';
import { ChampionsScoreDTO } from '../../../models-dto/champion/champions-score.dto.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
/**
 * Third party methods
 */
export declare class ChampionApi extends BaseApiLol {
    /**
     * Get champion rotation
     * @param region Riot region
     */
    rotation(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<unknown>>;
    /**
     * Champion mastery by summoner
     * @param puuid
     * @param region
     */
    masteryByPUUID(puuid: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ChampionMasteryDTO[]>>;
    /**
     * Champion mastery by summoner
     * @param puuid
     * @param region
     */
    masteryByPUUIDChampion(puuid: string, championId: number, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ChampionMasteryDTO>>;
    /**
     * Champions mastery score
     * @param puuid
     * @param region
     */
    championsScore(puuid: string, region: Regions): Promise<ChampionsScoreDTO>;
}
