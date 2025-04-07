import { Regions } from '../../../constants/index.d.ts';
import { LolStatusDTO } from '../../../models-dto/index.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
export declare class StatusApi extends BaseApiLol {
    /**
     * Lol status by server
     * @param region Riot region
     * @deprecated
     */
    get(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<LolStatusDTO>>;
}
