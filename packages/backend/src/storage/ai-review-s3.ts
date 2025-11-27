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
    keyPrefix: "ai-match-analyses",
    keyExtension: "request.json",
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
    keyPrefix: "ai-match-analyses",
    keyExtension: "response.json",
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

type ArtPromptS3Params = {
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  request: {
    reviewText: string;
    reviewTextLength: number;
    artStyle: string;
    artThemes: string[];
  };
  response: {
    artPrompt: string;
    durationMs: number;
    model: string;
  };
};

export async function saveArtPromptToS3(params: ArtPromptS3Params): Promise<void> {
  const { matchId, queueType, trackedPlayerAliases, request, response } = params;

  const requestBody = JSON.stringify(request, null, 2);

  await saveToS3({
    matchId,
    keyPrefix: "ai-art-prompts",
    keyExtension: "request.json",
    body: requestBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-art-prompt-request",
      queueType,
      trackedPlayers: trackedPlayerAliases.join(", "),
      artStyle: request.artStyle,
      artThemes: request.artThemes.join(", "),
    },
    logEmoji: "🎨",
    logMessage: "Saving AI art prompt request to S3",
    errorContext: "ai art prompt request",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      artStyle: request.artStyle,
      artThemes: request.artThemes,
    },
  });

  const responseBody = JSON.stringify(
    {
      ...response,
      generatedAt: new Date().toISOString(),
      artPromptLength: response.artPrompt.length,
    },
    null,
    2,
  );

  await saveToS3({
    matchId,
    keyPrefix: "ai-art-prompts",
    keyExtension: "response.json",
    body: responseBody,
    contentType: "application/json",
    metadata: {
      matchId,
      type: "ai-art-prompt-response",
      queueType,
      durationMs: response.durationMs.toString(),
      model: response.model,
      trackedPlayers: trackedPlayerAliases.join(", "),
      artStyle: request.artStyle,
      artThemes: request.artThemes.join(", "),
      artPromptLength: response.artPrompt.length.toString(),
    },
    logEmoji: "🖌️",
    logMessage: "Saving AI art prompt response to S3",
    errorContext: "ai art prompt response",
    returnUrl: false,
    additionalLogDetails: {
      queueType,
      durationMs: response.durationMs,
      artPromptLength: response.artPrompt.length,
    },
  });
}
