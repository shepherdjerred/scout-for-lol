import { beforeEach, describe, expect, test } from "bun:test";
import { PermissionsBitField, PermissionFlagsBits } from "discord.js";
import { PrismaClient } from "../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCompetition, type CreateCompetitionInput } from "./competition/queries.js";
import { addParticipant, getParticipantStatus } from "./competition/participants.js";
import { validateOwnerLimit, validateServerLimit } from "./competition/validation.js";
import { canCreateCompetition, grantPermission } from "./competition/permissions.js";
import { clearAllRateLimits } from "./competition/rate-limit.js";
import type { CompetitionId, DiscordAccountId, DiscordGuildId, PlayerId } from "@scout-for-lol/data";
import { DiscordAccountIdSchema, DiscordChannelIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";

// ============================================================================
// Test Database Setup
// ============================================================================

const testDir = mkdtempSync(join(tmpdir(), "competition-business-logic-test-"));
const testDbPath = join(testDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database
execSync("bunx prisma db push --skip-generate", {
  env: { ...process.env, DATABASE_URL: testDbUrl },
  cwd: process.cwd(),
  stdio: "inherit",
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
  await prisma.serverPermission.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();
  await prisma.player.deleteMany();
  clearAllRateLimits();
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
): Promise<{ competitionId: CompetitionId }> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const input: CreateCompetitionInput = {
    serverId,
    ownerId,
    channelId: DiscordChannelIdSchema.parse("123456789012345678"),
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

  return { competitionId: competition.id };
}

// ============================================================================
// Participant Management Business Rules
// ============================================================================

describe("Participant Management - Cannot join inactive competition", () => {
  test("cannot join cancelled competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      isCancelled: true,
    });

    await expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(
      "Cannot join an inactive competition",
    );
  });

  test("cannot join ended competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const lastWeek = new Date(now.getTime() - 7 * 86400000);

    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: lastWeek,
      endDate: yesterday,
    });

    await expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(
      "Cannot join an inactive competition",
    );
  });

  test("can join active competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const nextWeek = new Date(now.getTime() + 7 * 86400000);

    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: yesterday,
      endDate: nextWeek,
    });

    const participant = await addParticipant(prisma, competitionId, playerId, "JOINED");
    expect(participant.status).toBe("JOINED");
  });
});

describe("Participant Management - Participant limit enforcement", () => {
  test("cannot join when participant limit is reached", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      maxParticipants: 2,
    });

    // Add 2 participants (reaches limit)
    const { playerId: player1Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-1"), "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-2"), "Player2");
    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");

    // Try to add 3rd participant
    const { playerId: player3Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-3"), "Player3");
    await expect(addParticipant(prisma, competitionId, player3Id, "JOINED")).rejects.toThrow(
      "Competition has reached maximum participants (2)",
    );
  });

  test("can join when below participant limit", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      maxParticipants: 2,
    });

    // Add 1 participant (below limit)
    const { playerId: player1Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-1"), "Player1");
    await addParticipant(prisma, competitionId, player1Id, "JOINED");

    // Can add 2nd participant
    const { playerId: player2Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-2"), "Player2");
    const participant = await addParticipant(prisma, competitionId, player2Id, "JOINED");
    expect(participant.status).toBe("JOINED");
  });

  test("LEFT participants do not count toward limit", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      maxParticipants: 2,
    });

    // Add 2 participants
    const { playerId: player1Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-1"), "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-2"), "Player2");
    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");

    // Player1 leaves
    await prisma.competitionParticipant.update({
      where: {
        competitionId_playerId: {
          competitionId,
          playerId: player1Id,
        },
      },
      data: {
        status: "LEFT",
        leftAt: new Date(),
      },
    });

    // Now player3 can join (only 1 active participant)
    const { playerId: player3Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-3"), "Player3");
    const participant = await addParticipant(prisma, competitionId, player3Id, "JOINED");
    expect(participant.status).toBe("JOINED");
  });
});

