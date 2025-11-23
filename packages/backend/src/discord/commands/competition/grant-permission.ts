import { type ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { z } from "zod";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { grantPermission } from "@scout-for-lol/backend/database/competition/permissions.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

/**
 * Execute /competition grant-permission command
 * Allows server admins to grant competition creation permission to users
 */
export async function executeGrantPermission(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Check admin permissions
  // ============================================================================

  // Validate member permissions structure
  const PermissionsSchema = z.object({
    has: z.function(),
  });

  const permissionsResult = PermissionsSchema.safeParse(interaction.memberPermissions);

  if (!permissionsResult.success || !interaction.memberPermissions) {
    await interaction.reply({
      content: truncateDiscordMessage("Unable to verify permissions"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const hasAdmin = interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

  if (!hasAdmin) {
    await interaction.reply({
      content: truncateDiscordMessage("Only server administrators can grant permissions"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Extract and validate input
  // ============================================================================

  const targetUser = interaction.options.getUser("user", true);
  const serverId = interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;

  if (!serverId) {
    await interaction.reply({
      content: truncateDiscordMessage("This command can only be used in a server"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const adminId = interaction.user.id;

  // ============================================================================
  // Step 3: Grant permission in database
  // ============================================================================

  try {
    await grantPermission(
      prisma,
      serverId,
      DiscordAccountIdSchema.parse(targetUser.id),
      "CREATE_COMPETITION",
      DiscordAccountIdSchema.parse(adminId),
    );

    console.log(`[Grant Permission] ${adminId} granted CREATE_COMPETITION to ${targetUser.id} on server ${serverId}`);
  } catch (error) {
    console.error(`[Grant Permission] Error granting permission to ${targetUser.id}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error granting permission: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 4: Send success message
  // ============================================================================

  await interaction.reply({
    content: truncateDiscordMessage(
      `✅ Granted **CREATE_COMPETITION** permission to ${targetUser.username}.\n\nThey can now create competitions on this server.`,
    ),
    flags: MessageFlags.Ephemeral,
  });
}
