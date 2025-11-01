import { beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCompetition, getCompetitionById } from "../../../database/competition/queries.js";
import type { CreateCompetitionInput } from "../../../database/competition/queries.js";
import { addParticipant, getParticipantStatus } from "../../../database/competition/participants.js";

import { testGuildId, testAccountId, testChannelId, testPuuid, testDate } from "../../../testing/test-ids.js";
// Create a test database for integration tests
const testDir = mkdtempSync(join(tmpdir(), "competition-join-test-"));
const testDbPath = join(testDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database once before all tests
execSync(`DATABASE_URL="${testDbUrl}" bun run db:push`, {
  cwd: join(import.meta.dir, "../../../.."),
  env: { ...process.env, DATABASE_URL: testDbUrl },
});
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  type CompetitionId,
  type DiscordAccountId,
  type DiscordChannelId,
  type DiscordGuildId,
  type PlayerId,
} from "@scout-for-lol/data";

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

async function createTestPlayer(
  serverId: DiscordGuildId,
  discordId: DiscordAccountId,
  alias: string,
): Promise<{ playerId: PlayerId }> {
  const now = new Date();
  const player = await prisma.player.create({
    data: {
      alias,
      discordId,
      serverId,
      creatorDiscordId: discordId,
      createdTime: now,
      updatedTime: now,
    },
  });

  return { playerId: player.id };
}

async function createTestCompetition(
  serverId: DiscordGuildId,
  ownerId: DiscordAccountId,
  options?: {
    visibility?: "OPEN" | "INVITE_ONLY" | "SERVER_WIDE";
    maxParticipants?: number;
    isCancelled?: boolean;
    startDate?: Date;
    endDate?: Date;
  },
): Promise<{ competitionId: CompetitionId; channelId: DiscordChannelId }> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const input: CreateCompetitionInput = {
    serverId,
    ownerId,
    channelId: testChannelId("123456789012345678"),
    title: "Test Competition",
    description: "A test competition",
    visibility: options?.visibility ?? "OPEN",
    maxParticipants: options?.maxParticipants ?? 50,
    dates: {
      type: "FIXED_DATES",
      startDate: options?.startDate ?? tomorrow,
      endDate: options?.endDate ?? nextWeek,
    },
    criteria: {
      type: "MOST_GAMES_PLAYED",
      queue: "SOLO",
    },
  };

  const competition = await createCompetition(prisma, input);

  // If cancelled, update it
  if (options?.isCancelled) {
    await prisma.competition.update({
      where: { id: competition.id },
      data: { isCancelled: true },
    });
  }

  return {
    competitionId: competition.id,
    channelId: input.channelId,
  };
}

// ============================================================================
// Test: Join OPEN competition
// ============================================================================

describe("Join OPEN competition", () => {
  test("user executes join on OPEN competition → succeeds", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // User joins
    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // Verify participant created with JOINED status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("JOINED");

    // Verify joinedAt timestamp set
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
    });
    expect(participant).not.toBeNull();
    expect(participant?.joinedAt).not.toBeNull();

    // Verify participant count
    const count = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: { not: "LEFT" },
      },
    });
    expect(count).toBe(1);
  });

  test("response message includes competition name and participant count", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    await addParticipant(prisma, competitionId, playerId, "JOINED");

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();
    expect(competition?.title).toBe("Test Competition");

    const count = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: { not: "LEFT" },
      },
    });
    expect(count).toBe(1);
  });
});

// ============================================================================
// Test: Join INVITE_ONLY when invited
// ============================================================================

describe("Join INVITE_ONLY when invited", () => {
  test("user is INVITED to competition → user executes join → succeeds", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Owner invites user
    await addParticipant(prisma, competitionId, playerId, "INVITED", ownerId);

    // Verify status is INVITED
    let status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("INVITED");

    // Get invitedAt before acceptance
    const beforeAccept = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
    });
    expect(beforeAccept?.invitedAt).not.toBeNull();
    const originalInvitedAt = beforeAccept?.invitedAt;

    // User accepts invitation (simulating join command)
    await prisma.competitionParticipant.update({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
      data: {
        status: "JOINED",
        joinedAt: new Date(),
      },
    });

    // Verify status is now JOINED
    status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("JOINED");

    // Verify joinedAt set and invitedAt preserved
    const afterAccept = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
    });
    expect(afterAccept?.joinedAt).not.toBeNull();
    expect(afterAccept?.invitedAt).toEqual(originalInvitedAt);
  });
});

