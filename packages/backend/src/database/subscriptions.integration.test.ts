import { test, expect, beforeEach, afterEach, describe } from "bun:test";
import { PrismaClient } from "../../generated/prisma/client/index.js";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getChannelsSubscribedToPlayers } from "./index.js";
import { CompetitionIdSchema, DiscordAccountIdSchema, DiscordChannelIdSchema, DiscordGuildIdSchema, LeaguePuuid, LeaguePuuidSchema, type DiscordChannelId, type DiscordGuildId, type PlayerId } from "@scout-for-lol/data";

// Create a temporary database for testing
const testDbDir = mkdtempSync(join(tmpdir(), "subscriptions-test-"));
const testDbPath = join(testDbDir, "test.db");
const testDbUrl = `file:${testDbPath}`;

// Push schema to test database
execSync("bunx prisma db push --skip-generate", {
  env: { ...process.env, DATABASE_URL: testDbUrl },
  cwd: process.cwd(),
  stdio: "inherit",
});

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
});

beforeEach(async () => {
  // Clean up database before each test
  await testPrisma.subscription.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.player.deleteMany();
});

afterEach(async () => {
  // Clean up after each test
  await testPrisma.subscription.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.player.deleteMany();
});

// Helper function to create a valid 78-character PUUID
function createPuuid(identifier: string): LeaguePuuid {
  // PUUIDs are exactly 78 characters long
  const base = `puuid-${identifier}`;
  return LeaguePuuidSchema.parse(base.padEnd(78, "0"));
}

// Helper function to create a valid Discord channel ID (17-20 numeric characters)
function createChannelId(identifier: string): DiscordChannelId {
  // Discord channel IDs are 17-20 characters and must be numeric (snowflake IDs)
  // Format: Take a base number and pad it to make it 18 characters
  const base = identifier.replace(/\D/g, ""); // Remove non-digits
  const numericId = `1${base}`.padEnd(18, "0");
  return DiscordChannelIdSchema.parse(numericId);
}

// Helper function to create test data with required metadata
async function createTestPlayer(alias: string, serverId: DiscordGuildId) {
  const now = new Date();
  return await testPrisma.player.create({
    data: {
      alias,
      discordId: DiscordAccountIdSchema.parse(`discord-${alias}`),
      serverId: DiscordGuildIdSchema.parse(serverId),
      creatorDiscordId: DiscordAccountIdSchema.parse("test-creator"),
      createdTime: now,
      updatedTime: now,
    },
  });
}

async function createTestAccount(puuid: LeaguePuuid, playerId: PlayerId, serverId: DiscordGuildId, alias: string) {
  const now = new Date();
  return await testPrisma.account.create({
    data: {
      puuid,
      region: "AMERICA_NORTH",
      alias,
      playerId,
      serverId,
      creatorDiscordId: DiscordAccountIdSchema.parse("test-creator"),
      createdTime: now,
      updatedTime: now,
    },
  });
}

async function createTestSubscription(playerId: PlayerId, channelId: DiscordChannelId, serverId: DiscordGuildId) {
  return await testPrisma.subscription.create({
    data: {
      playerId,
      channelId,
      serverId,
      creatorDiscordId: DiscordAccountIdSchema.parse("test-creator"),
      createdTime: new Date(),
      updatedTime: new Date(),
    },
  });
}

