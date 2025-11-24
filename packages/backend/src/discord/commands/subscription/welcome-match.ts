import { type ChatInputCommandInteraction } from "discord.js";
import type { PlayerConfigEntry } from "@scout-for-lol/data";
import { getRecentMatchIds } from "@scout-for-lol/backend/league/api/match-history.js";
import {
  fetchMatchData,
  generateMatchReport,
} from "@scout-for-lol/backend/league/tasks/postmatch/match-report-generator.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";

/**
 * Send a welcome message with the player's most recent match report
 * This runs asynchronously after subscription creation
 *
 * @param interaction - The Discord interaction (for sending followUp)
 * @param playerConfig - The player configuration entry
 * @param riotId - The player's Riot ID (for display in messages)
 */
export async function sendWelcomeMatch(
  interaction: ChatInputCommandInteraction,
  playerConfig: PlayerConfigEntry,
): Promise<void> {
  const playerAlias = playerConfig.alias;

  console.log(`[WelcomeMatch] 🎉 Fetching welcome match for ${playerAlias}`);

  try {
    // Fetch the most recent match
    const recentMatchIds = await getRecentMatchIds(playerConfig, 1);

    if (!recentMatchIds || recentMatchIds.length === 0) {
      console.log(`[WelcomeMatch] ℹ️  No recent matches found for ${playerAlias}`);

      // Send message indicating no matches found
      await interaction.followUp({
        content: `Welcome to Scout! No recent matches found for **${playerAlias}**. You'll see reports here when they play their next match.`,
        ephemeral: true,
      });
      return;
    }

    const mostRecentMatchId = recentMatchIds[0];
    if (!mostRecentMatchId) {
      console.log(`[WelcomeMatch] ℹ️  No match ID available for ${playerAlias}`);
      await interaction.followUp({
        content: `Welcome to Scout! No recent matches found for **${playerAlias}**. You'll see reports here when they play their next match.`,
        ephemeral: true,
      });
      return;
    }

    console.log(`[WelcomeMatch] 📜 Most recent match for ${playerAlias}: ${mostRecentMatchId}`);

    // Fetch the match data
    const matchData = await fetchMatchData(mostRecentMatchId, playerConfig.league.leagueAccount.region);

    if (!matchData) {
      console.log(`[WelcomeMatch] ⚠️  Could not fetch match data for ${mostRecentMatchId}`);
      await interaction.followUp({
        content: `Welcome to Scout! Unable to load the most recent match for **${playerAlias}**. You'll see reports here when they play their next match.`,
        ephemeral: true,
      });
      return;
    }

    // Generate the match report
    const message = await generateMatchReport(matchData, [playerConfig]);

    if (!message) {
      console.log(`[WelcomeMatch] ⚠️  No message generated for match ${mostRecentMatchId}`);
      await interaction.followUp({
        content: `Welcome to Scout! Unable to generate a report for the most recent match of **${playerAlias}**. You'll see reports here when they play their next match.`,
        ephemeral: true,
      });
      return;
    }

    // Send the welcome message with the match report
    await interaction.followUp({
      content: `Welcome to Scout! Here's the last match **${playerAlias}** was in. You'll see messages like this for future matches.`,
      files: message.files ?? [],
      embeds: message.embeds ?? [],
      ephemeral: true,
    });

    console.log(`[WelcomeMatch] ✅ Successfully sent welcome match for ${playerAlias}`);
  } catch (error) {
    console.error(`[WelcomeMatch] ❌ Error sending welcome match for ${playerAlias}:`, error);

    // Send a fallback message if something went wrong
    try {
      await interaction.followUp({
        content: `Welcome to Scout! There was an error loading the most recent match for **${playerAlias}**. You'll see reports here when they play their next match.\n\nError: ${getErrorMessage(error)}`,
        ephemeral: true,
      });
    } catch (followUpError) {
      // If even the fallback fails, just log it
      console.error(`[WelcomeMatch] ❌ Failed to send fallback message:`, followUpError);
    }
  }
}
