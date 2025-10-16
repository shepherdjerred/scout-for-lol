import { describe, expect, test } from "bun:test";
import {
  calculatePollingInterval,
  shouldCheckPlayer,
  POLLING_INTERVALS,
  ACTIVITY_THRESHOLDS,
} from "./polling-intervals";

describe("calculatePollingInterval", () => {
  test("returns default interval for null lastSeenInGame (never seen)", () => {
    expect(calculatePollingInterval(null)).toBe(POLLING_INTERVALS.DEFAULT);
  });

  test("returns default interval for players seen recently (< 1 day)", () => {
    const now = new Date();
    const recentlyActive = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    expect(calculatePollingInterval(recentlyActive)).toBe(POLLING_INTERVALS.DEFAULT);
  });

  test("returns 3 min interval for players seen 1-5 days ago", () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000); // 1.5 days ago
    expect(calculatePollingInterval(oneDayAgo)).toBe(POLLING_INTERVALS.ONE_DAY);

    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(fourDaysAgo)).toBe(POLLING_INTERVALS.ONE_DAY);
  });

  test("returns 5 min interval for players seen 5-7 days ago", () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5.5 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(fiveDaysAgo)).toBe(POLLING_INTERVALS.FIVE_DAYS);

    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(sixDaysAgo)).toBe(POLLING_INTERVALS.FIVE_DAYS);
  });

  test("returns 7 min interval for players seen 7-30 days ago", () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(oneWeekAgo)).toBe(POLLING_INTERVALS.ONE_WEEK);

    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(twoWeeksAgo)).toBe(POLLING_INTERVALS.ONE_WEEK);
  });

  test("returns 10 min interval for players seen 30-90 days ago", () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(oneMonthAgo)).toBe(POLLING_INTERVALS.ONE_MONTH);

    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(twoMonthsAgo)).toBe(POLLING_INTERVALS.ONE_MONTH);
  });

  test("returns 15 min interval (max) for players seen 90+ days ago", () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(threeMonthsAgo)).toBe(POLLING_INTERVALS.THREE_MONTHS);

    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(sixMonthsAgo)).toBe(POLLING_INTERVALS.THREE_MONTHS);

    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(oneYearAgo)).toBe(POLLING_INTERVALS.THREE_MONTHS);
  });

  test("boundary: exactly 1 day should use ONE_DAY interval", () => {
    const now = new Date();
    const exactlyOneDay = new Date(now.getTime() - ACTIVITY_THRESHOLDS.ONE_DAY * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(exactlyOneDay)).toBe(POLLING_INTERVALS.ONE_DAY);
  });

  test("boundary: exactly 5 days should use FIVE_DAYS interval", () => {
    const now = new Date();
    const exactlyFiveDays = new Date(now.getTime() - ACTIVITY_THRESHOLDS.FIVE_DAYS * 24 * 60 * 60 * 1000);
    expect(calculatePollingInterval(exactlyFiveDays)).toBe(POLLING_INTERVALS.FIVE_DAYS);
  });
});

