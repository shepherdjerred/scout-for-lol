import type { PrismaClient } from "@scout-for-lol/backend/generated/prisma/client/index.js";
import { type ChatInputCommandInteraction } from "discord.js";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";

export type PlayerWithAccounts = Awaited<ReturnType<typeof findPlayerByAliasWithAccounts>>;
export type PlayerWithSubscriptions = Awaited<ReturnType<typeof findPlayerByAliasWithSubscriptions>>;
export type PlayerWithCompetitions = Awaited<ReturnType<typeof findPlayerByAliasWithCompetitions>>;

/**
 * Find a player by alias (basic query)
 */
export async function findPlayerByAlias(
  prisma: PrismaClient,
  serverId: string,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId,
        alias,
      },
    },
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
  serverId: string,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId,
        alias,
      },
    },
    include: {
      accounts: true,
    },
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
 * Find a player by alias with subscriptions included
 */
export async function findPlayerByAliasWithSubscriptions(
  prisma: PrismaClient,
  serverId: string,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId,
        alias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
    },
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
 * Find a player by alias with competition participants included
 */
export async function findPlayerByAliasWithCompetitions(
  prisma: PrismaClient,
  serverId: string,
  alias: string,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId,
        alias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
      competitionParticipants: {
        include: {
          competition: true,
        },
      },
    },
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
 * Find player by Discord ID
 */
export async function findPlayerByDiscordId(
  prisma: PrismaClient,
  serverId: string,
  discordId: string,
  interaction?: ChatInputCommandInteraction,
) {
  const player = await prisma.player.findFirst({
    where: {
      serverId,
      discordId,
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

