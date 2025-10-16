import { describe, expect, test, beforeEach } from "bun:test";
import { PrismaClient } from "../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  recordPermissionError,
  recordSuccessfulSend,
  getAbandonedGuilds,
  markGuildAsNotified,
  cleanupOldErrorRecords,
} from "./guild-permission-errors.js";

// Create a test database
const testDir = mkdtempSync(join(tmpdir(), "guild-errors-test-"));
const testDbPath = join(testDir, "test.db");

// Initialize test database
execSync(`DATABASE_URL="file:${testDbPath}" bun run db:push`, {
  cwd: join(process.cwd()),
  stdio: "pipe",
});

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

beforeEach(async () => {
  // Clean up all records before each test
  await prisma.guildPermissionError.deleteMany();
});

describe("recordPermissionError", () => {
  test("creates new error record on first occurrence", async () => {
    await recordPermissionError(prisma, "guild-123", "channel-456", "proactive_check", "Missing Send Messages");

    const record = await prisma.guildPermissionError.findUnique({
      where: {
        serverId_channelId: {
          serverId: "guild-123",
          channelId: "channel-456",
        },
      },
    });

    expect(record).toBeDefined();
    expect(record?.serverId).toBe("guild-123");
    expect(record?.channelId).toBe("channel-456");
    expect(record?.errorType).toBe("proactive_check");
    expect(record?.errorReason).toBe("Missing Send Messages");
    expect(record?.consecutiveErrorCount).toBe(1);
    expect(record?.firstOccurrence).toBeDefined();
    expect(record?.lastOccurrence).toBeDefined();
  });

  test("increments error count on subsequent occurrences", async () => {
    // First error
    await recordPermissionError(prisma, "guild-123", "channel-456", "proactive_check");

    // Second error
    await recordPermissionError(prisma, "guild-123", "channel-456", "api_error");

    const record = await prisma.guildPermissionError.findUnique({
      where: {
        serverId_channelId: {
          serverId: "guild-123",
          channelId: "channel-456",
        },
      },
    });

    expect(record?.consecutiveErrorCount).toBe(2);
    expect(record?.errorType).toBe("api_error"); // Updates to latest error type
  });

  test("tracks separate errors for different channels in same guild", async () => {
    await recordPermissionError(prisma, "guild-123", "channel-1", "proactive_check");
    await recordPermissionError(prisma, "guild-123", "channel-2", "proactive_check");

    const errors = await prisma.guildPermissionError.findMany({
      where: { serverId: "guild-123" },
    });

    expect(errors).toHaveLength(2);
  });
});

describe("recordSuccessfulSend", () => {
  test("resets error count when called", async () => {
    // Create some errors
    await recordPermissionError(prisma, "guild-123", "channel-456", "proactive_check");
    await recordPermissionError(prisma, "guild-123", "channel-456", "api_error");

    // Record successful send
    await recordSuccessfulSend(prisma, "guild-123", "channel-456");

    const record = await prisma.guildPermissionError.findUnique({
      where: {
        serverId_channelId: {
          serverId: "guild-123",
          channelId: "channel-456",
        },
      },
    });

    expect(record?.consecutiveErrorCount).toBe(0);
    expect(record?.lastSuccessfulSend).toBeDefined();
  });

  test("creates record with successful send if none exists", async () => {
    await recordSuccessfulSend(prisma, "guild-123", "channel-456");

    const record = await prisma.guildPermissionError.findUnique({
      where: {
        serverId_channelId: {
          serverId: "guild-123",
          channelId: "channel-456",
        },
      },
    });

    expect(record?.consecutiveErrorCount).toBe(0);
    expect(record?.lastSuccessfulSend).toBeDefined();
  });
});

describe("getAbandonedGuilds", () => {
  test("finds guilds with 7+ days of consecutive errors", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Create error record from 8 days ago
    await prisma.guildPermissionError.create({
      data: {
        serverId: "abandoned-guild",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 50,
      },
    });

    const abandoned = await getAbandonedGuilds(prisma, 7);

    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]?.serverId).toBe("abandoned-guild");
    expect(abandoned[0]?.errorCount).toBe(50);
  });

  test("does not find guilds with recent errors (< 7 days)", async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await prisma.guildPermissionError.create({
      data: {
        serverId: "recent-error-guild",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: fiveDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 10,
      },
    });

    const abandoned = await getAbandonedGuilds(prisma, 7);

    expect(abandoned).toHaveLength(0);
  });

  test("does not find guilds with recent successful sends", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.guildPermissionError.create({
      data: {
        serverId: "recovered-guild",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 5,
        lastSuccessfulSend: yesterday, // Recent success
      },
    });

    const abandoned = await getAbandonedGuilds(prisma, 7);

    expect(abandoned).toHaveLength(0);
  });

  test("does not find guilds already notified", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    await prisma.guildPermissionError.create({
      data: {
        serverId: "already-notified",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 50,
        ownerNotified: true,
      },
    });

    const abandoned = await getAbandonedGuilds(prisma, 7);

    expect(abandoned).toHaveLength(0);
  });

  test("aggregates multiple channels for same guild", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Multiple channels with errors in same guild
    await prisma.guildPermissionError.create({
      data: {
        serverId: "multi-channel-guild",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 20,
      },
    });

    await prisma.guildPermissionError.create({
      data: {
        serverId: "multi-channel-guild",
        channelId: "channel-2",
        errorType: "api_error",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 15,
      },
    });

    const abandoned = await getAbandonedGuilds(prisma, 7);

    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]?.serverId).toBe("multi-channel-guild");
    expect(abandoned[0]?.errorCount).toBe(35); // 20 + 15
  });

  test("respects custom minDays parameter", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await prisma.guildPermissionError.create({
      data: {
        serverId: "three-day-error",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: threeDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 10,
      },
    });

    // Not found with 7-day threshold
    const abandonedSeven = await getAbandonedGuilds(prisma, 7);
    expect(abandonedSeven).toHaveLength(0);

    // Found with 2-day threshold
    const abandonedTwo = await getAbandonedGuilds(prisma, 2);
    expect(abandonedTwo).toHaveLength(1);
  });
});

