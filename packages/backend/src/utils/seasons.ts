import { z } from "zod";

/**
 * League of Legends Season Data
 *
 * Season start/end dates are manually maintained since there's no reliable API.
 * Dates are in UTC and represent the start of the first day and end of the last day.
 */

/**
 * Valid season IDs as a Zod enum
 */
export const SeasonIdSchema = z.enum(["2025_SEASON_3_ACT_1"]);

export type SeasonId = z.infer<typeof SeasonIdSchema>;

/**
 * Season data type
 */
export type SeasonData = {
  id: SeasonId;
  displayName: string;
  startDate: Date;
  endDate: Date;
};

export const SEASONS: Record<SeasonId, SeasonData> = {
  "2025_SEASON_3_ACT_1": {
    id: "2025_SEASON_3_ACT_1",
    displayName: "Trials of Twilight",
    startDate: new Date("2025-08-27T00:00:00-07:00"),
    endDate: new Date("2025-10-21T23:59:59-07:00"),
  },
};

/**
 * Get season data by ID
 * @param seasonId The season ID
 * @returns Season data or undefined if not found
 */
export function getSeasonById(seasonId: string): SeasonData | undefined {
  const result = SeasonIdSchema.safeParse(seasonId);
  if (!result.success) {
    return undefined;
  }
  return SEASONS[result.data];
}

/**
 * Get all seasons sorted by start date (newest first)
 * @returns Array of all season data
 */
export function getAllSeasons(): SeasonData[] {
  return Object.values(SEASONS).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

/**
 * Get current active season (based on current date)
 * @returns Current season data or undefined if no active season
 */
export function getCurrentSeason(): SeasonData | undefined {
  const now = new Date();
  return getAllSeasons().find((season) => season.startDate <= now && season.endDate >= now);
}

/**
 * Get season choices for Discord autocomplete
 * Only returns seasons that haven't ended yet (current and future seasons)
 * @returns Array of {name, value} for Discord choices
 */
export function getSeasonChoices(): Array<{ name: string; value: SeasonId }> {
  const now = new Date();
  return getAllSeasons()
    .filter((season) => season.endDate >= now)
    .map((season) => ({
      name: season.displayName,
      value: season.id,
    }));
}

/**
 * Get season start and end dates
 * @param seasonId The season ID
 * @returns Object with startDate and endDate or undefined if not found
 */
export function getSeasonDates(seasonId: string): { startDate: Date; endDate: Date } | undefined {
  const season = getSeasonById(seasonId);
  if (!season) {
    return undefined;
  }
  return {
    startDate: season.startDate,
    endDate: season.endDate,
  };
}

/**
 * Check if a season has ended
 * @param seasonId The season ID
 * @param now Optional date to check against (defaults to current date)
 * @returns true if season has ended, false if not, undefined if season not found
 */
export function hasSeasonEnded(seasonId: string, now: Date = new Date()): boolean | undefined {
  const season = getSeasonById(seasonId);
  if (!season) {
    return undefined;
  }
  return season.endDate < now;
}
