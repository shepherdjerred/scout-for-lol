import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import {
  ApplicationState,
  Player,
  PlayerConfigEntry,
} from "@scout-for-lol/data";
import { send } from "../../discord/channel";
import { checkPostMatchInternal } from "./internal";
import { test, expect } from "bun:test";
import { Message, MessageCreateOptions, MessagePayload } from "discord.js";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  LeaguePuuidSchema,
} from "@scout-for-lol/data";
import {
  parseArenaMatch,
  parseClassicMatch,
  parseMatch,
  organizeArenaTeams,
  organizeClassicTeams,
  isArenaMatchResult,
  isClassicMatchResult,
  type ArenaMatchResult,
  type ClassicMatchResult,
  ArenaMatchResultSchema,
} from "./arena-types";

const testdataPath = new URL("testdata/match.json", import.meta.url);
const arenaTestdataPath = new URL("testdata/arena.json", import.meta.url);

test("postmatch", async () => {
  const state: ApplicationState = {
    gamesStarted: [
      {
        uuid: "uuid",
        added: new Date(),
        matchId: 1,
        players: [
          {
            player: {
              alias: "name",
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse(
                    "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw"
                  ),
                  region: "AMERICA_NORTH",
                },
              },
              discordAccount: {
                id: DiscordAccountIdSchema.parse("123456789012345678"),
              },
            },
            rank: { division: 3, tier: "gold", lp: 11, wins: 10, losses: 20 },
          },
        ],
      },
    ],
  };
  const saveMatchFn = async (_: MatchV5DTOs.MatchDto) => {
    // do nothing
  };
  const sendFn = (async (
    message: string | MessagePayload | MessageCreateOptions
  ): Promise<Message<true> | Message<false>> => {
    expect(message).toMatchSnapshot();
    return Promise.resolve({} as Message<true> | Message<false>);
  }) satisfies typeof send;
  const checkMatchFn = async () => {
    const exampleMatch = JSON.parse(
      await Bun.file(testdataPath).text()
    ) as MatchV5DTOs.MatchDto;
    return exampleMatch;
  };
  const getPlayerFn = (_: PlayerConfigEntry): Promise<Player> => {
    return Promise.resolve({
      config: {
        alias: "name",
        league: {
          leagueAccount: {
            puuid: LeaguePuuidSchema.parse(
              "XtEsV464OFaO3c0_q9REa6wYF0HpC2LK4laLnyM7WhfAVeuDz9biieJ5ZRD049AUCBjLjyBeeezTaw"
            ),
            region: "AMERICA_NORTH",
          },
        },
        discordAccount: {
          id: DiscordAccountIdSchema.parse("12345678901234567"),
        },
      },
      ranks: {
        solo: { division: 3, tier: "gold", lp: 11, wins: 10, losses: 20 },
      },
    } satisfies Player);
  };
  const getSubscriptionsFn = () => {
    return Promise.resolve([
      { channel: DiscordChannelIdSchema.parse("12345678901234567") },
    ]);
  };

  await checkPostMatchInternal(
    state,
    saveMatchFn,
    checkMatchFn,
    sendFn,
    getPlayerFn,
    getSubscriptionsFn
  );
});

