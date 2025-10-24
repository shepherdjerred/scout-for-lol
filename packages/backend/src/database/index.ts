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
  MatchIdSchema,
  type MatchId,
} from "@scout-for-lol/data";
import { uniqueBy } from "remeda";

console.log("🗄️  Initializing Prisma database client");
export const prisma = new PrismaClient();

console.log("✅ Database client initialized");

export type PlayerAccountWithState = {
  config: PlayerConfigEntry;
  lastCheckedTime: Date | undefined;
};

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
          },
          discordAccount: {
            id: DiscordAccountIdSchema.optional().parse(player.discordId),
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

/**
 * Get all player accounts with their runtime state for polling.
 * Includes lastMatchTime to determine polling intervals.
 *
 * @param prismaClient - Prisma client instance
 * @returns Array of player accounts with their polling state
 */
export async function getAccountsWithState(prismaClient: PrismaClient = prisma): Promise<PlayerAccountWithState[]> {
  console.log("🔍 Fetching all player accounts with state");

  try {
    const startTime = Date.now();

    const players = await prismaClient.player.findMany({
      include: {
        accounts: true,
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(`📊 Found ${players.length.toString()} players in ${queryTime.toString()}ms`);

    // transform
    const result = players.flatMap((player): PlayerAccountWithState[] => {
      return player.accounts.map((account): PlayerAccountWithState => {
        return {
          config: {
            alias: player.alias,
            league: {
              leagueAccount: mapToAccount(account),
            },
            discordAccount: {
              id: DiscordAccountIdSchema.optional().parse(player.discordId),
            },
          },
          lastCheckedTime: undefined,
        };
      });
    });

    console.log(`📋 Returning ${result.length.toString()} player account entries with state`);
    return result;
  } catch (error) {
    console.error("❌ Error fetching player accounts with state:", error);
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
 * Update the lastProcessedMatchId for a specific account.
 * This is called after we successfully process a match to avoid reprocessing.
 *
 * @param puuid - Player PUUID to update
 * @param matchId - The match ID that was just processed
 * @param prismaClient - Prisma client instance
 */
export async function updateLastProcessedMatch(
  puuid: LeaguePuuid,
  matchId: MatchId,
  prismaClient: PrismaClient = prisma,
): Promise<void> {
  console.log(`📝 Updating lastProcessedMatchId for ${puuid} to ${matchId}`);

  try {
    const startTime = Date.now();

    await prismaClient.account.updateMany({
      where: {
        puuid,
      },
      data: {
        lastProcessedMatchId: matchId,
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(`✅ Updated lastProcessedMatchId in ${queryTime.toString()}ms`);
  } catch (error) {
    console.error("❌ Error updating lastProcessedMatchId:", error);
    throw error;
  }
}

/**
 * Get the lastProcessedMatchId for a specific account.
 *
 * @param puuid - Player PUUID to query
 * @param prismaClient - Prisma client instance
 * @returns The last processed match ID, or null if none exists
 */
export async function getLastProcessedMatch(
  puuid: LeaguePuuid,
  prismaClient: PrismaClient = prisma,
): Promise<MatchId | null> {
  try {
    const account = await prismaClient.account.findFirst({
      where: {
        puuid,
      },
      select: {
        lastProcessedMatchId: true,
      },
    });

    return account?.lastProcessedMatchId ? MatchIdSchema.parse(account.lastProcessedMatchId) : null;
  } catch (error) {
    console.error("❌ Error getting lastProcessedMatchId:", error);
    throw error;
  }
}

/**
 * Update the lastMatchTime for an account.
 * This is called when we process a match to track player activity for dynamic polling.
 *
 * @param puuid - Player PUUID to update
 * @param matchTime - The game creation timestamp from the match
 * @param prismaClient - Prisma client instance
 */
export async function updateLastMatchTime(
  puuid: LeaguePuuid,
  matchTime: Date,
  prismaClient: PrismaClient = prisma,
): Promise<void> {
  console.log(`📝 Updating lastMatchTime for ${puuid} to ${matchTime.toISOString()}`);

  try {
    await prismaClient.account.updateMany({
      where: {
        puuid,
      },
      data: {
        lastMatchTime: matchTime,
      },
    });
  } catch (error) {
    console.error("❌ Error updating lastMatchTime:", error);
    throw error;
  }
}
