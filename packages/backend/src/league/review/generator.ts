/**
 * Backend wrapper for AI match review generation
 *
 * This is a thin wrapper around the unified pipeline from @scout-for-lol/data.
 * It handles backend-specific concerns:
 * - Loading prompts/personality from filesystem
 * - Initializing AI clients from environment
 * - Saving traces to S3
 * - Error handling with Sentry
 */

import {
  type RawMatch,
  type RawTimeline,
  type ArenaMatch,
  type CompletedMatch,
  type MatchId,
  generateFullMatchReview,
  DEFAULT_STAGE_CONFIGS,
  type ReviewPipelineOutput,
} from "@scout-for-lol/data";
import * as Sentry from "@sentry/node";
<<<<<<< Updated upstream
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
import { generateImageDescriptionFromReview } from "@scout-for-lol/backend/league/review/ai-image-description.js";
import { generateReviewImageBackend } from "@scout-for-lol/backend/league/review/image-backend.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("review-generator");
||||||| Stash base
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
import { generateImageDescriptionFromReview } from "@scout-for-lol/backend/league/review/ai-image-description.js";
import { generateReviewImageBackend } from "@scout-for-lol/backend/league/review/image-backend.js";
=======
import { loadPromptFile, selectRandomPersonality, loadPlayerMetadata, getLaneContext } from "./prompts.js";
import { getOpenAIClient, getGeminiClient } from "./ai-clients.js";
import { savePipelineTracesToS3, savePipelineDebugToS3 } from "@scout-for-lol/backend/storage/pipeline-s3.js";
>>>>>>> Stashed changes

/**
 * Metadata about the generated review
 */
export type ReviewMetadata = {
  reviewerName: string;
  playerName: string;
};

/**
 * Select the player to review
 *
 * Prefers "Jerred" if they're in the match, otherwise selects randomly.
 */
