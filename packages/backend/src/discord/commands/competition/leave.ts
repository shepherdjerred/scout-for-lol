import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { prisma } from "../../../database/index.js";
import { getCompetitionById } from "../../../database/competition/queries.js";
import { removeParticipant, getParticipantStatus } from "../../../database/competition/participants.js";
import { getErrorMessage } from "../../../utils/errors.js";

/**
 * Execute /competition leave command
 * Allows users to opt out of competitions (soft delete - sets status to LEFT)
 */
export async function executeCompetitionLeave(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = interaction.options.getInteger("competition-id", true);
  const userId = interaction.user.id;
  const serverId = interaction.guildId;

  if (!serverId) {
    await interaction.reply({
      content: "This command can only be used in a server",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Get user's linked Player account
  // ============================================================================

  let player;
  try {
    player = await prisma.player.findFirst({
      where: {
        serverId,
        discordId: userId,
      },
    });
  } catch (error) {
    console.error(`[Competition Leave] Error fetching player for user ${userId}:`, error);
    await interaction.reply({
      content: `Error fetching player data: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!player) {
    await interaction.reply({
      content: `❌ No League account linked

You need to link your League of Legends account first. Use:
\`/subscribe region:NA1 riot-id:YourName#NA1 alias:YourName channel:#updates\``,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 3: Check if competition exists
  // ============================================================================

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`[Competition Leave] Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: `Error fetching competition: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: `❌ Competition not found

Competition with ID ${competitionId.toString()} does not exist.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 4: Check if user is a participant
  // ============================================================================

  let participantStatus;
  try {
    participantStatus = await getParticipantStatus(prisma, competitionId, player.id);
  } catch (error) {
    console.error(`[Competition Leave] Error checking participant status:`, error);
    await interaction.reply({
      content: `Error checking participation status: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Not a participant or already left
  if (!participantStatus || participantStatus === "LEFT") {
    await interaction.reply({
      content: `❌ Not a participant

You're not in this competition. Use \`/competition list\` to see competitions you can join.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Remove participant (soft delete)
  // ============================================================================

  try {
    await removeParticipant(prisma, competitionId, player.id);
    console.log(
      `[Competition Leave] User ${userId} left competition ${competitionId.toString()} (status was: ${participantStatus})`,
    );
  } catch (error) {
    console.error(`[Competition Leave] Error removing participant:`, error);
    await interaction.reply({
      content: `Error leaving competition: ${getErrorMessage(error)}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 6: Send success message
  // ============================================================================

  await interaction.reply({
    content: `✅ You've left the competition

You're no longer participating in **${competition.title}**.

Note: You cannot rejoin a competition after leaving.`,
    flags: MessageFlags.Ephemeral,
  });
}
