import type { MatchId } from "@scout-for-lol/data";
import { saveToS3 } from "@scout-for-lol/backend/storage/s3-helpers.js";

type MatchAnalysisS3Params = {
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  request: {
    prompt: string;
    matchData: unknown;
    laneContext: string;
    timelineSummary?: string | undefined;
    playerIndex: number;
    playerName: string;
    playerChampion?: string | undefined;
  };
  response: {
    analysis: string;
    durationMs: number;
    model: string;
  };
};

export async function saveMatchAnalysisToS3(params: MatchAnalysisS3Params): Promise<void> {
  const { matchId, queueType, trackedPlayerAliases, request, response } = params;

  const requestBody = JSON.stringify(request, null, 2);

  await saveToS3({
    matchId,
    assetType: "ai-match-analysis",
    extension: "request.json",
    body: requestBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-match-analysis-request",
      queueType,
      trackedPlayers: trackedPlayerAliases.join(", "),
      playerIndex: request.playerIndex.toString(),
      playerName: request.playerName,
      playerChampion: request.playerChampion ?? "unknown",
    },
    logEmoji: "🧠",
    logMessage: "Saving AI match analysis request to S3",
    errorContext: "ai match analysis request",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
    },
  });

  const responseBody = JSON.stringify(
    {
      ...response,
      generatedAt: new Date().toISOString(),
      analysisLength: response.analysis.length,
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    assetType: "ai-match-analysis",
    extension: "response.json",
    body: responseBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-match-analysis-response",
      queueType,
      durationMs: response.durationMs.toString(),
      model: response.model,
      trackedPlayers: trackedPlayerAliases.join(", "),
      playerIndex: request.playerIndex.toString(),
      playerName: request.playerName,
      analysisLength: response.analysis.length.toString(),
    },
    logEmoji: "📈",
    logMessage: "Saving AI match analysis response to S3",
    errorContext: "ai match analysis response",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      durationMs: response.durationMs,
      analysisLength: response.analysis.length,
    },
  });
}

type ImageDescriptionS3Params = {
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  request: {
    reviewText: string;
    reviewTextLength: number;
  };
  response: {
    imageDescription: string;
    durationMs: number;
    model: string;
  };
};

export async function saveImageDescriptionToS3(params: ImageDescriptionS3Params): Promise<void> {
  const { matchId, queueType, trackedPlayerAliases, request, response } = params;

  const requestBody = JSON.stringify(request, null, 2);

  await saveToS3({
    matchId,
    assetType: "ai-image-description",
    extension: "request.json",
    body: requestBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-image-description-request",
      queueType,
      trackedPlayers: trackedPlayerAliases.join(", "),
    },
    logEmoji: "🎨",
    logMessage: "Saving AI image description request to S3",
    errorContext: "ai image description request",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      reviewTextLength: request.reviewTextLength,
    },
  });

  const responseBody = JSON.stringify(
    {
      ...response,
      generatedAt: new Date().toISOString(),
      imageDescriptionLength: response.imageDescription.length,
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    assetType: "ai-image-description",
    extension: "response.json",
    body: responseBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-image-description-response",
      queueType,
      durationMs: response.durationMs.toString(),
      model: response.model,
      trackedPlayers: trackedPlayerAliases.join(", "),
      imageDescriptionLength: response.imageDescription.length.toString(),
    },
    logEmoji: "🖌️",
    logMessage: "Saving AI image description response to S3",
    errorContext: "ai image description response",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      durationMs: response.durationMs,
      imageDescriptionLength: response.imageDescription.length,
    },
  });
}

type ImageGenerationS3Params = {
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  request: {
    imageDescription: string;
    imageDescriptionLength: number;
    model: string;
  };
  response: {
    imageGenerated: boolean;
    durationMs: number;
    imageSizeBytes?: number;
  };
};

export async function saveImageGenerationToS3(params: ImageGenerationS3Params): Promise<void> {
  const { matchId, queueType, trackedPlayerAliases, request, response } = params;

  const requestBody = JSON.stringify(request, null, 2);

  await saveToS3({
    matchId,
    assetType: "ai-image-generation",
    extension: "request.json",
    body: requestBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-image-generation-request",
      queueType,
      trackedPlayers: trackedPlayerAliases.join(", "),
      model: request.model,
    },
    logEmoji: "🖼️",
    logMessage: "Saving AI image generation request to S3",
    errorContext: "ai image generation request",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      imageDescriptionLength: request.imageDescriptionLength,
      model: request.model,
    },
  });

  const responseBody = JSON.stringify(
    {
      ...response,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    assetType: "ai-image-generation",
    extension: "response.json",
    body: responseBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-image-generation-response",
      queueType,
      durationMs: response.durationMs.toString(),
      trackedPlayers: trackedPlayerAliases.join(", "),
      imageGenerated: response.imageGenerated.toString(),
      ...(response.imageSizeBytes !== undefined && { imageSizeBytes: response.imageSizeBytes.toString() }),
    },
    logEmoji: "📸",
    logMessage: "Saving AI image generation response to S3",
    errorContext: "ai image generation response",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      durationMs: response.durationMs,
      imageGenerated: response.imageGenerated,
      imageSizeBytes: response.imageSizeBytes,
    },
  });
}
