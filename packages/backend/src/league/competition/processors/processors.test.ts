import { describe, expect, it } from "bun:test";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { Rank } from "@scout-for-lol/data";
import { rankToLeaguePoints } from "@scout-for-lol/data";
import { processCriteria } from "./index.js";
import type { PlayerWithAccounts } from "./types.js";

// ============================================================================
// Test Fixtures - Players
// ============================================================================

const playerA: PlayerWithAccounts = {
  id: 1,
  alias: "PlayerA",
  discordId: "discord-a",
  accounts: [
    {
      id: 1,
      alias: "PlayerA",
      puuid: "puuid-a",
      region: "na1",
    },
  ],
};

const playerB: PlayerWithAccounts = {
  id: 2,
  alias: "PlayerB",
  discordId: "discord-b",
  accounts: [
    {
      id: 2,
      alias: "PlayerB",
      puuid: "puuid-b",
      region: "na1",
    },
  ],
};

const playerC: PlayerWithAccounts = {
  id: 3,
  alias: "PlayerC",
  discordId: "discord-c",
  accounts: [
    {
      id: 3,
      alias: "PlayerC",
      puuid: "puuid-c",
      region: "na1",
    },
  ],
};

const allParticipants = [playerA, playerB, playerC];

// ============================================================================
// Test Fixtures - Match Factory
// ============================================================================

