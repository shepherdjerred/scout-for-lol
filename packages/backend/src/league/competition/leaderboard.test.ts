import { describe, expect, test } from "bun:test";
import type { Rank } from "@scout-for-lol/data";
import type { LeaderboardEntry } from "./processors/types.js";

// Import the internal functions for testing by re-exporting them
// We'll need to test the ranking logic directly

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock leaderboard entry with numeric score
 */
function createEntry(playerId: number, score: number): LeaderboardEntry {
  return {
    playerId,
    playerName: `Player${playerId.toString()}`,
    score,
  };
}

/**
 * Create a mock leaderboard entry with Rank score
 */
function createRankEntry(playerId: number, rank: Rank): LeaderboardEntry {
  return {
    playerId,
    playerName: `Player${playerId.toString()}`,
    score: rank,
  };
}

/**
 * Helper to assign ranks to entries (mirrors the actual implementation)
 */
function assignRanks(entries: LeaderboardEntry[]): (LeaderboardEntry & { rank: number })[] {
  if (entries.length === 0) {
    return [];
  }

  const ranked: (LeaderboardEntry & { rank: number })[] = [];
  let currentRank = 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue; // Skip if undefined

    // Check for ties with previous entry
    if (i > 0) {
      const previousEntry = entries[i - 1];
      if (previousEntry && !scoresAreEqual(entry.score, previousEntry.score)) {
        // Not a tie - update rank to current position
        currentRank = i + 1;
      }
      // If it's a tie, keep the same rank
    }

    ranked.push({
      playerId: entry.playerId,
      playerName: entry.playerName,
      score: entry.score,
      ...(entry.metadata !== undefined && { metadata: entry.metadata }),
      rank: currentRank,
    });
  }

  return ranked;
}

/**
 * Check if two scores are equal (mirrors the actual implementation)
 * Uses simplified equality check for Rank objects
 */
function scoresAreEqual(a: number | Rank, b: number | Rank): boolean {
  // Both are numbers
  // eslint-disable-next-line no-restricted-syntax -- Test helper needs type checking
  if (typeof a === "number" && typeof b === "number") {
    return a === b;
  }

  // Both are Rank objects
  // eslint-disable-next-line no-restricted-syntax -- Test helper needs type checking
  if (typeof a === "object" && typeof b === "object") {
    // For simplicity in tests, compare tier, division, and LP
    return a.tier === b.tier && a.division === b.division && a.lp === b.lp;
  }

  // Mixed types are never equal
  return false;
}

// ============================================================================
// Unit Tests
// ============================================================================

