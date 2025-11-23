import { describe, expect, test, mock } from "bun:test";
import type { ArenaMatch, CompletedMatch, MatchId } from "@scout-for-lol/data";

import { testAccountId, testPuuid } from "../../../testing/test-ids.js";

// Test match ID for all tests
const TEST_MATCH_ID = "NA1_1234567890" as MatchId;

// Mock the configuration module to prevent API calls
// Use a factory function to read env vars at runtime so other tests can override
void mock.module("../../../configuration.js", () => ({
  default: {
    version: process.env["VERSION"] ?? "test",
    gitSha: process.env["GIT_SHA"] ?? "test",
    sentryDsn: process.env["SENTRY_DSN"],
    environment: (process.env["ENVIRONMENT"] as "dev" | "beta" | "prod") ?? "dev",
    discordToken: process.env["DISCORD_TOKEN"] ?? "test",
    applicationId: process.env["APPLICATION_ID"] ?? "test",
    riotApiToken: process.env["RIOT_API_TOKEN"] ?? "test",
    databaseUrl: process.env["DATABASE_URL"] ?? "test.db",
    port: Number.parseInt(process.env["PORT"] ?? "3000"),
    s3BucketName: process.env["S3_BUCKET_NAME"],
    openaiApiKey: undefined, // Always undefined for this test to prevent API calls
    geminiApiKey: undefined, // Always undefined for this test to prevent API calls
  },
}));

import { generateMatchReview } from "../generator.ts";
describe("generateMatchReview", () => {
  describe("when API keys are not configured", () => {
    test("returns undefined for regular match", async () => {
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
                  puuid: testPuuid("test-puuid") as unknown,
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

      const review = await generateMatchReview(match, TEST_MATCH_ID);

      expect(review).toBeUndefined();
    });

    test("returns undefined for arena match", async () => {
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
                  puuid: testPuuid("arena-puuid") as unknown,
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

      const review = await generateMatchReview(match, TEST_MATCH_ID);

      expect(review).toBeUndefined();
    });
  });
});