function createMatch(
  queueId: number,
  participants: {
    puuid: string;
    championId: number;
    win: boolean;
  }[],
): MatchV5DTOs.MatchDto {
  return {
    metadata: {
      dataVersion: "2",
      matchId: `TEST_${Date.now().toString()}`,
      participants: participants.map((p) => p.puuid),
    },
    info: {
      gameCreation: Date.now(),
      gameDuration: 1800,
      gameEndTimestamp: Date.now(),
      gameId: 1,
      gameMode: "CLASSIC",
      gameName: "",
      gameStartTimestamp: Date.now(),
      gameType: "MATCHED_GAME",
      mapId: 11,
      participants: participants.map((p, index) => ({
        puuid: p.puuid,
        championId: p.championId,
        win: p.win,
        teamId: p.win ? 100 : 200,
        kills: 5,
        deaths: 3,
        assists: 7,
        // Add other required fields with placeholder values
        allInPings: 0,
        assistMePings: 0,
        baitPings: 0,
        baronKills: 0,
        basicPings: 0,
        bountyLevel: 0,
        challenges: {},
        champExperience: 10000,
        champLevel: 18,
        championName: "TestChampion",
        championTransform: 0,
        commandPings: 0,
        consumablesPurchased: 0,
        damageDealtToBuildings: 0,
        damageDealtToObjectives: 0,
        damageDealtToTurrets: 0,
        damageSelfMitigated: 0,
        dangerPings: 0,
        detectorWardsPlaced: 0,
        doubleKills: 0,
        dragonKills: 0,
        eligibleForProgression: true,
        enemyMissingPings: 0,
        enemyVisionPings: 0,
        firstBloodAssist: false,
        firstBloodKill: false,
        firstTowerAssist: false,
        firstTowerKill: false,
        gameEndedInEarlySurrender: false,
        gameEndedInSurrender: false,
        getBackPings: 0,
        goldEarned: 10000,
        goldSpent: 9000,
        holdPings: 0,
        individualPosition: "TOP",
        inhibitorKills: 0,
        inhibitorTakedowns: 0,
        inhibitorsLost: 0,
        item0: 0,
        item1: 0,
        item2: 0,
        item3: 0,
        item4: 0,
        item5: 0,
        item6: 0,
        itemsPurchased: 10,
        killingSprees: 0,
        largestCriticalStrike: 0,
        largestKillingSpree: 0,
        largestMultiKill: 0,
        longestTimeSpentLiving: 0,
        magicDamageDealt: 0,
        magicDamageDealtToChampions: 0,
        magicDamageTaken: 0,
        needVisionPings: 0,
        neutralMinionsKilled: 0,
        nexusKills: 0,
        nexusLost: 0,
        nexusTakedowns: 0,
        objectivesStolen: 0,
        objectivesStolenAssists: 0,
        onMyWayPings: 0,
        participantId: index + 1,
        pentaKills: 0,
        physicalDamageDealt: 0,
        physicalDamageDealtToChampions: 0,
        physicalDamageTaken: 0,
        placement: 0,
        playerAugment1: 0,
        playerAugment2: 0,
        playerAugment3: 0,
        playerAugment4: 0,
        playerScore0: 0,
        playerScore1: 0,
        playerScore2: 0,
        playerScore3: 0,
        playerScore4: 0,
        playerScore5: 0,
        playerScore6: 0,
        playerScore7: 0,
        playerScore8: 0,
        playerScore9: 0,
        playerSubteamId: 0,
        pushPings: 0,
        quadraKills: 0,
        riotIdGameName: "",
        riotIdName: "",
        riotIdTagline: "",
        role: "SOLO",
        sightWardsBoughtInGame: 0,
        spell1Casts: 0,
        spell2Casts: 0,
        spell3Casts: 0,
        spell4Casts: 0,
        subteamPlacement: 0,
        summoner1Casts: 0,
        summoner1Id: 0,
        summoner2Casts: 0,
        summoner2Id: 0,
        summonerId: "",
        summonerLevel: 30,
        summonerName: "",
        teamEarlySurrendered: false,
        teamPosition: "TOP",
        timeCCingOthers: 0,
        timePlayed: 1800,
        totalAllyJungleMinionsKilled: 0,
        totalDamageDealt: 100000,
        totalDamageDealtToChampions: 15000,
        totalDamageShieldedOnTeammates: 0,
        totalDamageTaken: 20000,
        totalEnemyJungleMinionsKilled: 0,
        totalHeal: 5000,
        totalHealsOnTeammates: 0,
        totalMinionsKilled: 200,
        totalTimeCCDealt: 100,
        totalTimeSpentDead: 60,
        totalUnitsHealed: 1,
        tripleKills: 0,
        trueDamageDealt: 0,
        trueDamageDealtToChampions: 0,
        trueDamageTaken: 0,
        turretKills: 0,
        turretTakedowns: 0,
        turretsLost: 0,
        unrealKills: 0,
        visionClearedPings: 0,
        visionScore: 50,
        visionWardsBoughtInGame: 5,
        wardsKilled: 10,
        wardsPlaced: 15,
        // Add missing fields from ParticipantDto
        lane: "MID",
        missions: {},
        perks: {
          statPerks: {
            defense: 0,
            flex: 0,
            offense: 0,
          },
          styles: [],
        },
        retreatPings: 0,
        totalDamageDealtToBuildings: 0,
        totalDamageTakenFromAllSources: 0,
        totalHealsForAlly: 0,
        totalHealsTaken: 0,
        totalMinionsKilledInEnemyJungle: 0,
        totalMinionsKilledInNeutralJungle: 0,
        totalMinionsKilledInTeamJungle: 0,
      })),
      platformId: "NA1",
      queueId,
      teams: [],
      tournamentCode: "",
      endOfGameResult: "WIN",
      gameVersion: "13.1.1",
    },
  } as unknown as MatchV5DTOs.MatchDto;
}

// ============================================================================
// Test Fixtures - Ranks
// ============================================================================

const diamondII: Rank = {
  tier: "diamond",
  division: 2,
  lp: 50,
  wins: 100,
  losses: 80,
};

const diamondIII: Rank = {
  tier: "diamond",
  division: 3,
  lp: 75,
  wins: 90,
  losses: 85,
};

const platinumI: Rank = {
  tier: "platinum",
  division: 1,
  lp: 80,
  wins: 80,
  losses: 70,
};

const goldIV: Rank = {
  tier: "gold",
  division: 4,
  lp: 20,
  wins: 50,
  losses: 50,
};

const diamondIV: Rank = {
  tier: "diamond",
  division: 4,
  lp: 30,
  wins: 120,
  losses: 100,
};

const platinumII: Rank = {
  tier: "platinum",
  division: 2,
  lp: 60,
  wins: 85,
  losses: 75,
};

// ============================================================================
// Tests: Most Games Played
// ============================================================================

