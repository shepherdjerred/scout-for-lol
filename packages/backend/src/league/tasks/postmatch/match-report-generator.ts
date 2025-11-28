import { z } from "zod";
import * as Sentry from "@sentry/node";
import { api } from "@scout-for-lol/backend/league/api/api.js";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "@scout-for-lol/backend/league/model/region.js";
import type {
  PlayerConfigEntry,
  Region,
  MatchId,
  CompletedMatch,
  ArenaMatch,
  QueueType,
  RawMatch,
  RawTimeline,
} from "@scout-for-lol/data";
import { MatchIdSchema, queueTypeToDisplayString, RawMatchSchema, RawTimelineSchema } from "@scout-for-lol/data";
import { getPlayer } from "@scout-for-lol/backend/league/model/player.js";
import type { MessageCreateOptions } from "discord.js";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { matchToSvg, arenaMatchToSvg, svgToPng } from "@scout-for-lol/report";
import { saveMatchToS3, saveImageToS3, saveSvgToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { toMatch, toArenaMatch } from "@scout-for-lol/backend/league/model/match.js";
import { generateMatchReview } from "@scout-for-lol/backend/mastra/index.js";
import { match } from "ts-pattern";
import { logErrorDetails } from "./match-report-debug.js";

/** Helper to capture exceptions with source and match context */
function captureError(error: unknown, source: string, matchId?: string, extra?: Record<string, string>): void {
  Sentry.captureException(error, { tags: { source, ...(matchId && { matchId }), ...extra } });
}


/**
 * Fetch match data from Riot API
 *
 * Validates the response against our schema to ensure type safety and catch API changes.
 */
export async function fetchMatchData(matchId: MatchId, playerRegion: Region): Promise<RawMatch | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    console.log(`[fetchMatchData] 📥 Fetching match data for ${matchId}`);
    const response = await api.MatchV5.get(matchId, regionGroup);

    // Validate and parse the API response to ensure it matches our schema
    try {
      const validated = RawMatchSchema.parse(response.response);
      return validated;
    } catch (parseError) {
      console.error(`[fetchMatchData] ❌ Match data validation failed for ${matchId}:`, parseError);
      console.error(`[fetchMatchData] This may indicate an API schema change or data corruption`);
      captureError(parseError, "match-data-validation", matchId);
      console.error(`[fetchMatchData] 🔍 Raw API response:`, JSON.stringify(response.response, null, 2));
      return undefined;
    }
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(`[fetchMatchData] ℹ️  Match ${matchId} not found (404) - may still be processing`);
        return undefined;
      }
      console.error(`[fetchMatchData] ❌ HTTP Error ${result.data.status.toString()} for match ${matchId}`);
      captureError(e, "match-data-fetch", matchId, { httpStatus: result.data.status.toString() });
    } else {
      console.error(`[fetchMatchData] ❌ Error fetching match ${matchId}:`, e);
      captureError(e, "match-data-fetch", matchId);
    }
    return undefined;
  }
}

/**
 * Fetch match timeline data from Riot API
 *
 * The timeline provides frame-by-frame game data including:
 * - Participant stats evolution (gold, XP, position)
 * - Game events (kills, item purchases, objectives, etc.)
 *
 * Validates the response against our schema to ensure type safety and catch API changes.
 */
