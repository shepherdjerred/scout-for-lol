import { describe, it, expect } from "bun:test";
import type { ChallengesDto, ParticipantDto, Player, MatchDto } from "@scout-for-lol/data";
import { ArenaMatchSchema, ArenaTeamSchema, LeaguePuuidSchema } from "@scout-for-lol/data";
import { participantToArenaChampion } from "@scout-for-lol/backend/league/model/champion.js";
import { toArenaMatch, toArenaSubteams } from "@scout-for-lol/backend/league/model/match.js";

function makeParticipant(
  overrides: Partial<ParticipantDto> & {
    playerSubteamId: number;
    placement: number;
    puuid: string;
  },
): ParticipantDto {
  const base: Partial<ParticipantDto> = {
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
    challenges: {
      damageTakenOnTeamPercentage: 0.2,
    } satisfies Partial<ChallengesDto> as unknown as ChallengesDto,
  };
  return {
    totalHealsOnTeammates: 300,
    totalDamageShieldedOnTeammates: 500,
    ...base,
    ...overrides,
  } satisfies Partial<ParticipantDto> as unknown as ParticipantDto;
}

function makeArenaMatchDto(): MatchDto {
  const longPuuid = (label: string) => (label + "-".repeat(80)).slice(0, 78);
  const participants: ParticipantDto[] = [];
  for (let sub = 1; sub <= 8; sub++) {
    participants.push(
      makeParticipant({
        playerSubteamId: sub,
        placement: sub,
        puuid: longPuuid(`A${sub.toString()}`),
      }),
    );
    participants.push(
      makeParticipant({
        playerSubteamId: sub,
        placement: sub,
        puuid: longPuuid(`B${sub.toString()}`),
      }),
    );
  }
  return {
    metadata: {
      dataVersion: "",
      matchId: "NA1_1",
      participants: participants.map((p) => p.puuid),
    },
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
      endOfGameResult: "WIN",
      gameVersion: "1.0.0",
    },
  };
}

describe("arena match integration", () => {
  it("builds valid arena subteams and players from MatchDto", async () => {
    const dto = makeArenaMatchDto();
    const subteams = await toArenaSubteams(dto.info.participants);
    const players = await Promise.all(dto.info.participants.map(participantToArenaChampion));

    // Validate subteams against schema and basic expectations
    subteams.forEach((st) => {
      const parsed = ArenaTeamSchema.parse(st);
      expect(parsed.players.length).toBe(2);
    });
    expect(subteams.length).toBe(8);
    expect(players.length).toBe(16);
  });

  it("builds full ArenaMatch via toArenaMatch", async () => {
    const dto = makeArenaMatchDto();
    const first = dto.info.participants[0];
    if (!first) {
      throw new Error("participants should not be empty in test dto");
    }
    const puuid = LeaguePuuidSchema.parse(first.puuid);
    const player: Player = {
      config: {
        alias: "Test",
        league: { leagueAccount: { puuid, region: "PBE" } },
        discordAccount: undefined,
      },
      ranks: {},
    };
    const arenaMatch = await toArenaMatch([player], dto);
    const parsed = ArenaMatchSchema.parse(arenaMatch);
    expect(parsed.queueType).toBe("arena");
    expect(parsed.teams.length).toBe(8);
    expect(parsed.players.length).toBe(1);
    const firstPlayer = parsed.players[0];
    if (!firstPlayer) {
      throw new Error("parsed players should not be empty");
    }
    expect(firstPlayer.placement).toBeGreaterThanOrEqual(1);
    expect(firstPlayer.placement).toBeLessThanOrEqual(8);
  });

  it("builds ArenaMatch with multiple tracked players", async () => {
    const dto = makeArenaMatchDto();
    const first = dto.info.participants[0];
    const second = dto.info.participants[2]; // Different team
    if (!first || !second) {
      throw new Error("participants should not be empty in test dto");
    }

    const puuid1 = LeaguePuuidSchema.parse(first.puuid);
    const puuid2 = LeaguePuuidSchema.parse(second.puuid);

    const player1: Player = {
      config: {
        alias: "Player1",
        league: { leagueAccount: { puuid: puuid1, region: "PBE" } },
        discordAccount: undefined,
      },
      ranks: {},
    };

    const player2: Player = {
      config: {
        alias: "Player2",
        league: { leagueAccount: { puuid: puuid2, region: "PBE" } },
        discordAccount: undefined,
      },
      ranks: {},
    };

    const arenaMatch = await toArenaMatch([player1, player2], dto);
    const parsed = ArenaMatchSchema.parse(arenaMatch);

    expect(parsed.queueType).toBe("arena");
    expect(parsed.teams.length).toBe(8);
    expect(parsed.players.length).toBe(2); // Should have 2 tracked players

    // Verify both players are included
    expect(parsed.players[0]?.champion).toBeDefined();
    expect(parsed.players[1]?.champion).toBeDefined();
    expect(parsed.players[0]?.placement).toBeGreaterThanOrEqual(1);
    expect(parsed.players[1]?.placement).toBeGreaterThanOrEqual(1);
  });
});
