import { type ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { CompetitionIdSchema, DiscordAccountIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { cancelCompetition, getCompetitionById } from "@scout-for-lol/backend/database/competition/queries.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { asTextChannel } from "@scout-for-lol/backend/discord/utils/channel.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

/**
 * Execute /competition cancel command
 * Allows owner or server admin to cancel a competition
 */
export async function executeCompetitionCancel(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);

  // ============================================================================
  // Step 2: Check if competition exists
  // ============================================================================

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`[Competition Cancel] Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching competition: ${getErrorMessage(error)}`),
      ephemeral: true,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: truncateDiscordMessage(`Competition with ID ${competitionId.toString()} not found`),
      ephemeral: true,
    });
    return;
  }

  // ============================================================================
  // Step 3: Check permissions (owner or admin)
  // ============================================================================

  const member = interaction.member;
  const isOwner = competition.ownerId === userId;

  // Check if user is admin (only works in guild context)
  // Use optional chaining to safely access permissions
  const isAdmin = Boolean(
    member &&
      "permissions" in member &&
      member.permissions &&
      typeof member.permissions === "object" &&
      "has" in member.permissions &&
      member.permissions.has(PermissionFlagsBits.Administrator),
  );

  if (!isOwner && !isAdmin) {
    await interaction.reply({
      content: truncateDiscordMessage("Only the competition owner or server administrators can cancel competitions"),
      ephemeral: true,
    });
    return;
  }

  // ============================================================================
  // Step 4: Cancel the competition
  // ============================================================================

  try {
    await cancelCompetition(prisma, competitionId);
    console.log(`[Competition Cancel] Competition ${competitionId.toString()} cancelled by user ${userId}`);
  } catch (error) {
    console.error(`[Competition Cancel] Error cancelling competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error cancelling competition: ${getErrorMessage(error)}`),
      ephemeral: true,
    });
    return;
  }

  // ============================================================================
  // Step 5: Send success message
  // ============================================================================

  await interaction.reply({
    content: truncateDiscordMessage(`Competition "${competition.title}" has been cancelled`),
    ephemeral: true,
  });

  // ============================================================================
  // Step 6: Post notification to competition channel
  // ============================================================================

  try {
    const channel = await interaction.client.channels.fetch(competition.channelId);

    if (!channel) {
      console.warn(`[Competition Cancel] Channel ${competition.channelId} not found`);
      return;
    }

    const textChannel = asTextChannel(channel);

    if (!textChannel) {
      console.warn(`[Competition Cancel] Channel ${competition.channelId} is not text-based`);
      return;
    }

    await textChannel.send(`🚫 Competition **${competition.title}** has been cancelled by <@${userId}>`);
    console.log(`[Competition Cancel] Posted notification to channel ${competition.channelId}`);
  } catch (error) {
    // Non-critical error - log but don't fail the command
    // Permission errors are expected and shouldn't be alarming
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("permission") || errorMessage.includes("50013") || errorMessage.includes("50001")) {
      console.warn(
        `[Competition Cancel] Cannot post to channel ${competition.channelId} - missing permissions. ` +
          "Please ensure the bot has 'Send Messages' and 'View Channel' permissions.",
      );
    } else {
      console.error(`[Competition Cancel] Error posting to channel ${competition.channelId}:`, errorMessage);
    }
  }
}
