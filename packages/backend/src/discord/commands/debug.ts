import { type ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import configuration from "../../configuration";
import { getState } from "../../league/model/state";

export const debugCommand = new SlashCommandBuilder()
  .setName("debug")
  .setDescription("Debug commands for bot owner")
  .addSubcommand((subcommand) =>
    subcommand.setName("state").setDescription("Show current application state for debugging"),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("database").setDescription("Upload the SQLite database file (owner only)"),
  );

export async function executeDebugState(interaction: ChatInputCommandInteraction) {
  console.log("🐛 Executing debug state command");
  const state = getState();
  const debugInfo = {
    note: "Active game tracking removed - Spectator API deprecated",
    gamesInProgress: 0,
    state: state,
  };
  console.log("📊 Debug info:", debugInfo);
  await interaction.reply({
    content: `\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``,
    ephemeral: true,
  });
}

export async function executeDebugDatabase(interaction: ChatInputCommandInteraction) {
  console.log("🐛 Executing debug database command");
  const userId = interaction.user.id;
  const username = interaction.user.username;

  // Check if user is the bot owner
  if (userId !== configuration.ownerDiscordId) {
    console.warn(`⚠️  Unauthorized debug database access attempt by ${username} (${userId})`);
    await interaction.reply({
      content: "❌ This command is only available to the bot owner.",
      ephemeral: true,
    });
    return;
  }

  console.log(`✅ Authorized debug database access by owner ${username} (${userId})`);

  // Get the database file path from configuration
  const databaseUrl = configuration.databaseUrl;

  // Handle file:// URLs and extract the path
  let databasePath: string;
  if (databaseUrl.startsWith("file:")) {
    // Remove 'file:' prefix and handle URL encoding
    databasePath = databaseUrl.replace(/^file:/, "");
  } else {
    databasePath = databaseUrl;
  }

  console.log(`📁 Database path: ${databasePath}`);

  // Check if file exists
  if (!existsSync(databasePath)) {
    console.error(`❌ Database file not found at ${databasePath}`);
    await interaction.reply({
      content: `❌ Database file not found at: \`${databasePath}\``,
      ephemeral: true,
    });
    return;
  }

  try {
    // Defer reply as file reading might take a moment
    await interaction.deferReply({ ephemeral: true });

    console.log(`📖 Reading database file from ${databasePath}`);
    const fileBuffer = await readFile(databasePath);
    console.log(`✅ Successfully read database file (${fileBuffer.length.toString()} bytes)`);

    // Create attachment
    const attachment = new AttachmentBuilder(fileBuffer, { name: "database.sqlite" });

    await interaction.editReply({
      content: `✅ Database file uploaded successfully\n\nPath: \`${databasePath}\`\nSize: ${(fileBuffer.length / 1024).toFixed(2)} KB`,
      files: [attachment],
    });

    console.log(`🎉 Database file uploaded successfully to ${username}`);
  } catch (error) {
    console.error("❌ Error reading or uploading database file:", error);
    await interaction.editReply({
      content: `❌ Error uploading database file: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
