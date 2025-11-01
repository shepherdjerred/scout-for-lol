import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { PrismaClient } from "../../../../generated/prisma/client/index.js";
import { pruneOrphanedPlayers } from "./prune-players.js";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  LeaguePuuidSchema,
} from "@scout-for-lol/data";

// Mark these tests as serial since they create temporary databases
// and have timing constraints. Running them concurrently would slow them down.
describe.serial("pruneOrphanedPlayers", () => {
  let prisma: PrismaClient;
  let testDir: string;
  let testDbPath: string;

  beforeEach(async () => {
    // Create a temporary database for each test
    testDir = mkdtempSync(join(tmpdir(), "prune-players-test-"));
    testDbPath = join(testDir, "test.db");

    // Run Prisma migrations to set up the schema
    execSync(`DATABASE_URL="file:${testDbPath}" bun run db:push`, {
      cwd: join(__dirname, "../../../.."),
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
      stdio: "ignore",
    });

    // Create Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${testDbPath}`,
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.$disconnect();
    rmSync(testDir, { recursive: true, force: true });
  });

  it("should prune players with no subscriptions and no active competitions", async () => {
    const now = new Date();

    // Create an orphaned player
    await prisma.player.create({
      data: {
        alias: "orphaned",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Verify player exists
    const beforeCount = await prisma.player.count();
    expect(beforeCount).toBe(1);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify player was pruned
    expect(result.totalPlayersPruned).toBe(1);
    const afterCount = await prisma.player.count();
    expect(afterCount).toBe(0);
  });

  it("should NOT prune players with subscriptions", async () => {
    const now = new Date();

    // Create a player with a subscription
    await prisma.player.create({
      data: {
        alias: "subscribed",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        subscriptions: {
          create: {
            channelId: DiscordChannelIdSchema.parse("channel1"),
            serverId: DiscordGuildIdSchema.parse("server1"),
            creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
            createdTime: now,
            updatedTime: now,
          },
        },
      },
    });

    // Verify player exists
    const beforeCount = await prisma.player.count();
    expect(beforeCount).toBe(1);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify player was NOT pruned
    expect(result.totalPlayersPruned).toBe(0);
    const afterCount = await prisma.player.count();
    expect(afterCount).toBe(1);
  });

  it("should NOT prune players with active competition participations", async () => {
    const now = new Date();

    // Create a competition
    const competition = await prisma.competition.create({
      data: {
        serverId: DiscordGuildIdSchema.parse("server1"),
        ownerId: DiscordAccountIdSchema.parse("user1"),
        title: "Test Competition",
        description: "Test",
        channelId: DiscordChannelIdSchema.parse("channel1"),
        visibility: "OPEN",
        criteriaType: "MOST_WINS",
        criteriaConfig: "{}",
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Create a player with active competition participation
    await prisma.player.create({
      data: {
        alias: "competing",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        competitionParticipants: {
          create: {
            competitionId: competition.id,
            status: "JOINED",
            joinedAt: now,
          },
        },
      },
    });

    // Verify player exists
    const beforeCount = await prisma.player.count();
    expect(beforeCount).toBe(1);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify player was NOT pruned
    expect(result.totalPlayersPruned).toBe(0);
    const afterCount = await prisma.player.count();
    expect(afterCount).toBe(1);
  });

  it("should prune players with LEFT or INVITED competition status", async () => {
    const now = new Date();

    // Create a competition
    const competition = await prisma.competition.create({
      data: {
        serverId: DiscordGuildIdSchema.parse("server1"),
        ownerId: DiscordAccountIdSchema.parse("user1"),
        title: "Test Competition",
        description: "Test",
        channelId: DiscordChannelIdSchema.parse("channel1"),
        visibility: "OPEN",
        criteriaType: "MOST_WINS",
        criteriaConfig: "{}",
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Create a player who left the competition
    await prisma.player.create({
      data: {
        alias: "left",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        competitionParticipants: {
          create: {
            competitionId: competition.id,
            status: "LEFT",
            leftAt: now,
          },
        },
      },
    });

    // Create a player who was only invited
    await prisma.player.create({
      data: {
        alias: "invited",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        competitionParticipants: {
          create: {
            competitionId: competition.id,
            status: "INVITED",
            invitedBy: DiscordAccountIdSchema.parse("user2"),
            invitedAt: now,
          },
        },
      },
    });

    // Verify players exist
    const beforeCount = await prisma.player.count();
    expect(beforeCount).toBe(2);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify both players were pruned
    expect(result.totalPlayersPruned).toBe(2);
    const afterCount = await prisma.player.count();
    expect(afterCount).toBe(0);
  });

  it("should delete associated accounts when pruning players", async () => {
    const now = new Date();

    // Create a player with accounts
    await prisma.player.create({
      data: {
        alias: "orphaned",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        accounts: {
          create: [
            {
              alias: "account1",
              puuid: LeaguePuuidSchema.parse("puuid1"),
              region: "AMERICA_NORTH",
              serverId: DiscordGuildIdSchema.parse("server1"),
              creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
              createdTime: now,
              updatedTime: now,
            },
            {
              alias: "account2",
              puuid: LeaguePuuidSchema.parse("puuid2"),
              region: "euw1",
              serverId: DiscordGuildIdSchema.parse("server1"),
              creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
              createdTime: now,
              updatedTime: now,
            },
          ],
        },
      },
    });

    // Verify accounts exist
    const beforeAccountCount = await prisma.account.count();
    expect(beforeAccountCount).toBe(2);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify accounts were deleted
    expect(result.totalPlayersPruned).toBe(1);
    expect(result.totalAccountsDeleted).toBe(2);
    const afterAccountCount = await prisma.account.count();
    expect(afterAccountCount).toBe(0);
  });

  it("should handle mixed scenarios correctly", async () => {
    const now = new Date();

    // Create a competition
    const competition = await prisma.competition.create({
      data: {
        serverId: DiscordGuildIdSchema.parse("server1"),
        ownerId: DiscordAccountIdSchema.parse("user1"),
        title: "Test Competition",
        description: "Test",
        channelId: DiscordChannelIdSchema.parse("channel1"),
        visibility: "OPEN",
        criteriaType: "MOST_WINS",
        criteriaConfig: "{}",
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Create orphaned player (should be pruned)
    await prisma.player.create({
      data: {
        alias: "orphaned",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Create subscribed player (should NOT be pruned)
    await prisma.player.create({
      data: {
        alias: "subscribed",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        subscriptions: {
          create: {
            channelId: "channel1",
            serverId: "server1",
            creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
            createdTime: now,
            updatedTime: now,
          },
        },
      },
    });

    // Create competing player (should NOT be pruned)
    await prisma.player.create({
      data: {
        alias: "competing",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        competitionParticipants: {
          create: {
            competitionId: competition.id,
            status: "JOINED",
            joinedAt: now,
          },
        },
      },
    });

    // Create player who left competition (should be pruned)
    await prisma.player.create({
      data: {
        alias: "left",
        serverId: DiscordGuildIdSchema.parse("server1"),
        creatorDiscordId: DiscordAccountIdSchema.parse("user1"),
        createdTime: now,
        updatedTime: now,
        competitionParticipants: {
          create: {
            competitionId: competition.id,
            status: "LEFT",
            leftAt: now,
          },
        },
      },
    });

    // Verify all players exist
    const beforeCount = await prisma.player.count();
    expect(beforeCount).toBe(4);

    // Prune orphaned players (disable notifications in tests)
    const result = await pruneOrphanedPlayers(prisma, false, null);

    // Verify only orphaned and left players were pruned
    expect(result.totalPlayersPruned).toBe(2);
    expect(result.serverSummaries.length).toBe(1);
    expect(result.serverSummaries[0]?.playersPruned).toBe(2);

    const afterCount = await prisma.player.count();
    expect(afterCount).toBe(2);

    // Verify the correct players remain
    const remainingPlayers = await prisma.player.findMany();
    const remainingAliases = remainingPlayers.map((p) => p.alias).sort();
    expect(remainingAliases).toEqual(["competing", "subscribed"]);
  });
});
