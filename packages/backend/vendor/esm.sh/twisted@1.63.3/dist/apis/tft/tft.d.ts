import { BaseApiTft } from './base/base.api.tft.d.ts';
import { MatchTFTApi } from './match/match.tft.d.ts';
import { SummonerTftApi } from './summoner/summoner.d.ts';
import { TFTStaticFiles } from './static/static.d.ts';
import { LeagueTFTApi } from './league/league.tft.d.ts';
import { SpectatorTFTV5Api } from './spectator/spectator-v5.tft.d.ts';
/**
 * TFT Api
 */
export declare class TftApi extends BaseApiTft {
    /**
     * Match methods
     */
    readonly Match: MatchTFTApi;
    /**
     * Summoner methods
     */
    readonly Summoner: SummonerTftApi;
    /**
     * League methods
     */
    readonly League: LeagueTFTApi;
    /**
     * Spectator methods
     */
    readonly SpectatorV5: SpectatorTFTV5Api;
    /**
     * Static files
     */
    readonly StaticFiles: TFTStaticFiles;
}
