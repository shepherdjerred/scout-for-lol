import { SlashCommandBuilder } from "discord.js";

export const debugCommand = new SlashCommandBuilder()
  .setName("debug")
  .setDescription("Show current application state for debugging");