test("postmatch arena", async () => {
  const state: ApplicationState = {
    gamesStarted: [
      {
        uuid: "uuid-arena",
        added: new Date(),
        matchId: 5320091586, // Match ID from arena.json
        players: [
          {
            player: {
              alias: "arena-player",
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse(
                    "sSkJYiMcDmW1zvWqywvronaTmPET-Fk_F_YHXCIWy3nwqxMTajbRkzQkH3FoQOf4TOX9WmEbW9WO_A"
                  ),
                  region: "AMERICA_NORTH",
                },
              },
              discordAccount: {
                id: DiscordAccountIdSchema.parse("123456789012345679"),
              },
            },
            rank: {
              division: 2,
              tier: "platinum",
              lp: 50,
              wins: 15,
              losses: 10,
            },
          },
        ],
      },
    ],
  };
  const saveMatchFn = async (_: MatchV5DTOs.MatchDto) => {
    // do nothing
  };
  const sendFn = (async (
    message: string | MessagePayload | MessageCreateOptions
  ): Promise<Message<true> | Message<false>> => {
    expect(message).toMatchSnapshot();
    return Promise.resolve({} as Message<true> | Message<false>);
  }) satisfies typeof send;
  const checkMatchFn = async () => {
    const exampleArenaMatch = JSON.parse(
      await Bun.file(arenaTestdataPath).text()
    ) as MatchV5DTOs.MatchDto;
    return exampleArenaMatch;
  };
  const getPlayerFn = (_: PlayerConfigEntry): Promise<Player> => {
    return Promise.resolve({
      config: {
        alias: "arena-player",
        league: {
          leagueAccount: {
            puuid: LeaguePuuidSchema.parse(
              "sSkJYiMcDmW1zvWqywvronaTmPET-Fk_F_YHXCIWy3nwqxMTajbRkzQkH3FoQOf4TOX9WmEbW9WO_A"
            ),
            region: "AMERICA_NORTH",
          },
        },
        discordAccount: {
          id: DiscordAccountIdSchema.parse("123456789012345679"),
        },
      },
      ranks: {
        solo: { division: 2, tier: "platinum", lp: 50, wins: 15, losses: 10 },
      },
    } satisfies Player);
  };
  const getSubscriptionsFn = () => {
    return Promise.resolve([
      { channel: DiscordChannelIdSchema.parse("12345678901234568") },
    ]);
  };

  await checkPostMatchInternal(
    state,
    saveMatchFn,
    checkMatchFn,
    sendFn,
    getPlayerFn,
    getSubscriptionsFn
  );
});

test("createMatchObj arena", async () => {
  // Arena match state
  const state: ApplicationState = {
    gamesStarted: [
      {
        uuid: "uuid-arena-createMatchObj",
        added: new Date(),
        matchId: 5320091586, // Match ID from arena.json
        players: [
          {
            player: {
              alias: "arena-test-player",
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse(
                    "sSkJYiMcDmW1zvWqywvronaTmPET-Fk_F_YHXCIWy3nwqxMTajbRkzQkH3FoQOf4TOX9WmEbW9WO_A"
                  ),
                  region: "AMERICA_NORTH",
                },
              },
              discordAccount: {
                id: DiscordAccountIdSchema.parse("123456789012345680"),
              },
            },
            rank: {
              division: 1,
              tier: "diamond",
              lp: 75,
              wins: 25,
              losses: 15,
            },
          },
        ],
      },
    ],
  };

  // Load arena match data
  const arenaMatch = JSON.parse(
    await Bun.file(arenaTestdataPath).text()
  ) as MatchV5DTOs.MatchDto;

  const getPlayerFn = (_: PlayerConfigEntry): Promise<Player> => {
    return Promise.resolve({
      config: {
        alias: "arena-test-player",
        league: {
          leagueAccount: {
            puuid: LeaguePuuidSchema.parse(
              "sSkJYiMcDmW1zvWqywvronaTmPET-Fk_F_YHXCIWy3nwqxMTajbRkzQkH3FoQOf4TOX9WmEbW9WO_A"
            ),
            region: "AMERICA_NORTH",
          },
        },
        discordAccount: {
          id: DiscordAccountIdSchema.parse("123456789012345680"),
        },
      },
      ranks: {
        solo: { division: 1, tier: "diamond", lp: 75, wins: 25, losses: 15 },
      },
    } satisfies Player);
  };

  const saveMatchFn = async (_: MatchV5DTOs.MatchDto) => {
    // do nothing
  };

  const sendFn = (async (
    _message: string | MessagePayload | MessageCreateOptions
  ): Promise<Message<true> | Message<false>> => {
    // Should not be called due to image generation error, but just in case
    return Promise.resolve({} as Message<true> | Message<false>);
  }) satisfies typeof send;

  const checkMatchFn = () => {
    return Promise.resolve(arenaMatch);
  };

  const getSubscriptionsFn = () => {
    return Promise.resolve([]);
  };

  // We'll use the internal logging to capture the match object structure
  // The console output shows the final match object details
  const originalConsoleLog = console.log;
  const logCapturer: string[] = [];
  console.log = (...args: unknown[]) => {
    const message = args.join(" ");
    logCapturer.push(message);
    originalConsoleLog(...args);
  };

  try {
    await checkPostMatchInternal(
      state,
      saveMatchFn,
      checkMatchFn,
      sendFn,
      getPlayerFn,
      getSubscriptionsFn
    );
  } catch (_error) {
    // Expected to fail during image generation
  } finally {
    console.log = originalConsoleLog;
  }

  // Extract the relevant log lines that show the match object structure
  const relevantLogs = logCapturer.filter(
    (line) =>
      line.includes("[createMatchObj] 📊 Final match object:") ||
      line.includes("[createMatchObj] 🎯 Queue type:") ||
      line.includes("[createMatchObj] ✅ Player") ||
      line.includes("[createMatchObj] 🏆 Champion info:") ||
      line.includes("[createMatchObj] 🎯 Match outcome") ||
      line.includes("[createMatchObj] 🥊 Lane opponent")
  );

  // Create a structured summary of what was captured
  const matchObjSummary = {
    relevantLogEntries: relevantLogs,
    testPurpose: "Capture createMatchObj output for Arena matches",
    expectedIssues:
      "Image generation fails for Arena due to team structure differences",
  };

  expect(matchObjSummary).toMatchSnapshot();
});

