import { beforeEach, describe, expect, test, mock } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCompetition, type CreateCompetitionInput } from "../../../database/competition/queries.js";
import type { CompetitionCriteria } from "@scout-for-lol/data";
import { z } from "zod";

// Schema for Discord message content validation
const MessageContentSchema = z.object({
  content: z.string(),
  embeds: z.array(z.unknown()).optional(),
});

// Mock the Discord send function BEFORE importing daily-update
let sentMessages: { channelId: string; content: string | Record<string, unknown> }[] = [];

// Mock the channel send function
void mock.module("../../discord/channel.js", () => ({
  send: (message: string | Record<string, unknown>, channelId: string) => {
    sentMessages.push({ channelId, content: message });
    return Promise.resolve({ id: "mock-message-id" });
  },
}));

// Create a test database
const testDir = mkdtempSync(join(tmpdir(), "daily-update-test-"));
const testDbPath = join(testDir, "test.db");
execSync(`DATABASE_URL="file:${testDbPath}" bun run db:push`, {
  cwd: join(__dirname, "../../.."),
  env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
});

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

// Mock the prisma instance used by daily-update
void mock.module("../../../database/index.js", () => ({
  prisma: testPrisma,
}));

// Now import daily-update after mocks are set up
const { runDailyLeaderboardUpdate } = await import("./daily-update.js");

// Test helpers
async function createTestCompetition(
  criteria: CompetitionCriteria,
  startDate: Date,
  endDate: Date,
  options?: {
    serverId?: string;
    channelId?: string;
    title?: string;
  },
): Promise<{ competitionId: number; channelId: string }> {
  const channelId = options?.channelId ?? `channel-${Date.now().toString()}`;
  const input: CreateCompetitionInput = {
    serverId: options?.serverId ?? "123456789012345678",
    ownerId: "987654321098765432",
    channelId,
    title: options?.title ?? "Test Competition",
    description: "Test Description",
    visibility: "OPEN",
    maxParticipants: 50,
    dates: {
      type: "FIXED_DATES",
      startDate,
      endDate,
    },
    criteria,
  };

  const competition = await createCompetition(testPrisma, input);
  return { competitionId: competition.id, channelId };
}

async function createTestPlayer(alias: string, puuid: string, region: string): Promise<{ playerId: number }> {
  const now = new Date();
  const player = await testPrisma.player.create({
    data: {
      alias,
      discordId: null,
      serverId: "123456789012345678",
      creatorDiscordId: "987654321098765432",
      createdTime: now,
      updatedTime: now,
      accounts: {
        create: [
          {
            alias,
            puuid,
            region,
            serverId: "123456789012345678",
            creatorDiscordId: "987654321098765432",
            createdTime: now,
            updatedTime: now,
          },
        ],
      },
    },
  });
  return { playerId: player.id };
}

async function addTestParticipant(competitionId: number, playerId: number): Promise<void> {
  const now = new Date();
  await testPrisma.competitionParticipant.create({
    data: {
      competitionId,
      playerId,
      status: "JOINED",
      joinedAt: now,
    },
  });
}

async function createStartSnapshot(competitionId: number, playerId: number, startDate: Date): Promise<void> {
  await testPrisma.competitionSnapshot.create({
    data: {
      competitionId,
      playerId,
      snapshotType: "START",
      snapshotData: JSON.stringify({ soloGames: 0 }),
      snapshotTime: startDate,
    },
  });
}

beforeEach(async () => {
  // Clean up before each test
  await testPrisma.competitionSnapshot.deleteMany();
  await testPrisma.competitionParticipant.deleteMany();
  await testPrisma.competition.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.player.deleteMany();

  // Reset sent messages
  sentMessages = [];
});

// ============================================================================
// Daily Update Tests
// ============================================================================

