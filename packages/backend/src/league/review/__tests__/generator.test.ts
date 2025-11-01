import { describe, expect, test } from "bun:test";
import { generateMatchReview } from "../generator.ts";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";
import { DiscordAccountIdSchema, LeaguePuuidSchema } from "@scout-for-lol/data";

import { testGuildId, testAccountId, testChannelId, testPuuid, testDate } from "../../../testing/test-ids.js";
describe("generateMatchReview", () => {
  describe("regular matches", () => {
    test("generates review for a solo queue victory", () => {
      // Use minimal type-safe fixture - only testing review generation logic
      const match = {
        queueType: "solo",
        durationInSeconds: 1800,
        players: [
          {
            playerConfig: {
              alias: "TestPlayer",
              discord: { discordUserId: testAccountId("12300000000000000") },
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse("test-puuid") as unknown,
                  region: "AMERICA_NORTH",
                  gameName: "TestPlayer",
                  tagLine: "NA1",
                },
              },
            },
            rankBeforeMatch: { tier: "gold", division: 2, leaguePoints: 50 },
            rankAfterMatch: { tier: "gold", division: 2, leaguePoints: 65 },
            wins: 50,
            losses: 48,
            champion: {
              championName: "Jinx",
              kills: 10,
              deaths: 3,
              assists: 8,
              cs: 200,
              lane: "adc",
              items: [],
              summonerSpells: { spell1: 4, spell2: 7 },
            },
            outcome: "Victory",
            team: "blue",
            lane: "adc",
            laneOpponent: {
              championName: "Caitlyn",
              kills: 3,
              deaths: 10,
              assists: 5,
              cs: 180,
              lane: "adc",
              items: [],
              summonerSpells: { spell1: 4, spell2: 7 },
            },
          },
        ],
        teams: {
          blue: [],
          red: [],
        },
      } as unknown as CompletedMatch;

      const review = generateMatchReview(match);

      expect(review).toContain("TestPlayer");
      expect(review).toContain("Jinx");
      expect(review).toContain("solo");
      expect(review).toContain("Victory");
      expect(review).toContain("10/3/8");
    });

    test("generates review for a flex queue defeat", () => {
      const match = {
        queueType: "flex",
        durationInSeconds: 2100,
        players: [
          {
            playerConfig: {
              alias: "Player2",
              discord: { discordUserId: testAccountId("45600000000000000") },
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse("test-puuid-2") as unknown,
                  region: "AMERICA_NORTH",
                  gameName: "Player2",
                  tagLine: "NA1",
                },
              },
            },
            rankBeforeMatch: { tier: "silver", division: 3, leaguePoints: 30 },
            rankAfterMatch: { tier: "silver", division: 3, leaguePoints: 15 },
            wins: 25,
            losses: 27,
            champion: {
              championName: "Yasuo",
              kills: 5,
              deaths: 8,
              assists: 4,
              cs: 150,
              lane: "middle",
              items: [],
              summonerSpells: { spell1: 4, spell2: 12 },
            },
            outcome: "Defeat",
            team: "red",
            lane: "middle",
            laneOpponent: undefined,
          },
        ],
        teams: {
          blue: [],
          red: [],
        },
      } as unknown as CompletedMatch;

      const review = generateMatchReview(match);

      expect(review).toContain("Player2");
      expect(review).toContain("Yasuo");
      expect(review).toContain("flex");
      expect(review).toContain("Defeat");
      expect(review).toContain("5/8/4");
    });
  });

  describe("arena matches", () => {
    test("generates review for arena match with 1st place", () => {
      const match = {
        queueType: "arena",
        durationInSeconds: 1200,
        players: [
          {
            playerConfig: {
              alias: "ArenaPlayer",
              discord: { discordUserId: testAccountId("78900000000000000") },
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse("arena-puuid") as unknown,
                  region: "AMERICA_NORTH",
                  gameName: "ArenaPlayer",
                  tagLine: "NA1",
                },
              },
            },
            placement: 1,
            champion: {
              championName: "Zed",
              riotIdGameName: "ArenaPlayer#NA1",
              kills: 15,
              deaths: 2,
              assists: 10,
              level: 18,
              items: [],
              gold: 10000,
              damage: 50000,
              augments: [],
              arenaMetrics: {
                augmentChoices: [],
              },
              teamSubteamId: 1,
            },
            teamId: 1,
            teammate: {
              championName: "Talon",
              riotIdGameName: "Teammate#NA1",
              kills: 12,
              deaths: 3,
              assists: 11,
              level: 18,
              items: [],
              gold: 9500,
              damage: 45000,
              augments: [],
              arenaMetrics: {
                augmentChoices: [],
              },
              teamSubteamId: 1,
            },
          },
        ],
        teams: [],
      } as unknown as ArenaMatch;

      const review = generateMatchReview(match);

      expect(review).toContain("ArenaPlayer");
      expect(review).toContain("1st place");
      expect(review).toContain("Zed");
      expect(review).toContain("Talon");
    });

    test("generates review for arena match with 4th place", () => {
      const match = {
        queueType: "arena",
        durationInSeconds: 900,
        players: [
          {
            playerConfig: {
              alias: "ArenaPlayer2",
              discord: { discordUserId: testAccountId("89000000000000000") },
              league: {
                leagueAccount: {
                  puuid: LeaguePuuidSchema.parse("arena-puuid-2") as unknown,
                  region: "AMERICA_NORTH",
                  gameName: "ArenaPlayer2",
                  tagLine: "NA1",
                },
              },
            },
            placement: 4,
            champion: {
              championName: "Ahri",
              riotIdGameName: "ArenaPlayer2#NA1",
              kills: 8,
              deaths: 5,
              assists: 6,
              level: 16,
              items: [],
              gold: 8000,
              damage: 35000,
              augments: [],
              arenaMetrics: {
                augmentChoices: [],
              },
              teamSubteamId: 4,
            },
            teamId: 4,
            teammate: {
              championName: "Lux",
              riotIdGameName: "Teammate2#NA1",
              kills: 7,
              deaths: 5,
              assists: 8,
              level: 16,
              items: [],
              gold: 7800,
              damage: 33000,
              augments: [],
              arenaMetrics: {
                augmentChoices: [],
              },
              teamSubteamId: 4,
            },
          },
        ],
        teams: [],
      } as unknown as ArenaMatch;

      const review = generateMatchReview(match);

      expect(review).toContain("ArenaPlayer2");
      expect(review).toContain("4th place");
      expect(review).toContain("Ahri");
      expect(review).toContain("Lux");
    });
  });

  describe("edge cases", () => {
    test("handles match with no players", () => {
      const match = {
        queueType: "solo",
        durationInSeconds: 1800,
        players: [],
        teams: {
          blue: [],
          red: [],
        },
      } as unknown as CompletedMatch;

      const review = generateMatchReview(match);

      expect(review).toContain("Unable to generate review");
      expect(review).toContain("no player data found");
    });
  });
});
