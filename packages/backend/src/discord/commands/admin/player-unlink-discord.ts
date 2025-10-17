import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  playerAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerUnlinkDiscord(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = interaction.user.id;
  const username = interaction.user.username;

  console.log(`🔓 Starting Discord unlink for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      playerAlias: interaction.options.getString("player-alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: playerAlias="${args.playerAlias}"`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { playerAlias, guildId } = args;

  // Find the player
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: playerAlias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
    },
  });

  if (!player) {
    console.log(`❌ Player not found: "${playerAlias}"`);
    await interaction.reply({
      content: `❌ **Player not found**\n\nNo player with alias "${playerAlias}" exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  // Check if player has a Discord ID
  if (!player.discordId) {
    console.log(`⚠️  Player has no Discord ID to unlink`);
    await interaction.reply({
      content: `ℹ️ **No Discord ID linked**\n\nPlayer "${playerAlias}" doesn't have a Discord ID linked.`,
      ephemeral: true,
    });
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

    const executionTime = Date.now() - startTime;
    console.log(`✅ Discord ID unlinked successfully in ${executionTime.toString()}ms`);

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
    await interaction.reply({
      content: `❌ **Error unlinking Discord ID**\n\nFailed to unlink Discord ID: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
