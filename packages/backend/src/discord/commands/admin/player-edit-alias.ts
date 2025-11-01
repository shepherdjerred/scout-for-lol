import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  currentAlias: z.string().min(1).max(100),
  newAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerEditAlias(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`✏️  Starting player alias edit for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      currentAlias: interaction.options.getString("current-alias"),
      newAlias: interaction.options.getString("new-alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: currentAlias="${args.currentAlias}", newAlias="${args.newAlias}"`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { currentAlias, newAlias, guildId } = args;

  // Check if current player exists
  const currentPlayer = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: currentAlias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
    },
  });

  if (!currentPlayer) {
    console.log(`❌ Player not found: "${currentAlias}"`);
    await interaction.reply({
      content: `❌ **Player not found**\n\nNo player with alias "${currentAlias}" exists in this server.`,
      ephemeral: true,
    });
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
    console.log(`❌ New alias already taken: "${newAlias}"`);
    await interaction.reply({
      content: `❌ **Alias already taken**\n\nA player with alias "${newAlias}" already exists in this server.\n\nIf you want to merge these players, use \`/admin player-merge\` instead.`,
      ephemeral: true,
    });
    return;
  }

  console.log(`💾 Updating player alias from "${currentAlias}" to "${newAlias}"`);

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

    const executionTime = Date.now() - startTime;
    console.log(`✅ Player alias updated successfully in ${executionTime.toString()}ms`);

    const accountsList = updatedPlayer.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");
    const subscriptionsList = updatedPlayer.subscriptions.map((sub) => `<#${sub.channelId}>`).join(", ");

    await interaction.reply({
      content: `✅ **Alias updated successfully**\n\nPlayer alias changed from "${currentAlias}" to "${newAlias}"\n\n**Accounts (${updatedPlayer.accounts.length.toString()}):**\n${accountsList}\n\n${updatedPlayer.subscriptions.length > 0 ? `**Subscribed channels:** ${subscriptionsList}` : "No active subscriptions."}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during alias update:`, error);
    await interaction.reply({
      content: `❌ **Error updating alias**\n\nFailed to update player alias: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