describe("Participant Management - Cannot rejoin after leaving", () => {
  test("cannot rejoin competition after leaving", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId);
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");

    // Join and then leave
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

    // Try to rejoin
    await expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(
      "Cannot rejoin a competition after leaving",
    );
  });

  test("participant status is LEFT after leaving", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId);
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");

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

    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("LEFT");
  });
});

describe("Participant Management - Invitation system", () => {
  test("can add participant with INVITED status", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const inviterId = DiscordAccountIdSchema.parse("inviter-789");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "INVITE_ONLY",
    });
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");

    const participant = await addParticipant(prisma, competitionId, playerId, "INVITED", inviterId);

    expect(participant.status).toBe("INVITED");
    expect(participant.invitedBy).toBe(inviterId);
    expect(participant.invitedAt).toBeInstanceOf(Date);
    expect(participant.joinedAt).toBeNull();
  });

  test("INVITED participants count toward participant limit", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "INVITE_ONLY",
      maxParticipants: 2,
    });

    // Invite 2 participants (reaches limit)
    const { playerId: player1Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-1"), "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-2"), "Player2");
    await addParticipant(prisma, competitionId, player1Id, "INVITED", ownerId);
    await addParticipant(prisma, competitionId, player2Id, "INVITED", ownerId);

    // Cannot invite 3rd participant
    const { playerId: player3Id } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-3"), "Player3");
    await expect(addParticipant(prisma, competitionId, player3Id, "INVITED", ownerId)).rejects.toThrow(
      "Competition has reached maximum participants (2)",
    );
  });

  test("cannot add duplicate participant", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const { competitionId } = await createTestCompetition(serverId, ownerId);
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");

    await addParticipant(prisma, competitionId, playerId, "JOINED");

    // Try to add same participant again
    await expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow("is already a participant");
  });
});

// ============================================================================
// Competition Limit Enforcement
// ============================================================================

describe("Competition Limits - Owner limit", () => {
  test("owner cannot create more than 1 active competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");

    // Create first competition
    await createTestCompetition(serverId, ownerId);

    // Try to create second competition
    await expect(validateOwnerLimit(prisma, serverId, ownerId)).rejects.toThrow(
      "You already have 1 active competition",
    );
  });

  test("owner can create competition after previous one ends", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    // Create ended competition
    await createTestCompetition(serverId, ownerId, {
      startDate: lastWeek,
      endDate: yesterday,
    });

    // Can create new competition (should not throw)
    await validateOwnerLimit(prisma, serverId, ownerId);
    expect(true).toBe(true); // If we get here, validation passed
  });

  test("owner can create competition after previous one is cancelled", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");

    // Create cancelled competition
    await createTestCompetition(serverId, ownerId, {
      isCancelled: true,
    });

    // Can create new competition (should not throw)
    await validateOwnerLimit(prisma, serverId, ownerId);
    expect(true).toBe(true); // If we get here, validation passed
  });

  test("owner limit is per-server", async () => {
    const server1 = DiscordGuildIdSchema.parse("111111111111111111");
    const server2 = DiscordGuildIdSchema.parse("222222222222222222");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");

    // Create competition on server1
    await createTestCompetition(server1, ownerId);

    // Can still create competition on server2 (should not throw)
    await validateOwnerLimit(prisma, server2, ownerId);
    expect(true).toBe(true); // If we get here, validation passed
  });
});

describe("Competition Limits - Server limit", () => {
  test("server cannot have more than 2 active competitions", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");

    // Create 2 competitions
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-1"));
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-2"));

    // Cannot create 3rd
    await expect(validateServerLimit(prisma, serverId)).rejects.toThrow(
      "This server already has 2 active competitions",
    );
  });

  test("server can create competition after one ends", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    // Create 2 competitions, one ended
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-1"), {
      startDate: lastWeek,
      endDate: yesterday,
    });
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-2"));

    // Can create 3rd (only 1 active, should not throw)
    await validateServerLimit(prisma, serverId);
    expect(true).toBe(true); // If we get here, validation passed
  });

  test("cancelled competitions do not count toward server limit", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");

    // Create 2 competitions, one cancelled
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-1"), { isCancelled: true });
    await createTestCompetition(serverId, DiscordAccountIdSchema.parse("owner-2"));

    // Can create 3rd (only 1 active, should not throw)
    await validateServerLimit(prisma, serverId);
    expect(true).toBe(true); // If we get here, validation passed
  });
});

