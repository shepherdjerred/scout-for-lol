import { describe, test, expect, beforeEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PrismaClient } from "../../../generated/prisma/client";

// Create test database in temp directory
const tempDir = fs.mkdtempSync(path.join("/tmp", "subscribe-test-"));
const testDbPath = path.join(tempDir, "test.db");
const testDatabaseUrl = `file:${testDbPath}`;

// Push schema to test database
execSync("bunx prisma db push --skip-generate", {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  cwd: process.cwd(),
  stdio: "inherit",
});

// Test Prisma client with isolated database
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

beforeEach(async () => {
  // Clean up test data
  await testPrisma.subscription.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.player.deleteMany();
});

describe("Subscribe Command - Multi-Account Support", () => {
  test("creates new player and account for first subscription", async () => {
    const now = new Date();
    const serverId = "test-server-1";
    const alias = "TestPlayer";
    const discordUserId = "user-1";

    // First subscription - should create both player and account
    const account = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: "puuid-1",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: serverId,
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: serverId,
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: {
        player: true,
      },
    });

    // Verify player was created
    expect(account.player.alias).toBe(alias);
    expect(account.player.serverId).toBe(serverId);
    expect(account.player.discordId).toBe(discordUserId);

    // Verify account was created with correct player link
    expect(account.playerId).toBe(account.player.id);
    expect(account.puuid).toBe("puuid-1");
    expect(account.region).toBe("NA1");
  });

  test("adds second account to existing player with same alias", async () => {
    const now = new Date();
    const serverId = "test-server-2";
    const alias = "MultiAccountPlayer";
    const discordUserId = "user-2";

    // First account - creates player
    const firstAccount = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: "puuid-na1",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: serverId,
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: serverId,
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: {
        player: true,
      },
    });

    const playerId = firstAccount.player.id;

    // Second account - should connect to existing player
    const secondAccount = await testPrisma.account.create({
      data: {
        alias: alias, // Same alias!
        puuid: "puuid-euw",
        region: "EUW1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: serverId,
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: serverId,
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: {
        player: true,
      },
    });

    // Verify both accounts link to the same player
    expect(secondAccount.playerId).toBe(playerId);
    expect(secondAccount.player.id).toBe(playerId);
    expect(firstAccount.player.id).toBe(secondAccount.player.id);

    // Verify accounts have different PUUIDs and regions
    expect(firstAccount.puuid).toBe("puuid-na1");
    expect(secondAccount.puuid).toBe("puuid-euw");
    expect(firstAccount.region).toBe("NA1");
    expect(secondAccount.region).toBe("EUW1");

    // Verify player has both accounts
    const playerWithAccounts = await testPrisma.player.findUnique({
      where: { id: playerId },
      include: { accounts: true },
    });

    expect(playerWithAccounts?.accounts).toHaveLength(2);
    expect(playerWithAccounts?.accounts.map((a) => a.puuid).sort()).toEqual(["puuid-euw", "puuid-na1"]);
  });

  test("prevents duplicate accounts with same PUUID in same server", async () => {
    const now = new Date();
    const serverId = "test-server-3";
    const alias = "DuplicateTest";
    const puuid = "same-puuid";
    const discordUserId = "user-3";

    // First account
    await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: puuid,
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: serverId,
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: serverId,
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
    });

    // Try to create duplicate account with same PUUID in same server
    let errorThrown = false;
    try {
      await testPrisma.account.create({
        data: {
          alias: alias,
          puuid: puuid, // Same PUUID!
          region: "NA1",
          serverId: serverId, // Same server!
          creatorDiscordId: discordUserId,
          player: {
            connectOrCreate: {
              where: {
                serverId_alias: {
                  serverId: serverId,
                  alias: alias,
                },
              },
              create: {
                alias: alias,
                discordId: discordUserId,
                createdTime: now,
                updatedTime: now,
                creatorDiscordId: discordUserId,
                serverId: serverId,
              },
            },
          },
          createdTime: now,
          updatedTime: now,
        },
      });
    } catch (error) {
      errorThrown = true;
    }

    // Should fail due to @@unique([serverId, puuid])
    expect(errorThrown).toBe(true);
  });

  test("allows same PUUID in different servers", async () => {
    const now = new Date();
    const alias = "CrossServerPlayer";
    const puuid = "cross-server-puuid";
    const discordUserId = "user-4";

    // Account in server 1
    const account1 = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: puuid,
        region: "NA1",
        serverId: "server-1",
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: "server-1",
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: "server-1",
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
    });

    // Account in server 2 with same PUUID
    const account2 = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: puuid, // Same PUUID!
        region: "NA1",
        serverId: "server-2", // Different server!
        creatorDiscordId: discordUserId,
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: "server-2",
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: discordUserId,
              serverId: "server-2",
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
    });

    // Both should succeed
    expect(account1.puuid).toBe(puuid);
    expect(account2.puuid).toBe(puuid);
    expect(account1.serverId).not.toBe(account2.serverId);
  });

  test("subscription links to correct player when multiple accounts exist", async () => {
    const now = new Date();
    const serverId = "test-server-4";
    const alias = "SubscriptionTest";
    const channelId = "channel-test";
    const discordUserId = "user-5";

    // Create player with two accounts
    const account1 = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: "puuid-1",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          create: {
            alias: alias,
            discordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            creatorDiscordId: discordUserId,
            serverId: serverId,
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: { player: true },
    });

    await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: "puuid-2",
        region: "EUW1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        playerId: account1.player.id, // Link to existing player
        createdTime: now,
        updatedTime: now,
      },
    });

    // Create subscription to the player
    const subscription = await testPrisma.subscription.create({
      data: {
        channelId: channelId,
        playerId: account1.player.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: discordUserId,
        serverId: serverId,
      },
    });

    // Verify subscription links to correct player
    expect(subscription.playerId).toBe(account1.player.id);

    // Verify we can get all accounts for this subscription
    const playerWithData = await testPrisma.player.findUnique({
      where: { id: subscription.playerId },
      include: {
        accounts: true,
        subscriptions: true,
      },
    });

    expect(playerWithData).toBeDefined();
    if (!playerWithData) {
      throw new Error("Player not found");
    }

    expect(playerWithData.accounts).toHaveLength(2);
    expect(playerWithData.subscriptions).toHaveLength(1);
    const firstSubscription = playerWithData.subscriptions[0];
    if (!firstSubscription) {
      throw new Error("Subscription not found");
    }
    expect(firstSubscription.channelId).toBe(channelId);
  });

  test("different aliases create different players even for same Discord user", async () => {
    const now = new Date();
    const serverId = "test-server-5";
    const discordUserId = "user-6";

    // Create player with alias "MainAccount"
    const account1 = await testPrisma.account.create({
      data: {
        alias: "MainAccount",
        puuid: "puuid-main",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          create: {
            alias: "MainAccount",
            discordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            creatorDiscordId: discordUserId,
            serverId: serverId,
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: { player: true },
    });

    // Create player with alias "SmurfAccount"
    const account2 = await testPrisma.account.create({
      data: {
        alias: "SmurfAccount",
        puuid: "puuid-smurf",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          create: {
            alias: "SmurfAccount",
            discordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            creatorDiscordId: discordUserId,
            serverId: serverId,
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: { player: true },
    });

    // Verify different players were created
    expect(account1.player.id).not.toBe(account2.player.id);
    expect(account1.player.alias).toBe("MainAccount");
    expect(account2.player.alias).toBe("SmurfAccount");

    // Both can have same Discord user
    expect(account1.player.discordId).toBe(discordUserId);
    expect(account2.player.discordId).toBe(discordUserId);
  });

  test("detects when account (PUUID) already exists in server", async () => {
    const now = new Date();
    const serverId = "test-server-6";
    const alias = "ExistingPlayer";
    const puuid = "duplicate-check-puuid";
    const discordUserId = "user-7";

    // Create an account
    const existingAccount = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: puuid,
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          create: {
            alias: alias,
            discordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            creatorDiscordId: discordUserId,
            serverId: serverId,
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: { player: true },
    });

    // Verify we can detect this account exists by PUUID
    const foundAccount = await testPrisma.account.findUnique({
      where: {
        serverId_puuid: {
          serverId: serverId,
          puuid: puuid,
        },
      },
      include: {
        player: true,
      },
    });

    expect(foundAccount).toBeDefined();
    expect(foundAccount?.puuid).toBe(puuid);
    expect(foundAccount?.player.alias).toBe(alias);
    expect(foundAccount?.id).toBe(existingAccount.id);
  });

  test("detects when subscription already exists for player in channel", async () => {
    const now = new Date();
    const serverId = "test-server-7";
    const alias = "SubscribedPlayer";
    const channelId = "channel-duplicate-check";
    const discordUserId = "user-8";

    // Create player with account and subscription
    const account = await testPrisma.account.create({
      data: {
        alias: alias,
        puuid: "puuid-subscribed",
        region: "NA1",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        player: {
          create: {
            alias: alias,
            discordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            creatorDiscordId: discordUserId,
            serverId: serverId,
          },
        },
        createdTime: now,
        updatedTime: now,
      },
      include: { player: true },
    });

    // Create subscription
    const subscription = await testPrisma.subscription.create({
      data: {
        channelId: channelId,
        playerId: account.player.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: discordUserId,
        serverId: serverId,
      },
    });

    // Verify we can detect the subscription exists
    const foundSubscription = await testPrisma.subscription.findUnique({
      where: {
        serverId_playerId_channelId: {
          serverId: serverId,
          playerId: account.player.id,
          channelId: channelId,
        },
      },
    });

    expect(foundSubscription).toBeDefined();
    expect(foundSubscription?.id).toBe(subscription.id);
    expect(foundSubscription?.channelId).toBe(channelId);
    expect(foundSubscription?.playerId).toBe(account.player.id);

    // Verify we can subscribe the same player to a DIFFERENT channel
    const differentChannel = "channel-different";
    const secondSubscription = await testPrisma.subscription.create({
      data: {
        channelId: differentChannel,
        playerId: account.player.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: discordUserId,
        serverId: serverId,
      },
    });

    expect(secondSubscription).toBeDefined();
    expect(secondSubscription.channelId).toBe(differentChannel);

    // Verify player now has 2 subscriptions
    const playerWithSubs = await testPrisma.player.findUnique({
      where: { id: account.player.id },
      include: { subscriptions: true },
    });

    expect(playerWithSubs?.subscriptions).toHaveLength(2);
  });
});
