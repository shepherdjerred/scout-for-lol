import type { PrismaClient, Prisma } from "@scout-for-lol/backend/generated/prisma/client/index.js";
import { type ChatInputCommandInteraction } from "discord.js";
import { DiscordGuildIdSchema, type DiscordAccountId, type DiscordGuildId } from "@scout-for-lol/data";

export type PlayerWithAccounts = Awaited<ReturnType<typeof findPlayerByAliasWithAccounts>>;
export type PlayerWithSubscriptions = Awaited<ReturnType<typeof findPlayerByAliasWithSubscriptions>>;
export type PlayerWithCompetitions = Awaited<ReturnType<typeof findPlayerByAliasWithCompetitions>>;

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
 * Find a player by alias (basic query)
 */
export async function findPlayerByAlias(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  return findPlayerByAliasGeneric({ prisma, serverId, alias, include: {}, interaction });
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
  return findPlayerByAliasGeneric({ prisma, serverId, alias, include: { accounts: true }, interaction });
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
  return findPlayerByAliasGeneric({
    prisma,
    serverId,
    alias,
    include: { accounts: true, subscriptions: true },
    interaction,
  });
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
  return findPlayerByAliasGeneric({
    prisma,
    serverId,
    alias,
    include: {
      accounts: true,
      subscriptions: true,
      competitionParticipants: {
        include: {
          competition: true,
        },
      },
    },
    interaction,
  });
}

/**
 * Find player by Discord ID
 */
export async function findPlayerByDiscordId(
  prisma: PrismaClient,
  serverId: DiscordGuildId,
  discordId: DiscordAccountId,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findFirst({
    where: {
      serverId: serverId,
      discordId: discordId,
    },
    include: {
      accounts: true,
    },
  });

  if (!player && interaction) {
    console.log(`❌ No player found with Discord ID: ${discordId}`);
    await interaction.reply({
      content: `❌ **No League account linked**\n\nYou need to link your League of Legends account first.`,
      ephemeral: true,
    });
  }

  return player;
}

/**
 * Extract guild ID from interaction with validation
 */
export function extractGuildId(interaction: ChatInputCommandInteraction): string | null {
  return interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;
}

/**
 * Check if guild ID is valid and reply with error if not
 */
export async function requireGuildId(interaction: ChatInputCommandInteraction): Promise<string | null> {
  const guildId = extractGuildId(interaction);
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server",
      ephemeral: true,
    });
  }
  return guildId;
}
