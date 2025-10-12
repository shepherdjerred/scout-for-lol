import { test, expect, beforeEach, afterEach } from "bun:test";
import { PrismaClient } from "../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Create a temporary database for testing
const testDbDir = mkdtempSync(join(tmpdir(), "competition-test-"));
const testDbPath = join(testDbDir, "test.db");
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
});

afterEach(async () => {
  // Clean up after each test
  await prisma.competitionSnapshot.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.serverPermission.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();
  await prisma.player.deleteMany();
});

test("Competition CRUD operations", async () => {
  const now = new Date();
  const serverId = "server-123";
  const ownerId = "user-456";

  // Create competition
  const competition = await prisma.competition.create({
    data: {
      serverId,
      ownerId,
      title: "January Grind Challenge",
      description: "Most games played in solo queue",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: new Date(now.getTime() + 86400000), // Tomorrow
      endDate: new Date(now.getTime() + 2592000000), // 30 days
      seasonId: null,
      creatorDiscordId: ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  // Verify creation
  expect(competition.id).toBeGreaterThan(0);
  expect(competition.title).toBe("January Grind Challenge");
  expect(competition.visibility).toBe("OPEN");

  // Query competition by ID
  const found = await prisma.competition.findUnique({
    where: { id: competition.id },
  });

  expect(found).not.toBeNull();
  expect(found?.title).toBe("January Grind Challenge");

  // Update competition
  const updated = await prisma.competition.update({
    where: { id: competition.id },
    data: { title: "Updated Challenge" },
  });

  expect(updated.title).toBe("Updated Challenge");

  // Delete competition
  await prisma.competition.delete({
    where: { id: competition.id },
  });

  const deleted = await prisma.competition.findUnique({
    where: { id: competition.id },
  });

  expect(deleted).toBeNull();
});

test("User can create multiple competitions over time", async () => {
  const now = new Date();
  const serverId = "server-123";
  const ownerId = "user-456";

  // Create first competition (ENDED)
  const firstCompetition = await prisma.competition.create({
    data: {
      serverId,
      ownerId,
      title: "January Competition",
      description: "First competition",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: new Date(now.getTime() - 2592000000), // 30 days ago
      endDate: new Date(now.getTime() - 86400000), // Yesterday (ENDED)
      seasonId: null,
      creatorDiscordId: ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  expect(firstCompetition.id).toBeGreaterThan(0);

  // Create second competition (ACTIVE) - should succeed!
  const secondCompetition = await prisma.competition.create({
    data: {
      serverId,
      ownerId,
      title: "February Competition",
      description: "Second competition",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 2592000000), // 30 days from now (ACTIVE)
      seasonId: null,
      creatorDiscordId: ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  expect(secondCompetition.id).toBeGreaterThan(0);
  expect(secondCompetition.id).not.toBe(firstCompetition.id);

  // Verify both competitions exist
  const competitions = await prisma.competition.findMany({
    where: {
      serverId,
      ownerId,
    },
  });

  expect(competitions.length).toBe(2);
  expect(competitions.map((c) => c.title).sort()).toEqual([
    "February Competition",
    "January Competition",
  ]);
});

test("User can have cancelled and active competitions simultaneously", async () => {
  const now = new Date();
  const serverId = "server-123";
  const ownerId = "user-456";

  // Create cancelled competition
  const cancelledCompetition = await prisma.competition.create({
    data: {
      serverId,
      ownerId,
      title: "Cancelled Competition",
      description: "This was cancelled",
      channelId: "channel-789",
      isCancelled: true, // CANCELLED
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 2592000000),
      seasonId: null,
      creatorDiscordId: ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create active competition - should succeed!
  const activeCompetition = await prisma.competition.create({
    data: {
      serverId,
      ownerId,
      title: "Active Competition",
      description: "This is active",
      channelId: "channel-789",
      isCancelled: false, // ACTIVE
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 2592000000),
      seasonId: null,
      creatorDiscordId: ownerId,
      createdTime: now,
      updatedTime: now,
    },
  });

  expect(cancelledCompetition.id).toBeGreaterThan(0);
  expect(activeCompetition.id).toBeGreaterThan(0);

  // Query for active competitions only
  const activeCompetitions = await prisma.competition.findMany({
    where: {
      serverId,
      ownerId,
      isCancelled: false,
    },
  });

  expect(activeCompetitions.length).toBe(1);
  expect(activeCompetitions[0]?.title).toBe("Active Competition");
});

test("Cascade delete behavior", async () => {
  const now = new Date();
  const serverId = "server-123";

  // Create player
  const player = await prisma.player.create({
    data: {
      alias: "TestPlayer",
      serverId,
      discordId: "discord-123",
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create competition
  const competition = await prisma.competition.create({
    data: {
      serverId,
      ownerId: "owner-789",
      title: "Test Competition",
      description: "Test",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create participant
  const participant = await prisma.competitionParticipant.create({
    data: {
      competitionId: competition.id,
      playerId: player.id,
      status: "JOINED",
      invitedBy: null,
      joinedAt: now,
      leftAt: null,
    },
  });

  // Create snapshot
  const snapshot = await prisma.competitionSnapshot.create({
    data: {
      competitionId: competition.id,
      playerId: player.id,
      snapshotType: "START",
      snapshotData: JSON.stringify({ rank: "GOLD_II" }),
      snapshotTime: now,
    },
  });

  // Verify they exist
  expect(participant.id).toBeGreaterThan(0);
  expect(snapshot.id).toBeGreaterThan(0);

  // Delete competition
  await prisma.competition.delete({
    where: { id: competition.id },
  });

  // Verify participants and snapshots are also deleted (cascade)
  const foundParticipant = await prisma.competitionParticipant.findUnique({
    where: { id: participant.id },
  });

  const foundSnapshot = await prisma.competitionSnapshot.findUnique({
    where: { id: snapshot.id },
  });

  expect(foundParticipant).toBeNull();
  expect(foundSnapshot).toBeNull();
});

test("Foreign key constraints", async () => {
  const now = new Date();
  const serverId = "server-123";

  // Create competition
  const competition = await prisma.competition.create({
    data: {
      serverId,
      ownerId: "owner-789",
      title: "Test Competition",
      description: "Test",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Attempt to create participant with invalid playerId
  let error: Error | null = null;
  try {
    await prisma.competitionParticipant.create({
      data: {
        competitionId: competition.id,
        playerId: 999999, // Invalid ID
        status: "JOINED",
        invitedBy: null,
        joinedAt: now,
        leftAt: null,
      },
    });
  } catch (e) {
    error = e as unknown as Error;
  }
  expect(error).not.toBeNull();
  expect(error?.message).toContain("Foreign key constraint");
});

test("ServerPermission CRUD operations", async () => {
  const now = new Date();

  // Create permission
  const permission = await prisma.serverPermission.create({
    data: {
      serverId: "server-123",
      discordUserId: "user-456",
      permission: "CREATE_COMPETITION",
      grantedBy: "admin-789",
      grantedAt: now,
    },
  });

  expect(permission.id).toBeGreaterThan(0);
  expect(permission.permission).toBe("CREATE_COMPETITION");

  // Query permission
  const found = await prisma.serverPermission.findFirst({
    where: {
      serverId: "server-123",
      discordUserId: "user-456",
      permission: "CREATE_COMPETITION",
    },
  });

  expect(found).not.toBeNull();
  expect(found?.discordUserId).toBe("user-456");
});

test("CompetitionParticipant unique constraint", async () => {
  const now = new Date();
  const serverId = "server-123";

  // Create player
  const player = await prisma.player.create({
    data: {
      alias: "TestPlayer",
      serverId,
      discordId: "discord-123",
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create competition
  const competition = await prisma.competition.create({
    data: {
      serverId,
      ownerId: "owner-789",
      title: "Test Competition",
      description: "Test",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create participant
  await prisma.competitionParticipant.create({
    data: {
      competitionId: competition.id,
      playerId: player.id,
      status: "JOINED",
      invitedBy: null,
      joinedAt: now,
      leftAt: null,
    },
  });

  // Attempt to create duplicate participant
  let error: Error | null = null;
  try {
    await prisma.competitionParticipant.create({
      data: {
        competitionId: competition.id,
        playerId: player.id,
        status: "JOINED",
        invitedBy: null,
        joinedAt: now,
        leftAt: null,
      },
    });
  } catch (e) {
    error = e as unknown as Error;
  }
  expect(error).not.toBeNull();
  expect(error?.message).toContain("Unique constraint");
});

test("CompetitionSnapshot unique constraint", async () => {
  const now = new Date();
  const serverId = "server-123";

  // Create player
  const player = await prisma.player.create({
    data: {
      alias: "TestPlayer",
      serverId,
      discordId: "discord-123",
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create competition
  const competition = await prisma.competition.create({
    data: {
      serverId,
      ownerId: "owner-789",
      title: "Test Competition",
      description: "Test",
      channelId: "channel-789",
      isCancelled: false,
      visibility: "OPEN",
      criteriaType: "MOST_GAMES_PLAYED",
      criteriaConfig: JSON.stringify({ queue: "SOLO" }),
      maxParticipants: 50,
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
      seasonId: null,
      creatorDiscordId: "creator-456",
      createdTime: now,
      updatedTime: now,
    },
  });

  // Create snapshot
  await prisma.competitionSnapshot.create({
    data: {
      competitionId: competition.id,
      playerId: player.id,
      snapshotType: "START",
      snapshotData: JSON.stringify({ rank: "GOLD_II" }),
      snapshotTime: now,
    },
  });

  // Attempt to create duplicate snapshot (same competition, player, and type)
  let error: Error | null = null;
  try {
    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player.id,
        snapshotType: "START",
        snapshotData: JSON.stringify({ rank: "GOLD_I" }),
        snapshotTime: now,
      },
    });
  } catch (e) {
    error = e as unknown as Error;
  }
  expect(error).not.toBeNull();
  expect(error?.message).toContain("Unique constraint");
});
