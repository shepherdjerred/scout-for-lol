import { BannedChampion } from '../../matches/match/match-teams-bans.dto.d.ts';
import { ObserverDTO } from '../observer.dto.d.ts';
import { CurrentGameParticipantDTO } from '../current-game-participant.dto.d.ts';
export declare class CurrentGameInfoTFTDTO {
    gameId: number;
    gameStartTime: number;
    platformId: string;
    gameMode: string;
    mapId: number;
    gameType: string;
    bannedChampions: BannedChampion[];
    observers: ObserverDTO;
    participants: CurrentGameParticipantDTO[];
    gameLength: number;
    gameQueueConfigId: number;
}