describe("processMostGamesPlayed", () => {
  it("should count games in SOLO queue only", () => {
    const matches = [
      // SOLO queue matches
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // ARENA matches
      createMatch(1700, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-b", championId: 2, win: false },
      ]),
      createMatch(1700, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
    ];

    const result = processCriteria({ type: "MOST_GAMES_PLAYED", queue: "SOLO" }, matches, [playerA, playerB]);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    expect(playerAEntry?.score).toBe(2); // 2 solo games
    expect(playerBEntry?.score).toBe(0); // 0 solo games
  });

  it("should count games in ARENA queue only", () => {
    const matches = [
      // SOLO queue matches
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // ARENA matches
      createMatch(1700, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-b", championId: 2, win: false },
      ]),
      createMatch(1700, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
    ];

    const result = processCriteria({ type: "MOST_GAMES_PLAYED", queue: "ARENA" }, matches, [playerA, playerB]);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    expect(playerAEntry?.score).toBe(1); // 1 arena game
    expect(playerBEntry?.score).toBe(2); // 2 arena games
  });

  it("should count games in RANKED_ANY (SOLO + FLEX)", () => {
    const matches = [
      // SOLO queue
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // FLEX queue
      createMatch(440, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // ARENA (should not count)
      createMatch(1700, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
    ];

    const result = processCriteria({ type: "MOST_GAMES_PLAYED", queue: "RANKED_ANY" }, matches, [playerA, playerB]);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    expect(playerAEntry?.score).toBe(3); // 2 solo + 1 flex
    expect(playerBEntry?.score).toBe(0); // 0 ranked games
  });
});

// ============================================================================
// Tests: Highest Rank
// ============================================================================

describe("processHighestRank", () => {
  it("should rank players by current rank (Diamond II > Diamond III > Platinum I)", () => {
    const currentRanks = new Map([
      [playerA.id, { soloRank: diamondII }],
      [playerB.id, { soloRank: platinumI }],
      [playerC.id, { soloRank: diamondIII }],
    ]);

    const result = processCriteria({ type: "HIGHEST_RANK", queue: "SOLO" }, [], allParticipants, {
      currentRanks,
      startSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
      endSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
    });

    // Check that all players are included
    expect(result.length).toBe(3);

    // Check scores (ranks)
    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);
    const playerCEntry = result.find((e) => e.playerId === playerC.id);

    expect(playerAEntry?.score).toEqual(diamondII);
    expect(playerBEntry?.score).toEqual(platinumI);
    expect(playerCEntry?.score).toEqual(diamondIII);

    // Verify LP metadata for ordering
    expect(playerAEntry?.metadata?.["leaguePoints"]).toBe(rankToLeaguePoints(diamondII));
    expect(playerCEntry?.metadata?.["leaguePoints"]).toBe(rankToLeaguePoints(diamondIII));
    expect(playerBEntry?.metadata?.["leaguePoints"]).toBe(rankToLeaguePoints(platinumI));
  });

  it("should use unranked (Iron IV 0 LP) for players without rank", () => {
    const currentRanks = new Map([
      [playerA.id, { soloRank: diamondII }],
      // playerB has no rank
    ]);

    const result = processCriteria({ type: "HIGHEST_RANK", queue: "SOLO" }, [], [playerA, playerB], {
      currentRanks,
      startSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
      endSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
    });

    const playerBEntry = result.find((e) => e.playerId === playerB.id);
    expect(playerBEntry?.score).toEqual({
      tier: "iron",
      division: 4,
      lp: 0,
      wins: 0,
      losses: 0,
    });
  });
});

// ============================================================================
// Tests: Most Rank Climb
// ============================================================================

describe("processMostRankClimb", () => {
  it("should calculate LP gained from start to end", () => {
    const startSnapshots = new Map([
      [playerA.id, { soloRank: goldIV }],
      [playerB.id, { soloRank: platinumII }],
    ]);

    const endSnapshots = new Map([
      [playerA.id, { soloRank: diamondIV }], // Gold IV → Diamond IV = +400 LP
      [playerB.id, { soloRank: platinumI }], // Platinum II → Platinum I = +100 LP
    ]);

    const result = processCriteria({ type: "MOST_RANK_CLIMB", queue: "SOLO" }, [], [playerA, playerB], {
      currentRanks: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
      startSnapshots,
      endSnapshots,
    });

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    const playerALPGain = rankToLeaguePoints(diamondIV) - rankToLeaguePoints(goldIV);
    const playerBLPGain = rankToLeaguePoints(platinumI) - rankToLeaguePoints(platinumII);

    expect(playerAEntry?.score).toBe(playerALPGain);
    expect(playerBEntry?.score).toBe(playerBLPGain);
    expect(playerALPGain).toBeGreaterThan(playerBLPGain);
  });
});

// ============================================================================
// Tests: Most Wins Player
// ============================================================================

describe("processMostWinsPlayer", () => {
  it("should count total wins for each player", () => {
    const matches = [
      // PlayerA: 2 wins
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: false },
        { puuid: "puuid-other", championId: 2, win: true },
      ]),
      // PlayerB: 3 wins
      createMatch(420, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
    ];

    const result = processCriteria({ type: "MOST_WINS_PLAYER", queue: "SOLO" }, matches, [playerA, playerB]);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    expect(playerAEntry?.score).toBe(2);
    expect(playerBEntry?.score).toBe(3);
    expect(playerAEntry?.metadata?.["wins"]).toBe(2);
    expect(playerAEntry?.metadata?.["losses"]).toBe(1);
    expect(playerBEntry?.metadata?.["wins"]).toBe(3);
    expect(playerBEntry?.metadata?.["losses"]).toBe(0);
  });
});

