import { z } from "zod";
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
  MatchDto,
} from "@scout-for-lol/data";
import { MatchIdSchema, queueTypeToDisplayString, MatchDtoSchema } from "@scout-for-lol/data";
import { getPlayer } from "@scout-for-lol/backend/league/model/player.js";
import type { MessageCreateOptions } from "discord.js";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { matchToSvg, arenaMatchToSvg, svgToPng } from "@scout-for-lol/report";
import { saveMatchToS3, saveImageToS3, saveSvgToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { toMatch, toArenaMatch } from "@scout-for-lol/backend/league/model/match.js";
import { generateMatchReview } from "@scout-for-lol/backend/league/review/generator.js";
import { match } from "ts-pattern";

/**
 * Append review metadata as debug information
 */
function appendReviewMetadata(
  reviewText: string,
  metadata: { reviewerName: string; playerName: string; style?: string; themes?: string[] },
): string {
  const { reviewerName, playerName, style, themes } = metadata;
  const debugInfo = [
    "\n\n━━━━━━━━━━━━━━━━━━━━━━",
    "📊 **Review Metadata**",
    `👤 **Reviewer:** ${reviewerName}`,
    `🎮 **Player:** ${playerName}`,
  ];

  if (style) {
    debugInfo.push(`🎨 **Style:** ${style}`);
  }

  if (themes && themes.length > 0) {
    const themeText =
      themes.length === 1 && themes[0] ? `🎭 **Theme:** ${themes[0]}` : `🎭 **Themes:** ${themes.join(" × ")}`;
    debugInfo.push(themeText);
  }

  return reviewText + "\n" + debugInfo.join("\n");
}

/**
 * Fetch match data from Riot API
 *
 * Validates the response against our schema to ensure type safety and catch API changes.
 */
export async function fetchMatchData(matchId: MatchId, playerRegion: Region): Promise<MatchDto | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    console.log(`[fetchMatchData] 📥 Fetching match data for ${matchId}`);
    const response = await api.MatchV5.get(matchId, regionGroup);

    // Validate and parse the API response to ensure it matches our schema
    try {
      const validated = MatchDtoSchema.parse(response.response);
      return validated;
    } catch (parseError) {
      console.error(`[fetchMatchData] ❌ Match data validation failed for ${matchId}:`, parseError);
      console.error(`[fetchMatchData] This may indicate an API schema change or data corruption`);
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
    } else {
      console.error(`[fetchMatchData] ❌ Error fetching match ${matchId}:`, e);
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
    await saveImageToS3(matchId, image, queueTypeForStorage);
    await saveSvgToS3(matchId, svg, queueTypeForStorage);
  } catch (error) {
    console.error(`[createMatchImage] Failed to save images to S3:`, error);
  }

  // Convert Uint8Array to Buffer for Discord.js type compatibility
  // Using Bun's Buffer (not Node.js) - Discord.js types require Buffer, not Uint8Array
  // eslint-disable-next-line custom-rules/prefer-bun-apis -- Discord.js types require Buffer for type safety
  const buffer = Buffer.from(image);
  const attachment = new AttachmentBuilder(buffer).setName("match.png");
  if (!attachment.name) {
    throw new Error("[createMatchImage] Attachment name is null");
  }

  const embed = {
    image: {
      url: `attachment://${attachment.name}`,
    },
  };

  return [attachment, new EmbedBuilder(embed)];
}

/**
 * Generate a match report message for Discord
 *
 * @param matchData - The match data from Riot API
 * @param trackedPlayers - List of player configs to include in the match (should be in the match)
 * @returns MessageCreateOptions ready to send to Discord, or undefined if no tracked players found
 */
export async function generateMatchReport(
  matchData: MatchDto,
  trackedPlayers: PlayerConfigEntry[],
): Promise<MessageCreateOptions | undefined> {
  const matchId = MatchIdSchema.parse(matchData.metadata.matchId);
  console.log(`[generateMatchReport] 🎮 Generating report for match ${matchId}`);

  try {
    // Save match data to S3
    try {
      await saveMatchToS3(matchData);
    } catch (error) {
      console.error(`[generateMatchReport] Error saving match ${matchId} to S3:`, error);
      // Continue processing even if S3 storage fails
    }

    // Determine which tracked players are in this match
    const playersInMatch = trackedPlayers.filter((player) =>
      matchData.metadata.participants.includes(player.league.leagueAccount.puuid),
    );

    if (playersInMatch.length === 0) {
      console.log(`[generateMatchReport] ⚠️  No tracked players found in match ${matchId}`);
      return undefined;
    }

    console.log(
      `[generateMatchReport] 👥 Found ${playersInMatch.length.toString()} tracked player(s) in match: ${playersInMatch.map((p) => p.alias).join(", ")}`,
    );

    // Get full player data with ranks
    const players = await Promise.all(playersInMatch.map((playerConfig) => getPlayer(playerConfig)));

    // Process match based on queue type
    return await match<number, Promise<MessageCreateOptions>>(matchData.info.queueId)
      .with(1700, async (): Promise<MessageCreateOptions> => {
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
      })
      .otherwise(async (): Promise<MessageCreateOptions> => {
        console.log(`[generateMatchReport] ⚔️  Processing as standard match`);
        // Process match for all tracked players
        if (players.length === 0) {
          throw new Error("No player data available");
        }
        const completedMatch = toMatch(players, matchData, undefined, undefined);

        // Generate AI review (text and optional image) - only for ranked queues (solo/flex/clash)
        const isRankedQueue =
          completedMatch.queueType === "solo" ||
          completedMatch.queueType === "flex" ||
          completedMatch.queueType === "clash" ||
          completedMatch.queueType === "aram clash";
        let reviewText: string | undefined;
        let reviewImage: Uint8Array | undefined;
        if (isRankedQueue) {
          try {
            const review = await generateMatchReview(completedMatch, matchId, matchData);
            if (review) {
              reviewText = review.text;
              reviewImage = review.image;

              // Append debug metadata if available
              if (review.metadata) {
                reviewText = appendReviewMetadata(reviewText, review.metadata);
              }
            }
          } catch (error) {
            console.error(`[generateMatchReport] Error generating AI review:`, error);
          }
        } else {
          console.log(
            `[generateMatchReport] Skipping AI review - not a ranked solo/flex queue match (queueType: ${completedMatch.queueType ?? "unknown"})`,
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
          // eslint-disable-next-line custom-rules/prefer-bun-apis -- Discord.js types require Buffer for type safety
          const aiBuffer = Buffer.from(reviewImage);
          const aiImageAttachment = new AttachmentBuilder(aiBuffer).setName("ai-review.png");
          files.push(aiImageAttachment);
          console.log(`[generateMatchReport] ✨ Added AI-generated image to message`);
        }

        // Generate completion message
        const playerAliases = playersInMatch.map((p) => p.alias);
        const queueType = completedMatch.queueType ?? "custom";
        const completionMessage = formatGameCompletionMessage(playerAliases, queueType);

        // Combine completion message with review text if available
        let messageContent = completionMessage;
        if (reviewText && !reviewImage) {
          messageContent = `${completionMessage}\n\n${reviewText}`;
        }

        return {
          files: files,
          embeds: [matchReportEmbed],
          content: messageContent,
        };
      });
  } catch (error) {
    console.error(`[generateMatchReport] ❌ Error generating match report for ${matchId}:`, error);
    throw error;
  }
}
