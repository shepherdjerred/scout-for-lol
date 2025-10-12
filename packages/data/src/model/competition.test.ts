import { describe, expect, test } from "bun:test";
import {
  CompetitionCriteriaSchema,
  CompetitionIdSchema,
  CompetitionQueueTypeSchema,
  CompetitionVisibilitySchema,
  HighestRankCriteriaSchema,
  HighestWinRateCriteriaSchema,
  MostGamesPlayedCriteriaSchema,
  MostRankClimbCriteriaSchema,
  MostWinsChampionCriteriaSchema,
  MostWinsPlayerCriteriaSchema,
  ParticipantIdSchema,
  ParticipantStatusSchema,
  PermissionTypeSchema,
  SnapshotTypeSchema,
  competitionQueueTypeToString,
  getCompetitionStatus,
  participantStatusToString,
  visibilityToString,
} from "./competition.js";

describe("CompetitionId branded type", () => {
  test("accepts positive integers", () => {
    const result = CompetitionIdSchema.safeParse(1);
    expect(result.success).toBe(true);
  });

  test("accepts large positive integers", () => {
    const result = CompetitionIdSchema.safeParse(999999);
    expect(result.success).toBe(true);
  });

  test("rejects negative integers", () => {
    const result = CompetitionIdSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });

  test("rejects zero", () => {
    const result = CompetitionIdSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  test("rejects floats", () => {
    const result = CompetitionIdSchema.safeParse(1.5);
    expect(result.success).toBe(false);
  });

  test("rejects strings", () => {
    const result = CompetitionIdSchema.safeParse("1");
    expect(result.success).toBe(false);
  });
});

describe("ParticipantId branded type", () => {
  test("accepts positive integers", () => {
    const result = ParticipantIdSchema.safeParse(42);
    expect(result.success).toBe(true);
  });

  test("rejects negative integers", () => {
    const result = ParticipantIdSchema.safeParse(-5);
    expect(result.success).toBe(false);
  });

  test("rejects zero", () => {
    const result = ParticipantIdSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  // Note: TypeScript prevents assigning CompetitionId to ParticipantId at compile time
  // due to branding, but at runtime they're both numbers
});

describe("CompetitionVisibility enum", () => {
  test("accepts OPEN", () => {
    const result = CompetitionVisibilitySchema.safeParse("OPEN");
    expect(result.success).toBe(true);
  });

  test("accepts INVITE_ONLY", () => {
    const result = CompetitionVisibilitySchema.safeParse("INVITE_ONLY");
    expect(result.success).toBe(true);
  });

  test("accepts SERVER_WIDE", () => {
    const result = CompetitionVisibilitySchema.safeParse("SERVER_WIDE");
    expect(result.success).toBe(true);
  });

  test("rejects invalid values", () => {
    const result = CompetitionVisibilitySchema.safeParse("INVALID");
    expect(result.success).toBe(false);
  });

  test("rejects lowercase", () => {
    const result = CompetitionVisibilitySchema.safeParse("open");
    expect(result.success).toBe(false);
  });
});

describe("ParticipantStatus enum", () => {
  test("accepts INVITED", () => {
    const result = ParticipantStatusSchema.safeParse("INVITED");
    expect(result.success).toBe(true);
  });

  test("accepts JOINED", () => {
    const result = ParticipantStatusSchema.safeParse("JOINED");
    expect(result.success).toBe(true);
  });

  test("accepts LEFT", () => {
    const result = ParticipantStatusSchema.safeParse("LEFT");
    expect(result.success).toBe(true);
  });

  test("rejects invalid values", () => {
    const result = ParticipantStatusSchema.safeParse("PENDING");
    expect(result.success).toBe(false);
  });
});

describe("SnapshotType enum", () => {
  test("accepts START", () => {
    const result = SnapshotTypeSchema.safeParse("START");
    expect(result.success).toBe(true);
  });

  test("accepts END", () => {
    const result = SnapshotTypeSchema.safeParse("END");
    expect(result.success).toBe(true);
  });

  test("rejects invalid values", () => {
    const result = SnapshotTypeSchema.safeParse("MIDDLE");
    expect(result.success).toBe(false);
  });
});

describe("PermissionType enum", () => {
  test("accepts CREATE_COMPETITION", () => {
    const result = PermissionTypeSchema.safeParse("CREATE_COMPETITION");
    expect(result.success).toBe(true);
  });

  test("rejects invalid values", () => {
    const result = PermissionTypeSchema.safeParse("DELETE_COMPETITION");
    expect(result.success).toBe(false);
  });
});

describe("CompetitionQueueType enum", () => {
  test("accepts SOLO", () => {
    const result = CompetitionQueueTypeSchema.safeParse("SOLO");
    expect(result.success).toBe(true);
  });

  test("accepts FLEX", () => {
    const result = CompetitionQueueTypeSchema.safeParse("FLEX");
    expect(result.success).toBe(true);
  });

  test("accepts RANKED_ANY", () => {
    const result = CompetitionQueueTypeSchema.safeParse("RANKED_ANY");
    expect(result.success).toBe(true);
  });

  test("accepts ARENA", () => {
    const result = CompetitionQueueTypeSchema.safeParse("ARENA");
    expect(result.success).toBe(true);
  });

  test("accepts ARAM", () => {
    const result = CompetitionQueueTypeSchema.safeParse("ARAM");
    expect(result.success).toBe(true);
  });

  test("accepts ALL", () => {
    const result = CompetitionQueueTypeSchema.safeParse("ALL");
    expect(result.success).toBe(true);
  });

  test("rejects invalid values", () => {
    const result = CompetitionQueueTypeSchema.safeParse("NORMALS");
    expect(result.success).toBe(false);
  });
});

describe("getCompetitionStatus - CANCELLED", () => {
  test("returns CANCELLED when isCancelled is true (with future dates)", () => {
    const competition = {
      isCancelled: true,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-07-01"),
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("CANCELLED");
  });

  test("returns CANCELLED when isCancelled is true (with past dates)", () => {
    const competition = {
      isCancelled: true,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-02-01"),
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("CANCELLED");
  });

  test("returns CANCELLED when isCancelled is true (with current dates)", () => {
    const now = new Date();
    const competition = {
      isCancelled: true,
      startDate: new Date(now.getTime() - 86400000), // Yesterday
      endDate: new Date(now.getTime() + 86400000), // Tomorrow
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("CANCELLED");
  });

  test("returns CANCELLED when isCancelled is true (with seasonId)", () => {
    const competition = {
      isCancelled: true,
      startDate: null,
      endDate: null,
      seasonId: "2025-season-1",
    };
    expect(getCompetitionStatus(competition)).toBe("CANCELLED");
  });
});

describe("getCompetitionStatus - DRAFT", () => {
  test("returns DRAFT when startDate is in the future", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() + 86400000), // Tomorrow
      endDate: new Date(now.getTime() + 86400000 * 7), // Next week
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("DRAFT");
  });

  test("returns DRAFT when only seasonId is set", () => {
    const competition = {
      isCancelled: false,
      startDate: null,
      endDate: null,
      seasonId: "2025-season-1",
    };
    expect(getCompetitionStatus(competition)).toBe("DRAFT");
  });

  test("returns DRAFT when startDate is exactly now (edge case)", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() + 1000), // 1 second in future
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("DRAFT");
  });
});

describe("getCompetitionStatus - ACTIVE", () => {
  test("returns ACTIVE when startDate is in past and endDate is in future", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() - 86400000), // Yesterday
      endDate: new Date(now.getTime() + 86400000), // Tomorrow
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("ACTIVE");
  });

  test("returns ACTIVE when just started (edge case)", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() - 1000), // 1 second ago
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("ACTIVE");
  });
});

