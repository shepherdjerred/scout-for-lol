import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import { z } from "zod";
import { PrismaClient } from "../../../generated/prisma/client/index.js";
import { calculateLeaderboard } from "./leaderboard.js";
import { createCompetition } from "../../database/competition/queries.js";
import { addParticipant } from "../../database/competition/participants.js";
import type { Rank } from "@scout-for-lol/data";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ============================================================================
// Test Setup
// ============================================================================

// Create a temporary database for testing
const testDbDir = mkdtempSync(join(tmpdir(), "leaderboard-test-"));
const testDbPath = join(testDbDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database before tests run
execSync("bunx prisma db push --skip-generate", {
  env: { ...process.env, DATABASE_URL: testDbUrl },
  cwd: join(process.cwd(), ".."),
  stdio: "inherit",
});

let prisma: PrismaClient;

beforeAll(() => {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Helper to reset database between tests
async function resetDatabase() {
  await prisma.competitionSnapshot.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.serverPermission.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();
  await prisma.player.deleteMany();
}

beforeEach(async () => {
  await resetDatabase();
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("calculateLeaderboard integration tests", () => {
  test("should throw error for DRAFT competition", async () => {
    // Create DRAFT competition (no dates set)
    // Create raw competition directly with null dates for DRAFT status
    const rawCompetition = await prisma.competition.create({
      data: {
        serverId: "test-server",
        ownerId: "owner-1",
        channelId: "channel-1",
        title: "Test Competition",
        description: "Test",
        visibility: "OPEN",
        maxParticipants: 10,
        criteriaType: "MOST_GAMES_PLAYED",
        criteriaConfig: JSON.stringify({ queue: "SOLO" }),
        isCancelled: false,
        startDate: null, // DRAFT - no start date
        endDate: null,
        seasonId: null,
        creatorDiscordId: "owner-1",
        createdTime: new Date(),
        updatedTime: new Date(),
      },
    });

    // Parse it to get CompetitionWithCriteria
    const competition = {
      ...rawCompetition,
      criteria: { type: "MOST_GAMES_PLAYED" as const, queue: "SOLO" as const },
    };

    // Should throw error for DRAFT competition
    expect(calculateLeaderboard(prisma, competition)).rejects.toThrow("Cannot calculate leaderboard for DRAFT");
  });

  test("should return empty leaderboard for competition with no participants", async () => {
    // Create active competition with dates
    const competition = await createCompetition(prisma, {
      serverId: "test-server",
      ownerId: "owner-1",
      channelId: "channel-1",
      title: "Test Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 10,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      },
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    });

    // No participants added

    const leaderboard = await calculateLeaderboard(prisma, competition);

    expect(leaderboard).toHaveLength(0);
  });

  test("should calculate leaderboard with participants but no matches", async () => {
    // Create players
    const player1 = await prisma.player.create({
      data: {
        discordId: "discord-1",
        alias: "Player1",
        serverId: "test-server",
        creatorDiscordId: "discord-1",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-1",
              alias: "Player1",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-1",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    const player2 = await prisma.player.create({
      data: {
        discordId: "discord-2",
        alias: "Player2",
        serverId: "test-server",
        creatorDiscordId: "discord-2",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-2",
              alias: "Player2",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-2",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    // Create competition
    const competition = await createCompetition(prisma, {
      serverId: "test-server",
      ownerId: "owner-1",
      channelId: "channel-1",
      title: "Test Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 10,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      },
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    });

    // Add participants
    await addParticipant(prisma, competition.id, player1.id, "JOINED");
    await addParticipant(prisma, competition.id, player2.id, "JOINED");

    // Note: No matches in S3, so scores will be 0

    const leaderboard = await calculateLeaderboard(prisma, competition);

    expect(leaderboard).toHaveLength(2);

    // Both should have score 0 and rank 1 (tied)
    expect(leaderboard[0]?.score).toBe(0);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(leaderboard[1]?.score).toBe(0);
    expect(leaderboard[1]?.rank).toBe(1);
  });

  test("should handle HIGHEST_RANK criteria with snapshots", async () => {
    // Create players
    const player1 = await prisma.player.create({
      data: {
        discordId: "discord-1",
        alias: "Player1",
        serverId: "test-server",
        creatorDiscordId: "discord-1",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-1",
              alias: "Player1",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-1",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    const player2 = await prisma.player.create({
      data: {
        discordId: "discord-2",
        alias: "Player2",
        serverId: "test-server",
        creatorDiscordId: "discord-2",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-2",
              alias: "Player2",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-2",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    // Create competition with HIGHEST_RANK criteria
    const competition = await createCompetition(prisma, {
      serverId: "test-server",
      ownerId: "owner-1",
      channelId: "channel-1",
      title: "Rank Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 10,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      },
      criteria: {
        type: "HIGHEST_RANK",
        queue: "SOLO",
      },
    });

    // Add participants
    await addParticipant(prisma, competition.id, player1.id, "JOINED");
    await addParticipant(prisma, competition.id, player2.id, "JOINED");

    // Create END snapshots with rank data
    const goldRank: Rank = {
      tier: "gold",
      division: 2,
      lp: 50,
      wins: 100,
      losses: 80,
    };

    const silverRank: Rank = {
      tier: "silver",
      division: 1,
      lp: 75,
      wins: 80,
      losses: 70,
    };

    // Player 1 is Gold (higher)
    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player1.id,
        snapshotType: "END",
        snapshotData: JSON.stringify({ soloRank: goldRank }),
        snapshotTime: new Date(),
      },
    });

    // Player 2 is Silver (lower)
    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player2.id,
        snapshotType: "END",
        snapshotData: JSON.stringify({ soloRank: silverRank }),
        snapshotTime: new Date(),
      },
    });

    const leaderboard = await calculateLeaderboard(prisma, competition);

    expect(leaderboard).toHaveLength(2);

    // Player 1 (Gold) should be rank 1
    expect(leaderboard[0]?.playerId).toBe(player1.id);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(leaderboard[0]?.score).toMatchObject(goldRank);

    // Player 2 (Silver) should be rank 2
    expect(leaderboard[1]?.playerId).toBe(player2.id);
    expect(leaderboard[1]?.rank).toBe(2);
    expect(leaderboard[1]?.score).toMatchObject(silverRank);
  });

  test("should handle MOST_RANK_CLIMB criteria with START and END snapshots", async () => {
    // Create players
    const player1 = await prisma.player.create({
      data: {
        discordId: "discord-1",
        alias: "Player1",
        serverId: "test-server",
        creatorDiscordId: "discord-1",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-1",
              alias: "Player1",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-1",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    const player2 = await prisma.player.create({
      data: {
        discordId: "discord-2",
        alias: "Player2",
        serverId: "test-server",
        creatorDiscordId: "discord-2",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-2",
              alias: "Player2",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-2",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    // Create competition with MOST_RANK_CLIMB criteria
    const competition = await createCompetition(prisma, {
      serverId: "test-server",
      ownerId: "owner-1",
      channelId: "channel-1",
      title: "Climb Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 10,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      },
      criteria: {
        type: "MOST_RANK_CLIMB",
        queue: "SOLO",
      },
    });

    // Add participants
    await addParticipant(prisma, competition.id, player1.id, "JOINED");
    await addParticipant(prisma, competition.id, player2.id, "JOINED");

    // Player 1: Silver 1 50LP → Gold 2 50LP (climbed ~2 divisions = 400 LP)
    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player1.id,
        snapshotType: "START",
        snapshotData: JSON.stringify({
          soloRank: { tier: "silver", division: 1, lp: 50, wins: 50, losses: 50 },
        }),
        snapshotTime: new Date(),
      },
    });

    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player1.id,
        snapshotType: "END",
        snapshotData: JSON.stringify({
          soloRank: { tier: "gold", division: 2, lp: 50, wins: 100, losses: 80 },
        }),
        snapshotTime: new Date(),
      },
    });

    // Player 2: Silver 2 0LP → Silver 1 0LP (climbed 1 division = 200 LP)
    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player2.id,
        snapshotType: "START",
        snapshotData: JSON.stringify({
          soloRank: { tier: "silver", division: 2, lp: 0, wins: 40, losses: 40 },
        }),
        snapshotTime: new Date(),
      },
    });

    await prisma.competitionSnapshot.create({
      data: {
        competitionId: competition.id,
        playerId: player2.id,
        snapshotType: "END",
        snapshotData: JSON.stringify({
          soloRank: { tier: "silver", division: 1, lp: 0, wins: 80, losses: 70 },
        }),
        snapshotTime: new Date(),
      },
    });

    const leaderboard = await calculateLeaderboard(prisma, competition);

    expect(leaderboard).toHaveLength(2);

    // Player 1 should be rank 1 (bigger climb)
    expect(leaderboard[0]?.playerId).toBe(player1.id);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(z.number().safeParse(leaderboard[0]?.score).success).toBe(true);
    expect(z.number().parse(leaderboard[0]?.score)).toBeGreaterThan(0);

    // Player 2 should be rank 2 (smaller climb)
    expect(leaderboard[1]?.playerId).toBe(player2.id);
    expect(leaderboard[1]?.rank).toBe(2);
    expect(z.number().safeParse(leaderboard[1]?.score).success).toBe(true);
    expect(z.number().parse(leaderboard[1]?.score)).toBeGreaterThan(0);

    // Player 1's climb should be greater than Player 2's
    const score0 = z.number().parse(leaderboard[0]?.score);
    const score1 = z.number().parse(leaderboard[1]?.score);
    expect(score0).toBeGreaterThan(score1);
  });

  test("should only include JOINED participants, not INVITED or LEFT", async () => {
    // Create players
    const player1 = await prisma.player.create({
      data: {
        discordId: "discord-1",
        alias: "Player1",
        serverId: "test-server",
        creatorDiscordId: "discord-1",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-1",
              alias: "Player1",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-1",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    const player2 = await prisma.player.create({
      data: {
        discordId: "discord-2",
        alias: "Player2",
        serverId: "test-server",
        creatorDiscordId: "discord-2",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-2",
              alias: "Player2",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-2",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    const player3 = await prisma.player.create({
      data: {
        discordId: "discord-3",
        alias: "Player3",
        serverId: "test-server",
        creatorDiscordId: "discord-3",
        createdTime: new Date(),
        updatedTime: new Date(),
        accounts: {
          create: [
            {
              puuid: "puuid-3",
              alias: "Player3",
              region: "na1",
              serverId: "test-server",
              creatorDiscordId: "discord-3",
              createdTime: new Date(),
              updatedTime: new Date(),
            },
          ],
        },
      },
    });

    // Create competition
    const competition = await createCompetition(prisma, {
      serverId: "test-server",
      ownerId: "owner-1",
      channelId: "channel-1",
      title: "Test Competition",
      description: "Test",
      visibility: "OPEN",
      maxParticipants: 10,
      dates: {
        type: "FIXED_DATES",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      },
      criteria: {
        type: "MOST_GAMES_PLAYED",
        queue: "SOLO",
      },
    });

    // Add participants with different statuses
    await addParticipant(prisma, competition.id, player1.id, "JOINED");
    await addParticipant(prisma, competition.id, player2.id, "INVITED"); // Should not appear
    await addParticipant(prisma, competition.id, player3.id, "JOINED");

    // Set player3 to LEFT status
    await prisma.competitionParticipant.update({
      where: {
        competitionId_playerId: {
          competitionId: competition.id,
          playerId: player3.id,
        },
      },
      data: {
        status: "LEFT",
        leftAt: new Date(),
      },
    });

    const leaderboard = await calculateLeaderboard(prisma, competition);

    // Should only include player1 (JOINED)
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0]?.playerId).toBe(player1.id);
  });
});
