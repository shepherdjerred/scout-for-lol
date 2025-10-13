import { type CommandInteraction, SlashCommandBuilder } from "discord.js";

export const unsubscribeCommand = new SlashCommandBuilder().setName("unsubscribe").setDescription("Replies with Pong!");

export async function executeUnsubscribe(interaction: CommandInteraction) {
  await interaction.reply("Pong!");
}
