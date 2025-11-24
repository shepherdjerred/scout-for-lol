/**
 * Unit tests for MatchDto schema validation against real API data
 *
 * These tests verify that our schema correctly validates actual Riot API responses.
 * Test data files contain real match data from the Riot Games API.
 */

import { describe, expect, test } from "bun:test";
import { MatchDtoSchema } from "@scout-for-lol/packages/data/src/league/match-dto.schema.js";

const REAL_MATCH_FILES = [
  "/workspaces/scout-for-lol/packages/backend/src/league/model/__tests__/testdata/matches_2025_09_19_NA1_5370969615.json",
  "/workspaces/scout-for-lol/packages/backend/src/league/model/__tests__/testdata/matches_2025_09_19_NA1_5370986469.json",
];

describe("MatchDto Schema Validation", () => {
  test("validates real Arena match data from Riot API", async () => {
    for (const filePath of REAL_MATCH_FILES) {
      const data = JSON.parse(await Bun.file(filePath).text());
      const result = MatchDtoSchema.safeParse(data);

      expect(result.success).toBe(true);

      if (result.success) {
        // Verify basic structure
        expect(result.data.metadata).toBeDefined();
        expect(result.data.info).toBeDefined();
        expect(result.data.info.participants).toBeArray();
        expect(result.data.info.participants.length).toBeGreaterThan(0);

        // Verify first participant has challenges
        const firstParticipant = result.data.info.participants[0];
        expect(firstParticipant.challenges).toBeDefined();
      }
    }
  });

  test("schema matches real API data structure", () => {
    const data = JSON.parse(readFileSync(REAL_MATCH_FILES[0], "utf-8"));
    const result = MatchDtoSchema.safeParse(data);

    expect(result.success).toBe(true);

    if (result.success) {
      // Fields that are MISSING in real API but REQUIRED in twisted types
      const firstParticipant = result.data.info.participants[0];
      expect(firstParticipant.baitPings).toBeUndefined(); // Missing in real API
      expect(firstParticipant.bountyLevel).toBeUndefined(); // Missing in real API

      // Fields that ARE present in real API
      expect(firstParticipant.assists).toBeNumber();
      expect(firstParticipant.basicPings).toBeNumber();
      expect(firstParticipant.challenges).toBeDefined();

      // Verify endOfGameResult and tournamentCode are present
      expect(result.data.info.endOfGameResult).toBe("GameComplete");
      expect(result.data.info.tournamentCode).toBe(""); // Empty string in non-tournament matches
    }
  });

  test("challenge fields optionality matches real API", () => {
    const data = JSON.parse(readFileSync(REAL_MATCH_FILES[0], "utf-8"));
    const result = MatchDtoSchema.safeParse(data);

    expect(result.success).toBe(true);

    if (result.success) {
      const challenges = result.data.info.participants[0].challenges;

      // Fields that ARE present in real API
      expect(challenges.abilityUses).toBeNumber();
      expect(challenges.goldPerMinute).toBeNumber();
      expect(challenges.kda).toBeNumber();

      // Fields that are MISSING in real API Arena matches (should be optional)
      // These fields are not consistently present across all participants:
      expect(challenges.earliestElderDragon).toBeUndefined();
      expect(challenges.fasterSupportQuestCompletion).toBeUndefined();
      expect(challenges.fastestLegendary).toBeUndefined();
      expect(challenges.hadAfkTeammate).toBeUndefined();
      expect(challenges.highestChampionDamage).toBeUndefined();
      expect(challenges.highestCrowdControlScore).toBeUndefined();
      expect(challenges.highestWardKills).toBeUndefined();
      expect(challenges.junglerKillsEarlyJungle).toBeUndefined();
      expect(challenges.killsOnLanersEarlyJungleAsJungler).toBeUndefined();
      expect(challenges.laningPhaseGoldExpAdvantage).toBeUndefined();
      expect(challenges.maxCsAdvantageOnLaneOpponent).toBeUndefined();
      expect(challenges.maxLevelLeadLaneOpponent).toBeUndefined();
      expect(challenges.mythicItemUsed).toBeUndefined();
      expect(challenges.playedChampSelectPosition).toBeUndefined();
      expect(challenges.soloTurretsLategame).toBeUndefined();
      expect(challenges.threeWardsOneSweeperCount).toBeUndefined();
      expect(challenges.visionScoreAdvantageLaneOpponent).toBeUndefined();

      // shortestTimeToAceFromFirstTakedown may be present or undefined depending on participant
      // (present for participant 0, absent for many others)
      expect(
        challenges.shortestTimeToAceFromFirstTakedown === undefined ||
          typeof challenges.shortestTimeToAceFromFirstTakedown === "number",
      ).toBe(true);
    }
  });
});
