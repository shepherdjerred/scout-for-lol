import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { CompetitionIdSchema, getCompetitionStatus } from "@scout-for-lol/data";
import { match } from "ts-pattern";
import { z } from "zod";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { getCompetitionById } from "@scout-for-lol/backend/database/competition/queries.js";
import { getParticipants } from "@scout-for-lol/backend/database/competition/participants.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { formatScore } from "@scout-for-lol/backend/discord/embeds/competition.js";
import { loadCachedLeaderboard } from "@scout-for-lol/backend/storage/s3-leaderboard.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";

// Schema for participant with player relation (when includePlayer=true)
const ParticipantWithPlayerSchema = z.object({
  player: z.object({
    discordId: z.string(),
  }),
});

/**
 * Execute /competition view command
 * Shows detailed competition information and leaderboard
 */
export async function executeCompetitionView(interaction: ChatInputCommandInteraction): Promise<void> {
  // ============================================================================
  // Step 1: Extract and validate input
  // ============================================================================

  const competitionId = CompetitionIdSchema.parse(interaction.options.getInteger("competition-id", true));

  // ============================================================================
  // Step 2: Fetch competition
  // ============================================================================

  let competition;
  try {
    competition = await getCompetitionById(prisma, competitionId);
  } catch (error) {
    console.error(`[Competition View] Error fetching competition ${competitionId.toString()}:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching competition: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!competition) {
    await interaction.reply({
      content: truncateDiscordMessage(`❌ Competition not found

Competition #${competitionId.toString()} doesn't exist. Use \`/competition list\` to see all available competitions.`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 3: Calculate status and fetch participants
  // ============================================================================

  const status = getCompetitionStatus(competition);

  let participants;
  try {
    participants = await getParticipants(prisma, competitionId, "JOINED", true);
  } catch (error) {
    console.error(`[Competition View] Error fetching participants:`, error);
    await interaction.reply({
      content: truncateDiscordMessage(`Error fetching participants: ${getErrorMessage(error)}`),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ============================================================================
  // Step 4: Build embed
  // ============================================================================

  const embed = await buildCompetitionEmbed(competition, status, participants);

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Build Discord embed for competition view
 */
async function buildCompetitionEmbed(
  competition: Awaited<ReturnType<typeof getCompetitionById>>,
  status: ReturnType<typeof getCompetitionStatus>,
  participants: Awaited<ReturnType<typeof getParticipants>>,
): Promise<EmbedBuilder> {
  if (!competition) {
    throw new Error("Competition cannot be null");
  }

  const embed = new EmbedBuilder().setTitle(`🏆 ${competition.title}`).setDescription(competition.description);

  // Set color based on status
  const color = match(status)
    .with("DRAFT", () => 0x5865f2) // Blue
    .with("ACTIVE", () => 0x57f287) // Green
    .with("ENDED", () => 0xeb459e) // Pink
    .with("CANCELLED", () => 0xed4245) // Red
    .exhaustive();

  embed.setColor(color);

  // Add status field with emoji and details
  const statusText = getStatusText(status, competition);
  embed.addFields({ name: "Status", value: statusText, inline: true });

  // Add participants count
  const participantCount = participants.length;
  embed.addFields({
    name: "Participants",
    value: `${participantCount.toString()}/${competition.maxParticipants.toString()}`,
    inline: true,
  });

  // Add owner
  embed.addFields({ name: "Owner", value: `<@${competition.ownerId}>`, inline: true });

  // Add channel
  embed.addFields({ name: "Channel", value: `<#${competition.channelId}>`, inline: true });

  // Add visibility
  const visibilityText = match(competition.visibility)
    .with("OPEN", () => "Open to All")
    .with("INVITE_ONLY", () => "Invite Only")
    .with("SERVER_WIDE", () => "Server-Wide")
    .otherwise(() => competition.visibility);

  embed.addFields({ name: "Visibility", value: visibilityText, inline: true });

  // Add blank field for spacing (creates new row)
  embed.addFields({ name: "\u200B", value: "\u200B", inline: false });

  // Add leaderboard or participant list based on status
  if (status === "DRAFT") {
    addParticipantList(embed, participants);
    // TODO: use ts-pattern for exhaustive match
  } else {
    // For ACTIVE, ENDED, or CANCELLED - calculate and show leaderboard
    await addLeaderboard(embed, status, competition);
  }

  // Add footer with criteria description
  const criteriaDescription = getCriteriaDescription(competition.criteria);
  embed.setFooter({ text: `${criteriaDescription} • Competition ID: ${competition.id.toString()}` });
  embed.setTimestamp(new Date());

  return embed;
}

/**
 * Get status text with emoji and time information
 */
function getStatusText(
  status: ReturnType<typeof getCompetitionStatus>,
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
): string {
  const now = new Date();

  return match(status)
    .with("DRAFT", () => {
      if (competition.startDate) {
        const daysUntilStart = Math.ceil((competition.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `🔵 Draft (starts in ${daysUntilStart.toString()} day${daysUntilStart === 1 ? "" : "s"})`;
      }
      return "🔵 Draft";
    })
    .with("ACTIVE", () => {
      if (competition.endDate) {
        const daysRemaining = Math.ceil((competition.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `🟢 Active (${daysRemaining.toString()} day${daysRemaining === 1 ? "" : "s"} remaining)`;
      }
      return "🟢 Active";
    })
    .with("ENDED", () => {
      if (competition.endDate) {
        return `🔴 Ended (Completed ${competition.endDate.toLocaleDateString()})`;
      }
      return "🔴 Ended";
    })
    .with("CANCELLED", () => "⚫ Cancelled")
    .exhaustive();
}

/**
 * Add participant list to embed (for DRAFT status)
 */
function addParticipantList(embed: EmbedBuilder, participants: Awaited<ReturnType<typeof getParticipants>>): void {
  embed.addFields({ name: "👥 Participants", value: "━━━━━━━━━━━━━━━━━━━━━", inline: false });

  if (participants.length === 0) {
    embed.addFields({ name: "\u200B", value: "No participants yet.", inline: false });
    return;
  }

  // Show participant list with their Discord usernames
  // When includePlayer=true is passed to getParticipants, each participant includes player relation
  const participantList = participants
    .map((p) => {
      // Validate if player relation exists using Zod schema
      const result = ParticipantWithPlayerSchema.safeParse(p);
      if (result.success) {
        return `• <@${result.data.player.discordId}>`;
      }
      return `• Player ID: ${p.playerId.toString()}`;
    })
    .join("\n");

  embed.addFields({ name: "\u200B", value: participantList, inline: false });

  // Add note about leaderboard availability
  embed.addFields({ name: "📊 Leaderboard", value: "━━━━━━━━━━━━━━━━━━━━━", inline: false });
  embed.addFields({
    name: "\u200B",
    value: "Leaderboard will be available when the competition starts.",
    inline: false,
  });
}

/**
 * Add leaderboard standings to embed
 * Loads from S3 cache if available, otherwise shows message that leaderboard is not yet available
 */
async function addLeaderboard(
  embed: EmbedBuilder,
  status: ReturnType<typeof getCompetitionStatus>,
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
): Promise<void> {
  const title = match(status)
    .with("ACTIVE", () => "📊 Current Standings")
    .with("ENDED", () => "🎉 Final Standings")
    .with("CANCELLED", () => "📊 Standings (at cancellation)")
    .otherwise(() => "📊 Leaderboard");

  embed.addFields({ name: title, value: "━━━━━━━━━━━━━━━━━━━━━", inline: false });

  // Try to load from cache
  console.log(`[Competition View] Attempting to load cached leaderboard for competition ${competition.id.toString()}`);
  const cached = await loadCachedLeaderboard(competition.id);

  if (!cached) {
    console.log(`[Competition View] No cached leaderboard found for competition ${competition.id.toString()}`);
    embed.addFields({
      name: "\u200B",
      value:
        "Leaderboard not yet available. The leaderboard is updated daily at midnight UTC. Check back after the next update!",
      inline: false,
    });
    return;
  }

  console.log(`[Competition View] Using cached leaderboard from ${cached.calculatedAt}`);

  // Map cached entries to RankedLeaderboardEntry type to ensure type compatibility
  const leaderboard = cached.entries.map((entry) => ({
    playerId: entry.playerId,
    playerName: entry.playerName,
    score: entry.score,
    rank: entry.rank,
    ...(entry.metadata !== undefined && { metadata: entry.metadata }),
  }));
  const cachedAt = new Date(cached.calculatedAt);

  // Display leaderboard entries
  if (leaderboard.length === 0) {
    embed.addFields({
      name: "\u200B",
      value: "No participants have scores yet. Play some games to appear on the leaderboard!",
      inline: false,
    });
    return;
  }

  // Show top 10 entries
  const top10 = leaderboard.slice(0, 10);
  const leaderboardText = top10
    .map((entry) => {
      const medal = getMedalEmoji(entry.rank);
      const score = formatScore(entry.score, competition.criteria, entry.metadata);
      return `${medal} **${entry.rank.toString()}.** ${entry.playerName} - ${score}`;
    })
    .join("\n");

  embed.addFields({
    name: "\u200B",
    value: leaderboardText,
    inline: false,
  });

  // If there are more than 10 participants, indicate it
  if (leaderboard.length > 10) {
    embed.addFields({
      name: "\u200B",
      value: `(Showing top 10 of ${leaderboard.length.toString()} participants)`,
      inline: false,
    });
  }

  // Add cache timestamp
  const now = new Date();
  const ageMs = now.getTime() - cachedAt.getTime();
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

  let ageText = "";
  if (ageHours > 0) {
    ageText = `${ageHours.toString()} hour${ageHours === 1 ? "" : "s"} ago`;
  } else if (ageMinutes > 0) {
    ageText = `${ageMinutes.toString()} minute${ageMinutes === 1 ? "" : "s"} ago`;
  } else {
    ageText = "just now";
  }

  const dateStr = cachedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  embed.addFields({
    name: "\u200B",
    value: `_Last updated: ${dateStr} (${ageText})_`,
    inline: false,
  });
}

/**
 * Get medal emoji for rank position
 * Returns medal emoji for top 3, empty string with spacing for others
 */
function getMedalEmoji(rank: number): string {
  if (rank === 1) {
    return "🥇";
  }
  if (rank === 2) {
    return "🥈";
  }
  if (rank === 3) {
    return "🥉";
  }
  return "  "; // Two spaces for alignment
}

/**
 * Get human-readable description of criteria
 */
function getCriteriaDescription(
  criteria: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>["criteria"],
): string {
  return match(criteria)
    .with({ type: "MOST_GAMES_PLAYED" }, (c) => {
      const queue = formatQueueType(c.queue);
      return `Most games played in ${queue}`;
    })
    .with({ type: "HIGHEST_RANK" }, (c) => {
      const queue = c.queue === "SOLO" ? "Solo Queue" : "Flex Queue";
      return `Highest rank in ${queue}`;
    })
    .with({ type: "MOST_RANK_CLIMB" }, (c) => {
      const queue = c.queue === "SOLO" ? "Solo Queue" : "Flex Queue";
      return `Most rank climb in ${queue}`;
    })
    .with({ type: "MOST_WINS_PLAYER" }, (c) => {
      const queue = formatQueueType(c.queue);
      return `Most wins in ${queue}`;
    })
    .with({ type: "MOST_WINS_CHAMPION" }, (c) => {
      const queue = c.queue ? ` in ${formatQueueType(c.queue)}` : "";
      return `Most wins with Champion ${c.championId.toString()}${queue}`;
    })
    .with({ type: "HIGHEST_WIN_RATE" }, (c) => {
      const queue = formatQueueType(c.queue);
      return `Highest win rate in ${queue} (min ${c.minGames.toString()} games)`;
    })
    .exhaustive();
}

/**
 * Format queue type to human-readable string
 */
function formatQueueType(queue: string): string {
  return match(queue)
    .with("SOLO", () => "Solo Queue")
    .with("FLEX", () => "Flex Queue")
    .with("RANKED_ANY", () => "Ranked (Any)")
    .with("ARENA", () => "Arena")
    .with("ARAM", () => "ARAM")
    .with("ALL", () => "All Queues")
    .otherwise(() => queue);
}