// ============================================================================
// Tests: Most Wins Champion
// ============================================================================

describe("processMostWinsChampion", () => {
  it("should count wins with specific champion only", () => {
    const yasuoId = 157;
    const matches = [
      // PlayerA: 2 Yasuo wins, 1 Yasuo loss
      createMatch(420, [
        { puuid: "puuid-a", championId: yasuoId, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: yasuoId, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-a", championId: yasuoId, win: false },
        { puuid: "puuid-other", championId: 2, win: true },
      ]),
      // PlayerA with other champion (should not count)
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // PlayerB: 1 Yasuo win
      createMatch(420, [
        { puuid: "puuid-b", championId: yasuoId, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      // PlayerB with other champion (should not count)
      createMatch(420, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
      createMatch(420, [
        { puuid: "puuid-b", championId: 1, win: true },
        { puuid: "puuid-other", championId: 2, win: false },
      ]),
    ];

    const result = processCriteria({ type: "MOST_WINS_CHAMPION", championId: yasuoId, queue: "SOLO" }, matches, [
      playerA,
      playerB,
    ]);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);

    expect(playerAEntry?.score).toBe(2); // 2 Yasuo wins
    expect(playerBEntry?.score).toBe(1); // 1 Yasuo win
    expect(playerAEntry?.metadata?.["championId"]).toBe(yasuoId);
    expect(playerAEntry?.metadata?.["games"]).toBe(3); // 3 Yasuo games total
  });
});

// ============================================================================
// Tests: Highest Win Rate
// ============================================================================

describe("processHighestWinRate", () => {
  it("should calculate win rate with minimum games threshold", () => {
    const matches = [
      // PlayerA: 15 wins, 5 losses (75% win rate, 20 games)
      ...Array.from({ length: 15 }, () =>
        createMatch(420, [
          { puuid: "puuid-a", championId: 1, win: true },
          { puuid: "puuid-other", championId: 2, win: false },
        ]),
      ),
      ...Array.from({ length: 5 }, () =>
        createMatch(420, [
          { puuid: "puuid-a", championId: 1, win: false },
          { puuid: "puuid-other", championId: 2, win: true },
        ]),
      ),
      // PlayerB: 8 wins, 2 losses (80% win rate, but only 10 games - exactly at threshold)
      ...Array.from({ length: 8 }, () =>
        createMatch(420, [
          { puuid: "puuid-b", championId: 1, win: true },
          { puuid: "puuid-other", championId: 2, win: false },
        ]),
      ),
      ...Array.from({ length: 2 }, () =>
        createMatch(420, [
          { puuid: "puuid-b", championId: 1, win: false },
          { puuid: "puuid-other", championId: 2, win: true },
        ]),
      ),
      // PlayerC: 10 wins, 10 losses (50% win rate, 20 games)
      ...Array.from({ length: 10 }, () =>
        createMatch(420, [
          { puuid: "puuid-c", championId: 1, win: true },
          { puuid: "puuid-other", championId: 2, win: false },
        ]),
      ),
      ...Array.from({ length: 10 }, () =>
        createMatch(420, [
          { puuid: "puuid-c", championId: 1, win: false },
          { puuid: "puuid-other", championId: 2, win: true },
        ]),
      ),
    ];

    const result = processCriteria({ type: "HIGHEST_WIN_RATE", minGames: 10, queue: "SOLO" }, matches, allParticipants);

    // All players should be included (all have >= 10 games)
    expect(result.length).toBe(3);

    const playerAEntry = result.find((e) => e.playerId === playerA.id);
    const playerBEntry = result.find((e) => e.playerId === playerB.id);
    const playerCEntry = result.find((e) => e.playerId === playerC.id);

    expect(playerAEntry?.score).toBe(0.75); // 75%
    expect(playerBEntry?.score).toBe(0.8); // 80%
    expect(playerCEntry?.score).toBe(0.5); // 50%
  });

  it("should exclude players below minimum games", () => {
    const matches = [
      // PlayerA: 8 wins, 1 loss (only 9 games, below min of 10)
      ...Array.from({ length: 8 }, () =>
        createMatch(420, [
          { puuid: "puuid-a", championId: 1, win: true },
          { puuid: "puuid-other", championId: 2, win: false },
        ]),
      ),
      createMatch(420, [
        { puuid: "puuid-a", championId: 1, win: false },
        { puuid: "puuid-other", championId: 2, win: true },
      ]),
      // PlayerB: 10 wins, 0 losses (exactly 10 games, should be included)
      ...Array.from({ length: 10 }, () =>
        createMatch(420, [
          { puuid: "puuid-b", championId: 1, win: true },
          { puuid: "puuid-other", championId: 2, win: false },
        ]),
      ),
    ];

    const result = processCriteria({ type: "HIGHEST_WIN_RATE", minGames: 10, queue: "SOLO" }, matches, [
      playerA,
      playerB,
    ]);

    // Only PlayerB should be included (PlayerA has < 10 games)
    expect(result.length).toBe(1);
    expect(result[0]?.playerId).toBe(playerB.id);
    expect(result[0]?.score).toBe(1.0); // 100% win rate
  });
});

// ============================================================================
// Tests: Dispatcher Exhaustiveness
// ============================================================================

describe("processCriteria dispatcher", () => {
  it("should handle all criteria types without errors", () => {
    const emptyMatches: MatchV5DTOs.MatchDto[] = [];
    const emptyParticipants: PlayerWithAccounts[] = [];
    const emptySnapshots = {
      currentRanks: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
      startSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
      endSnapshots: new Map<number, { soloRank?: Rank; flexRank?: Rank }>(),
    };

    // This test verifies that TypeScript compilation succeeds with .exhaustive()
    // If any criteria type is missing, TypeScript would fail to compile

    expect(() =>
      processCriteria({ type: "MOST_GAMES_PLAYED", queue: "SOLO" }, emptyMatches, emptyParticipants),
    ).not.toThrow();

    expect(() =>
      processCriteria({ type: "HIGHEST_RANK", queue: "SOLO" }, emptyMatches, emptyParticipants, emptySnapshots),
    ).not.toThrow();

    expect(() =>
      processCriteria({ type: "MOST_RANK_CLIMB", queue: "SOLO" }, emptyMatches, emptyParticipants, emptySnapshots),
    ).not.toThrow();

    expect(() =>
      processCriteria({ type: "MOST_WINS_PLAYER", queue: "SOLO" }, emptyMatches, emptyParticipants),
    ).not.toThrow();

    expect(() =>
      processCriteria({ type: "MOST_WINS_CHAMPION", championId: 1, queue: "SOLO" }, emptyMatches, emptyParticipants),
    ).not.toThrow();

    expect(() =>
      processCriteria({ type: "HIGHEST_WIN_RATE", minGames: 10, queue: "SOLO" }, emptyMatches, emptyParticipants),
    ).not.toThrow();
  });
});
