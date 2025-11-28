import type { MatchId, MatchDto, ReviewTextMetadata, TimelineDto } from "@scout-for-lol/data";
import { MatchIdSchema } from "@scout-for-lol/data";
import { saveToS3 } from "@scout-for-lol/backend/storage/s3-helpers.js";

/**
 * Save a League of Legends match to S3 storage
 * @param match The match data to save
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves when the match is saved
 */
export async function saveMatchToS3(match: MatchDto, trackedPlayerAliases: string[]): Promise<void> {
  const matchId = MatchIdSchema.parse(match.metadata.matchId);
  const body = JSON.stringify(match, null, 2);

  await saveToS3({
    matchId,
    assetType: "match",
    extension: "json",
    body,
    contentType: "application/json",
    metadata: {
      matchId: matchId,
      gameMode: match.info.gameMode,
      queueId: match.info.queueId.toString(),
      participantCount: match.info.participants.length.toString(),
      gameDuration: match.info.gameDuration.toString(),
      gameVersion: match.info.gameVersion,
      result: match.info.endOfGameResult,
      map: match.info.mapId.toString(),
      dataVersion: match.metadata.dataVersion,
      gameType: match.info.gameType,
      trackedPlayers: trackedPlayerAliases.join(", "),
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
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves to the S3 URL when the image is saved, or undefined if S3 is not configured
 */
export async function saveImageToS3(
  matchId: MatchId,
  imageBuffer: Uint8Array,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    assetType: "report",
    extension: "png",
    body: imageBuffer,
    contentType: "image/png",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "png",
      trackedPlayers: trackedPlayerAliases.join(", "),
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
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves to the S3 URL when the SVG is saved, or undefined if S3 is not configured
 */
export async function saveSvgToS3(
  matchId: MatchId,
  svgContent: string,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    assetType: "report",
    extension: "svg",
    body: svgContent,
    contentType: "image/svg+xml",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "svg",
      trackedPlayers: trackedPlayerAliases.join(", "),
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
 * Save an AI-generated review text to S3 storage
 * @param matchId The match ID
 * @param reviewText The review text content
 * @param queueType The queue type (for metadata)
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves to the S3 URL when the text is saved, or undefined if S3 is not configured
 */
export async function saveAIReviewTextToS3(
  matchId: MatchId,
  reviewText: string,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    assetType: "ai-review",
    extension: "txt",
    body: reviewText,
    contentType: "text/plain",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "txt",
      type: "ai-review",
      trackedPlayers: trackedPlayerAliases.join(", "),
    },
    logEmoji: "📝",
    logMessage: "Saving AI review text to S3",
    errorContext: "AI review text",
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
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves to the S3 URL when the image is saved, or undefined if S3 is not configured
 */
export async function saveAIReviewImageToS3(
  matchId: MatchId,
  imageBuffer: Uint8Array,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<string | undefined> {
  return saveToS3({
    matchId,
    assetType: "ai-review-image",
    extension: "png",
    body: imageBuffer,
    contentType: "image/png",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "png",
      type: "ai-review",
      trackedPlayers: trackedPlayerAliases.join(", "),
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

/**
 * Save an AI review request (prompts and parameters) to S3 storage
 * @param matchId The match ID
 * @param textMetadata The metadata from the text generation including prompts and params
 * @param queueType The queue type (for metadata)
 * @param trackedPlayerAliases Array of tracked player aliases in this match (empty array if none)
 * @returns Promise that resolves to the S3 URL when saved, or undefined if S3 is not configured
 */
export async function saveAIReviewRequestToS3(
  matchId: MatchId,
  textMetadata: ReviewTextMetadata,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<string | undefined> {
  const requestData = {
    systemPrompt: textMetadata.systemPrompt,
    userPrompt: textMetadata.userPrompt,
    model: textMetadata.openaiRequestParams?.model,
    maxTokens: textMetadata.openaiRequestParams?.max_completion_tokens,
    temperature: textMetadata.openaiRequestParams?.temperature,
    topP: textMetadata.openaiRequestParams?.top_p,
    selectedPersonality: textMetadata.selectedPersonality,
    reviewerName: textMetadata.reviewerName,
    playerName: textMetadata.playerName,
    textTokensPrompt: textMetadata.textTokensPrompt,
    textTokensCompletion: textMetadata.textTokensCompletion,
    textDurationMs: textMetadata.textDurationMs,
  };

  const body = JSON.stringify(requestData, null, 2);

  return saveToS3({
    matchId,
    assetType: "ai-request",
    extension: "json",
    body,
    contentType: "application/json",
    metadata: {
      matchId: matchId,
      queueType: queueType,
      format: "json",
      type: "ai-request",
      model: textMetadata.openaiRequestParams?.model ?? "unknown",
      maxTokens: String(textMetadata.openaiRequestParams?.max_completion_tokens ?? "unknown"),
      personality: textMetadata.selectedPersonality ?? "unknown",
      reviewerName: textMetadata.reviewerName,
      playerName: textMetadata.playerName,
      trackedPlayers: trackedPlayerAliases.join(", "),
    },
    logEmoji: "📤",
    logMessage: "Saving AI review request to S3",
    errorContext: "AI review request",
    returnUrl: true,
    additionalLogDetails: {
      queueType,
      model: textMetadata.openaiRequestParams?.model,
      maxTokens: textMetadata.openaiRequestParams?.max_completion_tokens,
    },
  });
}

type TimelineSummaryS3Params = {
  matchId: MatchId;
  timelineDto: TimelineDto;
  prompt: string;
  summary: string;
  durationMs: number;
};

/**
 * Save timeline summary request and response to S3 storage
 * @param params The parameters for saving
 * @returns Promise that resolves when both files are saved
 */
export async function saveTimelineSummaryToS3(params: TimelineSummaryS3Params): Promise<void> {
  const { matchId, timelineDto, prompt, summary, durationMs } = params;
  // Save the request (timeline + prompt)
  const requestBody = JSON.stringify(
    {
      prompt,
      timeline: timelineDto,
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    assetType: "timeline-summary",
    extension: "request.json",
    body: requestBody,
    contentType: "application/json",
    metadata: {
      matchId: matchId,
      type: "timeline-summary-request",
      frameCount: timelineDto.info.frames.length.toString(),
    },
    logEmoji: "📊",
    logMessage: "Saving timeline summary request to S3",
    errorContext: "timeline summary request",
    returnUrl: false,
    additionalLogDetails: {
      frameCount: timelineDto.info.frames.length,
    },
  });

  // Save the response (summary)
  const responseBody = JSON.stringify(
    {
      summary,
      durationMs,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    assetType: "timeline-summary",
    extension: "response.json",
    body: responseBody,
    contentType: "application/json",
    metadata: {
      matchId: matchId,
      type: "timeline-summary-response",
      durationMs: durationMs.toString(),
      summaryLength: summary.length.toString(),
    },
    logEmoji: "📝",
    logMessage: "Saving timeline summary response to S3",
    errorContext: "timeline summary response",
    returnUrl: false,
    additionalLogDetails: {
      durationMs,
      summaryLength: summary.length,
    },
  });
}
