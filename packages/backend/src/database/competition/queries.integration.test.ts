import { beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type CreateCompetitionInput,
  cancelCompetition,
  createCompetition,
  getActiveCompetitions,
  getCompetitionById,
  getCompetitionsByServer,
} from "./queries.js";

// Create a test database
const testDir = mkdtempSync(join(tmpdir(), "competition-queries-test-"));
const testDbPath = join(testDir, "test.db");
execSync(`DATABASE_URL="file:${testDbPath}" bun run db:push`, {
  cwd: join(__dirname, "../../.."),
  env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
});

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.competitionSnapshot.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.competition.deleteMany();
});

// ============================================================================
// createCompetition
// ============================================================================

describe("createCompetition", () => {
  test("creates competition with fixed dates and MOST_GAMES_PLAYED criteria", async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const input: CreateCompetitionInput = {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Test Competition",
      description: "A test competition",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "FIXED_DATES",
        startDate,
        endDate,
      },
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    };

    const competition = await createCompetition(prisma, input);

    expect(competition.id).toBeGreaterThan(0);
    expect(competition.title).toBe("Test Competition");
    expect(competition.criteria.type).toBe("MOST_GAMES_PLAYED");
    if (competition.criteria.type === "MOST_GAMES_PLAYED") {
      expect(competition.criteria.queue).toBe("SOLO");
    }
  });

  test("creates competition with season ID and HIGHEST_RANK criteria", async () => {
    const input: CreateCompetitionInput = {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Season Competition",
      description: "Season-based",
      visibility: "INVITE_ONLY",
      maxParticipants: 25,
      dates: {
        type: "SEASON",
        seasonId: "SPLIT_1_2025",
      },
      criteria: {
        type: "HIGHEST_RANK",
        queue: "SOLO",
      },
    };

    const competition = await createCompetition(prisma, input);

    expect(competition.seasonId).toBe("SPLIT_1_2025");
    expect(competition.startDate).toBeNull();
    expect(competition.endDate).toBeNull();
  });

  test("criteria round-trips correctly with MOST_WINS_CHAMPION", async () => {
    const input: CreateCompetitionInput = {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Champion Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "SEASON",
        seasonId: "SPLIT_1_2025",
      },
      criteria: {
        type: "MOST_WINS_CHAMPION",
        championId: 157,
        queue: "SOLO",
      },
    };

    const created = await createCompetition(prisma, input);
    const retrieved = await getCompetitionById(prisma, created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.criteria.type).toBe("MOST_WINS_CHAMPION");
  });
});

// ============================================================================
// getCompetitionById
// ============================================================================

describe("getCompetitionById", () => {
  test("returns competition when it exists", async () => {
    const input: CreateCompetitionInput = {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Test",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: { type: "SEASON", seasonId: "S1" },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    };

    const created = await createCompetition(prisma, input);
    const found = await getCompetitionById(prisma, created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  test("returns null for non-existent ID", async () => {
    const found = await getCompetitionById(prisma, 99999);
    expect(found).toBeNull();
  });
});

// ============================================================================
// getCompetitionsByServer
// ============================================================================

describe("getCompetitionsByServer", () => {
  test("returns all competitions for a server", async () => {
    for (let i = 0; i < 3; i++) {
      await createCompetition(prisma, {
        serverId: "123456789012345678",
        ownerId: "987654321098765432",
        channelId: "111222333444555666",
        title: `Competition ${i.toString()}`,
        description: "Test",
        visibility: "OPEN",
        maxParticipants: 50,
        dates: { type: "SEASON", seasonId: `S${i.toString()}` },
        criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
      });
    }

    const competitions = await getCompetitionsByServer(prisma, "123456789012345678");
    expect(competitions).toHaveLength(3);
  });

  test("filters by activeOnly", async () => {
    const now = new Date();

    // Active competition
    await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Active",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "FIXED_DATES",
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    // Ended competition
    await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "111111111111111111",
      channelId: "111222333444555666",
      title: "Ended",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    const activeOnly = await getCompetitionsByServer(prisma, "123456789012345678", { activeOnly: true });

    expect(activeOnly).toHaveLength(1);
    expect(activeOnly[0]?.title).toBe("Active");
  });

  test("filters by ownerId", async () => {
    // Create competitions with different owners
    await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "111111111111111111",
      channelId: "111222333444555666",
      title: "Owner 1 Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: { type: "SEASON", seasonId: "S1" },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "222222222222222222",
      channelId: "111222333444555666",
      title: "Owner 2 Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: { type: "SEASON", seasonId: "S2" },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    const owner1Comps = await getCompetitionsByServer(prisma, "123456789012345678", { ownerId: "111111111111111111" });

    expect(owner1Comps).toHaveLength(1);
    expect(owner1Comps[0]?.title).toBe("Owner 1 Competition");
  });
});

// ============================================================================
// getActiveCompetitions
// ============================================================================

describe("getActiveCompetitions", () => {
  test("returns active competitions from multiple servers", async () => {
    const now = new Date();

    for (let i = 0; i < 3; i++) {
      await createCompetition(prisma, {
        serverId: (100000000000000000 + i).toString(),
        ownerId: "987654321098765432",
        channelId: "111222333444555666",
        title: `Server ${i.toString()}`,
        description: "Test",
        visibility: "OPEN",
        maxParticipants: 50,
        dates: {
          type: "FIXED_DATES",
          startDate: now,
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
      });
    }

    const active = await getActiveCompetitions(prisma);
    expect(active).toHaveLength(3);
  });

  test("excludes cancelled competitions", async () => {
    const now = new Date();

    const created = await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Active",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "FIXED_DATES",
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    await cancelCompetition(prisma, created.id);

    const active = await getActiveCompetitions(prisma);
    expect(active).toHaveLength(0);
  });

  test("excludes ended competitions", async () => {
    const now = new Date();

    // Create ended competition
    await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Ended",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    const active = await getActiveCompetitions(prisma);
    expect(active).toHaveLength(0);
  });
});

// ============================================================================
// cancelCompetition
// ============================================================================

describe("cancelCompetition", () => {
  test("sets isCancelled flag to true", async () => {
    const created = await createCompetition(prisma, {
      serverId: "123456789012345678",
      ownerId: "987654321098765432",
      channelId: "111222333444555666",
      title: "Test",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 50,
      dates: { type: "SEASON", seasonId: "S1" },
      criteria: { type: "MOST_GAMES_PLAYED", queue: "SOLO" },
    });

    const cancelled = await cancelCompetition(prisma, created.id);
    expect(cancelled.isCancelled).toBe(true);
  });

  test("throws for non-existent competition", async () => {
    let error: unknown = null;
    try {
      await cancelCompetition(prisma, 99999);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
  });
});
