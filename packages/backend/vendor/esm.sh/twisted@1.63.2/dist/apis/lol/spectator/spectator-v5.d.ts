import { Regions } from '../../../constants/index.d.ts';
import { FeaturedGamesDTO } from '../../../models-dto/spectator/featured-games.dto.d.ts';
import { CurrentGameInfoDTO } from '../../../models-dto/spectator/current-game-info.dto.d.ts';
import { SpectatorNotAvailableDTO } from '../../../models-dto/spectator/spectator-not-available.dto.d.ts';
import { BaseApiLol } from '../base/base.api.lol.d.ts';
export declare class SpectatorV5Api extends BaseApiLol {
    private errorHandler;
    /**
     * Get featured games
     * @param region
     */
    featuredGames(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<FeaturedGamesDTO>>;
    /**
     * Get summoner active game
     * @param puuid
     * @param region
     */
    activeGame(puuid: string, region: Regions): Promise<SpectatorNotAvailableDTO | import("../../../models-dto/index.d.ts").ApiResponseDTO<CurrentGameInfoDTO>>;
}
