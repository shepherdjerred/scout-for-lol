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

export const prisma = new PrismaClient();

export async function getChannelsSubscribedToPlayers(
  puuids: LeaguePuuid[],
): Promise<{ channel: DiscordChannelId }[]> {
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

  return unique(
    accounts.flatMap((account) =>
      account.playerId.subscriptions.map((subscription) => ({
        channel: DiscordChannelIdSchema.parse(subscription.channelId),
      })),
    ),
  );
}

export async function getAccounts(): Promise<PlayerConfig> {
  const players = await prisma.player.findMany({
    include: {
      accounts: true,
    },
  });
  // transform
  return players.flatMap((player): PlayerConfigEntry[] => {
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
