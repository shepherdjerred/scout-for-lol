import { describe, test, expect } from "bun:test";

import {
  calculatePollingInterval,
  shouldCheckPlayer,
  getPollingReferenceTime,
  POLLING_INTERVALS,
} from "./polling-intervals.js";

describe("calculatePollingInterval", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  test("returns MAX interval for undefined lastMatchTime", () => {
    // Use max interval to avoid excessive polling for players with unknown activity
    expect(calculatePollingInterval(undefined, now)).toBe(POLLING_INTERVALS.MAX);
  });

  test("returns MIN interval for recent match (within 1 hour)", () => {
    const lastMatch = new Date("2024-01-15T11:30:00Z"); // 30 minutes ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.MIN);
  });

  test("returns HOUR_6 interval for match 2 hours ago", () => {
    const lastMatch = new Date("2024-01-15T10:00:00Z"); // 2 hours ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.HOUR_6);
  });

  test("returns HOUR_12 interval for match 8 hours ago", () => {
    const lastMatch = new Date("2024-01-15T04:00:00Z"); // 8 hours ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.HOUR_12);
  });

  test("returns DAY_1 interval for match 16 hours ago", () => {
    const lastMatch = new Date("2024-01-14T20:00:00Z"); // 16 hours ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.DAY_1);
  });

  test("returns DAY_3 interval for match 2 days ago", () => {
    const lastMatch = new Date("2024-01-13T12:00:00Z"); // 2 days ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.DAY_3);
  });

  test("returns DAY_7 interval for match 5 days ago", () => {
    const lastMatch = new Date("2024-01-10T12:00:00Z"); // 5 days ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.DAY_7);
  });

  test("returns DAY_14 interval for match 10 days ago", () => {
    const lastMatch = new Date("2024-01-05T12:00:00Z"); // 10 days ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.DAY_14);
  });

  test("returns MAX interval for match 30+ days ago", () => {
    const lastMatch = new Date("2023-12-01T12:00:00Z"); // 45 days ago
    expect(calculatePollingInterval(lastMatch, now)).toBe(POLLING_INTERVALS.MAX);
  });
});

describe("getPollingReferenceTime", () => {
  const lastMatch = new Date("2024-01-14T12:00:00Z");
  const lastChecked = new Date("2024-01-15T11:00:00Z");

  test("returns undefined if never checked before", () => {
    expect(getPollingReferenceTime(lastMatch, undefined)).toBe(undefined);
    expect(getPollingReferenceTime(undefined, undefined)).toBe(undefined);
  });

  test("returns lastCheckedAt if never seen a match", () => {
    expect(getPollingReferenceTime(undefined, lastChecked)).toBe(lastChecked);
  });

  test("returns more recent of lastMatchTime and lastCheckedAt", () => {
    // lastCheckedAt is more recent
    expect(getPollingReferenceTime(lastMatch, lastChecked)).toBe(lastChecked);

    // lastMatchTime is more recent
    const recentMatch = new Date("2024-01-15T11:30:00Z");
    expect(getPollingReferenceTime(recentMatch, lastChecked)).toBe(recentMatch);
  });
});

describe("shouldCheckPlayer", () => {
  const baseTime = new Date("2024-01-15T12:00:00Z");

  describe("never checked before", () => {
    test("should always check if never checked before", () => {
      expect(shouldCheckPlayer(undefined, undefined, baseTime)).toBe(true);
      expect(shouldCheckPlayer(new Date("2024-01-14T12:00:00Z"), undefined, baseTime)).toBe(true);
    });
  });

  describe("min interval (active players)", () => {
    test("should always check for active players (< 1 hour since last match)", () => {
      const lastMatch = new Date("2024-01-15T11:30:00Z"); // 30 minutes ago
      const lastChecked = new Date("2024-01-15T11:59:00Z"); // 1 minute ago

      expect(shouldCheckPlayer(lastMatch, lastChecked, baseTime)).toBe(true);
    });
  });

  describe("longer intervals (inactive players)", () => {
    test("should respect polling interval based on time elapsed", () => {
      const lastMatch = new Date("2024-01-13T12:00:00Z"); // 2 days ago (DAY_3 interval = 20 min)

      // Just checked 10 minutes ago - should NOT check
      const justChecked = new Date("2024-01-15T11:50:00Z");
      expect(shouldCheckPlayer(lastMatch, justChecked, baseTime)).toBe(false);

      // Checked 20 minutes ago - SHOULD check
      const checkedAWhileAgo = new Date("2024-01-15T11:40:00Z");
      expect(shouldCheckPlayer(lastMatch, checkedAWhileAgo, baseTime)).toBe(true);

      // Checked 30 minutes ago - SHOULD check
      const checkedLongAgo = new Date("2024-01-15T11:30:00Z");
      expect(shouldCheckPlayer(lastMatch, checkedLongAgo, baseTime)).toBe(true);
    });

    test("uses lastCheckedAt if it's more recent than lastMatchTime", () => {
      // Player inactive for 10 days (DAY_14 interval = 45 min)
      const lastMatch = new Date("2024-01-05T12:00:00Z");

      // But we just checked 30 minutes ago
      const lastChecked = new Date("2024-01-15T11:30:00Z");

      // Should NOT check because only 30 minutes have elapsed (need 45)
      expect(shouldCheckPlayer(lastMatch, lastChecked, baseTime)).toBe(false);
    });

    test("handles very inactive players correctly", () => {
      // Player inactive for 45 days (MAX interval = 60 min)
      const lastMatch = new Date("2023-12-01T12:00:00Z");

      // Checked 45 minutes ago - should NOT check
      const recentCheck = new Date("2024-01-15T11:15:00Z");
      expect(shouldCheckPlayer(lastMatch, recentCheck, baseTime)).toBe(false);

      // Checked 60 minutes ago - SHOULD check
      const olderCheck = new Date("2024-01-15T11:00:00Z");
      expect(shouldCheckPlayer(lastMatch, olderCheck, baseTime)).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("should check if exactly at interval boundary", () => {
      const lastMatch = new Date("2024-01-13T12:00:00Z"); // 2 days ago (DAY_3 interval = 20 min)
      const lastChecked = new Date("2024-01-15T11:40:00Z"); // Exactly 20 minutes ago

      expect(shouldCheckPlayer(lastMatch, lastChecked, baseTime)).toBe(true);
    });

    test("handles lastMatchTime more recent than lastCheckedAt", () => {
      // Checked 1 hour ago
      const lastChecked = new Date("2024-01-15T11:00:00Z");

      // But played a match 30 minutes ago (active player - MIN interval)
      const lastMatch = new Date("2024-01-15T11:30:00Z");

      // Should check because it's an active player
      expect(shouldCheckPlayer(lastMatch, lastChecked, baseTime)).toBe(true);
    });

    test("handles player who just started playing after long inactivity", () => {
      // Player was inactive for 20 days (480 hours - uses MAX interval = 60 min)
      const lastMatch = new Date("2023-12-26T12:00:00Z");

      // But we checked 50 minutes ago
      const lastChecked = new Date("2024-01-15T11:10:00Z");

      // Should NOT check because only 50 minutes have elapsed (need 60)
      expect(shouldCheckPlayer(lastMatch, lastChecked, baseTime)).toBe(false);

      // Should check if we checked 60+ minutes ago
      const longAgoCheck = new Date("2024-01-15T11:00:00Z"); // 60 minutes ago
      expect(shouldCheckPlayer(lastMatch, longAgoCheck, baseTime)).toBe(true);
    });
  });
});
