import { Regions } from '../../../constants/index.d.ts';
import { LolStatusPlatformDataDTO } from '../../../models-dto/index.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
export declare class StatusV4Api extends BaseApiLol {
    /**
     * Lol status by server
     * @param region Riot region
     */
    get(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LolStatusPlatformDataDTO>>;
}
