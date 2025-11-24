import { type ChatInputCommandInteraction } from "discord.js";
import { CompetitionIdSchema, DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { getCompetitionById } from "@scout-for-lol/backend/database/competition/queries.js";
import { removeParticipant, getParticipantStatus } from "@scout-for-lol/backend/database/competition/participants.js";
import {
  replyWithErrorFromException,
  replyWithError,
  replyWithSuccess,
} from "@scout-for-lol/backend/discord/commands/competition/utils/replies.js";

/**
 * Execute /competition leave command
 * Allows users to opt out of competitions (soft delete - sets status to LEFT)
 */
export async function executeCompetitionLeave(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const serverId = interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;

  if (!serverId) {
    await replyWithError(interaction, "This command can only be used in a server");
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
    await replyWithErrorFromException(interaction, error, "fetching player data");
    return;
  }

  if (!player) {
    await replyWithError(
      interaction,
      `❌ No League account linked

You need to link your League of Legends account first. Use:
\`/subscription add region:NA1 riot-id:YourName#NA1 alias:YourName channel:#updates\``,
    );
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
    await replyWithErrorFromException(interaction, error, "fetching competition");
    return;
  }

  if (!competition) {
    await replyWithError(
      interaction,
      `❌ Competition not found

Competition with ID ${competitionId.toString()} does not exist.`,
    );
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
    await replyWithErrorFromException(interaction, error, "checking participation status");
    return;
  }

  // Not a participant or already left
  if (!participantStatus || participantStatus === "LEFT") {
    await replyWithError(
      interaction,
      `❌ Not a participant

You're not in this competition. Use \`/competition list\` to see competitions you can join.`,
    );
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
    await replyWithErrorFromException(interaction, error, "leaving competition");
    return;
  }

  // ============================================================================
  // Step 6: Send success message
  // ============================================================================

  await replyWithSuccess(
    interaction,
    `✅ You've left the competition

You're no longer participating in **${competition.title}**.

Note: You cannot rejoin a competition after leaving.`,
  );
}