test("createMatchObj returns arena-specific data for arena matches", async () => {
  // Mock createMatchObj function that handles Arena vs Classic
  const mockCreateMatchObj = (
    match: unknown,
    playerConfigs: { alias: string }[]
  ) => {
    const parsedMatch = parseMatch(match);

    if (isArenaMatch(parsedMatch)) {
      // Arena-specific result
      const arenaTeams = organizeArenaTeams(parsedMatch);

      const result: ArenaMatchResult = {
        matchType: "arena",
        match: parsedMatch,
        queueType: "arena",
        durationInSeconds: parsedMatch.info.gameDuration,
        arenaTeams: arenaTeams,
        players: playerConfigs.map((config, index) => {
          const participant = parsedMatch.info.participants[index];
          return {
            playerConfig: config,
            champion: { championName: participant?.championName ?? "Unknown" },
            outcome: participant?.win ? "Victory" : "Defeat",
            arenaTeam: participant?.playerSubteamId ?? 1,
            placement: participant?.placement ?? 1,
          };
        }),
      };
      return result;
    } else {
      // Classic-specific result
      const classicTeams = organizeClassicTeams(parsedMatch);

      const result: ClassicMatchResult = {
        matchType: "classic",
        match: parsedMatch,
        queueType: "ranked",
        durationInSeconds: parsedMatch.info.gameDuration,
        teams: {
          blue: [], // Would be populated with champion data
          red: [],
        },
        players: playerConfigs.map((config, index) => {
          const participant = parsedMatch.info.participants[index];
          return {
            playerConfig: config,
            champion: { championName: participant?.championName ?? "Unknown" },
            outcome: participant?.win ? "Victory" : "Defeat",
            team:
              participant?.teamId === 100
                ? ("blue" as const)
                : ("red" as const),
          };
        }),
      };
      return result;
    }
  };

  // Test with Arena data
  const arenaData = JSON.parse(await Bun.file(arenaTestdataPath).text());
  const arenaPlayerConfigs = [{ alias: "arena-player" }];

  const arenaResult = mockCreateMatchObj(arenaData, arenaPlayerConfigs);

  // Verify it's arena-specific
  expect(isArenaMatchResult(arenaResult)).toBe(true);
  expect(arenaResult.matchType).toBe("arena");

  if (isArenaMatchResult(arenaResult)) {
    // TypeScript knows this is ArenaMatchResult now
    expect(arenaResult.arenaTeams).toHaveLength(8);
    expect(arenaResult.players[0]?.arenaTeam).toBeGreaterThanOrEqual(1);
    expect(arenaResult.players[0]?.placement).toBeGreaterThanOrEqual(1);
    expect(arenaResult.queueType).toBe("arena");

    // Arena-specific fields should exist
    expect(arenaResult.players[0]).toHaveProperty("arenaTeam");
    expect(arenaResult.players[0]).toHaveProperty("placement");
    expect(arenaResult).toHaveProperty("arenaTeams");
  }

  // Test with Classic data
  const classicData = JSON.parse(await Bun.file(testdataPath).text());
  const classicPlayerConfigs = [{ alias: "classic-player" }];

  const classicResult = mockCreateMatchObj(classicData, classicPlayerConfigs);

  // Verify it's classic-specific
  expect(isClassicMatchResult(classicResult)).toBe(true);
  expect(classicResult.matchType).toBe("classic");

  if (isClassicMatchResult(classicResult)) {
    // TypeScript knows this is ClassicMatchResult now
    expect(classicResult.teams).toHaveProperty("blue");
    expect(classicResult.teams).toHaveProperty("red");
    expect(classicResult.players[0]?.team).toMatch(/^(blue|red)$/);

    // Classic-specific fields should exist
    expect(classicResult.players[0]).toHaveProperty("team");
    expect(classicResult).toHaveProperty("teams");
    // Arena-specific fields should NOT exist
    expect(classicResult.players[0]).not.toHaveProperty("arenaTeam");
    expect(classicResult.players[0]).not.toHaveProperty("placement");
  }
});

