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
import { unique } from "remeda";

console.log("🗄️  Initializing Prisma database client");
export const prisma = new PrismaClient();

console.log("✅ Database client initialized");

export async function getChannelsSubscribedToPlayers(
  puuids: LeaguePuuid[],
): Promise<{ channel: DiscordChannelId }[]> {
  console.log(
    `🔍 Fetching channels subscribed to ${puuids.length.toString()} players`,
  );
  console.log(`📋 PUUIDs: ${puuids.join(", ")}`);

  try {
    const startTime = Date.now();

    // the accounts that are subscribed to the players
    const accounts = await prisma.account.findMany({
      where: {
        puuid: {
          in: puuids,
        },
      },
      include: {
        playerId: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    const queryTime = Date.now() - startTime;
    console.log(
      `📊 Found ${accounts.length.toString()} accounts in ${queryTime.toString()}ms`,
    );

    const result = unique(
      accounts.flatMap((account) =>
        account.playerId.subscriptions.map((subscription) => ({
          channel: DiscordChannelIdSchema.parse(subscription.channelId),
        })),
      ),
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
    console.log(
      `📊 Found ${players.length.toString()} players in ${queryTime.toString()}ms`,
    );

    // transform
    const result = players.flatMap((player): PlayerConfigEntry[] => {
      return player.accounts.map((account): PlayerConfigEntry => {
        return {
          alias: player.alias,
          league: {
            leagueAccount: mapToAccount(account),
          },
          discordAccount: {
            id: DiscordAccountIdSchema.nullable().parse(player.discordId),
          },
        };
      });
    });

    console.log(
      `📋 Returning ${result.length.toString()} player config entries`,
    );
    return result;
  } catch (error) {
    console.error("❌ Error fetching player accounts:", error);
    throw error;
  }
}

function mapToAccount({
  puuid,
  region,
}: {
  puuid: string;
  region: string;
}): LeagueAccount {
  return {
    puuid: LeaguePuuidSchema.parse(puuid),
    region: RegionSchema.parse(region),
  };
}
