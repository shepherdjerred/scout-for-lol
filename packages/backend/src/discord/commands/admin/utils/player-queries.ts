import type { PrismaClient, Prisma } from "@scout-for-lol/backend/generated/prisma/client/index.js";
import { type ChatInputCommandInteraction } from "discord.js";
import { DiscordGuildIdSchema, type DiscordAccountId, type DiscordGuildId } from "@scout-for-lol/data";

export type PlayerWithAccounts = Awaited<ReturnType<typeof findPlayerByAliasWithAccounts>>;
export type PlayerWithSubscriptions = Awaited<ReturnType<typeof findPlayerByAliasWithSubscriptions>>;
export type PlayerWithCompetitions = Awaited<ReturnType<typeof findPlayerByAliasWithCompetitions>>;

/**
 * Build options object, conditionally including interaction if defined
 */
function buildFindPlayerOptions<T extends Prisma.PlayerInclude>(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  alias: string,
  include: T,
  interaction: ChatInputCommandInteraction | undefined,
): {
  prisma: PrismaClient;
  serverId: DiscordGuildId;
  alias: string;
  include: T;
  interaction?: ChatInputCommandInteraction;
} {
  if (interaction) {
    return { prisma, serverId, alias, include, interaction };
  }
  return { prisma, serverId, alias, include };
}

/**
 * Generic helper to find a player by alias with configurable includes
 */
async function findPlayerByAliasGeneric<T extends Prisma.PlayerInclude>(options: {
  prisma: PrismaClient;
  serverId: DiscordGuildId;
  alias: string;
  include: T;
  interaction?: ChatInputCommandInteraction;
}): Promise<Prisma.PlayerGetPayload<{ include: T }> | null> {
  const { prisma, serverId, alias, include, interaction } = options;
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId,
        alias,
      },
    },
    include,
  });

  if (!player && interaction) {
    console.log(`❌ Player not found: "${alias}"`);
    await interaction.reply({
      content: `❌ **Player not found**\n\nNo player with alias "${alias}" exists in this server.`,
      ephemeral: true,
    });
  }

  return player;
}

/**
 * Find a player by alias with accounts included
 */
export async function findPlayerByAliasWithAccounts(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  return findPlayerByAliasGeneric(buildFindPlayerOptions(prisma, serverId, alias, { accounts: true }, interaction));
}

/**
 * Find a player by alias with subscriptions included
 */
export async function findPlayerByAliasWithSubscriptions(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  return findPlayerByAliasGeneric(
    buildFindPlayerOptions(
      prisma,
      serverId,
      alias,
      { accounts: true, subscriptions: true },
      interaction,
    ),
  );
}

/**
 * Find a player by alias with competition participants included
 */
export async function findPlayerByAliasWithCompetitions(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  return findPlayerByAliasGeneric(
    buildFindPlayerOptions(
      prisma,
      serverId,
      alias,
      {
        accounts: true,
        subscriptions: true,
        competitionParticipants: {
          include: {
            competition: true,
          },
        },
      },
      interaction,
    ),
  );
}

/**
 * Extract guild ID from interaction with validation
 */
function extractGuildId(interaction: ChatInputCommandInteraction): string | null {
  return interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;
}

