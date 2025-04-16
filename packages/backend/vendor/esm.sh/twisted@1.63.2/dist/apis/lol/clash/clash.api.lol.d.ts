import { BaseApiLol } from '../base/base.api.lol.d.ts';
import { ClashPlayerDTO } from '../../../models-dto/clash/player.clash.dto.d.ts';
import { Regions } from '../../../constants/index.d.ts';
import { ClashTeamDto } from '../../../models-dto/clash/team.clash.dto.d.ts';
import { TournamentClashDTO } from '../../../models-dto/clash/tournament/tournament.clash.dto.d.ts';
/**
 * Clash api methods
 */
export declare class ClashApi extends BaseApiLol {
    /**
     * This endpoint returns a list of active Clash players for a given summoner ID. If a summoner registers for multiple tournaments at the same time (e.g., Saturday and Sunday) then both registrations would appear in this list.
     * @param region
     * @param summonerId Encrypted summoner id
     */
    playersList(encryptedSummonerId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ClashPlayerDTO[]>>;
    /**
     * Get team by id
     * @param region
     * @param teamId Team id
     */
    getTeamById(teamId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<ClashTeamDto>>;
    /**
     * Returns a list of active and upcoming tournaments.
     * @param region
     */
    getTournaments(region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<TournamentClashDTO[]>>;
    /**
     * Get team tournament
     */
    getTeamTournament(teamId: string, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<TournamentClashDTO>>;
    /**
     * Get tournament by id
     */
    getTournamentById(tournamentId: string | number, region: Regions): Promise<import("../../../models-dto/index.d.ts").ApiResponseDTO<TournamentClashDTO>>;
}
