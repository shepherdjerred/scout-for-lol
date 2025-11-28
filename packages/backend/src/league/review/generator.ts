import {
  type RawMatch,
  type RawTimeline,
  generateReviewText,
  type ArenaMatch,
  type CompletedMatch,
  type MatchId,
  selectRandomStyleAndTheme,
  curateMatchData,
  type CuratedMatchData,
  type ReviewTextMetadata,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import {
  saveAIReviewTextToS3,
  saveAIReviewRequestToS3,
  saveComprehensiveDebugToS3,
  type ComprehensiveDebugData,
} from "@scout-for-lol/backend/storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
} from "@scout-for-lol/backend/league/review/prompts.js";
import { getOpenAIClient } from "@scout-for-lol/backend/league/review/ai-clients.js";
import { summarizeTimeline } from "@scout-for-lol/backend/league/review/timeline-summary.js";
import { analyzeMatchData } from "@scout-for-lol/backend/league/review/ai-analysis.js";
import { generateArtPromptFromReview } from "@scout-for-lol/backend/league/review/ai-art.js";
import { generateReviewImageBackend } from "@scout-for-lol/backend/league/review/image-backend.js";

/**
 * Metadata about the generated review
 */
export type ReviewMetadata = {
  reviewerName: string;
  playerName: string;
  style?: string;
  themes?: string[];
};

type PlayerContext = {
  playerIndex: number;
  playerName: string;
  laneContext: string;
  playerMeta: PlayerMetadata;
};

type DebugDataParams = {
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  personality: Personality;
  playerContext: PlayerContext;
  match: CompletedMatch | ArenaMatch;
  curatedData?: CuratedMatchData;
  matchAnalysis?: string;
  textMetadata: ReviewTextMetadata;
  reviewText: string;
  style: string;
  themes: string[];
  artPrompt?: string;
  reviewImage?: Uint8Array;
};

type SaveReviewDataParams = {
  matchId: MatchId;
  reviewText: string;
  textMetadata: ReviewTextMetadata;
  queueType: string;
  trackedPlayerAliases: string[];
};

async function saveReviewDataToS3(params: SaveReviewDataParams): Promise<void> {
  const { matchId, reviewText, textMetadata, queueType, trackedPlayerAliases } = params;
  try {
    await saveAIReviewTextToS3(matchId, reviewText, queueType, trackedPlayerAliases);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[generateMatchReview] Failed to save review text to S3:", err);
  }

  try {
    await saveAIReviewRequestToS3(matchId, textMetadata, queueType, trackedPlayerAliases);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[generateMatchReview] Failed to save AI request to S3:", err);
  }
}

function buildComprehensiveDebugData(params: DebugDataParams): ComprehensiveDebugData {
  const {
    matchId,
    queueType,
    trackedPlayerAliases,
    personality,
    playerContext,
    match,
    curatedData,
    matchAnalysis,
    textMetadata,
    reviewText,
    style,
    themes,
    artPrompt,
    reviewImage,
  } = params;

  const player = match.players[playerContext.playerIndex];

  return {
    matchId,
    generatedAt: new Date().toISOString(),
    queueType,
    trackedPlayerAliases,
    personality: {
      filename: personality.filename ?? "unknown",
      name: personality.metadata.name,
      description: personality.metadata.description,
      favoriteChampions: personality.metadata.favoriteChampions,
      favoriteLanes: personality.metadata.favoriteLanes,
    },
    selectedPlayer: {
      playerIndex: playerContext.playerIndex,
      playerName: playerContext.playerName,
      ...(player?.champion.championName !== undefined && { champion: player.champion.championName }),
      ...(match.queueType !== "arena" &&
        player &&
        "lane" in player &&
        typeof player.lane === "string" && { lane: player.lane }),
      laneContext: playerContext.laneContext,
      playerMetadata: playerContext.playerMeta,
    },
    curatedData: curatedData,
    ...(curatedData?.timelineSummary !== undefined && {
      timelineSummary: {
        summary: curatedData.timelineSummary,
      },
    }),
    ...(matchAnalysis !== undefined && {
      matchAnalysis: {
        analysis: matchAnalysis,
        model: "gpt-4o-mini",
      },
    }),
    reviewTextGeneration: {
      systemPrompt: textMetadata.systemPrompt,
      userPrompt: textMetadata.userPrompt,
      ...(textMetadata.openaiRequestParams?.model !== undefined && { model: textMetadata.openaiRequestParams.model }),
      ...(textMetadata.openaiRequestParams?.max_completion_tokens !== undefined && {
        maxTokens: textMetadata.openaiRequestParams.max_completion_tokens,
      }),
      ...(textMetadata.openaiRequestParams?.temperature !== undefined && {
        temperature: textMetadata.openaiRequestParams.temperature,
      }),
      response: reviewText,
      ...(textMetadata.textTokensPrompt !== undefined && { tokensPrompt: textMetadata.textTokensPrompt }),
      ...(textMetadata.textTokensCompletion !== undefined && { tokensCompletion: textMetadata.textTokensCompletion }),
      durationMs: textMetadata.textDurationMs,
    },
    artGeneration: {
      style,
      themes,
      ...(artPrompt !== undefined && { artPrompt }),
      imageGenerated: reviewImage !== undefined,
      geminiModel: "gemini-3-pro-image-preview",
    },
  };
}

