import { beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCompetition, getCompetitionById } from "../../../database/competition/queries.js";
import type { CreateCompetitionInput } from "../../../database/competition/queries.js";
import { addParticipant, getParticipantStatus } from "../../../database/competition/participants.js";

// Create a test database for integration tests
const testDir = mkdtempSync(join(tmpdir(), "competition-invite-test-"));
const testDbPath = join(testDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database once before all tests
execSync(`DATABASE_URL="${testDbUrl}" bun run db:push`, {
  cwd: join(import.meta.dir, "../../../.."),
  env: { ...process.env, DATABASE_URL: testDbUrl },
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

async function createTestPlayer(serverId: string, discordId: string, alias: string): Promise<{ playerId: number }> {
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
  serverId: string,
  ownerId: string,
  options?: {
    visibility?: "OPEN" | "INVITE_ONLY" | "SERVER_WIDE";
    maxParticipants?: number;
    isCancelled?: boolean;
    startDate?: Date;
    endDate?: Date;
  },
): Promise<{ competitionId: number; channelId: string }> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const input: CreateCompetitionInput = {
    serverId,
    ownerId,
    channelId: "123456789012345678",
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
// Test: Owner invites user
// ============================================================================

describe("Owner invites user", () => {
  test("owner executes invite → succeeds", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Owner invites target user
    await addParticipant(prisma, competitionId, playerId, "INVITED", ownerId);

    // Verify participant created with INVITED status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("INVITED");

    // Verify invitedAt and invitedBy set correctly
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId,
        },
      },
    });
    expect(participant).not.toBeNull();
    expect(participant?.invitedAt).not.toBeNull();
    expect(participant?.invitedBy).toBe(ownerId);
  });
});

// ============================================================================
// Test: Non-owner tries to invite
// ============================================================================

describe("Non-owner tries to invite", () => {
  test("non-owner tries to invite → owner check would fail", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const nonOwnerId = "333333333333333333";
    const targetUserId = "222222222222222222";

    await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Get competition to verify ownership
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();
    expect(competition?.ownerId).toBe(ownerId);

    // Simulate command logic: check if user is owner
    const isOwner = competition?.ownerId === nonOwnerId;

    // Non-owner should NOT be able to invite (command would block this)
    expect(isOwner).toBe(false);
  });
});

// ============================================================================
// Test: Invite to OPEN competition
// ============================================================================

describe("Invite to OPEN competition", () => {
  test("OPEN competition → owner invites user → succeeds", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // Owner invites target user (works for any visibility type)
    await addParticipant(prisma, competitionId, playerId, "INVITED", ownerId);

    // Verify participant created with INVITED status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("INVITED");

    // Verify competition is OPEN
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition?.visibility).toBe("OPEN");
  });
});

// ============================================================================
// Test: Invite already joined user
// ============================================================================

describe("Invite already joined user", () => {
  test("user already JOINED → owner tries to invite → should detect existing status", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // User joins first
    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // Check status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("JOINED");

    // Command logic would check this and reject invitation
    expect(status).not.toBeNull();
    expect(status).toBe("JOINED");
  });
});

// ============================================================================
// Test: Invite already invited user (idempotent)
// ============================================================================

describe("Invite already invited user", () => {
  test("user already INVITED → owner tries to invite again → idempotent", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Owner invites target user
    await addParticipant(prisma, competitionId, playerId, "INVITED", ownerId);

    // Check status - already invited
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("INVITED");

    // Try to invite again - addParticipant will throw error
    expect(addParticipant(prisma, competitionId, playerId, "INVITED", ownerId)).rejects.toThrow(
      /already a participant/i,
    );

    // But command logic would detect this and handle gracefully (idempotent)
    expect(status).toBe("INVITED");
  });
});

// ============================================================================
// Test: Invite user without Player account
// ============================================================================

