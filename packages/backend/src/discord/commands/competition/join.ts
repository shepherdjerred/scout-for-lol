import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import {
  CompetitionIdSchema,
  DiscordAccountIdSchema,
  DiscordGuildIdSchema,
  getCompetitionStatus,
} from "@scout-for-lol/data";
import { match } from "ts-pattern";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { getCompetitionById } from "@scout-for-lol/backend/database/competition/queries.js";
import {
  addParticipant,
  acceptInvitation,
  getParticipantStatus,
} from "@scout-for-lol/backend/database/competition/participants.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { formatCriteriaType } from "@scout-for-lol/backend/discord/commands/competition/helpers.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

/**
 * Execute /competition join command
 * Allows users to opt into OPEN competitions or accept invitations to INVITE_ONLY competitions
 */
export async function executeCompetitionJoin(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));
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
    console.error(`[Competition Join] Error fetching player for user ${userId}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching player data: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!player) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ No League account linked

You need to link your League of Legends account first. Use:
\`/subscription add region:NA1 riot-id:YourName#NA1 alias:YourName channel:#updates\``),
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
    console.error(`[Competition Join] Error fetching competition ${competitionId.toString()}:`, error);
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
  // Step 6: Check existing participant status
  // ============================================================================

  let participantStatus;
  try {
    participantStatus = await getParticipantStatus(prisma, competitionId, player.id);
  } catch (error) {
    console.error(`[Competition Join] Error checking participant status:`, error);
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

You're already in this competition! Check your current standing with:
\`/competition view competition-id:${competitionId.toString()}\``),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (participantStatus === "LEFT") {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Cannot rejoin

You previously left this competition and cannot rejoin.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 7: Check visibility and permissions
  // ============================================================================

  // If INVITE_ONLY, user must have an invitation
  if (competition.visibility === "INVITE_ONLY" && participantStatus !== "INVITED") {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Invitation required

This is an invite-only competition. Ask the competition owner (<@${competition.ownerId}>) to invite you with:
\`/competition invite competition-id:${competitionId.toString()} user:@${interaction.user.username}\``),
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
    console.error(`[Competition Join] Error counting participants:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error checking participant limit: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (activeParticipantCount >= competition.maxParticipants) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Competition full

This competition has reached its maximum of ${competition.maxParticipants.toString()} participants. The competition is full!`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 9: Add participant or accept invitation
  // ============================================================================

  try {
    // At this point, participantStatus can only be "INVITED" or null
    // ("JOINED" and "LEFT" are handled earlier)
    await match(participantStatus)
      .with("INVITED", async () => {
        // User was invited, accept the invitation
        await acceptInvitation(prisma, competitionId, player.id);
        console.log(`[Competition Join] User ${userId} accepted invitation to competition ${competitionId.toString()}`);
      })
      .with(null, async () => {
        // User is joining for the first time (OPEN or SERVER_WIDE)
        await addParticipant({ prisma, competitionId, playerId: player.id, status: "JOINED" });
        console.log(`[Competition Join] User ${userId} joined competition ${competitionId.toString()}`);
      })
      .exhaustive();
  } catch (error) {
    console.error(`[Competition Join] Error adding participant:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error joining competition: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 10: Get updated participant count
  // ============================================================================

  let updatedParticipantCount;
  try {
    updatedParticipantCount = await prisma.competitionParticipant.count({
      where: {
        competitionId,
        status: { not: "LEFT" },
      },
    });
  } catch (error) {
    console.error(`[Competition Join] Error counting updated participants:`, error);
    updatedParticipantCount = activeParticipantCount + 1;
  }

  // ============================================================================
  // Step 11: Send success message
  // ============================================================================

  const status = getCompetitionStatus(competition);
  const statusLine = formatStatusForJoinMessage(status, competition, now);

  await interaction.reply({
    content: truncateDiscordMessage(`✅ You've joined the competition!

**${competition.title}**
Type: ${formatCriteriaType(competition.criteria.type)}
Participants: ${updatedParticipantCount.toString()}/${competition.maxParticipants.toString()}
${statusLine}

Good luck! The leaderboard will be posted daily in <#${competition.channelId}>.`),
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Format status for join success message
 */
function formatStatusForJoinMessage(
  status: ReturnType<typeof getCompetitionStatus>,
  competition: { startDate: Date | null; endDate: Date | null },
  now: Date,
): string {
  switch (status) {
    case "DRAFT":
      if (competition.startDate && competition.startDate > now) {
        return `Status: Starting ${getRelativeTimeString(competition.startDate)}`;
      }
      return "Status: Draft";
    case "ACTIVE":
      return "Status: In progress";
    case "ENDED":
      return "Status: Ended";
    case "CANCELLED":
      return "Status: Cancelled";
  }
}

/**
 * Get relative time string (e.g., "in 2 days")
 */
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `in ${diffDays.toString()} day${diffDays === 1 ? "" : "s"}`;
  }
  if (diffHours > 0) {
    return `in ${diffHours.toString()} hour${diffHours === 1 ? "" : "s"}`;
  }
  return "soon";
}
