import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { CompetitionIdSchema, DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { getCompetitionById } from "../../../database/competition/queries.js";
import { addParticipant, getParticipantStatus } from "../../../database/competition/participants.js";
import { getErrorMessage } from "../../../utils/errors.js";
import { formatCriteriaType } from "./helpers.js";
import { truncateDiscordMessage } from "../../utils/message.js";

/**
 * Execute /competition invite command
 * Allows competition owners to invite specific users to their competitions
 */
export async function executeCompetitionInvite(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));
  const targetUser = interaction.options.getUser("user", true);
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const serverId = interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;

  if (!serverId) {
    await interaction.reply({
      content: truncateDiscordMessage("This command can only be used in a server"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 2: Check if competition exists
  // ============================================================================

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`[Competition Invite] Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching competition: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: truncateDiscordMessage(`Competition with ID ${competitionId.toString()} not found`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 3: Check ownership
  // ============================================================================

  if (competition.ownerId !== userId) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Permission denied

Only the competition owner can invite participants. The owner of this competition is <@${competition.ownerId}>.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 4: Check if competition is cancelled
  // ============================================================================

  if (competition.isCancelled) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Competition cancelled

This competition has been cancelled and is no longer accepting participants.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 5: Check if competition has ended
  // ============================================================================

  const now = new Date();
  if (competition.endDate && competition.endDate < now) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Competition ended

This competition has already ended on ${competition.endDate.toLocaleDateString()}.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 6: Get target user's linked Player account
  // ============================================================================

  let player;
  try {
    player = await prisma.player.findFirst({
      where: {
        serverId,
        discordId: DiscordAccountIdSchema.parse(targetUser.id),
      },
    });
  } catch (error) {
    console.error(`[Competition Invite] Error fetching player for user ${targetUser.id}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching player data: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!player) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Cannot invite user

@${targetUser.username} doesn't have a linked League of Legends account. They need to use \`/subscribe\` first.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 7: Check existing participant status
  // ============================================================================

  let participantStatus;
  try {
    participantStatus = await getParticipantStatus(prisma, competitionId, player.id);
  } catch (error) {
    console.error(`[Competition Invite] Error checking participant status:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error checking participation status: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Handle existing participant statuses
  if (participantStatus === "JOINED") {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Already participating

@${targetUser.username} is already in this competition.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (participantStatus === "INVITED") {
    // Idempotent - already invited, just acknowledge
    await interaction.reply({
      content:
        truncateDiscordMessage(`@${targetUser.username} has already been invited to this competition. They can join with:
\`/competition join competition-id:${competitionId.toString()}\``),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (participantStatus === "LEFT") {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Cannot invite

@${targetUser.username} previously left this competition and cannot be re-invited.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 8: Check participant limit
  // ============================================================================

  let activeParticipantCount;
  try {
    activeParticipantCount = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: { not: "LEFT" },
      },
    });
  } catch (error) {
    console.error(`[Competition Invite] Error counting participants:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error checking participant limit: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (activeParticipantCount >= competition.maxParticipants) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Competition full

This competition has reached its maximum of ${competition.maxParticipants.toString()} participants. Cannot invite more users.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 9: Add participant with INVITED status
  // ============================================================================

  try {
    await addParticipant(prisma, competitionId, player.id, "INVITED", userId);
    console.log(
      `[Competition Invite] User ${userId} invited ${targetUser.id} to competition ${competitionId.toString()}`,
    );
  } catch (error) {
    console.error(`[Competition Invite] Error adding participant:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error sending invitation: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 10: Send DM to invited user
  // ============================================================================

  let dmFailed = false;
  try {
    const startDateStr = competition.startDate
      ? competition.startDate.toLocaleDateString()
      : competition.seasonId
        ? `Season ${competition.seasonId}`
        : "TBD";
    const endDateStr = competition.endDate ? competition.endDate.toLocaleDateString() : "TBD";
    const duration = competition.startDate && competition.endDate ? `${startDateStr} - ${endDateStr}` : startDateStr;

    await targetUser.send({
      content: truncateDiscordMessage(`📩 **Competition Invitation**

You've been invited to compete in **${competition.title}**!

**Description:** ${competition.description}
**Type:** ${formatCriteriaType(competition.criteria.type)}
**Duration:** ${duration}
**Owner:** <@${competition.ownerId}>

To join, use:
\`/competition join competition-id:${competitionId.toString()}\``),
    });
    console.log(`[Competition Invite] DM sent to user ${targetUser.id}`);
  } catch (error) {
    console.warn(`[Competition Invite] Failed to DM user ${targetUser.id}:`, getErrorMessage(error));
    dmFailed = true;
  }

  // ============================================================================
  // Step 11: Send success message
  // ============================================================================

  const dmWarning = dmFailed
    ? "\n⚠️ Note: Could not send DM (user may have DMs disabled). Please notify them manually."
    : "";

  await interaction.reply({
    content: truncateDiscordMessage(`✅ Invitation sent

Invited @${targetUser.username} to **${competition.title}**.
They can join with \`/competition join competition-id:${competitionId.toString()}\`${dmWarning}`),
    flags: MessageFlags.Ephemeral,
  });
}
