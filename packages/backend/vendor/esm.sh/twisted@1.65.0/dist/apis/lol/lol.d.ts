import { MatchApi } from './match/match.d.ts';
import { LeagueApi } from './league/league.d.ts';
import { SummonerApi } from './summoner/summoner.d.ts';
import { ChampionApi } from './champion/champion.d.ts';
import { SpectatorApi } from './spectator/spectator.d.ts';
import { SpectatorV5Api } from './spectator/spectator-v5.d.ts';
import { StatusApi } from './status/status.d.ts';
import { DataDragonService } from './dataDragon/DataDragonService.d.ts';
import { SeedApi } from './seed/seed.d.ts';
import { BaseApiLol } from './base/base.api.lol.d.ts';
import { ClashApi } from './clash/clash.api.lol.d.ts';
import { MatchV5Api } from './match/match-v5.d.ts';
import { StatusV4Api } from './status/status-v4.d.ts';
import { ChallengesV1Api } from './challenges/challenges.d.ts';
/**
 * Classic league of legends api
 */
export declare class LolApi extends BaseApiLol {
    /**
     * ChallengesV1 methods
     */
    readonly Challenges: ChallengesV1Api;
    /**
     * Match methods
     * @deprecated use v5 instead
     */
    readonly Match: MatchApi;
    /**
     * MatchV5 methods
     */
    readonly MatchV5: MatchV5Api;
    /**
     * League methods
     */
    readonly League: LeagueApi;
    /**
     * Summoner methods
     *
     */
    readonly Summoner: SummonerApi;
    /**
     * Champion mastery
     */
    readonly Champion: ChampionApi;
    /**
     * Spectator methods
     */
    readonly SpectatorV5: SpectatorV5Api;
    /**
     * Spectator methods
     * @deprecated Use SpectatorV5 instead
     */
    readonly Spectator: SpectatorApi;
    /**
     * Status methods
     * @deprecated Use StatusV4 instead
     */
    readonly Status: StatusApi;
    /**
     * StatusV4 methods
     */
    readonly StatusV4: StatusV4Api;
    /**
     * Clash methods
     */
    readonly Clash: ClashApi;
    /**
     * Data dragon
     */
    readonly DataDragon: DataDragonService;
    /**
     * Seed methods
     */
    readonly Seed: SeedApi;
}
