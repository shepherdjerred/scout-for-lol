import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  playerAlias: z.string().min(1).max(100),
  discordUserId: DiscordAccountIdSchema,
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerLinkDiscord(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🔗 Starting Discord link for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      playerAlias: interaction.options.getString("player-alias"),
      discordUserId: interaction.options.getUser("discord-user")?.id,
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: playerAlias="${args.playerAlias}", discordUserId=${args.discordUserId}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { playerAlias, discordUserId, guildId } = args;

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
    await interaction.reply({
      content: `❌ **Discord ID already linked**\n\nDiscord user <@${discordUserId}> is already linked to player "${existingPlayer.alias}".\n\nTo change the link, first unlink it from "${existingPlayer.alias}" using \`/admin player-unlink-discord\`, then link it to "${playerAlias}".`,
      ephemeral: true,
    });
    return;
  }

  // Check if player already has a Discord ID
  if (player.discordId) {
    console.log(`⚠️  Player already has Discord ID: ${player.discordId}`);
    await interaction.reply({
      content: `⚠️ **Player already has Discord ID**\n\nPlayer "${playerAlias}" is already linked to <@${player.discordId}>.\n\n${player.discordId === discordUserId ? "This Discord user is already linked to this player." : `To change it to <@${discordUserId}>, first unlink the current Discord ID using \`/admin player-unlink-discord\`, then link the new one.`}`,
      ephemeral: true,
    });
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

    const executionTime = Date.now() - startTime;
    console.log(`✅ Discord ID linked successfully in ${executionTime.toString()}ms`);

    const accountsList = updatedPlayer.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");
    const subscriptionsList =
      updatedPlayer.subscriptions.length > 0
        ? updatedPlayer.subscriptions.map((sub) => `<#${sub.channelId}>`).join(", ")
        : "No active subscriptions.";

    await interaction.reply({
      content: `✅ **Discord ID linked successfully**\n\nLinked <@${discordUserId}> to player "${playerAlias}"\n\n**Accounts (${updatedPlayer.accounts.length.toString()}):**\n${accountsList}\n\n**Subscribed channels:** ${subscriptionsList}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during Discord link:`, error);
    await interaction.reply({
      content: `❌ **Error linking Discord ID**\n\nFailed to link Discord ID: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
