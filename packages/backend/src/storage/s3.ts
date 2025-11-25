import type { MatchId, MatchDto } from "@scout-for-lol/data";
import { MatchIdSchema } from "@scout-for-lol/data";
import { saveToS3 } from "@scout-for-lol/backend/storage/s3-helpers.js";

/**
 * Save a League of Legends match to S3 storage
 * @param match The match data to save
 * @returns Promise that resolves when the match is saved
 */
export async function saveMatchToS3(match: MatchDto): Promise<void> {
  const matchId = MatchIdSchema.parse(match.metadata.matchId);
  const body = JSON.stringify(match, null, 2);

  await saveToS3({
    matchId,
    keyPrefix: "matches",
    keyExtension: "json",
    body,
    contentType: "application/json",
    metadata: {
      matchId: matchId,
      gameMode: match.info.gameMode,
      queueId: match.info.queueId.toString(),
      participantCount: match.info.participants.length.toString(),
      gameDuration: match.info.gameDuration.toString(),
    },
    logEmoji: "💾",
    logMessage: "Saving match to S3",
    errorContext: "match",
    returnUrl: false,
    additionalLogDetails: {
      participants: match.info.participants.length,
      gameMode: match.info.gameMode,
      gameDuration: match.info.gameDuration,
    },
  });
}

/**
 * Save a generated match image (PNG) to S3 storage
 * @param matchId The match ID
 * @param imageBuffer The PNG image buffer
 * @param queueType The queue type (for metadata)
 * @returns Promise that resolves to the S3 URL when the image is saved, or undefined if S3 is not configured
 */
export async function saveImageToS3(
  matchId: MatchId,
  imageBuffer: Uint8Array,
  queueType: string,
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    keyPrefix: "images",
    keyExtension: "png",
    body: imageBuffer,
    contentType: "image/png",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "png",
    },
    logEmoji: "🖼️",
    logMessage: "Saving PNG to S3",
    errorContext: "PNG",
    returnUrl: true,
    additionalLogDetails: {
      queueType,
    },
  });
}

/**
 * Save a generated match SVG to S3 storage
 * @param matchId The match ID
 * @param svgContent The SVG content string
 * @param queueType The queue type (for metadata)
 * @returns Promise that resolves to the S3 URL when the SVG is saved, or undefined if S3 is not configured
 */
export async function saveSvgToS3(
  matchId: MatchId,
  svgContent: string,
  queueType: string,
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    keyPrefix: "images",
    keyExtension: "svg",
    body: svgContent,
    contentType: "image/svg+xml",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "svg",
    },
    logEmoji: "📄",
    logMessage: "Saving SVG to S3",
    errorContext: "SVG",
    returnUrl: true,
    additionalLogDetails: {
      queueType,
    },
  });
}

/**
 * Save an AI-generated review image to S3 storage
 * @param matchId The match ID
 * @param imageBuffer The PNG image buffer
 * @param queueType The queue type (for metadata)
 * @returns Promise that resolves to the S3 URL when the image is saved, or undefined if S3 is not configured
 */
export async function saveAIReviewImageToS3(
  matchId: MatchId,
  imageBuffer: Uint8Array,
  queueType: string,
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    keyPrefix: "ai-reviews",
    keyExtension: "png",
    body: imageBuffer,
    contentType: "image/png",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "png",
      type: "ai-review",
    },
    logEmoji: "✨",
    logMessage: "Saving AI review image to S3",
    errorContext: "AI review image",
    returnUrl: true,
    additionalLogDetails: {
      queueType,
    },
  });
}
