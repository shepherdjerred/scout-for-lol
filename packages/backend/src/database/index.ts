// @ts-types="../../generated/client/index.d.ts"
import { PrismaClient } from "@prisma/client";
import {
  DiscordAccountIdSchema,
  type DiscordChannelId,
  DiscordChannelIdSchema,
  type LeagueAccount,
  LeaguePuuidSchema,
  type LeagueSummonerId,
  LeagueSummonerIdSchema,
  type PlayerConfig,
  type PlayerConfigEntry,
  RegionSchema,
} from "@scout/data";
import { unique } from "remeda";

export const prisma = new PrismaClient();

export async function getChannelsSubscribedToPlayers(
  summonerIds: LeagueSummonerId[],
): Promise<{ channel: DiscordChannelId }[]> {
  // the accounts that are subscribed to the players
  const accounts = await prisma.account.findMany({
    where: {
      summonerId: {
        in: summonerIds,
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
      }))
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
        alias: player.alias || undefined,
        league: {
          leagueAccount: mapToAccount(account),
        },
        discordAccount: {
          id: DiscordAccountIdSchema.parse(player.discordId),
        },
      };
    });
  });
}

function mapToAccount({ summonerId, puuid, region }: {
  summonerId: string;
  puuid: string;
  region: string;
}): LeagueAccount {
  return {
    summonerId: LeagueSummonerIdSchema.parse(summonerId),
    puuid: LeaguePuuidSchema.parse(puuid),
    region: RegionSchema.parse(region),
  };
}
