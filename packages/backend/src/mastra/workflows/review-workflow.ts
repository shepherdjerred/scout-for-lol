/* eslint-disable complexity, max-lines, max-params, @typescript-eslint/restrict-template-expressions -- Workflow orchestration inherently requires complex sequential logic with many debug log template literals */
/**
 * Review Workflow - Orchestrates the complete AI review generation pipeline
 *
 * This workflow uses Mastra's step-based approach to generate match reviews.
 * Steps are executed sequentially with data passed between them.
 *
 * Flow:
 * 1. Setup - Load personality, prompts, select player
 * 2. Curate match data - Transform raw Riot API data
 * 3. Summarize timeline - AI summary of game flow
 * 4. Analyze match - AI analysis of player performance
 * 5. Generate review text - Main AI review
 * 6. Generate art prompt - AI art direction
 * 7. Generate image - Gemini image generation
 *
 * Debugging:
 * - All intermediate data is collected in a debug context
 * - Timing is recorded for each step
 * - A comprehensive debug JSON is saved to S3
 */

import {
  selectRandomStyleAndTheme,
  generateReviewText,
  curateMatchData,
  type ReviewTextMetadata,
  type ArenaMatch,
  type CompletedMatch,
  type RawMatch,
  type RawTimeline,
  type MatchId,
  type CuratedMatchData,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";
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
import { saveAIReviewTextToS3, saveAIReviewRequestToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { saveToS3 } from "@scout-for-lol/backend/storage/s3-helpers.js";
import type OpenAI from "openai";

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

/**
 * Debug context for collecting all intermediate data
 */
type DebugContext = {
  workflowStartTime: number;
  matchId: string;
  steps: {
    name: string;
    startTime: number;
    endTime?: number | undefined;
    durationMs?: number | undefined;
    status: "running" | "success" | "failed" | "skipped";
    error?: string | undefined;
    data?: unknown;
  }[];
  personality?:
    | {
        name: string;
        filename?: string | undefined;
      }
    | undefined;
  playerContext?:
    | {
        playerIndex: number;
        playerName: string;
        laneFilename: string;
      }
    | undefined;
  curatedDataStats?:
    | {
        hasTimeline: boolean;
        participantCount: number;
        gameDuration?: number | undefined;
      }
    | undefined;
  timelineSummary?:
    | {
        length: number;
        content: string;
      }
    | undefined;
  matchAnalysis?:
    | {
        length: number;
        content: string;
      }
    | undefined;
  reviewText?:
    | {
        length: number;
        content: string;
        tokensPrompt?: number | undefined;
        tokensCompletion?: number | undefined;
        durationMs: number;
        systemPrompt?: string | undefined;
        userPrompt?: string | undefined;
      }
    | undefined;
  artGeneration?:
    | {
        style: string;
        themes: string[];
        artPrompt?: string | undefined;
        artPromptLength?: number | undefined;
      }
    | undefined;
  imageGeneration?:
    | {
        generated: boolean;
        durationMs?: number | undefined;
      }
    | undefined;
  totalDurationMs?: number | undefined;
  finalStatus: "success" | "failed" | "partial";
};

function createDebugStep(debug: DebugContext, name: string): number {
  const stepIndex = debug.steps.length;
  const startTime = Date.now();
  debug.steps.push({
    name,
    startTime,
    status: "running",
  });
  console.log(`[reviewWorkflow:${name}] ▶️  Starting step...`);
  return stepIndex;
}

function completeDebugStep(
  debug: DebugContext,
  stepIndex: number,
  status: "success" | "failed" | "skipped",
  data?: unknown,
  error?: string,
): void {
  const step = debug.steps[stepIndex];
  if (step) {
    step.endTime = Date.now();
    step.durationMs = step.endTime - step.startTime;
    step.status = status;
    step.data = data;
    step.error = error;
    const statusEmoji = status === "success" ? "✅" : status === "failed" ? "❌" : "⏭️";
    console.log(`[reviewWorkflow:${step.name}] ${statusEmoji} Step ${status} (${String(step.durationMs)}ms)`);
  }
}

/**
 * Save the complete debug context to S3
 */
async function saveDebugContextToS3(
  debug: DebugContext,
  matchId: MatchId,
  queueType: string,
  trackedPlayerAliases: string[],
): Promise<void> {
  try {
    const debugJson = JSON.stringify(debug, null, 2);
    await saveToS3({
      matchId,
      assetType: "workflow-debug",
      extension: "json",
      body: debugJson,
      contentType: "application/json",
      metadata: {
        queueType,
        trackedPlayers: trackedPlayerAliases.join(","),
        status: debug.finalStatus,
        totalDurationMs: (debug.totalDurationMs ?? 0).toString(),
      },
      logEmoji: "🐛",
      logMessage: "Saving workflow debug context",
      errorContext: "workflow-debug",
    });
  } catch (error) {
    console.error("[reviewWorkflow:debug] Failed to save debug context to S3:", error);
  }
}

/**
 * Execute the review generation workflow
 *
 * This function implements the workflow logic using direct async/await
 * while maintaining the step-based structure for clarity and future migration.
 *
 * @param match - The completed match data (regular or arena)
 * @param matchId - The match ID for S3 storage
 * @param rawMatchData - Optional raw match data from Riot API for detailed stats
 * @param timelineData - Optional timeline data from Riot API for game progression context
 * @returns A promise that resolves to an object with review text, optional image, and metadata
 */
export async function executeReviewWorkflow(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  rawMatchData?: RawMatch,
  timelineData?: RawTimeline,
): Promise<{ text: string; image?: Uint8Array; metadata?: ReviewMetadata } | undefined> {
  // Initialize debug context
  const debug: DebugContext = {
    workflowStartTime: Date.now(),
    matchId,
    steps: [],
    finalStatus: "failed",
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(`[reviewWorkflow] 🚀 Starting review workflow for match ${matchId}`);
  console.log(`${"=".repeat(60)}\n`);

  const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
  const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);

  try {
    // Step 1: Check OpenAI availability
    const checkStepIdx = createDebugStep(debug, "check-openai");
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      console.log("[reviewWorkflow] OpenAI API key not configured, skipping review generation");
      completeDebugStep(debug, checkStepIdx, "failed", undefined, "OpenAI API key not configured");
      debug.finalStatus = "failed";
      await saveDebugContextToS3(debug, matchId, queueType, trackedPlayerAliases);
      return undefined;
    }
    completeDebugStep(debug, checkStepIdx, "success", { configured: true });

    // Step 2: Setup - Load personality, prompts, and select player
    const setupStepIdx = createDebugStep(debug, "setup");
    const personality = await selectRandomPersonality();
    debug.personality = {
      name: personality.metadata.name,
      filename: personality.filename,
    };
    console.log(`[reviewWorkflow:setup] 🎭 Selected personality: ${personality.filename ?? personality.metadata.name}`);

    const basePromptTemplate = await loadPromptFile("base.txt");

    // Select a random player for the review
    const playerContext = await selectPlayerContext(match, debug);
    if (!playerContext) {
      completeDebugStep(debug, setupStepIdx, "failed", undefined, "No valid player found");
      debug.finalStatus = "failed";
      await saveDebugContextToS3(debug, matchId, queueType, trackedPlayerAliases);
      return undefined;
    }
    completeDebugStep(debug, setupStepIdx, "success", {
      personality: debug.personality,
      playerContext: debug.playerContext,
    });

    // Step 3: Curate match data
    const curateStepIdx = createDebugStep(debug, "curate-match-data");
    let curatedData: CuratedMatchData | undefined;
    if (rawMatchData) {
      curatedData = await curateMatchData(rawMatchData, timelineData);
      debug.curatedDataStats = {
        hasTimeline: !!curatedData.timeline,
        participantCount: curatedData.participants.length,
        gameDuration: curatedData.gameInfo.gameDuration,
      };
      console.log(
        `[reviewWorkflow:curate] 📊 Curated data: ${String(curatedData.participants.length)} participants, timeline: ${String(!!curatedData.timeline)}`,
      );
      completeDebugStep(debug, curateStepIdx, "success", debug.curatedDataStats);
    } else {
      console.log("[reviewWorkflow:curate] No raw match data provided, skipping curation");
      completeDebugStep(debug, curateStepIdx, "skipped", undefined, "No raw match data provided");
    }

    // Step 4: Summarize timeline (if available)
    const timelineStepIdx = createDebugStep(debug, "summarize-timeline");
    let timelineSummary: string | undefined;
    if (curatedData?.timeline) {
      timelineSummary = await summarizeTimeline(curatedData.timeline, matchId, openaiClient);
      if (timelineSummary) {
        curatedData = { ...curatedData, timelineSummary };
        debug.timelineSummary = {
          length: timelineSummary.length,
          content: timelineSummary,
        };
        console.log(`[reviewWorkflow:timeline] 📝 Timeline summary: ${String(timelineSummary.length)} chars`);
        completeDebugStep(debug, timelineStepIdx, "success", debug.timelineSummary);
      } else {
        completeDebugStep(debug, timelineStepIdx, "failed", undefined, "No summary returned");
      }
    } else {
      completeDebugStep(debug, timelineStepIdx, "skipped", undefined, "No timeline data available");
    }

    // Step 5: Analyze match (if curated data available)
    const analyzeStepIdx = createDebugStep(debug, "analyze-match");
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
      if (matchAnalysis) {
        debug.matchAnalysis = {
          length: matchAnalysis.length,
          content: matchAnalysis,
        };
        console.log(`[reviewWorkflow:analyze] 📊 Match analysis: ${String(matchAnalysis.length)} chars`);
        completeDebugStep(debug, analyzeStepIdx, "success", debug.matchAnalysis);
      } else {
        completeDebugStep(debug, analyzeStepIdx, "failed", undefined, "No analysis returned");
      }
    } else {
      console.log("[reviewWorkflow:analyze] Skipping match analysis - no curated data available");
      completeDebugStep(debug, analyzeStepIdx, "skipped", undefined, "No curated data available");
    }

    // Step 6: Generate review text
    const reviewStepIdx = createDebugStep(debug, "generate-review-text");
    const reviewResult = await generateAIReview({
      match,
      ...(curatedData !== undefined && { curatedData }),
      personality,
      basePromptTemplate,
      laneContext: playerContext.laneContext,
      playerMetadata: playerContext.playerMeta,
      openaiClient,
      playerIndex: playerContext.playerIndex,
      ...(matchAnalysis !== undefined && { matchAnalysis }),
      ...(timelineSummary !== undefined && { timelineSummary }),
    });

    if (!reviewResult) {
      console.log("[reviewWorkflow:review] Failed to generate AI review");
      completeDebugStep(debug, reviewStepIdx, "failed", undefined, "Review generation failed");
      debug.finalStatus = "failed";
      await saveDebugContextToS3(debug, matchId, queueType, trackedPlayerAliases);
      return undefined;
    }

    const { review: reviewText, metadata, textMetadata } = reviewResult;
    debug.reviewText = {
      length: reviewText.length,
      content: reviewText,
      tokensPrompt: textMetadata.textTokensPrompt,
      tokensCompletion: textMetadata.textTokensCompletion,
      durationMs: textMetadata.textDurationMs,
      systemPrompt: textMetadata.systemPrompt,
      userPrompt: textMetadata.userPrompt,
    };
    console.log(
      `[reviewWorkflow:review] ✍️  Review: ${String(reviewText.length)} chars, ${String(textMetadata.textTokensCompletion ?? 0)} tokens`,
    );
    completeDebugStep(debug, reviewStepIdx, "success", {
      length: reviewText.length,
      tokensPrompt: textMetadata.textTokensPrompt,
      tokensCompletion: textMetadata.textTokensCompletion,
      durationMs: textMetadata.textDurationMs,
    });

    // Save review text to S3
    try {
      await saveAIReviewTextToS3(matchId, reviewText, queueType, trackedPlayerAliases);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[reviewWorkflow:review] Failed to save review text to S3:", err);
    }

    try {
      await saveAIReviewRequestToS3(matchId, textMetadata, queueType, trackedPlayerAliases);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[reviewWorkflow:review] Failed to save AI request to S3:", err);
    }

    // Step 7: Select art style and themes
    const artSelectStepIdx = createDebugStep(debug, "select-art-style");
    const { style, themes } = selectRandomStyleAndTheme();
    debug.artGeneration = {
      style,
      themes,
    };
    const fullMetadata: ReviewMetadata = {
      ...metadata,
      style,
      themes,
    };
    console.log(`[reviewWorkflow:art] 🎨 Selected style: ${style}, themes: ${themes.join(", ")}`);
    completeDebugStep(debug, artSelectStepIdx, "success", { style, themes });

    // Step 8: Generate art prompt
    const artPromptStepIdx = createDebugStep(debug, "generate-art-prompt");
    const artPrompt = await generateArtPromptFromReview({
      reviewText,
      style,
      themes,
      matchId,
      queueType,
      trackedPlayerAliases,
      openaiClient,
    });
    if (artPrompt) {
      debug.artGeneration.artPrompt = artPrompt;
      debug.artGeneration.artPromptLength = artPrompt.length;
      console.log(`[reviewWorkflow:art] 🖌️  Art prompt: ${String(artPrompt.length)} chars`);
      completeDebugStep(debug, artPromptStepIdx, "success", { length: artPrompt.length });
    } else {
      completeDebugStep(debug, artPromptStepIdx, "failed", undefined, "Art prompt generation failed");
    }

    // Step 9: Generate image
    const imageStepIdx = createDebugStep(debug, "generate-image");
    const imageStartTime = Date.now();
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
    const imageDurationMs = Date.now() - imageStartTime;
    debug.imageGeneration = {
      generated: !!reviewImage,
      durationMs: imageDurationMs,
    };
    if (reviewImage) {
      console.log(`[reviewWorkflow:image] 🖼️  Image generated in ${String(imageDurationMs)}ms`);
      completeDebugStep(debug, imageStepIdx, "success", { generated: true, durationMs: imageDurationMs });
    } else {
      completeDebugStep(debug, imageStepIdx, "failed", undefined, "Image generation failed");
    }

    // Finalize debug context
    debug.totalDurationMs = Date.now() - debug.workflowStartTime;
    debug.finalStatus = "success";

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[reviewWorkflow] ✅ Workflow completed in ${debug.totalDurationMs}ms`);
    console.log(`${"=".repeat(60)}\n`);

    // Save debug context to S3
    await saveDebugContextToS3(debug, matchId, queueType, trackedPlayerAliases);

    return {
      text: reviewText,
      ...(reviewImage ? { image: reviewImage } : {}),
      metadata: fullMetadata,
    };
  } catch (error) {
    debug.totalDurationMs = Date.now() - debug.workflowStartTime;
    debug.finalStatus = "failed";
    console.error("[reviewWorkflow] Workflow failed with error:", error);
    await saveDebugContextToS3(debug, matchId, queueType, trackedPlayerAliases);
    throw error;
  }
}

/**
 * Select a random player for the review and load their context
 */
async function selectPlayerContext(
  match: CompletedMatch | ArenaMatch,
  debug: DebugContext,
): Promise<PlayerContext | undefined> {
  const playerIndex = Math.floor(Math.random() * match.players.length);
  const selectedPlayer = match.players[playerIndex];
  if (!selectedPlayer) {
    console.log("[reviewWorkflow:setup] No player found at selected index, skipping review generation");
    return undefined;
  }
  const playerName = selectedPlayer.playerConfig.alias;
  if (!playerName) {
    console.log("[reviewWorkflow:setup] No player name found, skipping review generation");
    return undefined;
  }

  let laneForContext: string | undefined;
  if (match.queueType !== "arena" && "lane" in selectedPlayer && typeof selectedPlayer.lane === "string") {
    laneForContext = selectedPlayer.lane;
  }

  const laneContextInfo = await getLaneContext(laneForContext);
  const playerMeta = await loadPlayerMetadata(playerName);

  debug.playerContext = {
    playerIndex,
    playerName,
    laneFilename: laneContextInfo.filename,
  };

  console.log(
    `[reviewWorkflow:setup] 👤 Selected player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${playerName}`,
  );
  console.log(`[reviewWorkflow:setup] 🛣️  Lane context: ${laneContextInfo.filename}`);

  return {
    playerIndex,
    playerName,
    laneContext: laneContextInfo.content,
    playerMeta,
  };
}

/**
 * Generate an AI-powered review using OpenAI
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
}): Promise<
  | {
      review: string;
      metadata: { reviewerName: string; playerName: string };
      textMetadata: ReviewTextMetadata;
    }
  | undefined
> {
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
      `[reviewWorkflow:review] 🎮 Generating review for player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${player?.playerConfig.alias ?? "unknown"}`,
    );

    console.log("[reviewWorkflow:review] 🤖 Calling OpenAI API...");

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

    console.log("[reviewWorkflow:review] ✅ Successfully generated AI review");
    return {
      review: result.text,
      metadata: {
        reviewerName: result.metadata.reviewerName,
        playerName: result.metadata.playerName,
      },
      textMetadata: result.metadata,
    };
  } catch (error) {
    console.error("[reviewWorkflow:review] Error generating AI review:", error);
    return undefined;
  }
}

// Re-export for backwards compatibility
export { executeReviewWorkflow as generateMatchReview };
