import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../database/index";
import { fromError } from "zod-validation-error";

export const listSubscriptionsCommand = new SlashCommandBuilder()
  .setName("listsubscriptions")
  .setDescription("Lists all users that the server is subscribed to");

export async function executeListSubscriptions(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: `This command can only be used in a server`,
      ephemeral: true,
    });
    return;
  }
  
  const guildId = DiscordGuildIdSchema.parse(interaction.guildId);

  const subscriptions = await prisma.subscription.findMany({
    where: { serverId: guildId },
    include: {
      player: {
        include: {
          accounts: true,
        },
      },
    },
  });

  if (subscriptions.length === 0) {
    await interaction.reply("No subscriptions found for this server.");
    return;
  }

  const subscriptionList = subscriptions
    .map((sub) => {
      const player = sub.player;
      return `${(player.alias || player.discordId) ?? "Unknown"} (${player.accounts.length.toString()} account${player.accounts.length === 1 ? "" : "s"})`;
    })
    .join("\n");

  await interaction.reply(`Subscriptions:\n${subscriptionList}`);
}
