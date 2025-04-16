import { Regions } from '../../../constants/index.d.ts';
import { BaseApiTft } from '../base/base.api.tft.d.ts';
import { CurrentGameInfoTFTDTO } from '../../../models-dto/spectator/tft-spectator/current-game-info-tft.dto.d.ts';
import { FeaturedGamesTFTDTO } from '../../../models-dto/spectator/tft-spectator/featured-games-tft.dto.d.ts';
import { BaseApiGames } from '../../../base/base.const.d.ts';
export declare class SpectatorTFTV5Api extends BaseApiTft {
    protected readonly game: BaseApiGames;
    /**
     * Get active games
     * @param puuid
     * @param region
     */
    activeGame(puuid: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<CurrentGameInfoTFTDTO>>;
    /**
     * Get featured games
     * @param region
     */
    featuredGames(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<FeaturedGamesTFTDTO>>;
}
