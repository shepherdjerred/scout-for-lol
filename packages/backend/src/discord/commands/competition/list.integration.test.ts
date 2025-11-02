import { beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DiscordAccountId, type DiscordChannelId, type DiscordGuildId } from "@scout-for-lol/data";
import { createCompetition, getCompetitionsByServer } from "../../../database/competition/queries.js";
import type { CreateCompetitionInput } from "../../../database/competition/queries.js";

import { testGuildId, testAccountId, testChannelId } from "../../../testing/test-ids.js";
// Create a test database for integration tests
const testDir = mkdtempSync(join(tmpdir(), "competition-list-test-"));
const testDbPath = join(testDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database once before all tests
const schemaPath = join(import.meta.dir, "../../../..", "prisma/schema.prisma");
execSync(`bunx prisma db push --skip-generate --schema=${schemaPath}`, {
  cwd: join(import.meta.dir, "../../../.."),
  env: {
    ...process.env,
    DATABASE_URL: testDbUrl,
    PRISMA_GENERATE_SKIP_AUTOINSTALL: "true",
    PRISMA_SKIP_POSTINSTALL_GENERATE: "true",
  },
  stdio: "ignore",
});

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.competitionSnapshot.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();
  await prisma.player.deleteMany();
});

// ============================================================================
// Test Helpers
// ============================================================================

function createTestCompetitionInput(
  serverId: DiscordGuildId,
  ownerId: DiscordAccountId,
  channelId: DiscordChannelId,
  overrides?: Partial<CreateCompetitionInput>,
): CreateCompetitionInput {
  return {
    serverId,
    ownerId,
    channelId,
    title: "Test Competition",
    description: "Test description",
    visibility: "OPEN",
    maxParticipants: 50,
    dates: {
      type: "FIXED_DATES",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    },
    criteria: {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("Competition List Query", () => {
  const serverId = testGuildId("12300");
  const ownerId1 = testAccountId("100000000010");
  const ownerId2 = testAccountId("200000000020");
  const channelId = testChannelId("1000000001");

  test("empty list when no competitions exist", async () => {
    const competitions = await getCompetitionsByServer(prisma, serverId);
    expect(competitions).toEqual([]);
  });

  test("returns all competitions for a server", async () => {
    // Create multiple competitions
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Competition 1" }),
    );
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Competition 2" }),
    );
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId2, channelId, { title: "Competition 3" }),
    );

    // Create competition in different server (should not appear)
    await createCompetition(
      prisma,
      createTestCompetitionInput(testGuildId("00000"), ownerId1, channelId, {
        title: "Other Server Comp",
      }),
    );

    const competitions = await getCompetitionsByServer(prisma, serverId);
    expect(competitions).toHaveLength(3);
    expect(competitions.map((c) => c.title).sort()).toEqual(["Competition 1", "Competition 2", "Competition 3"]);
  });

  test("filters by ownerId", async () => {
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Owner 1 Comp" }),
    );
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId2, channelId, { title: "Owner 2 Comp" }),
    );

    const owner1Comps = await getCompetitionsByServer(prisma, serverId, { ownerId: ownerId1 });
    expect(owner1Comps).toHaveLength(1);
    expect(owner1Comps[0]?.title).toBe("Owner 1 Comp");

    const owner2Comps = await getCompetitionsByServer(prisma, serverId, { ownerId: ownerId2 });
    expect(owner2Comps).toHaveLength(1);
    expect(owner2Comps[0]?.title).toBe("Owner 2 Comp");
  });

  test("filters by activeOnly - excludes cancelled", async () => {
    // Create active competition
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Active Comp" }),
    );

    // Create and cancel competition
    const cancelled = await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Cancelled Comp" }),
    );
    await prisma.competition.update({
      where: { id: cancelled.id },
      data: { isCancelled: true },
    });

    // Get all competitions
    const allComps = await getCompetitionsByServer(prisma, serverId);
    expect(allComps).toHaveLength(2);

    // Get only active competitions
    const activeComps = await getCompetitionsByServer(prisma, serverId, { activeOnly: true });
    expect(activeComps).toHaveLength(1);
    expect(activeComps[0]?.title).toBe("Active Comp");
  });

  test("filters by activeOnly - excludes ended competitions", async () => {
    // Create ongoing competition
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, {
        title: "Ongoing Comp",
        dates: {
          type: "FIXED_DATES",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
      }),
    );

    // Create ended competition
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, {
        title: "Ended Comp",
        dates: {
          type: "FIXED_DATES",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
      }),
    );

    // Get all competitions
    const allComps = await getCompetitionsByServer(prisma, serverId);
    expect(allComps).toHaveLength(2);

    // Get only active competitions
    const activeComps = await getCompetitionsByServer(prisma, serverId, { activeOnly: true });
    expect(activeComps).toHaveLength(1);
    expect(activeComps[0]?.title).toBe("Ongoing Comp");
  });

  test("activeOnly includes season-based competitions", async () => {
    // Create season-based competition (no end date)
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, {
        title: "Season Comp",
        dates: {
          type: "SEASON",
          seasonId: "2025_SEASON_3_ACT_1",
        },
      }),
    );

    const activeComps = await getCompetitionsByServer(prisma, serverId, { activeOnly: true });
    expect(activeComps).toHaveLength(1);
    expect(activeComps[0]?.title).toBe("Season Comp");
  });

  test("returns competitions ordered by creation time (newest first)", async () => {
    // Create competitions with slight delays to ensure ordering
    await createCompetition(prisma, createTestCompetitionInput(serverId, ownerId1, channelId, { title: "First" }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    await createCompetition(prisma, createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Second" }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    await createCompetition(prisma, createTestCompetitionInput(serverId, ownerId1, channelId, { title: "Third" }));

    const competitions = await getCompetitionsByServer(prisma, serverId);
    expect(competitions.map((c) => c.title)).toEqual(["Third", "Second", "First"]);
  });

  test("combines activeOnly and ownerId filters", async () => {
    // Create active competition by owner1
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, {
        title: "Owner1 Active",
        dates: {
          type: "FIXED_DATES",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
      }),
    );

    // Create ended competition by owner1
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId1, channelId, {
        title: "Owner1 Ended",
        dates: {
          type: "FIXED_DATES",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
      }),
    );

    // Create active competition by owner2
    await createCompetition(
      prisma,
      createTestCompetitionInput(serverId, ownerId2, channelId, {
        title: "Owner2 Active",
        dates: {
          type: "FIXED_DATES",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
        },
      }),
    );

    const filtered = await getCompetitionsByServer(prisma, serverId, {
      activeOnly: true,
      ownerId: ownerId1,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Owner1 Active");
  });

  test("handles large number of competitions", async () => {
    // Create 20 competitions
    for (let i = 0; i < 20; i++) {
      await createCompetition(
        prisma,
        createTestCompetitionInput(serverId, ownerId1, channelId, { title: `Competition ${i.toString()}` }),
      );
    }

    const competitions = await getCompetitionsByServer(prisma, serverId);
    expect(competitions).toHaveLength(20);
  });
});
