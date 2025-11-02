import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordChannelIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  alias: z.string(),
  channel: DiscordChannelIdSchema,
  guildId: DiscordGuildIdSchema,
});

export async function executeSubscriptionDelete(interaction: ChatInputCommandInteraction) {
  console.log("🔕 Starting subscription deletion process");

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      alias: interaction.options.getString("alias"),
      channel: interaction.options.getChannel("channel")?.id,
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: alias=${args.alias}, channel=${args.channel}, guildId=${args.guildId}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { alias, channel, guildId } = args;

  try {
    // Find the player by alias in this server
    const player = await prisma.player.findUnique({
      where: {
        serverId_alias: {
          serverId: guildId,
          alias: alias,
        },
      },
      include: {
        subscriptions: true,
        accounts: true,
      },
    });

    if (!player) {
      console.log(`⚠️  Player not found: ${alias}`);
      await interaction.reply({
        content: `❌ **Player not found**\n\nNo player found with alias "${alias}" in this server.`,
        ephemeral: true,
      });
      return;
    }

    console.log(`📝 Found player: ${player.alias} (ID: ${player.id.toString()})`);

    // Find the subscription for this player in this channel
    const subscription = await prisma.subscription.findUnique({
      where: {
        serverId_playerId_channelId: {
          serverId: guildId,
          playerId: player.id,
          channelId: channel,
        },
      },
    });

    if (!subscription) {
      console.log(`⚠️  Subscription not found for player ${alias} in channel ${channel}`);

      // Check if player has subscriptions in other channels
      const otherSubscriptions = player.subscriptions.filter((sub) => sub.channelId !== channel);

      if (otherSubscriptions.length > 0) {
        const channelList = otherSubscriptions.map((sub) => `<#${sub.channelId}>`).join(", ");
        await interaction.reply({
          content: `ℹ️ **No subscription found**\n\nPlayer "${alias}" is not subscribed in <#${channel}>.\n\nThey are currently subscribed in: ${channelList}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `ℹ️ **No subscription found**\n\nPlayer "${alias}" is not subscribed in <#${channel}>.`,
          ephemeral: true,
        });
      }
      return;
    }

    // Delete the subscription
    console.log(`🗑️  Deleting subscription ID: ${subscription.id.toString()}`);
    await prisma.subscription.delete({
      where: {
        id: subscription.id,
      },
    });

    console.log(`✅ Subscription deleted successfully`);

    // Check if player has any remaining subscriptions
    const remainingSubscriptions = player.subscriptions.filter((sub) => sub.id !== subscription.id);
    const accountCount = player.accounts.length;
    const accountList = player.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");

    let responseMessage = `✅ **Subscription removed**\n\nPlayer "${alias}" will no longer receive updates in <#${channel}>.`;

    if (remainingSubscriptions.length > 0) {
      const channelList = remainingSubscriptions.map((sub) => `<#${sub.channelId}>`).join(", ");
      responseMessage += `\n\nThis player is still subscribed in: ${channelList}`;
    } else {
      responseMessage += `\n\n⚠️  This player has no more active subscriptions. The player and their ${accountCount.toString()} account${accountCount === 1 ? "" : "s"} will be kept in the database but can be cleaned up later.`;
      responseMessage += `\n\n**Accounts:**\n${accountList}`;
    }

    await interaction.reply({
      content: responseMessage,
      ephemeral: true,
    });

    console.log(`🎉 Subscription deletion completed successfully`);
  } catch (error) {
    console.error(`❌ Error during subscription deletion:`, error);
    await interaction.reply({
      content: `❌ **Error deleting subscription**\n\n${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
