import { describe, expect, test } from "bun:test";
import {
  CompetitionIdSchema,
  CompetitionQueueTypeSchema,
  CompetitionVisibilitySchema,
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