describe("getChannelsSubscribedToPlayers - Deduplication Fix", () => {
  test("deduplicates channels when a player is tracked in multiple servers to the same channel", async () => {
    // This is the core bug fix: When Server A and Server B both track Player X
    // and both subscribe to channel #123, we should only send ONE message to #123

    const player = await createTestPlayer("TestPlayer", DiscordGuildIdSchema.parse("server-1"));

    // Create account for the player
    const account = await createTestAccount(
      createPuuid("main"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      player.alias,
    );

    // Create two subscriptions in different servers but to the SAME channel
    const channelId = createChannelId("123");
    await createTestSubscription(player.id, channelId, DiscordGuildIdSchema.parse("server-1"));
    await createTestSubscription(player.id, channelId, DiscordGuildIdSchema.parse("server-2"));

    // Get channels subscribed to this player
    const puuid = LeaguePuuidSchema.parse(account.puuid);
    const channels = await getChannelsSubscribedToPlayers([puuid], testPrisma);

    // Should only return 1 channel, not 2 (deduplication working!)
    expect(channels).toHaveLength(1);
    expect(channels[0]?.channel).toBe(DiscordChannelIdSchema.parse(channelId));
  });

  test("returns multiple channels when player is subscribed to different channels", async () => {
    const player = await createTestPlayer("TestPlayer", DiscordGuildIdSchema.parse("server-1"));
    const account = await createTestAccount(
      createPuuid("main"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      player.alias,
    );

    // Create subscriptions to different channels
    const channel1 = createChannelId("123");
    const channel2 = createChannelId("456");
    const channel3 = createChannelId("789");
    await createTestSubscription(player.id, channel1, DiscordGuildIdSchema.parse("server-1"));
    await createTestSubscription(player.id, channel2, DiscordGuildIdSchema.parse("server-2"));
    await createTestSubscription(player.id, channel3, DiscordGuildIdSchema.parse("server-3"));

    const puuid = LeaguePuuidSchema.parse(account.puuid);
    const channels = await getChannelsSubscribedToPlayers([puuid], testPrisma);

    // Should return 3 unique channels
    expect(channels).toHaveLength(3);
    const channelIds = channels.map((c) => c.channel).sort();
    expect(channelIds).toEqual([
      DiscordChannelIdSchema.parse(channel1),
      DiscordChannelIdSchema.parse(channel2),
      DiscordChannelIdSchema.parse(channel3),
    ]);
  });

  test("deduplicates when multiple accounts of same player are subscribed to same channel", async () => {
    // Test case: Player has a main account and a smurf account
    // Both accounts are tracked in the same channel
    // Should only send ONE message to that channel

    const player = await createTestPlayer("TestPlayer", DiscordGuildIdSchema.parse("server-1"));

    // Create two accounts for the same player (e.g., main and smurf)
    const mainAccount = await createTestAccount(
      createPuuid("main"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      player.alias,
    );
    const smurfAccount = await createTestAccount(
      createPuuid("smurf"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      `${player.alias}-smurf`,
    );

    // Create a subscription for the player (applies to all their accounts)
    const channelId = createChannelId("123");
    await createTestSubscription(player.id, channelId, DiscordGuildIdSchema.parse("server-1"));

    // Get channels for both accounts
    const puuids = [mainAccount.puuid, smurfAccount.puuid].map((p) => LeaguePuuidSchema.parse(p));
    const channels = await getChannelsSubscribedToPlayers(puuids, testPrisma);

    // Should only return 1 channel, not 2 (deduplication working!)
    expect(channels).toHaveLength(1);
    expect(channels[0]?.channel).toBe(DiscordChannelIdSchema.parse(channelId));
  });

  test("returns empty array when player has no subscriptions", async () => {
    const player = await createTestPlayer("TestPlayer", DiscordGuildIdSchema.parse("server-1"));
    const account = await createTestAccount(
      createPuuid("main"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      player.alias,
    );

    const puuid = LeaguePuuidSchema.parse(account.puuid);
    const channels = await getChannelsSubscribedToPlayers([puuid], testPrisma);

    expect(channels).toHaveLength(0);
  });

  test("handles complex scenario with multiple players and overlapping subscriptions", async () => {
    // Complex scenario:
    // - Player 1 subscribed to channel-A and channel-B
    // - Player 2 subscribed to channel-B and channel-C
    // - When both are in a game together, should return [channel-A, channel-B, channel-C]
    //   with channel-B deduplicated (not appearing twice)

    const player1 = await createTestPlayer("Player1", DiscordGuildIdSchema.parse("server-1"));
    const player2 = await createTestPlayer("Player2", DiscordGuildIdSchema.parse("server-1"));

    const account1 = await createTestAccount(
      createPuuid("player1"),
      player1.id,
      DiscordGuildIdSchema.parse("server-1"),
      player1.alias,
    );
    const account2 = await createTestAccount(
      createPuuid("player2"),
      player2.id,
      DiscordGuildIdSchema.parse("server-1"),
      player2.alias,
    );

    // Player 1 subscriptions
    const channelA = createChannelId("111");
    const channelB = createChannelId("222");
    const channelC = createChannelId("333");
    await createTestSubscription(player1.id, channelA, DiscordGuildIdSchema.parse("server-1"));
    await createTestSubscription(player1.id, channelB, DiscordGuildIdSchema.parse("server-2"));

    // Player 2 subscriptions (channel-B overlaps!)
    await createTestSubscription(player2.id, channelB, DiscordGuildIdSchema.parse("server-3"));
    await createTestSubscription(player2.id, channelC, DiscordGuildIdSchema.parse("server-4"));

    const puuids = [account1.puuid, account2.puuid].map((p) => LeaguePuuidSchema.parse(p));
    const channels = await getChannelsSubscribedToPlayers(puuids, testPrisma);

    // Should return 3 unique channels (A, B, C) not 4
    expect(channels).toHaveLength(3);
    const channelIds = channels.map((c) => c.channel).sort();
    expect(channelIds).toEqual([
      DiscordChannelIdSchema.parse(channelA),
      DiscordChannelIdSchema.parse(channelB),
      DiscordChannelIdSchema.parse(channelC),
    ]);
  });

  test("handles case where same player has multiple subscriptions in same server", async () => {
    // Edge case: Player is subscribed in multiple channels in the same server
    // (e.g., #general and #league-of-legends)

    const player = await createTestPlayer("TestPlayer", DiscordGuildIdSchema.parse("server-1"));
    const account = await createTestAccount(
      createPuuid("main"),
      player.id,
      DiscordGuildIdSchema.parse("server-1"),
      player.alias,
    );

    // Create multiple subscriptions in the same server to different channels
    const channelGeneral = createChannelId("1001");
    const channelLol = createChannelId("1002");
    await createTestSubscription(player.id, channelGeneral, DiscordGuildIdSchema.parse("server-1"));
    await createTestSubscription(player.id, channelLol, DiscordGuildIdSchema.parse("server-1"));

    const puuid = LeaguePuuidSchema.parse(account.puuid);
    const channels = await getChannelsSubscribedToPlayers([puuid], testPrisma);

    // Should return both channels
    expect(channels).toHaveLength(2);
    const channelIds = channels.map((c) => c.channel).sort();
    expect(channelIds).toEqual([
      DiscordChannelIdSchema.parse(channelGeneral),
      DiscordChannelIdSchema.parse(channelLol),
    ]);
  });
});
