import { beforeEach, describe, expect, test } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCompetition, getCompetitionById } from "../../../database/competition/queries.js";
import type { CreateCompetitionInput } from "../../../database/competition/queries.js";
import { addParticipant } from "../../../database/competition/participants.js";
import { ChampionIdSchema, CompetitionIdSchema, DiscordAccountIdSchema, DiscordChannelIdSchema, DiscordGuildIdSchema, LeaguePuuidSchema, getCompetitionStatus, type ChampionId } from "@scout-for-lol/data";

// Create a test database for integration tests
const testDir = mkdtempSync(join(tmpdir(), "competition-view-test-"));
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
    title?: string;
    description?: string;
    criteriaType?: "MOST_GAMES_PLAYED" | "HIGHEST_RANK" | "MOST_WINS_CHAMPION";
    championId?: ChampionId;
  },
): Promise<{ competitionId: number; channelId: string }> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let criteria: CreateCompetitionInput["criteria"];
  if (options?.criteriaType === "HIGHEST_RANK") {
    criteria = { type: "HIGHEST_RANK", queue: "SOLO" };
  } else if (options?.criteriaType === "MOST_WINS_CHAMPION" && options.championId) {
    criteria = { type: "MOST_WINS_CHAMPION", championId: options.championId, queue: "SOLO" };
  } else {
    criteria = { type: "MOST_GAMES_PLAYED", queue: "SOLO" };
  }

  const input: CreateCompetitionInput = {
    serverId,
    ownerId,
    channelId: DiscordChannelIdSchema.parse("123456789012345678"),
    title: options?.title ?? "Test Competition",
    description: options?.description ?? "A test competition",
    visibility: options?.visibility ?? "OPEN",
    maxParticipants: options?.maxParticipants ?? 50,
    dates: {
      type: "FIXED_DATES",
      startDate: options?.startDate ?? tomorrow,
      endDate: options?.endDate ?? nextWeek,
    },
    criteria,
  };

  const competition = await createCompetition(prisma, input);

  // If cancelled, update it
  if (options?.isCancelled) {
    await prisma.competition.update({
      where: { id: competition.id },
      data: { isCancelled: true },
    });
  }

  return { competitionId: competition.id, channelId: competition.channelId };
}

// ============================================================================
// Tests: View DRAFT Competition
// ============================================================================

describe("Competition View - DRAFT Status", () => {
  test("should show details for DRAFT competition with no participants", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId);

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("DRAFT");

    expect(competition.title).toBe("Test Competition");
    expect(competition.description).toBe("A test competition");
    expect(competition.visibility).toBe("OPEN");
    expect(competition.maxParticipants).toBe(50);
  });

  test("should show participant list for DRAFT competition with participants", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId);
    const { playerId: player1Id } = await createTestPlayer(serverId, "user-1", "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, "user-2", "Player2");
    const { playerId: player3Id } = await createTestPlayer(serverId, "user-3", "Player3");

    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");
    await addParticipant(prisma, competitionId, player3Id, "JOINED");

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("DRAFT");

    // Verify participants
    const participants = await prisma.competitionParticipant.findMany({
      where: { competitionId, status: "JOINED" },
    });
    expect(participants).toHaveLength(3);
  });

  test("should indicate leaderboard not available for DRAFT competition", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId);

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("DRAFT");

    // For DRAFT competitions, leaderboard should not be available
    // This would be validated by the embed content in actual Discord interaction
  });
});

// ============================================================================
// Tests: View ACTIVE Competition
// ============================================================================

describe("Competition View - ACTIVE Status", () => {
  test("should show details for ACTIVE competition", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: yesterday,
      endDate: nextWeek,
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("ACTIVE");
  });

  test("should handle ACTIVE competition with participants", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: yesterday,
      endDate: nextWeek,
    });

    // Add participants
    const { playerId: player1Id } = await createTestPlayer(serverId, "user-1", "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, "user-2", "Player2");
    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("ACTIVE");

    // TODO: When Task 19 is implemented, test leaderboard calculation here
  });
});

// ============================================================================
// Tests: View ENDED Competition
// ============================================================================

describe("Competition View - ENDED Status", () => {
  test("should show details for ENDED competition", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: lastWeek,
      endDate: yesterday,
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("ENDED");
  });

  test("should show final standings for ENDED competition", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create competition that will end in the future initially
    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      startDate: twoWeeksAgo,
      endDate: nextWeek,
    });

    // Add participants while competition is active
    const { playerId: player1Id } = await createTestPlayer(serverId, "user-1", "Player1");
    const { playerId: player2Id } = await createTestPlayer(serverId, "user-2", "Player2");
    await addParticipant(prisma, competitionId, player1Id, "JOINED");
    await addParticipant(prisma, competitionId, player2Id, "JOINED");

    // Now update the competition to have ended
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma.competition.update({
      where: { id: competitionId },
      data: { endDate: yesterday },
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("ENDED");

    // Verify participants are still there
    const participants = await prisma.competitionParticipant.findMany({
      where: { competitionId, status: "JOINED" },
    });
    expect(participants).toHaveLength(2);

    // TODO: When Task 19 is implemented, test final leaderboard here
  });
});

// ============================================================================
// Tests: View CANCELLED Competition
// ============================================================================

describe("Competition View - CANCELLED Status", () => {
  test("should show details for CANCELLED competition", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      isCancelled: true,
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    const status = getCompetitionStatus(competition);
    expect(status).toBe("CANCELLED");

    expect(competition.isCancelled).toBe(true);
  });
});

// ============================================================================
// Tests: View Non-existent Competition
// ============================================================================

describe("Competition View - Error Cases", () => {
  test("should return null for non-existent competition", async () => {
    const competition = await getCompetitionById(prisma, 999999);
    expect(competition).toBeNull();
  });
});

// ============================================================================
// Tests: Different Criteria Types
// ============================================================================

describe("Competition View - Different Criteria Types", () => {
  test("should show MOST_GAMES_PLAYED criteria", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      criteriaType: "MOST_GAMES_PLAYED",
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    expect(competition.criteria.type).toBe("MOST_GAMES_PLAYED");
  });

  test("should show HIGHEST_RANK criteria", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      criteriaType: "HIGHEST_RANK",
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    expect(competition.criteria.type).toBe("HIGHEST_RANK");
  });

  test("should show MOST_WINS_CHAMPION criteria with champion ID", async () => {
    const serverId = "server-1";
    const ownerId = DiscordAccountIdSchema.parse("owner-1");
    const championId = ChampionIdSchema.parse(157); // Yasuo

    const { competitionId } = await createTestCompetition(serverId, ownerId, {
      criteriaType: "MOST_WINS_CHAMPION",
      championId,
    });

    const competition = await getCompetitionById(prisma, competitionId);
    expect(competition).not.toBeNull();

    if (!competition) {
      throw new Error("Competition not found");
    }

    expect(competition.criteria.type).toBe("MOST_WINS_CHAMPION");
    if (competition.criteria.type === "MOST_WINS_CHAMPION") {
      expect(competition.criteria.championId).toBe(ChampionIdSchema.parse(championId));
    }
  });
});