export async function fetchMatchTimeline(matchId: MatchId, playerRegion: Region): Promise<RawTimeline | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    console.log(`[fetchMatchTimeline] 📥 Fetching timeline data for ${matchId}`);

    // Use the timeline endpoint from the twisted library
    // The twisted library provides api.MatchV5.timeline() for Match V5 Timeline API
    const response = await api.MatchV5.timeline(matchId, regionGroup);

    // Validate and parse the API response to ensure it matches our schema
    try {
      const validated = RawTimelineSchema.parse(response.response);
      console.log(`[fetchMatchTimeline] ✅ Timeline validated with ${validated.info.frames.length.toString()} frames`);
      return validated;
    } catch (parseError) {
      console.error(`[fetchMatchTimeline] ❌ Timeline data validation failed for ${matchId}:`, parseError);
      console.error(`[fetchMatchTimeline] This may indicate an API schema change or data corruption`);
      captureError(parseError, "timeline-data-validation", matchId);
      return undefined;
    }
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(`[fetchMatchTimeline] ℹ️  Timeline ${matchId} not found (404) - may still be processing`);
        return undefined;
      }
      console.error(`[fetchMatchTimeline] ❌ HTTP Error ${result.data.status.toString()} for timeline ${matchId}`);
      captureError(e, "timeline-data-fetch", matchId, { httpStatus: result.data.status.toString() });
    } else {
      console.error(`[fetchMatchTimeline] ❌ Error fetching timeline ${matchId}:`, e);
      captureError(e, "timeline-data-fetch", matchId);
    }
    return undefined;
  }
}

/**
 * Format a natural language message about who finished the game
 */
function formatGameCompletionMessage(playerAliases: string[], queueType: QueueType): string {
  const queueName = queueTypeToDisplayString(queueType);

  if (playerAliases.length === 1) {
    const player = playerAliases[0];
    if (player === undefined) {
      return `Game finished: ${queueName}`;
    }
    return `${player} finished a ${queueName} game`;
  } else if (playerAliases.length === 2) {
    const player1 = playerAliases[0];
    const player2 = playerAliases[1];
    if (player1 === undefined || player2 === undefined) {
      return `Game finished: ${queueName}`;
    }
    return `${player1} and ${player2} finished a ${queueName} game`;
  } else if (playerAliases.length >= 3) {
    const allButLast = playerAliases.slice(0, -1).join(", ");
    const last = playerAliases[playerAliases.length - 1];
    if (last === undefined) {
      return `Game finished: ${queueName}`;
    }
    return `${allButLast}, and ${last} finished a ${queueName} game`;
  }

  // Fallback (shouldn't happen)
  return `Game finished: ${queueName}`;
}

/**
 * Create image attachments for Discord message
 */
async function createMatchImage(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  let svg: string;
  try {
    let svgData: string;
    if (match.queueType === "arena") {
      const arenaMatch: ArenaMatch = match;
      svgData = await arenaMatchToSvg(arenaMatch);
    } else {
      const completedMatch: CompletedMatch = match;
      svgData = await matchToSvg(completedMatch);
    }
    const SvgSchema = z.string();
    svg = SvgSchema.parse(svgData);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[createMatchImage] Failed to generate SVG:`, error);
      throw error;
    }
    const wrappedError = new Error(String(error));
    console.error(`[createMatchImage] Failed to generate SVG:`, wrappedError);
    throw wrappedError;
  }

  let image: Uint8Array;
  try {
    const imageData = await svgToPng(svg);
    const ImageSchema = z.instanceof(Uint8Array);
    image = ImageSchema.parse(imageData);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[createMatchImage] Failed to convert SVG to PNG:`, error);
      throw error;
    }
    const wrappedError = new Error(String(error));
    console.error(`[createMatchImage] Failed to convert SVG to PNG:`, wrappedError);
    throw wrappedError;
  }

  // Save both PNG and SVG to S3
  try {
    const queueTypeForStorage = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
    const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);
    await saveImageToS3(matchId, image, queueTypeForStorage, trackedPlayerAliases);
    await saveSvgToS3(matchId, svg, queueTypeForStorage, trackedPlayerAliases);
  } catch (error) {
    console.error(`[createMatchImage] Failed to save images to S3:`, error);
  }

  // Convert Uint8Array to Buffer for Discord.js type compatibility
  const buffer = Buffer.from(image);
  const attachmentName = `${matchId}.png`;
  const attachment = new AttachmentBuilder(buffer).setName(attachmentName);
  if (!attachment.name) {
    throw new Error("[createMatchImage] Attachment name is null");
  }

  const embed = {
    image: {
      url: `attachment://${attachmentName}`,
    },
  };

  return [attachment, new EmbedBuilder(embed)];
}

