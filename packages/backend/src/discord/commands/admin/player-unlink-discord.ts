import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import {
  validateCommandArgs,
  executeWithTiming,
} from "@scout-for-lol/backend/discord/commands/admin/utils/validation.js";
import { findPlayerByAliasWithSubscriptions } from "@scout-for-lol/backend/discord/commands/admin/utils/player-queries.js";
import {
  buildPlayerNotLinkedError,
  buildDatabaseError,
} from "@scout-for-lol/backend/discord/commands/admin/utils/responses.js";

const ArgsSchema = z.object({
  playerAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerUnlinkDiscord(interaction: ChatInputCommandInteraction) {
  const validation = await validateCommandArgs(
    interaction,
    ArgsSchema,
    (i) => ({
      playerAlias: i.options.getString("player-alias"),
      guildId: i.guildId,
    }),
    "player-unlink-discord",
  );

  if (!validation.success) {
    return;
  }

  const { data: args, username } = validation;
  const { playerAlias, guildId } = args;

  await executeWithTiming("player-unlink-discord", username, async () => {
    // Find the player
    const player = await findPlayerByAliasWithSubscriptions(prisma, guildId, playerAlias, interaction);
    if (!player) {
      return;
    }

    // Check if player has a Discord ID
    if (!player.discordId) {
      console.log(`⚠️  Player has no Discord ID to unlink`);
      await interaction.reply(buildPlayerNotLinkedError(playerAlias));
      return;
    }

    const previousDiscordId = player.discordId;
    console.log(`💾 Unlinking Discord ID ${previousDiscordId} from player "${playerAlias}"`);

    try {
      const now = new Date();

      // Update the player to remove Discord ID
      const updatedPlayer = await prisma.player.update({
        where: {
          id: player.id,
        },
        data: {
          discordId: null,
          updatedTime: now,
        },
        include: {
          accounts: true,
          subscriptions: true,
        },
      });

      const accountsList = updatedPlayer.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");
      const subscriptionsList =
        updatedPlayer.subscriptions.length > 0
          ? updatedPlayer.subscriptions.map((sub) => `<#${sub.channelId}>`).join(", ")
          : "No active subscriptions.";

      await interaction.reply({
        content: `✅ **Discord ID unlinked successfully**\n\nUnlinked <@${previousDiscordId}> from player "${playerAlias}"\n\n**Accounts (${updatedPlayer.accounts.length.toString()}):**\n${accountsList}\n\n**Subscribed channels:** ${subscriptionsList}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(`❌ Database error during Discord unlink:`, error);
      await interaction.reply(buildDatabaseError("unlink Discord ID", error));
    }
  });
}