describe("getCompetitionStatus - ENDED", () => {
  test("returns ENDED when endDate is in past", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() - 86400000 * 7), // Last week
      endDate: new Date(now.getTime() - 86400000), // Yesterday
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("ENDED");
  });

  test("returns ENDED when just ended (edge case)", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() - 86400000 * 7),
      endDate: new Date(now.getTime() - 1000), // 1 second ago
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("ENDED");
  });

  test("returns ENDED when endDate is exactly now", () => {
    const now = new Date();
    const competition = {
      isCancelled: false,
      startDate: new Date(now.getTime() - 86400000),
      endDate: now,
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe("ENDED");
  });
});

describe("getCompetitionStatus - Error cases", () => {
  test("throws error when no dates and no seasonId", () => {
    const competition = {
      isCancelled: false,
      startDate: null,
      endDate: null,
      seasonId: null,
    };
    expect(() => getCompetitionStatus(competition)).toThrow(
      "Competition must have either (startDate AND endDate) OR seasonId"
    );
  });

  test("error message is descriptive", () => {
    const competition = {
      isCancelled: false,
      startDate: null,
      endDate: null,
      seasonId: null,
    };
    try {
      getCompetitionStatus(competition);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain("startDate AND endDate");
      expect((error as Error).message).toContain("seasonId");
    }
  });
});

