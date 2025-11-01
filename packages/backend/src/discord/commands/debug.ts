import { type ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { formatDistanceToNow } from "date-fns";
import { DiscordAccountIdSchema } from "@scout-for-lol/data";
import configuration from "../../configuration";
import { getState } from "../../league/model/state";
import { getAccountsWithState } from "../../database/index.js";
import { calculatePollingInterval, shouldCheckPlayer } from "../../utils/polling-intervals.js";

export const debugCommand = new SlashCommandBuilder()
  .setName("debug")
  .setDescription("Debug commands for bot owner")
  .addSubcommand((subcommand) =>
    subcommand.setName("state").setDescription("Show current application state for debugging"),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("database").setDescription("Upload the SQLite database file (owner only)"),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("polling").setDescription("Show polling intervals for all tracked players"),
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
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
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

export async function executeDebugPolling(interaction: ChatInputCommandInteraction) {
  console.log("🐛 Executing debug polling command");

  try {
    await interaction.deferReply({ ephemeral: true });

    const accountsWithState = await getAccountsWithState();
    const currentTime = new Date();

    if (accountsWithState.length === 0) {
      await interaction.editReply({ content: "No tracked players found." });
      return;
    }

    // Build summary info
    const intervalCounts = new Map<number, number>();
    const shouldCheckCount = { yes: 0, no: 0 };

    const playerDetails: string[] = [];

    for (const { config, lastMatchTime, lastCheckedAt } of accountsWithState) {
      const interval = calculatePollingInterval(lastMatchTime, currentTime);
      const shouldCheck = shouldCheckPlayer(lastMatchTime, lastCheckedAt, currentTime);

      // Count intervals
      intervalCounts.set(interval, (intervalCounts.get(interval) ?? 0) + 1);
      if (shouldCheck) {
        shouldCheckCount.yes++;
      } else {
        shouldCheckCount.no++;
      }

      // Format player info
      const lastMatchStr = lastMatchTime ? formatDistanceToNow(lastMatchTime, { addSuffix: true }) : "never";
      const lastCheckedStr = lastCheckedAt ? formatDistanceToNow(lastCheckedAt, { addSuffix: true }) : "never";
      const checkStatus = shouldCheck ? "✅" : "⏸️";

      playerDetails.push(
        `${checkStatus} **${config.alias}** (${config.league.leagueAccount.region})\n` +
          `  Interval: ${interval.toString()}m | Last match: ${lastMatchStr} | Last checked: ${lastCheckedStr}`,
      );
    }

    // Build summary
    const sortedIntervals = Array.from(intervalCounts.entries()).sort((a, b) => a[0] - b[0]);
    const intervalSummary = sortedIntervals
      .map(([interval, count]) => `${interval.toString()}min: ${count.toString()} player(s)`)
      .join("\n");

    const summary =
      `**Polling Interval Summary**\n` +
      `Total players: ${accountsWithState.length.toString()}\n` +
      `Should check now: ${shouldCheckCount.yes.toString()}\n` +
      `Waiting: ${shouldCheckCount.no.toString()}\n\n` +
      `**Interval Distribution:**\n${intervalSummary}\n\n` +
      `**Player Details:**\n${playerDetails.join("\n\n")}`;

    // Split into chunks if too long (Discord limit is 2000 characters)
    if (summary.length > 1900) {
      const chunks: string[] = [];
      let currentChunk =
        `**Polling Interval Summary**\n` +
        `Total players: ${accountsWithState.length.toString()}\n` +
        `Should check now: ${shouldCheckCount.yes.toString()}\n` +
        `Waiting: ${shouldCheckCount.no.toString()}\n\n` +
        `**Interval Distribution:**\n${intervalSummary}\n\n` +
        `**Player Details:**\n`;

      for (const detail of playerDetails) {
        if (currentChunk.length + detail.length + 2 > 1900) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += detail + "\n\n";
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      await interaction.editReply({ content: chunks[0] ?? "No content" });
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({ content: chunks[i] ?? "No content", ephemeral: true });
      }
    } else {
      await interaction.editReply({ content: summary });
    }

    console.log(`✅ Polling debug info sent (${accountsWithState.length.toString()} players)`);
  } catch (error) {
    console.error("❌ Error in debug polling command:", error);
    await interaction.editReply({
      content: `❌ Error getting polling info: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
