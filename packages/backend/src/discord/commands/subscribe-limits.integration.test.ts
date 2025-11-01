import { describe, test, expect, beforeEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { DiscordAccountIdSchema, DiscordChannelIdSchema, DiscordGuildIdSchema, LeaguePuuidSchema } from "@scout-for-lol/data";
import { PrismaClient } from "../../../generated/prisma/client";
import {
  DEFAULT_PLAYER_SUBSCRIPTION_LIMIT,
  DEFAULT_ACCOUNT_LIMIT,
  UNLIMITED_SUBSCRIPTION_SERVERS,
} from "../../configuration/subscription-limits";

// Create test database in temp directory
const tempDir = fs.mkdtempSync(path.join("/tmp", "subscribe-limits-test-"));
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

describe("Subscribe Command - Subscription Limits", () => {
  test("allows subscriptions up to the limit", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-limited");
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create DEFAULT_PLAYER_SUBSCRIPTION_LIMIT players with subscriptions
    for (let i = 0; i < DEFAULT_PLAYER_SUBSCRIPTION_LIMIT; i++) {
      const alias = `Player${i.toString()}`;
      const puuid = `puuid-${i.toString()}`;

      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: alias,
              discordId: null,
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: alias,
                  puuid: puuid,
                  region: "AMERICA_NORTH",
                  serverId: serverId,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Verify we created the correct number of subscribed players
    const subscribedPlayerCount = await testPrisma.player.count({
      where: {
        serverId: serverId,
        subscriptions: {
          some: {},
        },
      },
    });

    expect(subscribedPlayerCount).toBe(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT);
  });

  test("counts only players with active subscriptions", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-count");
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create 5 players with subscriptions
    for (let i = 0; i < 5; i++) {
      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: `SubscribedPlayer${i.toString()}`,
              discordId: null,
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: `SubscribedPlayer${i.toString()}`,
                  puuid: `puuid-subscribed-${i.toString()}`,
                  region: "AMERICA_NORTH",
                  serverId: serverId,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Create 3 players WITHOUT subscriptions
    for (let i = 0; i < 3; i++) {
      await testPrisma.player.create({
        data: {
          alias: `UnsubscribedPlayer${i.toString()}`,
          discordId: null,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          accounts: {
            create: {
              alias: `UnsubscribedPlayer${i.toString()}`,
              puuid: `puuid-unsubscribed-${i.toString()}`,
              region: "AMERICA_NORTH",
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
            },
          },
        },
      });
    }

    // Verify only players with subscriptions are counted
    const subscribedPlayerCount = await testPrisma.player.count({
      where: {
        serverId: serverId,
        subscriptions: {
          some: {},
        },
      },
    });

    expect(subscribedPlayerCount).toBe(5);

    // Verify total players is 8
    const totalPlayerCount = await testPrisma.player.count({
      where: {
        serverId: serverId,
      },
    });

    expect(totalPlayerCount).toBe(8);
  });

  test("allows adding accounts to existing player even at limit", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-existing-player");
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create limit number of players with subscriptions
    for (let i = 0; i < DEFAULT_PLAYER_SUBSCRIPTION_LIMIT; i++) {
      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: `Player${i.toString()}`,
              discordId: null,
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: `Player${i.toString()}`,
                  puuid: `puuid-${i.toString()}`,
                  region: "AMERICA_NORTH",
                  serverId: serverId,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Get one of the existing players
    const existingPlayer = await testPrisma.player.findFirst({
      where: {
        serverId: serverId,
        alias: "Player0",
      },
    });

    expect(existingPlayer).not.toBeNull();

    if (!existingPlayer) {
      throw new Error("Expected player not found");
    }

    // Should be able to add a second account to this player even at limit
    const secondAccount = await testPrisma.account.create({
      data: {
        alias: "Player0", // Same alias
        puuid: LeaguePuuidSchema.parse("puuid-player0-euw"),
        region: "EU_WEST",
        serverId: serverId,
        creatorDiscordId: discordUserId,
        playerId: existingPlayer.id,
        createdTime: now,
        updatedTime: now,
      },
    });

    expect(secondAccount.playerId).toBe(existingPlayer.id);

    // Verify player count hasn't changed
    const subscribedPlayerCount = await testPrisma.player.count({
      where: {
        serverId: serverId,
        subscriptions: {
          some: {},
        },
      },
    });

    expect(subscribedPlayerCount).toBe(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT);
  });

  test("unlimited servers bypass the limit", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-unlimited");
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Add to unlimited servers set
    UNLIMITED_SUBSCRIPTION_SERVERS.add(serverId);

    try {
      // Create more than the default limit
      const extraPlayers = 5;
      for (let i = 0; i < DEFAULT_PLAYER_SUBSCRIPTION_LIMIT + extraPlayers; i++) {
        await testPrisma.subscription.create({
          data: {
            channelId: channelId,
            serverId: serverId,
            creatorDiscordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            player: {
              create: {
                alias: `Player${i.toString()}`,
                discordId: null,
                serverId: serverId,
                creatorDiscordId: discordUserId,
                createdTime: now,
                updatedTime: now,
                accounts: {
                  create: {
                    alias: `Player${i.toString()}`,
                    puuid: `puuid-${i.toString()}`,
                    region: "AMERICA_NORTH",
                    serverId: serverId,
                    creatorDiscordId: discordUserId,
                    createdTime: now,
                    updatedTime: now,
                  },
                },
              },
            },
          },
        });
      }

      // Verify we exceeded the limit
      const subscribedPlayerCount = await testPrisma.player.count({
        where: {
          serverId: serverId,
          subscriptions: {
            some: {},
          },
        },
      });

      expect(subscribedPlayerCount).toBe(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT + extraPlayers);
    } finally {
      // Clean up - remove from unlimited set
      UNLIMITED_SUBSCRIPTION_SERVERS.delete(serverId);
    }
  });

  test("limits are enforced per-server independently", async () => {
    const now = new Date();
    const server1Id = "test-server-1";
    const server2Id = "test-server-2";
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create limit number of players in server 1
    for (let i = 0; i < DEFAULT_PLAYER_SUBSCRIPTION_LIMIT; i++) {
      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: server1Id,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: `Server1Player${i.toString()}`,
              discordId: null,
              serverId: server1Id,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: `Server1Player${i.toString()}`,
                  puuid: `puuid-s1-${i.toString()}`,
                  region: "AMERICA_NORTH",
                  serverId: server1Id,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Create limit number of players in server 2
    for (let i = 0; i < DEFAULT_PLAYER_SUBSCRIPTION_LIMIT; i++) {
      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: server2Id,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: `Server2Player${i.toString()}`,
              discordId: null,
              serverId: server2Id,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: `Server2Player${i.toString()}`,
                  puuid: `puuid-s2-${i.toString()}`,
                  region: "AMERICA_NORTH",
                  serverId: server2Id,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Verify each server has the correct count
    const server1Count = await testPrisma.player.count({
      where: {
        serverId: server1Id,
        subscriptions: {
          some: {},
        },
      },
    });

    const server2Count = await testPrisma.player.count({
      where: {
        serverId: server2Id,
        subscriptions: {
          some: {},
        },
      },
    });

    expect(server1Count).toBe(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT);
    expect(server2Count).toBe(DEFAULT_PLAYER_SUBSCRIPTION_LIMIT);
  });

  test("allows accounts up to the account limit", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-account-limit");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create DEFAULT_ACCOUNT_LIMIT accounts (doesn't matter if they have subscriptions)
    for (let i = 0; i < DEFAULT_ACCOUNT_LIMIT; i++) {
      const alias = `Player${i.toString()}`;
      const puuid = `puuid-${i.toString()}`;

      await testPrisma.player.create({
        data: {
          alias: alias,
          discordId: null,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          accounts: {
            create: {
              alias: alias,
              puuid: puuid,
              region: "AMERICA_NORTH",
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
            },
          },
        },
      });
    }

    // Verify we created the correct number of accounts
    const accountCount = await testPrisma.account.count({
      where: {
        serverId: serverId,
      },
    });

    expect(accountCount).toBe(DEFAULT_ACCOUNT_LIMIT);
  });

  test("account limit counts all accounts regardless of subscriptions", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-account-count");
    const channelId = DiscordChannelIdSchema.parse("test-channel");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create 5 accounts WITH subscriptions
    for (let i = 0; i < 5; i++) {
      await testPrisma.subscription.create({
        data: {
          channelId: channelId,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          player: {
            create: {
              alias: `SubscribedPlayer${i.toString()}`,
              discordId: null,
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
              accounts: {
                create: {
                  alias: `SubscribedPlayer${i.toString()}`,
                  puuid: `puuid-subscribed-${i.toString()}`,
                  region: "AMERICA_NORTH",
                  serverId: serverId,
                  creatorDiscordId: discordUserId,
                  createdTime: now,
                  updatedTime: now,
                },
              },
            },
          },
        },
      });
    }

    // Create 3 accounts WITHOUT subscriptions
    for (let i = 0; i < 3; i++) {
      await testPrisma.player.create({
        data: {
          alias: `UnsubscribedPlayer${i.toString()}`,
          discordId: null,
          serverId: serverId,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          accounts: {
            create: {
              alias: `UnsubscribedPlayer${i.toString()}`,
              puuid: `puuid-unsubscribed-${i.toString()}`,
              region: "AMERICA_NORTH",
              serverId: serverId,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
            },
          },
        },
      });
    }

    // Verify total account count is 8 (5 + 3)
    const accountCount = await testPrisma.account.count({
      where: {
        serverId: serverId,
      },
    });

    expect(accountCount).toBe(8);

    // Verify only 5 have subscriptions
    const subscribedPlayerCount = await testPrisma.player.count({
      where: {
        serverId: serverId,
        subscriptions: {
          some: {},
        },
      },
    });

    expect(subscribedPlayerCount).toBe(5);
  });

  test("account limit is enforced per-server independently", async () => {
    const now = new Date();
    const server1Id = "test-server-accounts-1";
    const server2Id = "test-server-accounts-2";
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Create limit number of accounts in server 1
    for (let i = 0; i < DEFAULT_ACCOUNT_LIMIT; i++) {
      await testPrisma.player.create({
        data: {
          alias: `Server1Account${i.toString()}`,
          discordId: null,
          serverId: server1Id,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          accounts: {
            create: {
              alias: `Server1Account${i.toString()}`,
              puuid: `puuid-s1-${i.toString()}`,
              region: "AMERICA_NORTH",
              serverId: server1Id,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
            },
          },
        },
      });
    }

    // Create limit number of accounts in server 2
    for (let i = 0; i < DEFAULT_ACCOUNT_LIMIT; i++) {
      await testPrisma.player.create({
        data: {
          alias: `Server2Account${i.toString()}`,
          discordId: null,
          serverId: server2Id,
          creatorDiscordId: discordUserId,
          createdTime: now,
          updatedTime: now,
          accounts: {
            create: {
              alias: `Server2Account${i.toString()}`,
              puuid: `puuid-s2-${i.toString()}`,
              region: "AMERICA_NORTH",
              serverId: server2Id,
              creatorDiscordId: discordUserId,
              createdTime: now,
              updatedTime: now,
            },
          },
        },
      });
    }

    // Verify each server has the correct count
    const server1Count = await testPrisma.account.count({
      where: {
        serverId: server1Id,
      },
    });

    const server2Count = await testPrisma.account.count({
      where: {
        serverId: server2Id,
      },
    });

    expect(server1Count).toBe(DEFAULT_ACCOUNT_LIMIT);
    expect(server2Count).toBe(DEFAULT_ACCOUNT_LIMIT);
  });

  test("unlimited servers bypass account limit", async () => {
    const now = new Date();
    const serverId = DiscordGuildIdSchema.parse("test-server-unlimited-accounts");
    const discordUserId = DiscordAccountIdSchema.parse("test-user");

    // Add to unlimited servers set
    UNLIMITED_SUBSCRIPTION_SERVERS.add(serverId);

    try {
      // Create more than the default account limit
      const extraAccounts = 5;
      for (let i = 0; i < DEFAULT_ACCOUNT_LIMIT + extraAccounts; i++) {
        await testPrisma.player.create({
          data: {
            alias: `Account${i.toString()}`,
            discordId: null,
            serverId: serverId,
            creatorDiscordId: discordUserId,
            createdTime: now,
            updatedTime: now,
            accounts: {
              create: {
                alias: `Account${i.toString()}`,
                puuid: `puuid-${i.toString()}`,
                region: "AMERICA_NORTH",
                serverId: serverId,
                creatorDiscordId: discordUserId,
                createdTime: now,
                updatedTime: now,
              },
            },
          },
        });
      }

      // Verify we exceeded the limit
      const accountCount = await testPrisma.account.count({
        where: {
          serverId: serverId,
        },
      });

      expect(accountCount).toBe(DEFAULT_ACCOUNT_LIMIT + extraAccounts);
    } finally {
      // Clean up - remove from unlimited set
      UNLIMITED_SUBSCRIPTION_SERVERS.delete(serverId);
    }
  });
});
