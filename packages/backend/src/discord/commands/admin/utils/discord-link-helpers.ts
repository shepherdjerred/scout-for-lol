import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import type { DiscordAccountId, DiscordGuildId } from "@scout-for-lol/data";
import type { PrismaClient } from "@scout-for-lol/backend/generated/prisma/client/index.js";
import type { PlayerWithSubscriptions } from "@scout-for-lol/backend/discord/commands/admin/utils/player-queries.js";
import {
  buildDiscordAlreadyLinkedError,
  buildDiscordIdInUseError,
  buildPlayerNotLinkedError,
} from "@scout-for-lol/backend/discord/commands/admin/utils/responses.js";

/**
 * Validation result for Discord link operations
 */
type DiscordLinkValidationResult =
  | { success: true }
  | { success: false; errorResponse: { content: string; flags?: number } };

/**
 * Validate that a Discord ID can be linked to a player
 * Checks:
 * 1. Discord ID is not already linked to a different player
 * 2. Player doesn't already have a Discord ID
 */
export async function validateDiscordLink(options: {
  prisma: PrismaClient;
  guildId: DiscordGuildId;
  player: PlayerWithSubscriptions;
  discordUserId: DiscordAccountId;
  playerAlias: string;
}): Promise<DiscordLinkValidationResult> {
  const { prisma, guildId, player, discordUserId, playerAlias } = options;
  if (!player) {
    return {
      success: false,
      errorResponse: {
        content: `❌ Player "${playerAlias}" not found`,
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  // Check if this Discord ID is already linked to a different player
  const existingPlayer = await prisma.player.findFirst({
    where: {
      serverId: guildId,
      discordId: discordUserId,
      NOT: {
        id: player.id,
      },
    },
  });

  if (existingPlayer) {
    console.log(`❌ Discord ID already linked to player "${existingPlayer.alias}"`);
    const errorResponse = buildDiscordIdInUseError(discordUserId, existingPlayer.alias);
    return {
      success: false,
      errorResponse: {
        content: errorResponse.content ?? "",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  // Check if player already has a Discord ID
  if (player.discordId) {
    console.log(`⚠️  Player already has Discord ID: ${player.discordId}`);
    const errorResponse = buildDiscordAlreadyLinkedError(playerAlias, player.discordId);
    return {
      success: false,
      errorResponse: {
        content: errorResponse.content ?? "",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  return { success: true };
}

/**
 * Validate that a Discord ID can be unlinked from a player
 * Checks:
 * 1. Player has a Discord ID to unlink
 */
export function validateDiscordUnlink(
  player: PlayerWithSubscriptions,
  playerAlias: string,
): DiscordLinkValidationResult {
  if (!player) {
    return {
      success: false,
      errorResponse: {
        content: `❌ Player "${playerAlias}" not found`,
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  if (!player.discordId) {
    console.log(`⚠️  Player has no Discord ID to unlink`);
    const errorResponse = buildPlayerNotLinkedError(playerAlias);
    return {
      success: false,
      errorResponse: {
        content: errorResponse.content ?? "",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  return { success: true };
}

/**
 * Execute a Discord link operation with common error handling
 */
export async function executeDiscordLinkOperation(
  interaction: ChatInputCommandInteraction,
  operation: () => Promise<void>,
  operationName: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    console.error(`❌ Database error during Discord ${operationName}:`, error);
    const { buildDatabaseError } = await import("@scout-for-lol/backend/discord/commands/admin/utils/responses.js");
    await interaction.reply(buildDatabaseError(`${operationName} Discord ID`, error));
  }
}