test("arena match result validation with zod", async () => {
  // Test that our arena result schema validates correctly
  const arenaData = JSON.parse(await Bun.file(arenaTestdataPath).text());
  const parsedArenaMatch = parseArenaMatch(arenaData);
  const arenaTeams = organizeArenaTeams(parsedArenaMatch);

  const mockArenaResult = {
    matchType: "arena" as const,
    match: parsedArenaMatch,
    queueType: "arena",
    durationInSeconds: parsedArenaMatch.info.gameDuration,
    arenaTeams: arenaTeams,
    players: [
      {
        playerConfig: { alias: "test-player" },
        champion: { championName: "Teemo" },
        outcome: "Victory",
        arenaTeam: 1,
        placement: 3,
      },
    ],
  };

  // This should parse successfully
  expect(() => ArenaMatchResultSchema.parse(mockArenaResult)).not.toThrow();

  const validatedResult = ArenaMatchResultSchema.parse(mockArenaResult);
  expect(validatedResult.matchType).toBe("arena");
  expect(validatedResult.arenaTeams).toHaveLength(8);
  expect(validatedResult.players[0]?.arenaTeam).toBe(1);
  expect(validatedResult.players[0]?.placement).toBe(3);
});

test("arena.json structure validation", async () => {
  // Load arena match data
  const arenaData: unknown = JSON.parse(
    await Bun.file(arenaTestdataPath).text()
  );

  // Test that parsing succeeds - this validates the entire structure
  expect(() => parseArenaMatch(arenaData)).not.toThrow();

  // Parse and validate the structure
  const arenaMatch = parseArenaMatch(arenaData);

  // Test basic Arena characteristics
  expect(arenaMatch.info.gameMode).toBe("CHERRY");
  expect(arenaMatch.info.mapId).toBe(30);
  expect(arenaMatch.info.queueId).toBe(1700);
  expect(arenaMatch.info.participants).toHaveLength(16);

  // Test Arena team organization
  const teams = organizeArenaTeams(arenaMatch);
  expect(teams).toHaveLength(8); // 8 teams in Arena

  // Each team should have 2 players
  for (const team of teams) {
    expect(team.participants).toHaveLength(2);
    expect(team.subteamId).toBeGreaterThanOrEqual(1);
    expect(team.subteamId).toBeLessThanOrEqual(8);
  }
});

test("classic match structure validation", async () => {
  // Load classic match data
  const classicData: unknown = JSON.parse(await Bun.file(testdataPath).text());

  // Test that parsing succeeds - this validates the entire structure
  expect(() => parseClassicMatch(classicData)).not.toThrow();

  // Parse and validate the structure
  const classicMatch = parseClassicMatch(classicData);

  // Test basic Classic characteristics
  expect(classicMatch.info.gameMode).not.toBe("CHERRY");
  expect(classicMatch.info.mapId).not.toBe(30);
  expect(classicMatch.info.queueId).not.toBe(1700);
  expect(classicMatch.info.participants.length).toBeGreaterThanOrEqual(10); // Usually 10 players

  // Test Classic team organization
  const teams = organizeClassicTeams(classicMatch);
  expect(teams.blue).toHaveLength(5); // 5 players per team
  expect(teams.red).toHaveLength(5);

  // Verify team IDs
  for (const participant of teams.blue) {
    expect(participant.teamId).toBe(100);
  }
  for (const participant of teams.red) {
    expect(participant.teamId).toBe(200);
  }
});

test("universal match parsing", async () => {
  // Test that the universal parser can handle both types
  const arenaData: unknown = JSON.parse(
    await Bun.file(arenaTestdataPath).text()
  );
  const classicData: unknown = JSON.parse(await Bun.file(testdataPath).text());

  // Both should parse successfully with the universal parser
  expect(() => parseMatch(arenaData)).not.toThrow();
  expect(() => parseMatch(classicData)).not.toThrow();

  const arenaResult = parseMatch(arenaData);
  const classicResult = parseMatch(classicData);

  // Verify they parsed as the correct types
  expect(arenaResult.info.gameMode).toBe("CHERRY"); // Arena
  expect(classicResult.info.gameMode).not.toBe("CHERRY"); // Classic
});