async function prepareCuratedData(
  rawMatchData: RawMatch | undefined,
  timelineData: RawTimeline | undefined,
  matchId: MatchId,
  openaiClient: OpenAI,
): Promise<CuratedMatchData | undefined> {
  if (!rawMatchData) {
    return undefined;
  }

  const curatedData = await curateMatchData(rawMatchData, timelineData);
  if (curatedData.timeline) {
    // Use curated timeline for summarization (already has champion names, Blue/Red teams, etc.)
    const timelineSummary = await summarizeTimeline(curatedData.timeline, matchId, openaiClient);
    if (timelineSummary) {
      return { ...curatedData, timelineSummary };
    }
  }

  return curatedData;
}

async function selectPlayerContext(match: CompletedMatch | ArenaMatch): Promise<PlayerContext | undefined> {
  const playerIndex = Math.floor(Math.random() * match.players.length);
  const selectedPlayer = match.players[playerIndex];
  if (!selectedPlayer) {
    console.log("[generateMatchReview] No player found at selected index, skipping review generation");
    return undefined;
  }
  const playerName = selectedPlayer.playerConfig.alias;
  if (!playerName) {
    console.log("[generateMatchReview] No player name found, skipping review generation");
    return undefined;
  }

  let laneForContext: string | undefined;
  if (match.queueType !== "arena" && "lane" in selectedPlayer && typeof selectedPlayer.lane === "string") {
    laneForContext = selectedPlayer.lane;
  }

  const laneContextInfo = await getLaneContext(laneForContext);
  const playerMeta = await loadPlayerMetadata(playerName);

  console.log(
    `[generateMatchReview] Selected player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${playerName}`,
  );
  console.log(`[generateMatchReview] Selected lane context: ${laneContextInfo.filename}`);

  return {
    playerIndex,
    playerName,
    laneContext: laneContextInfo.content,
    playerMeta,
  };
}

/**
 * Generate an AI-powered review using OpenAI (backend wrapper)
 */
async function generateAIReview(params: {
  match: CompletedMatch | ArenaMatch;
  curatedData?: CuratedMatchData;
  personality: Personality;
  basePromptTemplate: string;
  laneContext: string;
  playerMetadata: PlayerMetadata;
  openaiClient: OpenAI;
  playerIndex: number;
  matchAnalysis?: string;
  timelineSummary?: string;
}): Promise<{ review: string; metadata: ReviewMetadata; textMetadata: ReviewTextMetadata } | undefined> {
  const {
    match,
    curatedData,
    personality,
    basePromptTemplate,
    laneContext,
    playerMetadata,
    openaiClient,
    playerIndex,
    matchAnalysis,
    timelineSummary,
  } = params;

  try {
    const player = match.players[playerIndex];
    console.log(
      `[generateAIReview] Generating review for player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${player?.playerConfig.alias ?? "unknown"}`,
    );

    console.log("[generateAIReview] Calling OpenAI API...");

    // Call shared review text generation function
    const result = await generateReviewText({
      match,
      personality,
      basePromptTemplate,
      laneContext,
      playerMetadata,
      openaiClient,
      model: "gpt-5.1",
      maxTokens: 1000,
      curatedData,
      playerIndex,
      ...(matchAnalysis !== undefined && { matchAnalysis }),
      ...(timelineSummary !== undefined && { timelineSummary }),
    });

    console.log("[generateAIReview] Successfully generated AI review");
    return {
      review: result.text,
      metadata: {
        reviewerName: result.metadata.reviewerName,
        playerName: result.metadata.playerName,
      },
      textMetadata: result.metadata,
    };
  } catch (error) {
    console.error("[generateAIReview] Error generating AI review:", error);
    Sentry.captureException(error, {
      tags: {
        source: "openai-review-generation",
        queueType: match.queueType ?? "unknown",
      },
    });
    return undefined;
  }
}