/**
 * Check if queue type is ranked
 */
function isRankedQueue(queueType: QueueType | undefined): boolean {
  return queueType === "solo" || queueType === "flex" || queueType === "clash" || queueType === "aram clash";
}

/**
 * Check if Jerred is in the match
 */
function hasJerred(playersInMatch: PlayerConfigEntry[]): boolean {
  return playersInMatch.some((p) => p.alias.toLowerCase() === "jerred");
}

/**
 * Process arena match and generate Discord message
 */
async function processArenaMatch(
  players: Awaited<ReturnType<typeof getPlayer>>[],
  matchData: RawMatch,
  matchId: MatchId,
  playersInMatch: PlayerConfigEntry[],
): Promise<MessageCreateOptions> {
  console.log(`[generateMatchReport] 🎯 Processing as arena match`);
  const arenaMatch = await toArenaMatch(players, matchData);

  // Create Discord message for arena
  const [attachment, embed] = await createMatchImage(arenaMatch, matchId);

  // Generate completion message
  const playerAliases = playersInMatch.map((p) => p.alias);
  const completionMessage = formatGameCompletionMessage(playerAliases, arenaMatch.queueType);

  return {
    content: completionMessage,
    files: [attachment],
    embeds: [embed],
  };
}

type StandardMatchContext = {
  players: Awaited<ReturnType<typeof getPlayer>>[];
  matchData: RawMatch;
  matchId: MatchId;
  playersInMatch: PlayerConfigEntry[];
  timelineData: RawTimeline | undefined;
};

/**
 * Process standard match and generate Discord message
 */
async function processStandardMatch(ctx: StandardMatchContext): Promise<MessageCreateOptions> {
  const { players, matchData, matchId, playersInMatch, timelineData } = ctx;
  console.log(`[generateMatchReport] ⚔️  Processing as standard match`);
  // Process match for all tracked players
  if (players.length === 0) {
    throw new Error("No player data available");
  }
  const completedMatch = toMatch(players, matchData, undefined, undefined);

  // Generate AI review (text and optional image) - for ranked queues or matches with Jerred
  let reviewText: string | undefined;
  let reviewImage: Uint8Array | undefined;
  const shouldGenerateReview = isRankedQueue(completedMatch.queueType) || hasJerred(playersInMatch);
  if (shouldGenerateReview) {
    try {
      const review = await generateMatchReview(completedMatch, matchId, matchData, timelineData);
      if (review) {
        reviewText = review.text;
        reviewImage = review.image;

      }
    } catch (error) {
      console.error(`[generateMatchReport] Error generating AI review:`, error);
      captureError(error, "ai-review-generation", matchId, { queueType: completedMatch.queueType ?? "unknown" });
    }
  } else {
    console.log(
      `[generateMatchReport] Skipping AI review - not a ranked queue and Jerred not in match (queueType: ${completedMatch.queueType ?? "unknown"})`,
    );
  }

  // Create Discord message
  const [matchReportAttachment, matchReportEmbed] = await createMatchImage(completedMatch, matchId);

  // Build files array - start with match report image
  const files = [matchReportAttachment];

  // Add AI-generated image if available
  if (reviewImage) {
    // Convert Uint8Array to Buffer for Discord.js type compatibility
    // Using Bun's Buffer (not Node.js) - Discord.js types require Buffer, not Uint8Array
    const aiBuffer = Buffer.from(reviewImage);
    const aiImageAttachment = new AttachmentBuilder(aiBuffer).setName("ai-review.png");
    files.push(aiImageAttachment);
    console.log(`[generateMatchReport] ✨ Added AI-generated image to message`);
  }

  // Generate completion message
  const playerAliases = playersInMatch.map((p) => p.alias);
  const queueType = completedMatch.queueType ?? "custom";
  const completionMessage = formatGameCompletionMessage(playerAliases, queueType);

  // Combine completion message with review text if available (always include text, even with image)
  let messageContent = completionMessage;
  if (reviewText) {
    messageContent = `${completionMessage}\n\n${reviewText}`;
  }

  return {
    files: files,
    embeds: [matchReportEmbed],
    content: messageContent,
  };
}

