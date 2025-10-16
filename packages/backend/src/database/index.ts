import { PrismaClient } from "../../generated/prisma/client";
import {
  DiscordAccountIdSchema,
  type DiscordChannelId,
  DiscordChannelIdSchema,
  type LeagueAccount,
  LeaguePuuidSchema,
  type LeaguePuuid,
  type PlayerConfig,
  type PlayerConfigEntry,
  RegionSchema,
} from "@scout-for-lol/data";
import { uniqueBy } from "remeda";

console.log("🗄️  Initializing Prisma database client");
export const prisma = new PrismaClient();

console.log("✅ Database client initialized");

export async function getChannelsSubscribedToPlayers(
  puuids: LeaguePuuid[],
  prismaClient: PrismaClient = prisma,
): Promise<{ channel: DiscordChannelId; serverId: string }[]> {
  console.log(`🔍 Fetching channels subscribed to ${puuids.length.toString()} players`);
  console.log(`📋 PUUIDs: ${puuids.join(", ")}`);

  try {
    const startTime = Date.now();

    // the accounts that are subscribed to the players
    const accounts = await prismaClient.account.findMany({
      where: {
        puuid: {
          in: puuids,
        },
      },
      include: {
        player: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(`📊 Found ${accounts.length.toString()} accounts in ${queryTime.toString()}ms`);

    const result = uniqueBy(
      accounts.flatMap((account) =>
        account.player.subscriptions.map((subscription) => ({
          channel: DiscordChannelIdSchema.parse(subscription.channelId),
          serverId: subscription.serverId,
        })),
      ),
      (server) => server.channel,
    );

    console.log(`📺 Returning ${result.length.toString()} unique channels`);
    return result;
  } catch (error) {
    console.error("❌ Error fetching subscribed channels:", error);
    throw error;
  }
}

export async function getAccounts(): Promise<PlayerConfig> {
  console.log("🔍 Fetching all player accounts");

  try {
    const startTime = Date.now();

    const players = await prisma.player.findMany({
      include: {
        accounts: true,
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(`📊 Found ${players.length.toString()} players in ${queryTime.toString()}ms`);

    // transform
    const result = players.flatMap((player): PlayerConfigEntry[] => {
      return player.accounts.map((account): PlayerConfigEntry => {
        return {
          alias: player.alias,
          league: {
            leagueAccount: mapToAccount(account),
            lastSeenInGame: account.lastSeenInGame,
          },
          discordAccount: {
            id: DiscordAccountIdSchema.nullable().parse(player.discordId),
          },
        };
      });
    });

    console.log(`📋 Returning ${result.length.toString()} player config entries`);
    return result;
  } catch (error) {
    console.error("❌ Error fetching player accounts:", error);
    throw error;
  }
}

function mapToAccount({ puuid, region }: { puuid: string; region: string }): LeagueAccount {
  return {
    puuid: LeaguePuuidSchema.parse(puuid),
    region: RegionSchema.parse(region),
  };
}

/**
 * Update the lastSeenInGame timestamp for multiple accounts.
 * This is called when we detect players in an active game.
 *
 * @param puuids - Array of player PUUIDs to update
 * @param timestamp - The timestamp to set (defaults to now)
 * @param prismaClient - Prisma client instance
 */
export async function updateLastSeenInGame(
  puuids: LeaguePuuid[],
  timestamp: Date = new Date(),
  prismaClient: PrismaClient = prisma,
): Promise<void> {
  if (puuids.length === 0) {
    return;
  }

  console.log(`📝 Updating lastSeenInGame for ${puuids.length.toString()} accounts`);

  try {
    const startTime = Date.now();

    await prismaClient.account.updateMany({
      where: {
        puuid: {
          in: puuids,
        },
      },
      data: {
        lastSeenInGame: timestamp,
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(`✅ Updated lastSeenInGame in ${queryTime.toString()}ms`);
  } catch (error) {
    console.error("❌ Error updating lastSeenInGame:", error);
    throw error;
  }
}
