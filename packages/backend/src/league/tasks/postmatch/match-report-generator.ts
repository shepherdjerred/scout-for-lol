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

      // Debug: Check if participants have puuid (they should)
      const firstParticipant = validated.info.participants[0];
      if (firstParticipant) {
        const hasPuuid = "puuid" in firstParticipant;
        console.log(`[debug][fetchMatchData] First participant has puuid:`, hasPuuid);
        if (hasPuuid) {
          console.log(`[debug][fetchMatchData] First participant puuid:`, firstParticipant.puuid);
        }
      }

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
    const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);
    await saveImageToS3(matchId, image, queueTypeForStorage, trackedPlayerAliases);
    await saveSvgToS3(matchId, svg, queueTypeForStorage, trackedPlayerAliases);
  } catch (error) {
    console.error(`[createMatchImage] Failed to save images to S3:`, error);
  }

  // Convert Uint8Array to Buffer for Discord.js type compatibility
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
    console.log(`[debug][generateMatchReport] Getting player data for ${playersInMatch.length.toString()} player(s)`);

    // Debug: Check playerConfigs before calling getPlayer
    for (let i = 0; i < playersInMatch.length; i++) {
      const playerConfig = playersInMatch[i];
      if (playerConfig) {
        console.log(`[debug][generateMatchReport] playersInMatch[${i.toString()}] keys:`, Object.keys(playerConfig));
        console.log(`[debug][generateMatchReport] playersInMatch[${i.toString()}] has puuid:`, "puuid" in playerConfig);
        if ("puuid" in playerConfig) {
          console.error(
            `[debug][generateMatchReport] ⚠️  ERROR: playersInMatch[${i.toString()}] has puuid at top level!`,
            JSON.stringify(playerConfig, null, 2),
          );
        }
      }
    }

    const players = await Promise.all(playersInMatch.map((playerConfig) => getPlayer(playerConfig)));
    console.log(`[debug][generateMatchReport] Got ${players.length.toString()} player(s)`);
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player) {
        console.log(`[debug][generateMatchReport] Player ${i.toString()} keys:`, Object.keys(player));
        if ("puuid" in player) {
          console.error(`[debug][generateMatchReport] ⚠️  WARNING: Player ${i.toString()} has puuid field!`, player);
        }
        if ("puuid" in player.config) {
          console.error(
            `[debug][generateMatchReport] ⚠️  WARNING: Player ${i.toString()}.config has puuid field!`,
            player.config,
          );
        }
      }
    }

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
        console.log(`[debug][generateMatchReport] Calling toMatch with ${players.length.toString()} player(s)`);
        const completedMatch = toMatch(players, matchData, undefined, undefined);
        console.log(
          `[debug][generateMatchReport] toMatch returned match with ${completedMatch.players.length.toString()} player(s)`,
        );
        for (let i = 0; i < completedMatch.players.length; i++) {
          const playerObj = completedMatch.players[i];
          if (playerObj) {
            console.log(
              `[debug][generateMatchReport] CompletedMatch.players[${i.toString()}] keys:`,
              Object.keys(playerObj),
            );
            if ("puuid" in playerObj) {
              console.error(
                `[debug][generateMatchReport] ⚠️  ERROR: CompletedMatch.players[${i.toString()}] has puuid field!`,
                playerObj,
              );
            }
          }
        }

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