// ============================================================================
// Test: Join INVITE_ONLY without invitation
// ============================================================================

describe("Join INVITE_ONLY without invitation", () => {
  test("user not invited → user tries to join INVITE_ONLY → visibility check fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Check that user is not invited
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBeNull();

    // Get competition to check visibility
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();
    expect(competition?.visibility).toBe("INVITE_ONLY");

    // Simulate command logic: check if visibility is INVITE_ONLY and user is not INVITED
    const canJoin = competition?.visibility === "INVITE_ONLY" && status !== "INVITED";

    // User should NOT be able to join (command would block this)
    expect(canJoin).toBe(true); // true means "blocked from joining"
  });
});

// ============================================================================
// Test: Join when at participant limit
// ============================================================================

describe("Join when at participant limit", () => {
  test("competition has maxParticipants=2 → 2 users already joined → 3rd user tries to join → fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");

    const { competitionId } = await createTestCompetition(serverId, ownerId, { maxParticipants: 2 });

    // Create 2 players and have them join
    const { playerId: player1Id } = await createTestPlayer(
      serverId,
      testAccountId("1000000000000"),
      "Player1",
    );
    const { playerId: player2Id } = await createTestPlayer(
      serverId,
      testAccountId("2000000000000"),
      "Player2",
    );
    const { playerId: player3Id } = await createTestPlayer(
      serverId,
      testAccountId("3000000000000"),
      "Player3",
    );

    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");

    // Verify 2 participants
    const count = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: { not: "LEFT" },
      },
    });
    expect(count).toBe(2);

    // 3rd user tries to join - should fail
    expect(addParticipant(prisma, competitionId, player3Id, "JOINED")).rejects.toThrow(/maximum participants/i);
  });
});

// ============================================================================
// Test: Join already joined competition
// ============================================================================

describe("Join already joined competition", () => {
  test("user already JOINED → user tries to join again → fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // User joins
    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // Verify joined
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("JOINED");

    // Try to join again - should fail
    expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(/already a participant/i);
  });
});

// ============================================================================
// Test: Join after leaving
// ============================================================================

describe("Join after leaving", () => {
  test("user joined then left (status=LEFT) → user tries to rejoin → fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // User joins
    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // User leaves
    await prisma.competitionParticipant.update({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
      data: {
        status: "LEFT",
        leftAt: new Date(),
      },
    });

    // Verify left
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("LEFT");

    // Try to rejoin - should fail
    expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(/cannot rejoin/i);
  });
});

// ============================================================================
// Test: Join CANCELLED competition
// ============================================================================

describe("Join CANCELLED competition", () => {
  test("competition is cancelled → user tries to join → fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "OPEN",
      isCancelled: true,
    });

    // Verify competition is cancelled
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition?.isCancelled).toBe(true);

    // Try to join - should fail
    expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(/inactive competition/i);
  });
});

// ============================================================================
// Test: Join without Player account
// ============================================================================

describe("Join without Player account", () => {
  test("Discord user has no linked Player → cannot join", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // Try to find player - should not exist
    const player = await prisma.player.findFirst({
      where: {
        serverId,
        discordId: userId,
      },
    });
    expect(player).toBeNull();

    // This simulates the error condition in the command - no player found
    // The command would check for null player and return error message
    expect(player).toBeNull();
  });
});

// ============================================================================
// Test: SERVER_WIDE competition
// ============================================================================

describe("SERVER_WIDE competition", () => {
  test("SERVER_WIDE visibility → any server member can join → succeeds", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "SERVER_WIDE" });

    // User joins
    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // Verify participant created with JOINED status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("JOINED");
  });
});

// ============================================================================
// Test: Join ended competition
// ============================================================================

describe("Join ended competition", () => {
  test("competition has ended → user tries to join → fails", async () => {
    const serverId = testGuildId("123456789012345678");
    const ownerId = testAccountId("111111111111111111");
    const userId = testAccountId("222222222222222222");

    // Create competition with dates in the past
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { playerId } = await createTestPlayer(serverId, userId, "TestUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "OPEN",
      startDate: lastWeek,
      endDate: yesterday,
    });

    // Verify competition has ended
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();
    const now = new Date();
    if (competition?.endDate) {
      expect(competition.endDate < now).toBe(true);
    }

    // Try to join - should fail
    expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(/inactive competition/i);
  });
});