/**
 * Generates a post-game review for a player's performance with optional AI-generated image.
 * @param match - The completed match data (regular or arena)
 * @param matchId - The match ID for S3 storage
 * @param rawMatchData - Optional raw match data from Riot API for detailed stats
 * @param timelineData - Optional timeline data from Riot API for game progression context
 * @returns A promise that resolves to an object with review text, optional image, and metadata, or undefined if API keys are not configured
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  rawMatchData?: RawMatch,
  timelineData?: RawTimeline,
): Promise<{ text: string; image?: Uint8Array; metadata?: ReviewMetadata } | undefined> {
  const openaiClient = getOpenAIClient();
  if (!openaiClient) {
    console.log("[generateMatchReview] OpenAI API key not configured, skipping review generation");
    return undefined;
  }

  const basePromptTemplate = await loadPromptFile("base.txt");
  const personality = await selectRandomPersonality();
  console.log(`[generateMatchReview] Selected personality: ${personality.filename ?? personality.metadata.name}`);

  const curatedData = await prepareCuratedData(rawMatchData, timelineData, matchId, openaiClient);

  const playerContext = await selectPlayerContext(match);
  if (!playerContext) {
    return undefined;
  }

  const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
  const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);

  let matchAnalysis: string | undefined;
  if (curatedData) {
    matchAnalysis = await analyzeMatchData({
      match,
      curatedData,
      laneContext: playerContext.laneContext,
      matchId,
      queueType,
      trackedPlayerAliases,
      playerIndex: playerContext.playerIndex,
      openaiClient,
    });
  } else {
    console.log("[generateMatchReview] Skipping match analysis - no curated data available");
  }

  const aiReviewResult = await generateAIReview({
    match,
    ...(curatedData !== undefined && { curatedData }),
    personality,
    basePromptTemplate,
    laneContext: playerContext.laneContext,
    playerMetadata: playerContext.playerMeta,
    openaiClient,
    playerIndex: playerContext.playerIndex,
    ...(matchAnalysis !== undefined && { matchAnalysis }),
    ...(curatedData?.timelineSummary !== undefined && { timelineSummary: curatedData.timelineSummary }),
  });

  if (!aiReviewResult) {
    console.log("[generateMatchReview] Failed to generate AI review");
    return undefined;
  }

  const { review: reviewText, metadata, textMetadata } = aiReviewResult;

  await saveReviewDataToS3({ matchId, reviewText, textMetadata, queueType, trackedPlayerAliases });

  const { style, themes } = selectRandomStyleAndTheme();
  const fullMetadata: ReviewMetadata = {
    ...metadata,
    style,
    themes,
  };

  const artPrompt = await generateArtPromptFromReview({
    reviewText,
    style,
    themes,
    matchId,
    queueType,
    trackedPlayerAliases,
    openaiClient,
  });

  const reviewImage = await generateReviewImageBackend({
    reviewText,
    artPrompt: artPrompt ?? reviewText,
    match,
    matchId,
    queueType,
    style,
    themes,
    ...(curatedData !== undefined && { curatedData }),
  });

  // Save comprehensive debug data to S3
  try {
    const comprehensiveDebugData = buildComprehensiveDebugData({
      matchId,
      queueType,
      trackedPlayerAliases,
      personality,
      playerContext,
      match,
      ...(curatedData !== undefined && { curatedData }),
      ...(matchAnalysis !== undefined && { matchAnalysis }),
      textMetadata,
      reviewText,
      style,
      themes,
      ...(artPrompt !== undefined && { artPrompt }),
      ...(reviewImage !== undefined && { reviewImage }),
    });

    await saveComprehensiveDebugToS3(comprehensiveDebugData);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[generateMatchReview] Failed to save comprehensive debug data to S3:", err);
  }

  return {
    text: reviewText,
    ...(reviewImage ? { image: reviewImage } : {}),
    metadata: fullMetadata,
  };
}