// ============================================================================
// Permission Enforcement
// ============================================================================

describe("Permission Enforcement - Create competition", () => {
  test("admin can create competition without grant", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const userId = DiscordAccountIdSchema.parse("user-123");
    const adminPermissions = new PermissionsBitField([PermissionFlagsBits.Administrator]);

    const result = await canCreateCompetition(prisma, serverId, userId, adminPermissions);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  test("user with CREATE_COMPETITION grant can create competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const userId = DiscordAccountIdSchema.parse("user-123");
    const normalPermissions = new PermissionsBitField([PermissionFlagsBits.SendMessages]);

    // Grant permission
    await grantPermission(prisma, serverId, userId, "CREATE_COMPETITION", DiscordAccountIdSchema.parse("admin-456"));

    const result = await canCreateCompetition(prisma, serverId, userId, normalPermissions);

    expect(result.allowed).toBe(true);
  });

  test("user without grant cannot create competition", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const userId = DiscordAccountIdSchema.parse("user-123");
    const normalPermissions = new PermissionsBitField([PermissionFlagsBits.SendMessages]);

    const result = await canCreateCompetition(prisma, serverId, userId, normalPermissions);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Missing CREATE_COMPETITION permission");
  });

  test("permission grant is server-specific", async () => {
    const server1 = DiscordGuildIdSchema.parse("111111111111111111");
    const server2 = DiscordGuildIdSchema.parse("222222222222222222");
    const userId = DiscordAccountIdSchema.parse("user-123");
    const normalPermissions = new PermissionsBitField([PermissionFlagsBits.SendMessages]);

    // Grant on server1
    await grantPermission(prisma, server1, userId, "CREATE_COMPETITION", DiscordAccountIdSchema.parse("admin-456"));

    // Can create on server1
    const result1 = await canCreateCompetition(prisma, server1, userId, normalPermissions);
    expect(result1.allowed).toBe(true);

    // Cannot create on server2
    const result2 = await canCreateCompetition(prisma, server2, userId, normalPermissions);
    expect(result2.allowed).toBe(false);
  });
});

// ============================================================================
// Integration: Full Competition Lifecycle
// ============================================================================

describe("Integration - Competition lifecycle", () => {
  test("complete competition lifecycle: create, join, leave", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");

    // Create competition
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      maxParticipants: 10,
    });

    // Player joins
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");
    const participant = await addParticipant(prisma, competitionId, playerId, "JOINED");
    expect(participant.status).toBe("JOINED");

    // Verify joined status
    const status1 = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status1).toBe("JOINED");

    // Player leaves
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

    // Verify left status
    const status2 = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status2).toBe("LEFT");

    // Cannot rejoin
    await expect(addParticipant(prisma, competitionId, playerId, "JOINED")).rejects.toThrow(
      "Cannot rejoin a competition after leaving",
    );
  });

  test("invite-only competition workflow", async () => {
    const serverId = DiscordGuildIdSchema.parse("123456789012345678");
    const ownerId = DiscordAccountIdSchema.parse("owner-123");

    // Create invite-only competition
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      visibility: "INVITE_ONLY",
    });

    // Owner invites player
    const { playerId } = await createTestPlayer(serverId, DiscordAccountIdSchema.parse("user-456"), "TestPlayer");
    const invitation = await addParticipant(prisma, competitionId, playerId, "INVITED", ownerId);
    expect(invitation.status).toBe("INVITED");
    expect(invitation.invitedBy).toBe(ownerId);

    // Verify invited status
    const status = await getParticipantStatus(prisma, competitionId, playerId);
    expect(status).toBe("INVITED");
  });
});
