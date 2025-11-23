import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import { api } from "../../api/api.js";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "../../model/region.js";
import type { PlayerConfigEntry, Region, MatchId, CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import { MatchIdSchema } from "@scout-for-lol/data";
import { getPlayer } from "../../model/player.js";
import { AttachmentBuilder, EmbedBuilder, MessageCreateOptions } from "discord.js";
import { matchToSvg, arenaMatchToSvg, svgToPng } from "@scout-for-lol/report";
import { saveMatchToS3, saveImageToS3, saveSvgToS3 } from "../../../storage/s3.js";
import { toMatch, toArenaMatch } from "../../model/match.js";
import { generateMatchReview } from "../../review/generator.js";

/**
 * Fetch match data from Riot API
 */
export async function fetchMatchData(
  matchId: MatchId,
  playerRegion: Region,
): Promise<MatchV5DTOs.MatchDto | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    console.log(`[fetchMatchData] 📥 Fetching match data for ${matchId}`);
    const response = await api.MatchV5.get(matchId, regionGroup);

    return response.response;
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
 * Create image attachments for Discord message
 */
export async function createMatchImage(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
): Promise<[AttachmentBuilder, EmbedBuilder]> {
  const isArena = match.queueType === "arena";
  const svg = isArena ? await arenaMatchToSvg(match) : await matchToSvg(match);
  const image = await svgToPng(svg);

  // Save both PNG and SVG to S3
  try {
    const queueTypeForStorage = isArena ? "arena" : (match.queueType ?? "unknown");
    await saveImageToS3(matchId, image, queueTypeForStorage);
    await saveSvgToS3(matchId, svg, queueTypeForStorage);
  } catch (error) {
    console.error(`[createMatchImage] Failed to save images to S3:`, error);
  }

  const attachment = new AttachmentBuilder(image).setName("match.png");
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
  matchData: MatchV5DTOs.MatchDto,
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

    // Check if it's an arena match
    const isArena = matchData.info.queueId === 1700;

    if (isArena) {
      console.log(`[generateMatchReport] 🎯 Processing as arena match`);
      const arenaMatch = await toArenaMatch(players, matchData);

      // Create Discord message for arena
      const [attachment, embed] = await createMatchImage(arenaMatch, matchId);

      return {
        files: [attachment],
        embeds: [embed],
      };
      // TODO: use ts-pattern for exhaustive match
    } else {
      console.log(`[generateMatchReport] ⚔️  Processing as standard match`);
      // Process match for all tracked players
      if (players.length === 0) {
        throw new Error("No player data available");
      }
      const completedMatch = toMatch(players, matchData, undefined, undefined);

      // Generate AI review (text and optional image)
      let reviewText: string | undefined;
      let reviewImage: Buffer | undefined;
      try {
        const review = await generateMatchReview(completedMatch, matchId, matchData);
        reviewText = review.text;
        reviewImage = review.image;

        // Append debug metadata if available
        if (review.metadata) {
          const { reviewerName, playerName, style, themes } = review.metadata;
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
            if (themes.length === 1) {
              const theme = themes[0];
              if (theme) {
                debugInfo.push(`🎭 **Theme:** ${theme}`);
              }
            } else {
              debugInfo.push(`🎭 **Themes:** ${themes.join(" × ")}`);
            }
          }

          reviewText = reviewText + "\n" + debugInfo.join("\n");
        }
      } catch (error) {
        console.error(`[generateMatchReport] Error generating AI review:`, error);
      }

      // Create Discord message
      const [matchReportAttachment, matchReportEmbed] = await createMatchImage(completedMatch, matchId);

      // Build files array - start with match report image
      const files = [matchReportAttachment];

      // Add AI-generated image if available
      if (reviewImage) {
        const aiImageAttachment = new AttachmentBuilder(reviewImage).setName("ai-review.png");
        files.push(aiImageAttachment);
        console.log(`[generateMatchReport] ✨ Added AI-generated image to message`);
      }

      return {
        files: files,
        embeds: [matchReportEmbed],
        ...(reviewText && { content: reviewText }),
      };
    }
  } catch (error) {
    console.error(`[generateMatchReport] ❌ Error generating match report for ${matchId}:`, error);
    throw error;
  }
}
