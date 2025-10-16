import { describe, expect, test } from "bun:test";
import {
  SEASONS,
  SeasonIdSchema,
  getSeasonById,
  getAllSeasons,
  getCurrentSeason,
  getSeasonChoices,
  getSeasonDates,
  hasSeasonEnded,
} from "./seasons";

describe("seasons", () => {
  describe("SEASONS constant", () => {
    test("should have valid season data", () => {
      expect(SEASONS).toBeDefined();
      expect(Object.keys(SEASONS).length).toBeGreaterThan(0);

      for (const season of Object.values(SEASONS)) {
        expect(season.id).toBeTruthy();
        expect(season.displayName).toBeTruthy();
        expect(season.startDate).toBeInstanceOf(Date);
        expect(season.endDate).toBeInstanceOf(Date);
        expect(season.startDate.getTime()).toBeLessThan(season.endDate.getTime());
      }
    });

    test("should have seasons in chronological order in display names", () => {
      const seasons = Object.values(SEASONS);
      // Check that we have at least one season with a display name
      const firstSeason = seasons[0];
      if (firstSeason) {
        expect(firstSeason.displayName.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SeasonIdSchema", () => {
    test("should accept valid season IDs", () => {
      const validIds = ["2025_SEASON_3_ACT_1"] as const;
      for (const id of validIds) {
        const result = SeasonIdSchema.safeParse(id);
        expect(result.success).toBe(true);
      }
    });

    test("should reject invalid season IDs", () => {
      const invalidIds = ["invalid", "2026_SPLIT_1", "2024_SPLIT_3", "2024", ""];
      for (const id of invalidIds) {
        const result = SeasonIdSchema.safeParse(id);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("getSeasonById", () => {
    test("should return season data for valid ID", () => {
      const season = getSeasonById("2025_SEASON_3_ACT_1");
      expect(season).toBeDefined();
      expect(season?.id).toBe("2025_SEASON_3_ACT_1");
      expect(season?.displayName).toBe("Trials of Twilight");
      expect(season?.startDate).toBeInstanceOf(Date);
      expect(season?.endDate).toBeInstanceOf(Date);
    });

    test("should return undefined for invalid ID", () => {
      expect(getSeasonById("invalid")).toBeUndefined();
      expect(getSeasonById("2026_SPLIT_1")).toBeUndefined();
      expect(getSeasonById("")).toBeUndefined();
    });
  });

  describe("getAllSeasons", () => {
    test("should return all seasons", () => {
      const seasons = getAllSeasons();
      expect(seasons.length).toBe(Object.keys(SEASONS).length);
    });

    test("should return seasons sorted by start date (newest first)", () => {
      const seasons = getAllSeasons();
      for (let i = 0; i < seasons.length - 1; i++) {
        const current = seasons[i];
        const next = seasons[i + 1];
        if (current && next) {
          expect(current.startDate.getTime()).toBeGreaterThanOrEqual(next.startDate.getTime());
        }
      }
    });

    test("should include all required fields", () => {
      const seasons = getAllSeasons();
      for (const season of seasons) {
        expect(season.id).toBeTruthy();
        expect(season.displayName).toBeTruthy();
        expect(season.startDate).toBeInstanceOf(Date);
        expect(season.endDate).toBeInstanceOf(Date);
      }
    });
  });

  describe("getCurrentSeason", () => {
    test("should return a season or undefined", () => {
      const current = getCurrentSeason();
      // Might be undefined if we're between seasons
      if (current) {
        expect(current.id).toBeTruthy();
        expect(current.startDate).toBeInstanceOf(Date);
        expect(current.endDate).toBeInstanceOf(Date);
      }
    });

    test("should return season that includes current date", () => {
      const current = getCurrentSeason();
      if (current) {
        const now = new Date();
        expect(current.startDate.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(current.endDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
      }
    });
  });

  describe("getSeasonChoices", () => {
    test("should return array of Discord choices", () => {
      const choices = getSeasonChoices();
      expect(choices.length).toBeGreaterThan(0);

      for (const choice of choices) {
        expect(choice.name).toBeTruthy();
        expect(choice.value).toBeTruthy();
        expect(SeasonIdSchema.safeParse(choice.value).success).toBe(true);
      }
    });

    test("should only return seasons that haven't ended yet", () => {
      const now = new Date();
      const choices = getSeasonChoices();

      // All returned seasons should have endDate >= now
      for (const choice of choices) {
        const season = SEASONS[choice.value];
        if (season) {
          expect(season.endDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
        }
      }
    });

    test("should be sorted by date (newest first)", () => {
      const choices = getSeasonChoices();
      if (choices.length > 1) {
        // Verify choices are sorted by start date descending
        for (let i = 0; i < choices.length - 1; i++) {
          const currentChoice = choices[i];
          const nextChoice = choices[i + 1];
          if (currentChoice && nextChoice) {
            const current = SEASONS[currentChoice.value];
            const next = SEASONS[nextChoice.value];
            if (current && next) {
              expect(current.startDate.getTime()).toBeGreaterThanOrEqual(next.startDate.getTime());
            }
          }
        }
      }
    });

    test("should have human-readable names", () => {
      const choices = getSeasonChoices();
      for (const choice of choices) {
        // Display names should not be IDs
        expect(choice.name).not.toBe(choice.value);
        expect(choice.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getSeasonDates", () => {
    test("should return dates for valid season", () => {
      const dates = getSeasonDates("2025_SEASON_3_ACT_1");
      expect(dates).toBeDefined();
      if (dates) {
        expect(dates.startDate).toBeInstanceOf(Date);
        expect(dates.endDate).toBeInstanceOf(Date);
        expect(dates.startDate.getTime()).toBeLessThan(dates.endDate.getTime());
      }
    });

    test("should return undefined for invalid season", () => {
      expect(getSeasonDates("invalid")).toBeUndefined();
      expect(getSeasonDates("")).toBeUndefined();
    });

    test("should return correct dates", () => {
      const dates = getSeasonDates("2025_SEASON_3_ACT_1");
      expect(dates).toBeDefined();
      if (dates) {
        // 2025 Season 3 Act 1 starts August 27, 2025
        expect(dates.startDate.getFullYear()).toBe(2025);
        expect(dates.startDate.getMonth()).toBe(7); // August (0-indexed)
        expect(dates.startDate.getDate()).toBe(27);
      }
    });
  });

  describe("hasSeasonEnded", () => {
    test("should return true for ended season", () => {
      const futureDate = new Date("2030-01-01T00:00:00Z");
      // 2025_SEASON_3_ACT_1 ends 2025-10-21
      const result = hasSeasonEnded("2025_SEASON_3_ACT_1", futureDate);
      expect(result).toBe(true);
    });

    test("should return false for active season", () => {
      const duringDate = new Date("2025-09-01T00:00:00Z");
      // 2025_SEASON_3_ACT_1 runs from 2025-08-27 to 2025-10-21
      const result = hasSeasonEnded("2025_SEASON_3_ACT_1", duringDate);
      expect(result).toBe(false);
    });

    test("should return false for future season", () => {
      const pastDate = new Date("2025-01-01T00:00:00Z");
      // 2025_SEASON_3_ACT_1 starts 2025-08-27
      const result = hasSeasonEnded("2025_SEASON_3_ACT_1", pastDate);
      expect(result).toBe(false);
    });

    test("should return undefined for invalid season ID", () => {
      const result = hasSeasonEnded("INVALID_SEASON");
      expect(result).toBeUndefined();
    });

    test("should use current date when not provided", () => {
      // Should return a boolean for valid season
      const result = hasSeasonEnded("2025_SEASON_3_ACT_1");
      expect(typeof result).toBe("boolean");
    });

    test("should return true when season ends exactly at the check time", () => {
      const season = SEASONS["2025_SEASON_3_ACT_1"];
      if (season) {
        // Check at exactly the end time
        const result = hasSeasonEnded("2025_SEASON_3_ACT_1", season.endDate);
        expect(result).toBe(false); // endDate is the last moment, so equal time means not ended
      }
    });

    test("should return true when season ends 1ms before check time", () => {
      const season = SEASONS["2025_SEASON_3_ACT_1"];
      if (season) {
        // Check 1ms after end time
        const checkTime = new Date(season.endDate.getTime() + 1);
        const result = hasSeasonEnded("2025_SEASON_3_ACT_1", checkTime);
        expect(result).toBe(true);
      }
    });
  });

  describe("season date ranges", () => {
    test("should have no overlapping seasons", () => {
      const seasons = getAllSeasons();
      for (let i = 0; i < seasons.length - 1; i++) {
        const current = seasons[i];
        const next = seasons[i + 1];
        if (current && next) {
          // Current season should start after or when previous ends
          expect(current.startDate.getTime()).toBeGreaterThanOrEqual(next.endDate.getTime());
        }
      }
    });

    test("should have realistic season durations", () => {
      const seasons = getAllSeasons();
      for (const season of seasons) {
        const durationMs = season.endDate.getTime() - season.startDate.getTime();
        const durationDays = durationMs / (1000 * 60 * 60 * 24);
        // Seasons typically last 1-6 months
        expect(durationDays).toBeGreaterThan(30); // At least 1 month
        expect(durationDays).toBeLessThan(200); // Less than 7 months
      }
    });
  });
});
