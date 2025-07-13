import { test, expect } from "bun:test";
import {
  parseArenaMatch,
  parseClassicMatch,
  organizeArenaTeams,
  organizeClassicTeams,
  ArenaMatchResultSchema,
  ClassicMatchResultSchema,
  type ArenaMatchResult,
  type ClassicMatchResult,
} from "./arena-types";

const arenaTestdataPath = new URL("testdata/arena.json", import.meta.url);
const classicTestdataPath = new URL("testdata/match.json", import.meta.url);

test("arena-specific result structure", async () => {
  // Load and parse arena match
  const arenaData = JSON.parse(
    await Bun.file(arenaTestdataPath).text()
  ) as unknown;
  const arenaMatch = parseArenaMatch(arenaData);
  const arenaTeams = organizeArenaTeams(arenaMatch);

  // Create arena-specific result structure
  const arenaResult: ArenaMatchResult = {
    matchType: "arena",
    match: arenaMatch,
    queueType: "arena",
    durationInSeconds: arenaMatch.info.gameDuration,
    arenaTeams: arenaTeams,
    players: [
      {
        playerConfig: { alias: "arena-player-1" },
        champion: { championName: "Teemo" },
        outcome: "Victory",
        arenaTeam: 1,
        placement: 3,
        rankBeforeMatch: { tier: "GOLD", rank: "II" },
        rankAfterMatch: { tier: "GOLD", rank: "I" },
        wins: 45,
        losses: 32,
      },
      {
        playerConfig: { alias: "arena-player-2" },
        champion: { championName: "Yasuo" },
        outcome: "Defeat",
        arenaTeam: 4,
        placement: 7,
      },
    ],
  };

  // Validate the arena result with Zod
  expect(() => ArenaMatchResultSchema.parse(arenaResult)).not.toThrow();

  // Type guard checks
  expect(arenaResult.matchType).toBe("arena");
  expect(arenaResult.arenaTeams).toHaveLength(8);
  expect(arenaResult.players[0]?.arenaTeam).toBe(1);
  expect(arenaResult.players[0]?.placement).toBe(3);
  expect(arenaResult.players[1]?.arenaTeam).toBe(4);
  expect(arenaResult.players[1]?.placement).toBe(7);
});

test("classic-specific result structure", async () => {
  // Load and parse classic match
  const classicData = JSON.parse(
    await Bun.file(classicTestdataPath).text()
  ) as unknown;
  const classicMatch = parseClassicMatch(classicData);

  // Create classic-specific result structure
  const classicResult: ClassicMatchResult = {
    matchType: "classic",
    match: classicMatch,
    queueType: "ranked",
    durationInSeconds: classicMatch.info.gameDuration,
    teams: {
      blue: [], // Would contain champion data
      red: [],
    },
    players: [
      {
        playerConfig: { alias: "classic-player-1" },
        champion: { championName: "Jinx" },
        outcome: "Victory",
        team: "blue",
        lane: "bottom",
        rankBeforeMatch: { tier: "SILVER", rank: "III" },
        rankAfterMatch: { tier: "SILVER", rank: "II" },
        wins: 22,
        losses: 18,
      },
      {
        playerConfig: { alias: "classic-player-2" },
        champion: { championName: "Thresh" },
        outcome: "Victory",
        team: "blue",
        lane: "support",
      },
    ],
  };

  // Validate the classic result with Zod
  expect(() => ClassicMatchResultSchema.parse(classicResult)).not.toThrow();

  // Type guard checks
  expect(classicResult.matchType).toBe("classic");
  expect(classicResult.teams).toHaveProperty("blue");
  expect(classicResult.teams).toHaveProperty("red");
  expect(classicResult.players[0]?.team).toBe("blue");
  expect(classicResult.players[0]?.lane).toBe("bottom");
  expect(classicResult.players[1]?.team).toBe("blue");
  expect(classicResult.players[1]?.lane).toBe("support");

  // Arena-specific fields should NOT exist
  expect(classicResult.players[0]).not.toHaveProperty("arenaTeam");
  expect(classicResult.players[0]).not.toHaveProperty("placement");
});

test("arena vs classic createMatchObj behavior demonstration", async () => {
  // This test demonstrates how createMatchObj should behave differently
  // for Arena vs Classic matches

  const arenaData = JSON.parse(
    await Bun.file(arenaTestdataPath).text()
  ) as unknown;
  const classicData = JSON.parse(
    await Bun.file(classicTestdataPath).text()
  ) as unknown;

  // Arena match should use Arena parsing
  const arenaMatch = parseArenaMatch(arenaData);
  expect(arenaMatch.info.gameMode).toBe("CHERRY");
  expect(arenaMatch.info.queueId).toBe(1700);

  const arenaTeams = organizeArenaTeams(arenaMatch);
  expect(arenaTeams).toHaveLength(8); // 8 teams in Arena

  // Each arena team should have 2 players
  for (const team of arenaTeams) {
    expect(team.participants).toHaveLength(2);
    expect(team.subteamId).toBeGreaterThanOrEqual(1);
    expect(team.subteamId).toBeLessThanOrEqual(8);
  }

  // Classic match should use Classic parsing
  const classicMatch = parseClassicMatch(classicData);
  expect(classicMatch.info.gameMode).not.toBe("CHERRY");
  expect(classicMatch.info.queueId).not.toBe(1700);

  const classicTeams = organizeClassicTeams(classicMatch);
  expect(classicTeams.blue).toHaveLength(5); // 5 players per team
  expect(classicTeams.red).toHaveLength(5);

  // Verify team IDs are correct
  for (const participant of classicTeams.blue) {
    expect(participant.teamId).toBe(100);
  }
  for (const participant of classicTeams.red) {
    expect(participant.teamId).toBe(200);
  }
});