describe("shouldCheckPlayer", () => {
  test("always checks players with default interval (1 min)", () => {
    const recentlyActive = new Date("2024-10-16T12:00:00Z");
    const currentTime = new Date("2024-10-16T12:05:00Z");

    // Should check at any minute
    expect(shouldCheckPlayer(recentlyActive, currentTime)).toBe(true);

    const currentTime2 = new Date("2024-10-16T12:03:00Z");
    expect(shouldCheckPlayer(recentlyActive, currentTime2)).toBe(true);
  });

  test("always checks players never seen in game", () => {
    const currentTime = new Date("2024-10-16T12:05:00Z");
    expect(shouldCheckPlayer(null, currentTime)).toBe(true);

    const currentTime2 = new Date("2024-10-16T12:13:00Z");
    expect(shouldCheckPlayer(null, currentTime2)).toBe(true);
  });

  test("checks players with 3 min interval only at correct minutes (0, 3, 6, 9...)", () => {
    const oneDayAgo = new Date("2024-10-15T12:00:00Z");

    // Minute 0 - should check
    const time0 = new Date("2024-10-16T12:00:00Z");
    expect(shouldCheckPlayer(oneDayAgo, time0)).toBe(true);

    // Minute 3 - should check
    const time3 = new Date("2024-10-16T12:03:00Z");
    expect(shouldCheckPlayer(oneDayAgo, time3)).toBe(true);

    // Minute 6 - should check
    const time6 = new Date("2024-10-16T12:06:00Z");
    expect(shouldCheckPlayer(oneDayAgo, time6)).toBe(true);

    // Minute 1 - should NOT check
    const time1 = new Date("2024-10-16T12:01:00Z");
    expect(shouldCheckPlayer(oneDayAgo, time1)).toBe(false);

    // Minute 5 - should NOT check
    const time5 = new Date("2024-10-16T12:05:00Z");
    expect(shouldCheckPlayer(oneDayAgo, time5)).toBe(false);
  });

  test("checks players with 5 min interval only at correct minutes (0, 5, 10, 15...)", () => {
    const fiveDaysAgo = new Date("2024-10-11T12:00:00Z");

    // Minute 0 - should check
    const time0 = new Date("2024-10-16T12:00:00Z");
    expect(shouldCheckPlayer(fiveDaysAgo, time0)).toBe(true);

    // Minute 5 - should check
    const time5 = new Date("2024-10-16T12:05:00Z");
    expect(shouldCheckPlayer(fiveDaysAgo, time5)).toBe(true);

    // Minute 10 - should check
    const time10 = new Date("2024-10-16T12:10:00Z");
    expect(shouldCheckPlayer(fiveDaysAgo, time10)).toBe(true);

    // Minute 3 - should NOT check
    const time3 = new Date("2024-10-16T12:03:00Z");
    expect(shouldCheckPlayer(fiveDaysAgo, time3)).toBe(false);

    // Minute 7 - should NOT check
    const time7 = new Date("2024-10-16T12:07:00Z");
    expect(shouldCheckPlayer(fiveDaysAgo, time7)).toBe(false);
  });

  test("checks players with 7 min interval only at correct minutes (0, 7, 14, 21...)", () => {
    const oneWeekAgo = new Date("2024-10-09T12:00:00Z");

    // Minute 0 - should check
    const time0 = new Date("2024-10-16T12:00:00Z");
    expect(shouldCheckPlayer(oneWeekAgo, time0)).toBe(true);

    // Minute 7 - should check
    const time7 = new Date("2024-10-16T12:07:00Z");
    expect(shouldCheckPlayer(oneWeekAgo, time7)).toBe(true);

    // Minute 14 - should check
    const time14 = new Date("2024-10-16T12:14:00Z");
    expect(shouldCheckPlayer(oneWeekAgo, time14)).toBe(true);

    // Minute 5 - should NOT check
    const time5 = new Date("2024-10-16T12:05:00Z");
    expect(shouldCheckPlayer(oneWeekAgo, time5)).toBe(false);

    // Minute 10 - should NOT check
    const time10 = new Date("2024-10-16T12:10:00Z");
    expect(shouldCheckPlayer(oneWeekAgo, time10)).toBe(false);
  });

  test("checks players with 10 min interval only at correct minutes (0, 10, 20, 30...)", () => {
    const oneMonthAgo = new Date("2024-09-16T12:00:00Z");

    // Minute 0 - should check
    const time0 = new Date("2024-10-16T12:00:00Z");
    expect(shouldCheckPlayer(oneMonthAgo, time0)).toBe(true);

    // Minute 10 - should check
    const time10 = new Date("2024-10-16T12:10:00Z");
    expect(shouldCheckPlayer(oneMonthAgo, time10)).toBe(true);

    // Minute 20 - should check
    const time20 = new Date("2024-10-16T12:20:00Z");
    expect(shouldCheckPlayer(oneMonthAgo, time20)).toBe(true);

    // Minute 5 - should NOT check
    const time5 = new Date("2024-10-16T12:05:00Z");
    expect(shouldCheckPlayer(oneMonthAgo, time5)).toBe(false);

    // Minute 15 - should NOT check
    const time15 = new Date("2024-10-16T12:15:00Z");
    expect(shouldCheckPlayer(oneMonthAgo, time15)).toBe(false);
  });

  test("checks players with 15 min interval only at correct minutes (0, 15, 30, 45)", () => {
    const threeMonthsAgo = new Date("2024-07-16T12:00:00Z");

    // Minute 0 - should check
    const time0 = new Date("2024-10-16T12:00:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time0)).toBe(true);

    // Minute 15 - should check
    const time15 = new Date("2024-10-16T12:15:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time15)).toBe(true);

    // Minute 30 - should check
    const time30 = new Date("2024-10-16T12:30:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time30)).toBe(true);

    // Minute 45 - should check
    const time45 = new Date("2024-10-16T12:45:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time45)).toBe(true);

    // Minute 10 - should NOT check
    const time10 = new Date("2024-10-16T12:10:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time10)).toBe(false);

    // Minute 20 - should NOT check
    const time20 = new Date("2024-10-16T12:20:00Z");
    expect(shouldCheckPlayer(threeMonthsAgo, time20)).toBe(false);
  });
});

