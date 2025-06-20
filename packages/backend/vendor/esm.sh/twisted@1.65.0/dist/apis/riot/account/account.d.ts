import { RegionGroups, Games } from "../../../constants/index.d.ts";
import { BaseApiRiot } from "../base/base.api.riot.d.ts";
import { AccountDto } from "../../../models-dto/account/account.dto.d.ts";
import { AccountRegionDto } from "../../../models-dto/account/account-region.dto.d.ts";
export declare class AccountV1Api extends BaseApiRiot {
    /**
     * Get by PUUID
     * @param puuid
     *
     */
    getByPUUID(puuid: string, region: RegionGroups): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<AccountDto>>;
    /**
     * Get by RiotId
     * @param gameName
     * @param tagLine
     * @param region
     *
     */
    getByRiotId(gameName: string, tagLine: string, region: RegionGroups): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<AccountDto>>;
    /**
     * Get active region of a PUUID
     * @param puuid
     * @param game
     * @param region
     *
     */
    getActiveRegion(puuid: string, game: Games, region: RegionGroups): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<AccountRegionDto>>;
}