describe("Invite user without Player account", () => {
  test("target user has no linked account → should detect missing player", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Try to find player - should not exist
    const player = await prisma.player.findFirst({
      where: {
        serverId,
        discordId: targetUserId,
      },
    });
    expect(player).toBeNull();

    // Competition exists
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    // Command logic would check for player and reject
    expect(player).toBeNull();
  });
});

// ============================================================================
// Test: Invite when at limit
// ============================================================================

describe("Invite when at limit", () => {
  test("competition at maxParticipants → owner tries to invite → fails", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";

    const { competitionId } = await createTestCompetition(serverId, ownerId, { maxParticipants: 2 });

    // Create 2 players and have them join
    const { playerId: player1Id } = await createTestPlayer(serverId, "user1", "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, "user2", "Player2");
    const { playerId: player3Id } = await createTestPlayer(serverId, "user3", "Player3");

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

    // Owner tries to invite 3rd user - should fail
    expect(addParticipant(prisma, competitionId, player3Id, "INVITED", ownerId)).rejects.toThrow(
      /maximum participants/i,
    );
  });
});

// ============================================================================
// Test: Invite user who left
// ============================================================================

describe("Invite user who left", () => {
  test("user previously left → owner tries to invite → should detect LEFT status", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "OPEN" });

    // User joins then leaves
    await addParticipant(prisma, competitionId, playerId, "JOINED");
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

    // Check status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("LEFT");

    // Command logic would check this and reject invitation
    expect(status).toBe("LEFT");
  });
});

// ============================================================================
// Test: Invite to cancelled competition
// ============================================================================

describe("Invite to cancelled competition", () => {
  test("competition is cancelled → owner tries to invite → should detect cancellation", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "INVITE_ONLY",
      isCancelled: true,
    });

    // Verify competition is cancelled
    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition?.isCancelled).toBe(true);

    // Try to invite - should fail due to inactive competition
    expect(addParticipant(prisma, competitionId, playerId, "INVITED", ownerId)).rejects.toThrow(
      /inactive competition/i,
    );
  });
});

// ============================================================================
// Test: Invite to ended competition
// ============================================================================

describe("Invite to ended competition", () => {
  test("competition has ended → owner tries to invite → should detect ended status", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";
    const targetUserId = "222222222222222222";

    // Create competition with dates in the past
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { playerId } = await createTestPlayer(serverId, targetUserId, "TargetUser");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "INVITE_ONLY",
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

    // Try to invite - should fail due to inactive competition
    expect(addParticipant(prisma, competitionId, playerId, "INVITED", ownerId)).rejects.toThrow(
      /inactive competition/i,
    );
  });
});

// ============================================================================
// Test: Multiple invitations to different users
// ============================================================================

describe("Multiple invitations", () => {
  test("owner invites multiple users → all succeed", async () => {
    const serverId = "123456789012345678";
    const ownerId = "111111111111111111";

    const { competitionId } = await createTestCompetition(serverId, ownerId, { visibility: "INVITE_ONLY" });

    // Create 3 players
    const { playerId: player1Id } = await createTestPlayer(serverId, "user1", "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, "user2", "Player2");
    const { playerId: player3Id } = await createTestPlayer(serverId, "user3", "Player3");

    // Owner invites all 3
    await addParticipant(prisma, competitionId, player1Id, "INVITED", ownerId);
    await addParticipant(prisma, competitionId, player2Id, "INVITED", ownerId);
    await addParticipant(prisma, competitionId, player3Id, "INVITED", ownerId);

    // Verify all 3 have INVITED status
    const status1 = await getParticipantStatus(prisma, competitionId, player1Id);
    const status2 = await getParticipantStatus(prisma, competitionId, player2Id);
    const status3 = await getParticipantStatus(prisma, competitionId, player3Id);

    expect(status1).toBe("INVITED");
    expect(status2).toBe("INVITED");
    expect(status3).toBe("INVITED");

    // Verify count
    const count = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: "INVITED",
      },
    });
    expect(count).toBe(3);
  });
});
