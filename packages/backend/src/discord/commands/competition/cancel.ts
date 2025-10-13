import { type ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { z } from "zod";
import { prisma } from "../../../database/index.js";
import { cancelCompetition, getCompetitionById } from "../../../database/competition/queries.js";
import { getErrorMessage } from "../../../utils/errors.js";

/**
 * Execute /competition cancel command
 * Allows owner or server admin to cancel a competition
 */
export async function executeCompetitionCancel(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = interaction.options.getInteger("competition-id", true);
  const userId = interaction.user.id;

  // ============================================================================
  // Step 2: Check if competition exists
  // ============================================================================

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`[Competition Cancel] Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: `Error fetching competition: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: `Competition with ID ${competitionId.toString()} not found`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 3: Check permissions (owner or admin)
  // ============================================================================

  const member = interaction.member;
  const isOwner = competition.ownerId === userId;

  // Type guard for GuildMember with permissions
  const GuildMemberSchema = z.object({
    permissions: z.object({
      has: z.function(),
    }),
  });

  const memberResult = GuildMemberSchema.safeParse(member);
  let isAdmin = false;
  if (memberResult.success && member) {
    const permissions = member.permissions;
    isAdmin = permissions.has(PermissionFlagsBits.Administrator);
  }

  if (!isOwner && !isAdmin) {
    await interaction.reply({
      content: "Only the competition owner or server administrators can cancel competitions",
      flags: MessageFlags.Ephemeral,
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
      content: `Error cancelling competition: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Send success message
  // ============================================================================

  await interaction.reply({
    content: `Competition "${competition.title}" has been cancelled`,
    flags: MessageFlags.Ephemeral,
  });

  // ============================================================================
  // Step 6: Post notification to competition channel
  // ============================================================================

  try {
    const channel = await interaction.client.channels.fetch(competition.channelId);

    // Validate channel is text-based
    const TextChannelSchema = z.object({
      isTextBased: z.function(),
      send: z.function(),
    });

    const channelResult = TextChannelSchema.safeParse(channel);

    if (channelResult.success && channel) {
      const textChannel = channel;
      const isTextBased = textChannel.isTextBased();

      if (isTextBased) {
        await textChannel.send(`🚫 Competition **${competition.title}** has been cancelled by <@${userId}>`);
        console.log(`[Competition Cancel] Posted notification to channel ${competition.channelId}`);
      } else {
        console.warn(`[Competition Cancel] Channel ${competition.channelId} is not text-based`);
      }
    } else {
      console.warn(`[Competition Cancel] Channel ${competition.channelId} not found or invalid`);
    }
  } catch (error) {
    // Non-critical error - log but don't fail the command
    console.error(`[Competition Cancel] Error posting to channel ${competition.channelId}:`, getErrorMessage(error));
  }
}
