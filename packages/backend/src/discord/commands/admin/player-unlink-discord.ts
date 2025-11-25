import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { executeCommand } from "@scout-for-lol/backend/discord/commands/utils/command-wrapper.js";
import { findPlayerByAliasWithSubscriptions } from "@scout-for-lol/backend/discord/commands/admin/utils/player-queries.js";
import { buildPlayerUpdateResponse } from "@scout-for-lol/backend/discord/commands/admin/utils/player-responses.js";
import { updatePlayerDiscordId } from "@scout-for-lol/backend/discord/commands/admin/utils/player-updates.js";
import {
  validateDiscordUnlink,
  executeDiscordLinkOperation,
} from "@scout-for-lol/backend/discord/commands/admin/utils/discord-link-helpers.js";

const ArgsSchema = z.object({
  playerAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerUnlinkDiscord(interaction: ChatInputCommandInteraction) {
  return executeCommand({
    interaction,
    schema: ArgsSchema,
    argsBuilder: (i) => ({
      playerAlias: i.options.getString("player-alias"),
      guildId: i.guildId,
    }),
    commandName: "player-unlink-discord",
    handler: async ({ data: args }) => {
      const { playerAlias, guildId } = args;

      // Find the player
      const player = await findPlayerByAliasWithSubscriptions(prisma, guildId, playerAlias, interaction);
      if (!player) {
        return;
      }

      // TypeScript narrowing: player is non-null here
      const playerNonNull: NonNullable<typeof player> = player;

      // Validate Discord unlink
      const validation = validateDiscordUnlink(playerNonNull, playerAlias);
      if (!validation.success) {
        await interaction.reply(validation.errorResponse);
        return;
      }

      // After validation, we know discordId is not null
      const previousDiscordId = playerNonNull.discordId;
      if (!previousDiscordId) {
        // This should never happen due to validation, but TypeScript needs the check
        return;
      }
      console.log(`💾 Unlinking Discord ID ${previousDiscordId} from player "${playerAlias}"`);

      await executeDiscordLinkOperation(
        interaction,
        async () => {
          const updatedPlayer = await updatePlayerDiscordId(prisma, playerNonNull.id, null);
          // updatePlayerDiscordId always returns a player (update operation never returns null)
          // Check that result is not null
          if (!updatedPlayer) {
            throw new Error("Failed to update player");
          }
          const updatedPlayerNonNull = updatedPlayer;

          await interaction.reply(
            buildPlayerUpdateResponse(
              updatedPlayerNonNull,
              "✅ **Discord ID unlinked successfully**",
              `Unlinked <@${previousDiscordId}> from player "${playerAlias}"`,
            ),
          );
        },
        "unlink",
      );
    },
  });
}