describe("competitionQueueTypeToString", () => {
  test("formats SOLO correctly", () => {
    expect(competitionQueueTypeToString("SOLO")).toBe("Solo Queue");
  });

  test("formats FLEX correctly", () => {
    expect(competitionQueueTypeToString("FLEX")).toBe("Flex Queue");
  });

  test("formats RANKED_ANY correctly", () => {
    expect(competitionQueueTypeToString("RANKED_ANY")).toBe("Ranked (Any)");
  });

  test("formats ARENA correctly", () => {
    expect(competitionQueueTypeToString("ARENA")).toBe("Arena");
  });

  test("formats ARAM correctly", () => {
    expect(competitionQueueTypeToString("ARAM")).toBe("ARAM");
  });

  test("formats ALL correctly", () => {
    expect(competitionQueueTypeToString("ALL")).toBe("All Queues");
  });
});

describe("visibilityToString", () => {
  test("formats OPEN correctly", () => {
    expect(visibilityToString("OPEN")).toBe("Open to All");
  });

  test("formats INVITE_ONLY correctly", () => {
    expect(visibilityToString("INVITE_ONLY")).toBe("Invite Only");
  });

  test("formats SERVER_WIDE correctly", () => {
    expect(visibilityToString("SERVER_WIDE")).toBe("Server-Wide");
  });
});

describe("participantStatusToString", () => {
  test("formats INVITED correctly", () => {
    expect(participantStatusToString("INVITED")).toBe("Invited");
  });

  test("formats JOINED correctly", () => {
    expect(participantStatusToString("JOINED")).toBe("Joined");
  });

  test("formats LEFT correctly", () => {
    expect(participantStatusToString("LEFT")).toBe("Left");
  });
});

// ============================================================================
// Competition Criteria Tests
// ============================================================================

describe("MostGamesPlayedCriteria", () => {
  test("accepts valid criteria with SOLO queue", () => {
    const result = MostGamesPlayedCriteriaSchema.safeParse({
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
  });

  test("accepts all queue types", () => {
    const queues = ["SOLO", "FLEX", "RANKED_ANY", "ARENA", "ARAM", "ALL"];
    for (const queue of queues) {
      const result = MostGamesPlayedCriteriaSchema.safeParse({
        type: "MOST_GAMES_PLAYED",
        queue,
      });
      expect(result.success).toBe(true);
    }
  });

  test("rejects missing queue field", () => {
    const result = MostGamesPlayedCriteriaSchema.safeParse({
      type: "MOST_GAMES_PLAYED",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid queue type", () => {
    const result = MostGamesPlayedCriteriaSchema.safeParse({
      type: "MOST_GAMES_PLAYED",
      queue: "INVALID_QUEUE",
    });
    expect(result.success).toBe(false);
  });

  test("rejects wrong type discriminator", () => {
    const result = MostGamesPlayedCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });
});

describe("HighestRankCriteria", () => {
  test("accepts SOLO queue", () => {
    const result = HighestRankCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
  });

  test("accepts FLEX queue", () => {
    const result = HighestRankCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "FLEX",
    });
    expect(result.success).toBe(true);
  });

  test("rejects ARENA queue", () => {
    const result = HighestRankCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "ARENA",
    });
    expect(result.success).toBe(false);
  });

  test("rejects ARAM queue", () => {
    const result = HighestRankCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "ARAM",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing queue field", () => {
    const result = HighestRankCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
    });
    expect(result.success).toBe(false);
  });
});