/**
 * Fetch timeline data for standard (non-arena) matches
 * Returns undefined for arena matches or if timeline fetch fails
 */
async function fetchTimelineIfStandardMatch(
  matchData: RawMatch,
  matchId: MatchId,
  playersInMatch: PlayerConfigEntry[],
): Promise<RawTimeline | undefined> {
  // Don't fetch timeline for arena matches
  if (matchData.info.queueId === 1700) {
    return undefined;
  }

  const firstPlayer = playersInMatch[0];
  if (!firstPlayer) {
    return undefined;
  }

  const playerRegion = firstPlayer.league.leagueAccount.region;
  try {
    console.log(`[generateMatchReport] 📊 Fetching timeline data for match ${matchId}`);
    const timelineData = await fetchMatchTimeline(matchId, playerRegion);
    if (timelineData) {
      console.log(
        `[generateMatchReport] ✅ Timeline fetched with ${timelineData.info.frames.length.toString()} frames`,
      );
    }
    return timelineData;
  } catch (error) {
    console.error(`[generateMatchReport] ⚠️  Failed to fetch timeline, continuing without it:`, error);
    captureError(error, "timeline-fetch-wrapper", matchId);
    return undefined;
  }
}

/**
 * Generate a match report message for Discord
 *
 * @param matchData - The match data from Riot API
 * @param trackedPlayers - List of player configs to include in the match (should be in the match)
 * @returns MessageCreateOptions ready to send to Discord, or undefined if no tracked players found
 */
export async function generateMatchReport(
  matchData: RawMatch,
  trackedPlayers: PlayerConfigEntry[],
): Promise<MessageCreateOptions | undefined> {
  const matchId = MatchIdSchema.parse(matchData.metadata.matchId);
  console.log(`[generateMatchReport] 🎮 Generating report for match ${matchId}`);

  try {
    // Determine which tracked players are in this match
    const playersInMatch = trackedPlayers.filter((player) =>
      matchData.metadata.participants.includes(player.league.leagueAccount.puuid),
    );

    // Save match data to S3 (with tracked player aliases if any)
    try {
      const trackedPlayerAliases = playersInMatch.map((p) => p.alias);
      await saveMatchToS3(matchData, trackedPlayerAliases);
    } catch (error) {
      console.error(`[generateMatchReport] Error saving match ${matchId} to S3:`, error);
      // Continue processing even if S3 storage fails
    }

    if (playersInMatch.length === 0) {
      console.log(`[generateMatchReport] ⚠️  No tracked players found in match ${matchId}`);
      return undefined;
    }

    console.log(
      `[generateMatchReport] 👥 Found ${playersInMatch.length.toString()} tracked player(s) in match: ${playersInMatch.map((p) => p.alias).join(", ")}`,
    );

    // Get full player data with ranks
    const players = await Promise.all(playersInMatch.map((playerConfig) => getPlayer(playerConfig)));

    // Fetch timeline data for standard matches (to provide game progression context for AI reviews)
    const timelineData = await fetchTimelineIfStandardMatch(matchData, matchId, playersInMatch);

    // Process match based on queue type
    return await match<number, Promise<MessageCreateOptions>>(matchData.info.queueId)
      .with(1700, () => processArenaMatch(players, matchData, matchId, playersInMatch))
      .otherwise(() => processStandardMatch({ players, matchData, matchId, playersInMatch, timelineData }));
  } catch (error) {
    logErrorDetails(error, matchId, matchData, trackedPlayers);
    throw error;
  }
}
