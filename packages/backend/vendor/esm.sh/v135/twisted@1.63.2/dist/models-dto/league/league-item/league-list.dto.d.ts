import { LeagueItemDTO } from './league-item.dto.d.ts';
export declare class LeagueListDTO {
    leagueId: string;
    tier: string;
    entries: LeagueItemDTO[];
    queue: string;
    name: string;
}
