import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import {
  validateCommandArgs,
  executeWithTiming,
} from "@scout-for-lol/backend/discord/commands/admin/utils/validation.js";
import { findPlayerByAliasWithSubscriptions } from "@scout-for-lol/backend/discord/commands/admin/utils/player-queries.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("admin-player-edit");
import {
  buildDatabaseError,
  buildSuccessResponse,
} from "@scout-for-lol/backend/discord/commands/admin/utils/responses.js";
import {
  formatPlayerAccountsList,
  formatPlayerSubscriptionsList,
} from "@scout-for-lol/backend/discord/commands/admin/utils/player-responses.js";

const ArgsSchema = z.object({
  currentAlias: z.string().min(1).max(100),
  newAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerEdit(interaction: ChatInputCommandInteraction) {
  const validation = await validateCommandArgs(
    interaction,
    ArgsSchema,
    (i) => ({
      currentAlias: i.options.getString("current-alias"),
      newAlias: i.options.getString("new-alias"),
      guildId: i.guildId,
    }),
    "player-edit",
  );

  if (!validation.success) {
    return;
  }

  const { data: args, username } = validation;
  const { currentAlias, newAlias, guildId } = args;

  await executeWithTiming("player-edit", username, async () => {
    // Check if current player exists
    const currentPlayer = await findPlayerByAliasWithSubscriptions(prisma, guildId, currentAlias, interaction);
    if (!currentPlayer) {
      return;
    }

    // Check if new alias is already taken
    const existingPlayer = await prisma.player.findUnique({
      where: {
        serverId_alias: {
          serverId: guildId,
          alias: newAlias,
        },
      },
    });

    if (existingPlayer) {
      logger.info(`❌ New alias already taken: "${newAlias}"`);
      await interaction.reply({
        content: `❌ **Alias already taken**\n\nA player with alias "${newAlias}" already exists in this server.\n\nIf you want to merge these players, use \`/admin player-merge\` instead.`,
        ephemeral: true,
      });
      return;
    }

    logger.info(`💾 Updating player alias from "${currentAlias}" to "${newAlias}"`);

    try {
      const now = new Date();

      // Update the player alias
      const updatedPlayer = await prisma.player.update({
        where: {
          id: currentPlayer.id,
        },
        data: {
          alias: newAlias,
          updatedTime: now,
        },
        include: {
          accounts: true,
          subscriptions: true,
        },
      });

      const accountsList = formatPlayerAccountsList(updatedPlayer);
      const subscriptionsList = formatPlayerSubscriptionsList(updatedPlayer);

      await interaction.reply(
        buildSuccessResponse(
          `✅ **Alias updated successfully**\n\nPlayer alias changed from "${currentAlias}" to "${newAlias}"`,
          `**Accounts (${updatedPlayer.accounts.length.toString()}):**\n${accountsList}\n\n**Subscribed channels:** ${subscriptionsList}`,
        ),
      );
    } catch (error) {
      logger.error(`❌ Database error during alias update:`, error);
      await interaction.reply(buildDatabaseError("update player alias", error));
    }
  });
}