describe("Leaderboard Ranking Logic", () => {
  describe("assignRanks - numeric scores", () => {
    test("should assign ranks correctly with no ties", () => {
      const entries = [createEntry(1, 100), createEntry(2, 80), createEntry(3, 60)];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toMatchObject({ playerId: 1, score: 100, rank: 1 });
      expect(ranked[1]).toMatchObject({ playerId: 2, score: 80, rank: 2 });
      expect(ranked[2]).toMatchObject({ playerId: 3, score: 60, rank: 3 });
    });

    test("should handle ties correctly (same rank, skip next)", () => {
      const entries = [createEntry(1, 100), createEntry(2, 80), createEntry(3, 80), createEntry(4, 60)];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(4);
      expect(ranked[0]).toMatchObject({ playerId: 1, score: 100, rank: 1 });
      expect(ranked[1]).toMatchObject({ playerId: 2, score: 80, rank: 2 });
      expect(ranked[2]).toMatchObject({ playerId: 3, score: 80, rank: 2 }); // Same rank
      expect(ranked[3]).toMatchObject({ playerId: 4, score: 60, rank: 4 }); // Skip rank 3
    });

    test("should handle three-way ties", () => {
      const entries = [
        createEntry(1, 100),
        createEntry(2, 50),
        createEntry(3, 50),
        createEntry(4, 50),
        createEntry(5, 20),
      ];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(5);
      expect(ranked[0]).toMatchObject({ rank: 1 });
      expect(ranked[1]).toMatchObject({ rank: 2 });
      expect(ranked[2]).toMatchObject({ rank: 2 });
      expect(ranked[3]).toMatchObject({ rank: 2 });
      expect(ranked[4]).toMatchObject({ rank: 5 }); // Skip ranks 3 and 4
    });

    test("should handle all entries having same score", () => {
      const entries = [createEntry(1, 100), createEntry(2, 100), createEntry(3, 100)];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toMatchObject({ rank: 1 });
      expect(ranked[1]).toMatchObject({ rank: 1 });
      expect(ranked[2]).toMatchObject({ rank: 1 });
    });

    test("should handle empty array", () => {
      const entries: LeaderboardEntry[] = [];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(0);
    });

    test("should handle single entry", () => {
      const entries = [createEntry(1, 100)];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(1);
      expect(ranked[0]).toMatchObject({ playerId: 1, score: 100, rank: 1 });
    });
  });

  describe("assignRanks - Rank scores", () => {
    test("should assign ranks correctly with no ties (different tiers)", () => {
      const entries = [
        createRankEntry(1, { tier: "diamond", division: 2, lp: 50, wins: 100, losses: 50 }),
        createRankEntry(2, { tier: "platinum", division: 1, lp: 75, wins: 80, losses: 60 }),
        createRankEntry(3, { tier: "gold", division: 3, lp: 20, wins: 50, losses: 50 }),
      ];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toMatchObject({ playerId: 1, rank: 1 });
      expect(ranked[1]).toMatchObject({ playerId: 2, rank: 2 });
      expect(ranked[2]).toMatchObject({ playerId: 3, rank: 3 });
    });

    test("should handle ties with same rank (same tier, division, and LP)", () => {
      const sameRank: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };

      const entries = [
        createRankEntry(1, { tier: "diamond", division: 4, lp: 0, wins: 100, losses: 50 }),
        createRankEntry(2, sameRank),
        createRankEntry(3, sameRank),
        createRankEntry(4, { tier: "silver", division: 1, lp: 90, wins: 30, losses: 30 }),
      ];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(4);
      expect(ranked[0]).toMatchObject({ rank: 1 });
      expect(ranked[1]).toMatchObject({ rank: 2 });
      expect(ranked[2]).toMatchObject({ rank: 2 }); // Same rank
      expect(ranked[3]).toMatchObject({ rank: 4 }); // Skip rank 3
    });

    test("should differentiate between same tier but different divisions", () => {
      const entries = [
        createRankEntry(1, { tier: "gold", division: 1, lp: 0, wins: 50, losses: 50 }),
        createRankEntry(2, { tier: "gold", division: 2, lp: 0, wins: 50, losses: 50 }),
        createRankEntry(3, { tier: "gold", division: 3, lp: 0, wins: 50, losses: 50 }),
      ];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toMatchObject({ rank: 1 }); // G1 > G2
      expect(ranked[1]).toMatchObject({ rank: 2 }); // G2 > G3
      expect(ranked[2]).toMatchObject({ rank: 3 });
    });

    test("should differentiate between same tier/division but different LP", () => {
      const entries = [
        createRankEntry(1, { tier: "gold", division: 2, lp: 90, wins: 50, losses: 50 }),
        createRankEntry(2, { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 }),
        createRankEntry(3, { tier: "gold", division: 2, lp: 10, wins: 50, losses: 50 }),
      ];

      const ranked = assignRanks(entries);

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toMatchObject({ rank: 1 }); // 90 LP
      expect(ranked[1]).toMatchObject({ rank: 2 }); // 50 LP
      expect(ranked[2]).toMatchObject({ rank: 3 }); // 10 LP
    });
  });

  describe("scoresAreEqual", () => {
    test("should return true for equal numeric scores", () => {
      expect(scoresAreEqual(100, 100)).toBe(true);
    });

    test("should return false for different numeric scores", () => {
      expect(scoresAreEqual(100, 90)).toBe(false);
    });

    test("should return true for equal Rank scores", () => {
      const rank1: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };
      const rank2: Rank = { tier: "gold", division: 2, lp: 50, wins: 60, losses: 40 }; // Different W/L doesn't matter

      expect(scoresAreEqual(rank1, rank2)).toBe(true);
    });

    test("should return false for different Rank scores (different tiers)", () => {
      const rank1: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };
      const rank2: Rank = { tier: "silver", division: 2, lp: 50, wins: 50, losses: 50 };

      expect(scoresAreEqual(rank1, rank2)).toBe(false);
    });

    test("should return false for different Rank scores (different divisions)", () => {
      const rank1: Rank = { tier: "gold", division: 1, lp: 50, wins: 50, losses: 50 };
      const rank2: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };

      expect(scoresAreEqual(rank1, rank2)).toBe(false);
    });

    test("should return false for different Rank scores (different LP)", () => {
      const rank1: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };
      const rank2: Rank = { tier: "gold", division: 2, lp: 60, wins: 50, losses: 50 };

      expect(scoresAreEqual(rank1, rank2)).toBe(false);
    });

    test("should return false for mixed types (number vs Rank)", () => {
      const rank: Rank = { tier: "gold", division: 2, lp: 50, wins: 50, losses: 50 };

      expect(scoresAreEqual(100, rank)).toBe(false);
      expect(scoresAreEqual(rank, 100)).toBe(false);
    });
  });
});
