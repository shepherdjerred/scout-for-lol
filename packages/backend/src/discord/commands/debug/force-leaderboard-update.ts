import type { ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { getCompetitionById } from "@scout-for-lol/backend/database/competition/queries.js";
import { runDailyLeaderboardUpdate } from "@scout-for-lol/backend/league/tasks/competition/daily-update.js";
import { calculateLeaderboard } from "@scout-for-lol/backend/league/competition/leaderboard.js";
import { generateLeaderboardEmbed } from "@scout-for-lol/backend/discord/embeds/competition.js";
import { send as sendChannelMessage } from "@scout-for-lol/backend/league/discord/channel.js";

export async function executeDebugForceLeaderboardUpdate(interaction: ChatInputCommandInteraction) {
  console.log("🐛 Executing debug force-leaderboard-update command");

  const competitionId = interaction.options.getInteger("competition-id", false);

  // Defer reply since this might take time
  await interaction.deferReply({ ephemeral: true });

  try {
    if (competitionId !== null) {
      // Update specific competition
      console.log(`📊 Running leaderboard update for competition ${competitionId.toString()}`);

      const competition = await getCompetitionById(prisma, competitionId);

      if (!competition) {
        await interaction.editReply(`❌ Competition ${competitionId.toString()} not found`);
        return;
      }

      // Calculate leaderboard
      const leaderboard = await calculateLeaderboard(prisma, competition);

      // Generate embed
      const embed = generateLeaderboardEmbed(competition, leaderboard);

      // Post to competition channel
      await sendChannelMessage(
        {
          content: `📊 **Leaderboard Update** - ${competition.title}`,
          embeds: [embed],
        },
        competition.channelId,
        competition.serverId,
      );

      await interaction.editReply(
        `✅ Leaderboard updated successfully for competition **${competition.title}** (ID: ${competitionId.toString()})`,
      );

      console.log(`✅ Successfully updated leaderboard for competition ${competitionId.toString()}`);
    } else {
      // Update all active competitions
      console.log("📊 Running daily leaderboard update for all active competitions");

      await runDailyLeaderboardUpdate();

      await interaction.editReply("✅ Daily leaderboard update completed successfully for all active competitions");

      console.log("✅ Successfully ran daily leaderboard update for all competitions");
    }
  } catch (error) {
    console.error("❌ Error running leaderboard update:", error);
    await interaction.editReply(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
