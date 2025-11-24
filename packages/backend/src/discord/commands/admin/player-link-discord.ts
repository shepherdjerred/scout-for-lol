import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import {
  validateCommandArgs,
  executeWithTiming,
} from "@scout-for-lol/backend/discord/commands/admin/utils/validation.js";
import { findPlayerByAliasWithSubscriptions } from "@scout-for-lol/backend/discord/commands/admin/utils/player-queries.js";
import {
  buildDiscordAlreadyLinkedError,
  buildDiscordIdInUseError,
  buildDatabaseError,
} from "@scout-for-lol/backend/discord/commands/admin/utils/responses.js";
import { buildPlayerUpdateResponse } from "@scout-for-lol/backend/discord/commands/admin/utils/player-responses.js";

const ArgsSchema = z.object({
  playerAlias: z.string().min(1).max(100),
  discordUserId: DiscordAccountIdSchema,
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerLinkDiscord(interaction: ChatInputCommandInteraction) {
  const validation = await validateCommandArgs(
    interaction,
    ArgsSchema,
    (i) => ({
      playerAlias: i.options.getString("player-alias"),
      discordUserId: i.options.getUser("discord-user")?.id,
      guildId: i.guildId,
    }),
    "player-link-discord",
  );

  if (!validation.success) {
    return;
  }

  const { data: args, username } = validation;
  const { playerAlias, discordUserId, guildId } = args;

  await executeWithTiming("player-link-discord", username, async () => {
    // Find the player
    const player = await findPlayerByAliasWithSubscriptions(prisma, guildId, playerAlias, interaction);
    if (!player) {
      return;
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
      await interaction.reply(buildDiscordIdInUseError(discordUserId, existingPlayer.alias));
      return;
    }

    // Check if player already has a Discord ID
    if (player.discordId) {
      console.log(`⚠️  Player already has Discord ID: ${player.discordId}`);
      await interaction.reply(buildDiscordAlreadyLinkedError(playerAlias, player.discordId));
      return;
    }

    console.log(`💾 Linking Discord ID ${discordUserId} to player "${playerAlias}"`);

    try {
      const now = new Date();

      // Update the player with Discord ID
      const updatedPlayer = await prisma.player.update({
        where: {
          id: player.id,
        },
        data: {
          discordId: discordUserId,
          updatedTime: now,
        },
        include: {
          accounts: true,
          subscriptions: true,
        },
      });

      await interaction.reply(
        buildPlayerUpdateResponse(
          updatedPlayer,
          "✅ **Discord ID linked successfully**",
          `Linked <@${discordUserId}> to player "${playerAlias}"`,
        ),
      );
    } catch (error) {
      console.error(`❌ Database error during Discord link:`, error);
      await interaction.reply(buildDatabaseError("link Discord ID", error));
    }
  });
}