describe("MostRankClimbCriteria", () => {
  test("accepts SOLO queue", () => {
    const result = MostRankClimbCriteriaSchema.safeParse({
      type: "MOST_RANK_CLIMB",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
  });

  test("accepts FLEX queue", () => {
    const result = MostRankClimbCriteriaSchema.safeParse({
      type: "MOST_RANK_CLIMB",
      queue: "FLEX",
    });
    expect(result.success).toBe(true);
  });

  test("rejects ARENA queue", () => {
    const result = MostRankClimbCriteriaSchema.safeParse({
      type: "MOST_RANK_CLIMB",
      queue: "ARENA",
    });
    expect(result.success).toBe(false);
  });

  test("rejects RANKED_ANY queue", () => {
    const result = MostRankClimbCriteriaSchema.safeParse({
      type: "MOST_RANK_CLIMB",
      queue: "RANKED_ANY",
    });
    expect(result.success).toBe(false);
  });
});

describe("MostWinsPlayerCriteria", () => {
  test("accepts valid criteria with SOLO queue", () => {
    const result = MostWinsPlayerCriteriaSchema.safeParse({
      type: "MOST_WINS_PLAYER",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
  });

  test("accepts all queue types", () => {
    const queues = ["SOLO", "FLEX", "RANKED_ANY", "ARENA", "ARAM", "ALL"];
    for (const queue of queues) {
      const result = MostWinsPlayerCriteriaSchema.safeParse({
        type: "MOST_WINS_PLAYER",
        queue,
      });
      expect(result.success).toBe(true);
    }
  });

  test("rejects missing queue field", () => {
    const result = MostWinsPlayerCriteriaSchema.safeParse({
      type: "MOST_WINS_PLAYER",
    });
    expect(result.success).toBe(false);
  });
});

describe("MostWinsChampionCriteria", () => {
  test("accepts valid criteria with championId and queue", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: 157, // Yasuo
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
  });

  test("accepts valid criteria with championId only (no queue)", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: 157,
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing championId", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative championId", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: -1,
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("rejects zero championId", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: 0,
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("accepts large championId", () => {
    const result = MostWinsChampionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: 999,
      queue: "ARENA",
    });
    expect(result.success).toBe(true);
  });
});

describe("HighestWinRateCriteria", () => {
  test("accepts valid criteria with minGames", () => {
    const result = HighestWinRateCriteriaSchema.safeParse({
      type: "HIGHEST_WIN_RATE",
      minGames: 20,
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minGames).toBe(20);
    }
  });

  test("applies default minGames of 10 when not provided", () => {
    const result = HighestWinRateCriteriaSchema.safeParse({
      type: "HIGHEST_WIN_RATE",
      queue: "FLEX",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minGames).toBe(10);
    }
  });

  test("rejects negative minGames", () => {
    const result = HighestWinRateCriteriaSchema.safeParse({
      type: "HIGHEST_WIN_RATE",
      minGames: -5,
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("rejects zero minGames", () => {
    const result = HighestWinRateCriteriaSchema.safeParse({
      type: "HIGHEST_WIN_RATE",
      minGames: 0,
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("accepts all queue types", () => {
    const queues = ["SOLO", "FLEX", "RANKED_ANY", "ARENA", "ARAM", "ALL"];
    for (const queue of queues) {
      const result = HighestWinRateCriteriaSchema.safeParse({
        type: "HIGHEST_WIN_RATE",
        minGames: 15,
        queue,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("CompetitionCriteria discriminated union", () => {
  test("parses MOST_GAMES_PLAYED criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("MOST_GAMES_PLAYED");
      expect(result.data.queue).toBe("SOLO");
    }
  });

  test("parses HIGHEST_RANK criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "FLEX",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("HIGHEST_RANK");
      expect(result.data.queue).toBe("FLEX");
    }
  });

  test("parses MOST_RANK_CLIMB criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "MOST_RANK_CLIMB",
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("MOST_RANK_CLIMB");
      expect(result.data.queue).toBe("SOLO");
    }
  });

  test("parses MOST_WINS_PLAYER criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "MOST_WINS_PLAYER",
      queue: "ARENA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("MOST_WINS_PLAYER");
      expect(result.data.queue).toBe("ARENA");
    }
  });

  test("parses MOST_WINS_CHAMPION criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "MOST_WINS_CHAMPION",
      championId: 157,
      queue: "SOLO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("MOST_WINS_CHAMPION");
      if (result.data.type === "MOST_WINS_CHAMPION") {
        expect(result.data.championId).toBe(157);
        expect(result.data.queue).toBe("SOLO");
      }
    }
  });

  test("parses HIGHEST_WIN_RATE criteria", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "HIGHEST_WIN_RATE",
      minGames: 25,
      queue: "FLEX",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("HIGHEST_WIN_RATE");
      if (result.data.type === "HIGHEST_WIN_RATE") {
        expect(result.data.minGames).toBe(25);
        expect(result.data.queue).toBe("FLEX");
      }
    }
  });

  test("fails with invalid criteria type", () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: "INVALID_TYPE",
      queue: "SOLO",
    });
    expect(result.success).toBe(false);
  });

  test("HIGHEST_RANK only allows SOLO or FLEX", () => {
    const invalid = CompetitionCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "ARENA",
    });
    expect(invalid.success).toBe(false);

    const valid = CompetitionCriteriaSchema.safeParse({
      type: "HIGHEST_RANK",
      queue: "SOLO",
    });
    expect(valid.success).toBe(true);
  });

  test("TypeScript type narrowing works correctly", () => {
    const criteria = CompetitionCriteriaSchema.parse({
      type: "MOST_WINS_CHAMPION",
      championId: 157,
      queue: "SOLO",
    });

    // TypeScript should narrow the type based on discriminator
    if (criteria.type === "MOST_WINS_CHAMPION") {
      // This should compile without errors - championId exists on this type
      expect(criteria.championId).toBe(157);
      expect(criteria.queue).toBe("SOLO");
    } else {
      // This branch should never be reached
      expect(true).toBe(false);
    }
  });

  test("Each criteria type has distinct properties", () => {
    const criteria1 = CompetitionCriteriaSchema.parse({
      type: "HIGHEST_RANK",
      queue: "SOLO",
    });
    expect(criteria1.type).toBe("HIGHEST_RANK");

    const criteria2 = CompetitionCriteriaSchema.parse({
      type: "MOST_WINS_CHAMPION",
      championId: 157,
    });
    expect(criteria2.type).toBe("MOST_WINS_CHAMPION");
    // Verify type narrowing allows access to type-specific fields
    if (criteria2.type === "MOST_WINS_CHAMPION") {
      expect(criteria2.championId).toBe(157);
    }

    const criteria3 = CompetitionCriteriaSchema.parse({
      type: "HIGHEST_WIN_RATE",
      queue: "FLEX",
    });
    expect(criteria3.type).toBe("HIGHEST_WIN_RATE");
    if (criteria3.type === "HIGHEST_WIN_RATE") {
      expect(criteria3.minGames).toBe(10); // default value
    }
  });
});