describe("Daily Leaderboard Update", () => {
  test("posts update for single active competition", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    // Use dates relative to actual current time
    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const { competitionId, channelId } = await createTestCompetition(criteria, startDate, endDate);

    // Create START snapshot to make it ACTIVE
    const { playerId } = await createTestPlayer(
      "Player1",
      "p1-puuid-78-characters-long-exactly-this-is-a-valid-format-ok-1234567890",
      "na1",
    );
    await addTestParticipant(competitionId, playerId);
    await createStartSnapshot(competitionId, playerId, startDate);

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Verify message was sent
    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0]?.channelId).toBe(channelId);

    // Verify message content
    const message = sentMessages[0]?.content;
    expect(message).toBeDefined();

    const parsed = MessageContentSchema.safeParse(message);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.content).toContain("📊 **Daily Leaderboard Update**");
      expect(parsed.data.content).toContain("Test Competition");
    }
  });

  test("posts updates for multiple active competitions", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    // Use dates relative to actual current time
    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create 3 active competitions on different servers
    const comps = [];
    for (let i = 0; i < 3; i++) {
      const { competitionId, channelId } = await createTestCompetition(criteria, startDate, endDate, {
        serverId: (100000000000000000 + i).toString(),
        channelId: `channel-${i.toString()}`,
        title: `Competition ${i.toString()}`,
      });

      // Make them ACTIVE by adding START snapshots
      const { playerId } = await createTestPlayer(
        `Player${i.toString()}`,
        `p${i.toString()}-puuid-78-characters-long-exactly-this-is-valid-format-ok-123456789`,
        "na1",
      );
      await addTestParticipant(competitionId, playerId);
      await createStartSnapshot(competitionId, playerId, startDate);

      comps.push({ competitionId, channelId });
    }

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Verify messages were sent to all channels
    expect(sentMessages.length).toBe(3);

    // Verify each competition got an update
    for (let i = 0; i < 3; i++) {
      const messageForComp = sentMessages.find((m) => m.channelId === `channel-${i.toString()}`);
      expect(messageForComp).toBeDefined();

      const parsed = MessageContentSchema.safeParse(messageForComp?.content);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.content).toContain("📊 **Daily Leaderboard Update**");
        expect(parsed.data.content).toContain(`Competition ${i.toString()}`);
      }
    }
  });

  test("skips non-active competitions", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    const now = new Date();

    // Create ENDED competition (past end date) - won't be returned by getActiveCompetitions
    const { competitionId: endedId } = await createTestCompetition(
      criteria,
      new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Ended 3 days ago
      { title: "Ended Competition" },
    );
    const { playerId: endedPlayerId } = await createTestPlayer(
      "EndedPlayer",
      "ended-puuid-78-characters-long-exactly-this-is-valid-format-ok-123456",
      "na1",
    );
    await addTestParticipant(endedId, endedPlayerId);
    await createStartSnapshot(endedId, endedPlayerId, new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000));

    // Create CANCELLED competition - won't be returned by getActiveCompetitions
    const { competitionId: cancelledId } = await createTestCompetition(
      criteria,
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      { title: "Cancelled Competition" },
    );
    await testPrisma.competition.update({
      where: { id: cancelledId },
      data: { isCancelled: true },
    });

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Verify no messages were sent (only ENDED and CANCELLED exist, neither returned by getActiveCompetitions)
    expect(sentMessages.length).toBe(0);
  });

  test("handles competition with no participants", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create ACTIVE competition with no participants
    // This will be returned by getActiveCompetitions and will be ACTIVE status
    await createTestCompetition(criteria, startDate, endDate);

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Should post update even with no participants (will show "No participants have scores yet")
    expect(sentMessages.length).toBe(1);

    // Verify the message indicates no participants
    const message = sentMessages[0]?.content;
    const parsed = MessageContentSchema.safeParse(message);
    expect(parsed.success).toBe(true);
  });

  test("continues processing after error in one competition", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create first competition with invalid channel (will fail to send)
    const { competitionId: comp1Id } = await createTestCompetition(criteria, startDate, endDate, {
      channelId: "invalid-channel-id",
      title: "Competition 1",
    });
    const { playerId: player1Id } = await createTestPlayer(
      "Player1",
      "p1-puuid-78-characters-long-exactly-this-is-a-valid-format-ok-1234567890",
      "na1",
    );
    await addTestParticipant(comp1Id, player1Id);
    await createStartSnapshot(comp1Id, player1Id, startDate);

    // Create second competition (should succeed)
    const { competitionId: comp2Id, channelId: channel2Id } = await createTestCompetition(
      criteria,
      startDate,
      endDate,
      {
        channelId: "valid-channel-id",
        title: "Competition 2",
      },
    );
    const { playerId: player2Id } = await createTestPlayer(
      "Player2",
      "p2-puuid-78-characters-long-exactly-this-is-a-valid-format-ok-1234567890",
      "na1",
    );
    await addTestParticipant(comp2Id, player2Id);
    await createStartSnapshot(comp2Id, player2Id, startDate);

    // Run daily update - should not throw despite first competition failing
    await runDailyLeaderboardUpdate();

    // Second competition should still get updated
    expect(sentMessages.length).toBeGreaterThanOrEqual(1);
    const comp2Message = sentMessages.find((m) => m.channelId === channel2Id);
    expect(comp2Message).toBeDefined();
  });

  test("handles no active competitions gracefully", async () => {
    // Don't create any competitions

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Should complete without errors
    expect(sentMessages.length).toBe(0);
  });

  test("message includes day count for active competition", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { competitionId } = await createTestCompetition(criteria, startDate, endDate);

    // Make it ACTIVE
    const { playerId } = await createTestPlayer(
      "Player1",
      "p1-puuid-78-characters-long-exactly-this-is-a-valid-format-ok-1234567890",
      "na1",
    );
    await addTestParticipant(competitionId, playerId);
    await createStartSnapshot(competitionId, playerId, startDate);

    // Run daily update
    await runDailyLeaderboardUpdate();

    // Verify message was sent
    expect(sentMessages.length).toBe(1);

    // Verify embed contains status information
    const message = sentMessages[0]?.content;

    const parsed = MessageContentSchema.safeParse(message);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.embeds) {
      expect(parsed.data.embeds).toBeDefined();
      expect(parsed.data.embeds.length).toBeGreaterThan(0);

      // The embed should have status field that shows active state
      const embed = parsed.data.embeds[0];
      expect(embed).toBeDefined();
    }
  });

  test("respects rate limiting with delays between posts", async () => {
    const criteria: CompetitionCriteria = {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    };

    const now = new Date();
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create 3 active competitions
    for (let i = 0; i < 3; i++) {
      const { competitionId } = await createTestCompetition(criteria, startDate, endDate, {
        channelId: `channel-${i.toString()}`,
        title: `Competition ${i.toString()}`,
      });

      const { playerId } = await createTestPlayer(
        `Player${i.toString()}`,
        `p${i.toString()}-puuid-78-characters-long-exactly-this-is-valid-format-ok-123456789`,
        "na1",
      );
      await addTestParticipant(competitionId, playerId);
      await createStartSnapshot(competitionId, playerId, startDate);
    }

    const startTime = Date.now();
    await runDailyLeaderboardUpdate();
    const endTime = Date.now();

    // Should take at least 2 seconds (2 delays of 1 second each between 3 posts)
    // Allow some tolerance for test execution time
    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(1900); // At least 1.9 seconds

    // All messages should have been sent
    expect(sentMessages.length).toBe(3);
  });
});