describe("markGuildAsNotified", () => {
  test("marks all error records for a guild as notified", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Create multiple error records for same guild
    await prisma.guildPermissionError.create({
      data: {
        serverId: "guild-123",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 10,
      },
    });

    await prisma.guildPermissionError.create({
      data: {
        serverId: "guild-123",
        channelId: "channel-2",
        errorType: "api_error",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 5,
      },
    });

    await markGuildAsNotified(prisma, "guild-123");

    const records = await prisma.guildPermissionError.findMany({
      where: { serverId: "guild-123" },
    });

    expect(records).toHaveLength(2);
    expect(records.every((r) => r.ownerNotified)).toBe(true);
  });
});

describe("cleanupOldErrorRecords", () => {
  test("removes records with successful sends older than 30 days", async () => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    // Old resolved error
    await prisma.guildPermissionError.create({
      data: {
        serverId: "old-guild",
        channelId: "channel-1",
        errorType: "none",
        firstOccurrence: fortyDaysAgo,
        lastOccurrence: fortyDaysAgo,
        consecutiveErrorCount: 0,
        lastSuccessfulSend: fortyDaysAgo,
      },
    });

    const deletedCount = await cleanupOldErrorRecords(prisma);

    expect(deletedCount).toBe(1);

    const remaining = await prisma.guildPermissionError.findMany();
    expect(remaining).toHaveLength(0);
  });

  test("keeps recent resolved errors", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.guildPermissionError.create({
      data: {
        serverId: "recent-guild",
        channelId: "channel-1",
        errorType: "none",
        firstOccurrence: yesterday,
        lastOccurrence: yesterday,
        consecutiveErrorCount: 0,
        lastSuccessfulSend: yesterday,
      },
    });

    const deletedCount = await cleanupOldErrorRecords(prisma);

    expect(deletedCount).toBe(0);

    const remaining = await prisma.guildPermissionError.findMany();
    expect(remaining).toHaveLength(1);
  });

  test("keeps unresolved errors regardless of age", async () => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    // Old but still has errors
    await prisma.guildPermissionError.create({
      data: {
        serverId: "ongoing-error-guild",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: fortyDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 100, // Still has errors
      },
    });

    const deletedCount = await cleanupOldErrorRecords(prisma);

    expect(deletedCount).toBe(0);

    const remaining = await prisma.guildPermissionError.findMany();
    expect(remaining).toHaveLength(1);
  });
});

describe("Permission Error Workflow", () => {
  test("full workflow: error -> more errors -> success -> reset", async () => {
    const serverId = "workflow-guild";
    const channelId = "workflow-channel";

    // 1. First error
    await recordPermissionError(prisma, serverId, channelId, "proactive_check");
    let record = await prisma.guildPermissionError.findUnique({
      where: { serverId_channelId: { serverId, channelId } },
    });
    expect(record?.consecutiveErrorCount).toBe(1);

    // 2. More errors accumulate
    await recordPermissionError(prisma, serverId, channelId, "api_error");
    await recordPermissionError(prisma, serverId, channelId, "api_error");
    record = await prisma.guildPermissionError.findUnique({
      where: { serverId_channelId: { serverId, channelId } },
    });
    expect(record?.consecutiveErrorCount).toBe(3);

    // 3. Successful send resets count
    await recordSuccessfulSend(prisma, serverId, channelId);
    record = await prisma.guildPermissionError.findUnique({
      where: { serverId_channelId: { serverId, channelId } },
    });
    expect(record?.consecutiveErrorCount).toBe(0);
    expect(record?.lastSuccessfulSend).toBeDefined();
  });

  test("abandoned guild detection workflow", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Create error that started 8 days ago
    await prisma.guildPermissionError.create({
      data: {
        serverId: "abandoned-123",
        channelId: "channel-1",
        errorType: "proactive_check",
        firstOccurrence: eightDaysAgo,
        lastOccurrence: new Date(),
        consecutiveErrorCount: 50,
      },
    });

    // 1. Should be detected as abandoned
    const abandoned = await getAbandonedGuilds(prisma, 7);
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]?.serverId).toBe("abandoned-123");

    // 2. Mark as notified
    await markGuildAsNotified(prisma, "abandoned-123");

    // 3. Should no longer appear in abandoned list
    const stillAbandoned = await getAbandonedGuilds(prisma, 7);
    expect(stillAbandoned).toHaveLength(0);
  });
});
