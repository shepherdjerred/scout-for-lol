import { describe, it, expect } from "bun:test";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { getArenaPlacement } from "../match.js";

function makeParticipant(
  extra: Record<string, unknown> = {},
): MatchV5DTOs.ParticipantDto {
  return {
    puuid: crypto.randomUUID(),
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
    ...extra,
  } satisfies Partial<MatchV5DTOs.ParticipantDto> as MatchV5DTOs.ParticipantDto;
}

describe("arena placement extraction", () => {
  it("returns placement within 1..8", () => {
    for (let p = 1; p <= 8; p++) {
      const dto = makeParticipant({ placement: p, playerSubteamId: 1 });
      expect(getArenaPlacement(dto)).toBe(p);
    }
  });

  it("throws when placement is invalid", () => {
    const dto = makeParticipant({ placement: 0, playerSubteamId: 1 });
    expect(() => getArenaPlacement(dto)).toThrow();
  });
});
