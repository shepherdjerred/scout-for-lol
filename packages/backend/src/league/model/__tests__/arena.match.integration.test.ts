import { describe, it, expect } from "bun:test";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { ArenaSubteamSchema } from "@scout-for-lol/data";
import { participantToArenaChampion } from "../champion.js";
import { toArenaSubteams } from "../match.js";

function makeParticipant(overrides: Partial<MatchV5DTOs.ParticipantDto> & { playerSubteamId: number; placement: number; puuid: string; }): MatchV5DTOs.ParticipantDto {
  const base: Partial<MatchV5DTOs.ParticipantDto> = {
    riotIdGameName: "P#NA1",
    summonerName: "P",
    championName: "Lux",
    kills: 1,
    deaths: 1,
    assists: 1,
    champLevel: 18,
    item0: 0,
    item1: 0,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 0,
    summoner1Id: 4,
    summoner2Id: 7,
    totalMinionsKilled: 0,
    neutralMinionsKilled: 0,
    visionScore: 0,
    totalDamageDealtToChampions: 0,
    goldEarned: 0,
    teamPosition: "UTILITY",
    teamId: 100,
    playerAugment1: 0,
    playerAugment2: 0,
    playerAugment3: 0,
    playerAugment4: 0,
    playerAugment5: 0,
    playerAugment6: 0,
    PlayerScore0: 0,
    PlayerScore1: 0,
    PlayerScore2: 0,
    PlayerScore3: 0,
    PlayerScore4: 0,
    PlayerScore5: 0,
    PlayerScore6: 0,
    PlayerScore7: 0,
    PlayerScore8: 0,
  };
  return { ...base, ...overrides } as MatchV5DTOs.ParticipantDto;
}

function makeArenaMatchDto(): MatchV5DTOs.MatchDto {
  const participants: MatchV5DTOs.ParticipantDto[] = [];
  for (let sub = 1; sub <= 8; sub++) {
    participants.push(makeParticipant({ playerSubteamId: sub, placement: sub, puuid: `A${sub}` }));
    participants.push(makeParticipant({ playerSubteamId: sub, placement: sub, puuid: `B${sub}` }));
  }
  return {
    metadata: { dataVersion: "", matchId: "NA1_1", participants: participants.map(p => p.puuid) },
    info: {
      gameCreation: Date.now(),
      gameDuration: 900,
      gameEndTimestamp: Date.now(),
      gameId: 1,
      gameMode: "CHERRY",
      gameName: "",
      gameStartTimestamp: Date.now(),
      gameType: "MATCHED_GAME",
      mapId: 30,
      participants,
      platformId: "NA1",
      queueId: 1700,
      teams: [],
      tournamentCode: "",
    }
  } as unknown as MatchV5DTOs.MatchDto;
}

describe("arena match integration", () => {
  it("builds valid arena subteams and players from MatchDto", () => {
    const dto = makeArenaMatchDto();
    const subteams = toArenaSubteams(dto.info.participants);
    const players = dto.info.participants.map(participantToArenaChampion);

    // Validate subteams against schema and basic expectations
    subteams.forEach((st) => {
      const parsed = ArenaSubteamSchema.parse(st);
      expect(parsed.players.length).toBe(2);
    });
    expect(subteams.length).toBe(8);
    expect(players.length).toBe(16);
  });
});