<<<<<<< Updated upstream
async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { reviewText, matchId, queueType, trackedPlayerAliases, openaiClient } = params;

  // Step 3: Generate image description from review text
  const imageDescription = await generateImageDescriptionFromReview({
    reviewText,
    matchId,
    queueType,
    trackedPlayerAliases,
    openaiClient,
  });

  if (!imageDescription) {
    logger.info("[generateImage] No image description generated, skipping image generation");
    return {};
  }

  // Step 4: Generate image from description only
  const reviewImage = await generateReviewImageBackend({
    imageDescription,
    matchId,
    queueType,
    trackedPlayerAliases,
  });

  return {
    imageDescription,
    ...(reviewImage !== undefined && { reviewImage }),
  };
}

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
    logger.error("[generateMatchReview] Failed to save review text to S3:", err);
  }

  try {
    await saveAIReviewRequestToS3(matchId, textMetadata, queueType, trackedPlayerAliases);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("[generateMatchReview] Failed to save AI request to S3:", err);
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
    imageDescription,
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
    imageGeneration: {
      ...(imageDescription !== undefined && { imageDescription }),
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
  // Prefer "Jerred" if they're in the match, otherwise select randomly
||||||| Stash base
async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { reviewText, matchId, queueType, trackedPlayerAliases, openaiClient } = params;

  // Step 3: Generate image description from review text
  const imageDescription = await generateImageDescriptionFromReview({
    reviewText,
    matchId,
    queueType,
    trackedPlayerAliases,
    openaiClient,
  });

  if (!imageDescription) {
    console.log("[generateImage] No image description generated, skipping image generation");
    return {};
  }

  // Step 4: Generate image from description only
  const reviewImage = await generateReviewImageBackend({
    imageDescription,
    matchId,
    queueType,
    trackedPlayerAliases,
  });

  return {
    imageDescription,
    ...(reviewImage !== undefined && { reviewImage }),
  };
}

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
    imageDescription,
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
    imageGeneration: {
      ...(imageDescription !== undefined && { imageDescription }),
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
  // Prefer "Jerred" if they're in the match, otherwise select randomly
=======
function selectPlayerIndex(match: CompletedMatch | ArenaMatch): number {
>>>>>>> Stashed changes
  const jerredIndex = match.players.findIndex((p) => p.playerConfig.alias.toLowerCase() === "jerred");
<<<<<<< Updated upstream
  const playerIndex = jerredIndex !== -1 ? jerredIndex : Math.floor(Math.random() * match.players.length);
  const selectedPlayer = match.players[playerIndex];
  if (!selectedPlayer) {
    logger.info("[generateMatchReview] No player found at selected index, skipping review generation");
    return undefined;
  }
  const playerName = selectedPlayer.playerConfig.alias;
  if (!playerName) {
    logger.info("[generateMatchReview] No player name found, skipping review generation");
    return undefined;
  }

  let laneForContext: string | undefined;
  if (match.queueType !== "arena" && "lane" in selectedPlayer && typeof selectedPlayer.lane === "string") {
    laneForContext = selectedPlayer.lane;
  }

  const laneContextInfo = await getLaneContext(laneForContext);
  const playerMeta = await loadPlayerMetadata(playerName);

  logger.info(
    `[generateMatchReview] Selected player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${playerName}`,
  );
  logger.info(`[generateMatchReview] Selected lane context: ${laneContextInfo.filename}`);

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
    logger.info(
      `[generateAIReview] Generating review for player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${player?.playerConfig.alias ?? "unknown"}`,
    );

    logger.info("[generateAIReview] Calling OpenAI API...");

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

    logger.info("[generateAIReview] Successfully generated AI review");
    return {
      review: result.text,
      metadata: {
        reviewerName: result.metadata.reviewerName,
        playerName: result.metadata.playerName,
      },
      textMetadata: result.metadata,
    };
  } catch (error) {
    logger.error("[generateAIReview] Error generating AI review:", error);
    Sentry.captureException(error, {
      tags: {
        source: "openai-review-generation",
        queueType: match.queueType ?? "unknown",
      },
    });
    return undefined;
  }
||||||| Stash base
  const playerIndex = jerredIndex !== -1 ? jerredIndex : Math.floor(Math.random() * match.players.length);
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
=======
  return jerredIndex !== -1 ? jerredIndex : Math.floor(Math.random() * match.players.length);
>>>>>>> Stashed changes
}

/**
 * Generates a post-game review for a player's performance with optional AI-generated image.
 *
 * This function:
 * 1. Loads prompts and personality from filesystem
 * 2. Initializes AI clients from environment
 * 3. Calls the unified pipeline
 * 4. Saves traces to S3
 * 5. Returns the review text and optional image
 *
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
  // Initialize clients
  const openaiClient = getOpenAIClient();
  if (!openaiClient) {
    logger.info("[generateMatchReview] OpenAI API key not configured, skipping review generation");
    return undefined;
  }

<<<<<<< Updated upstream
  const basePromptTemplate = await loadPromptFile("base.txt");
  const personality = await selectRandomPersonality();
  logger.info(`[generateMatchReview] Selected personality: ${personality.filename ?? personality.metadata.name}`);
||||||| Stash base
  const basePromptTemplate = await loadPromptFile("base.txt");
  const personality = await selectRandomPersonality();
  console.log(`[generateMatchReview] Selected personality: ${personality.filename ?? personality.metadata.name}`);
=======
  const geminiClient = getGeminiClient();
>>>>>>> Stashed changes

  // Select player
  const playerIndex = selectPlayerIndex(match);
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

  // Determine lane context
  let laneForContext: string | undefined;
  if (match.queueType !== "arena" && "lane" in selectedPlayer && typeof selectedPlayer.lane === "string") {
    laneForContext = selectedPlayer.lane;
  }

  // Load prompts and personality
  const [basePromptTemplate, personality, laneContextInfo, playerMetadata] = await Promise.all([
    loadPromptFile("base.txt"),
    selectRandomPersonality(),
    getLaneContext(laneForContext),
    loadPlayerMetadata(playerName),
  ]);

  console.log(`[generateMatchReview] Selected player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${playerName}`);
  console.log(`[generateMatchReview] Selected personality: ${personality.filename ?? personality.metadata.name}`);
  console.log(`[generateMatchReview] Selected lane context: ${laneContextInfo.filename}`);

  const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
  const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);

<<<<<<< Updated upstream
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
    logger.info("[generateMatchReview] Skipping match analysis - no curated data available");
||||||| Stash base
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
=======
  // Call unified pipeline
  let pipelineOutput: ReviewPipelineOutput;

  // Build match input
  const matchInput: Parameters<typeof generateFullMatchReview>[0]["match"] = {
    processed: match,
  };
  if (rawMatchData !== undefined) {
    matchInput.raw = rawMatchData;
  }
  if (timelineData !== undefined) {
    matchInput.rawTimeline = timelineData;
>>>>>>> Stashed changes
  }

  // Build clients input
  const clientsInput: Parameters<typeof generateFullMatchReview>[0]["clients"] = {
    openai: openaiClient,
  };
  if (geminiClient !== undefined) {
    clientsInput.gemini = geminiClient;
  }

<<<<<<< Updated upstream
  if (!aiReviewResult) {
    logger.info("[generateMatchReview] Failed to generate AI review");
||||||| Stash base
  if (!aiReviewResult) {
    console.log("[generateMatchReview] Failed to generate AI review");
=======
  try {
    pipelineOutput = await generateFullMatchReview({
      match: matchInput,
      player: {
        index: playerIndex,
        metadata: playerMetadata,
      },
      prompts: {
        personality,
        baseTemplate: basePromptTemplate,
        laneContext: laneContextInfo.content,
      },
      clients: clientsInput,
      stages: DEFAULT_STAGE_CONFIGS,
    });
  } catch (error) {
    console.error("[generateMatchReview] Pipeline failed:", error);
    Sentry.captureException(error, {
      tags: {
        source: "review-pipeline",
        queueType,
      },
    });
>>>>>>> Stashed changes
    return undefined;
  }

  // Save traces to S3 (fire and forget, don't block return)
  savePipelineTracesToS3({
    matchId,
    queueType,
    trackedPlayerAliases,
    output: pipelineOutput,
  }).catch((err: unknown) => {
    console.error("[generateMatchReview] Failed to save pipeline traces to S3:", err);
  });

  // Also save debug data
  savePipelineDebugToS3({
    matchId,
    queueType,
    trackedPlayerAliases,
    output: pipelineOutput,
  }).catch((err: unknown) => {
    console.error("[generateMatchReview] Failed to save pipeline debug to S3:", err);
  });

<<<<<<< Updated upstream
    await saveComprehensiveDebugToS3(comprehensiveDebugData);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("[generateMatchReview] Failed to save comprehensive debug data to S3:", err);
||||||| Stash base
    await saveComprehensiveDebugToS3(comprehensiveDebugData);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[generateMatchReview] Failed to save comprehensive debug data to S3:", err);
=======
  // Convert base64 image to Uint8Array if present
  let reviewImage: Uint8Array | undefined;
  if (pipelineOutput.review.imageBase64) {
    try {
      const binaryString = atob(pipelineOutput.review.imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      reviewImage = bytes;
    } catch (err) {
      console.error("[generateMatchReview] Failed to decode image:", err);
    }
>>>>>>> Stashed changes
  }

  return {
    text: pipelineOutput.review.text,
    ...(reviewImage && { image: reviewImage }),
    metadata: {
      reviewerName: pipelineOutput.context.reviewerName,
      playerName: pipelineOutput.context.playerName,
    },
  };
}
