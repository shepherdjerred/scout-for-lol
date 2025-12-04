/**
 * Unified AI Review Pipeline
 *
 * This is the main entry point for generating AI-powered match reviews.
 * It orchestrates all stages of the pipeline and returns a complete result
 * with traces for observability.
 *
 * Pipeline stages:
 * 1a. Timeline Summary - Summarize raw timeline JSON to text (parallel with 1b)
 * 1b. Match Summary - Summarize raw match JSON to text (parallel with 1a)
 * 2.  Review Text - Generate review using personality (uses 1a + 1b text)
 * 3.  Image Description - Generate image prompt from review text
 * 4.  Image Generation - Generate image using Gemini
 *
 * Key design decisions:
 * - NO raw JSON goes to the personality reviewer (Stage 2)
 * - All JSON is minified to reduce token usage
 * - Each stage produces a trace for observability
 * - Platform-agnostic: no filesystem, S3, or Sentry dependencies
 */

import type {
  ReviewPipelineInput,
  ReviewPipelineOutput,
  PipelineTraces,
  PipelineIntermediateResults,
  PipelineContext,
  StageTrace,
  PipelineStagesConfig,
  PipelineClientsInput,
  PipelineProgressCallback,
  PipelineStageName,
} from "./pipeline-types.ts";
import type { RawMatch } from "@scout-for-lol/data/league/raw-match.schema";
import type { RawTimeline } from "@scout-for-lol/data/league/raw-timeline.schema";
import {
  generateTimelineSummary,
  generateMatchSummary,
  generateReviewTextStage,
  generateImageDescription,
  generateImage,
} from "./pipeline-stages.ts";

// ============================================================================
// Progress Tracking
// ============================================================================

/** Stage name to human-readable message */
const STAGE_MESSAGES: Record<PipelineStageName, string> = {
  "timeline-summary": "Generating timeline summary...",
  "match-summary": "Generating match summary...",
  "review-text": "Generating review...",
  "image-description": "Generating image prompt...",
  "image-generation": "Generating image...",
};

/** Count enabled stages for progress tracking */
function countEnabledStages(stages: PipelineStagesConfig, hasGemini: boolean): number {
  let count = 1; // reviewText is always enabled
  if (stages.timelineSummary.enabled) {
    count++;
  }
  if (stages.matchSummary.enabled) {
    count++;
  }
  if (stages.imageDescription.enabled) {
    count++;
  }
  if (stages.imageGeneration.enabled && hasGemini) {
    count++;
  }
  return count;
}

/** Create a progress reporter that tracks stage progression */
function createProgressReporter(
  onProgress: PipelineProgressCallback | undefined,
  totalStages: number,
): (stage: PipelineStageName) => void {
  let currentStage = 0;
  return (stage: PipelineStageName): void => {
    currentStage++;
    onProgress?.({
      stage,
      message: STAGE_MESSAGES[stage],
      currentStage,
      totalStages,
    });
  };
}

// ============================================================================
// Helper Types
// ============================================================================

type Stage1Result = {
  timelineSummaryText?: string;
  timelineSummaryTrace?: StageTrace;
  matchSummaryText?: string;
  matchSummaryTrace?: StageTrace;
};

type Stage1Context = {
  input: ReviewPipelineInput;
  intermediate: PipelineIntermediateResults;
  traces: Partial<PipelineTraces>;
  rawMatch: RawMatch;
  rawTimeline: RawTimeline;
};

type Stage3And4Context = {
  reviewText: string;
  stages: PipelineStagesConfig;
  clients: PipelineClientsInput;
  traces: Partial<PipelineTraces>;
  intermediate: PipelineIntermediateResults;
  imagePrompts?: string[] | undefined;
  reportProgress: (stage: PipelineStageName) => void;
};

type Stage3And4Result = {
  imageDescriptionText?: string;
  imageBase64?: string;
};

// ============================================================================
// Stage 1 Helpers
// ============================================================================

async function runTimelineSummary(ctx: Stage1Context): Promise<{ text: string; trace: StageTrace } | undefined> {
  const { input } = ctx;
  const { match, prompts, clients, stages } = input;

  if (!stages.timelineSummary.enabled) {
    return undefined;
  }

  return await generateTimelineSummary({
    rawTimeline: match.rawTimeline,
    rawMatch: match.raw,
    laneContext: prompts.laneContext,
    client: clients.openai,
    model: stages.timelineSummary.model,
    systemPrompt: stages.timelineSummary.systemPrompt,
    userPrompt: stages.timelineSummary.userPrompt,
  });
}

async function runMatchSummary(ctx: Stage1Context): Promise<{ text: string; trace: StageTrace } | undefined> {
  const { input } = ctx;
  const { match, player, clients, stages } = input;

  if (!stages.matchSummary.enabled) {
    return undefined;
  }

  return await generateMatchSummary({
    match: match.processed,
    rawMatch: match.raw,
    playerIndex: player.index,
    client: clients.openai,
    model: stages.matchSummary.model,
    systemPrompt: stages.matchSummary.systemPrompt,
    userPrompt: stages.matchSummary.userPrompt,
  });
}

async function runStage1Parallel(ctx: Stage1Context): Promise<Stage1Result> {
  const [timelineResult, matchResult] = await Promise.all([runTimelineSummary(ctx), runMatchSummary(ctx)]);

  const result: Stage1Result = {};

  if (timelineResult) {
    result.timelineSummaryText = timelineResult.text;
    result.timelineSummaryTrace = timelineResult.trace;
    ctx.intermediate.timelineSummaryText = timelineResult.text;
    ctx.traces.timelineSummary = timelineResult.trace;
  }

  if (matchResult) {
    result.matchSummaryText = matchResult.text;
    result.matchSummaryTrace = matchResult.trace;
    ctx.intermediate.matchSummaryText = matchResult.text;
    ctx.traces.matchSummary = matchResult.trace;
  }

  return result;
}

// ============================================================================
// Stage 3 & 4 Helpers
// ============================================================================

async function runStage3ImageDescription(ctx: Stage3And4Context): Promise<string | undefined> {
  const { reviewText, stages, clients, traces, intermediate, imagePrompts } = ctx;

  if (!stages.imageDescription.enabled) {
    return undefined;
  }

  const artStyleDescription = stages.imageGeneration.artStyle.description;

  try {
    const result = await generateImageDescription({
      reviewText,
      artStyle: artStyleDescription,
      client: clients.openai,
      model: stages.imageDescription.model,
      systemPrompt: stages.imageDescription.systemPrompt,
      userPrompt: stages.imageDescription.userPrompt,
      imagePrompts,
    });
    traces.imageDescription = result.trace;
    intermediate.imageDescriptionText = result.text;
    intermediate.selectedArtStyle = artStyleDescription;
    if (result.selectedImagePrompts.length > 0) {
      intermediate.selectedImagePrompts = result.selectedImagePrompts;
    }
    return result.text;
  } catch (error) {
    console.error("[Pipeline Stage 3] Image description failed:", error);
    return undefined;
  }
}

async function runStage4ImageGeneration(
  ctx: Stage3And4Context,
  imageDescriptionText: string,
): Promise<string | undefined> {
  const { stages, clients, traces } = ctx;

  if (!stages.imageGeneration.enabled || !clients.gemini) {
    return undefined;
  }

  try {
    const result = await generateImage({
      imageDescription: imageDescriptionText,
      geminiClient: clients.gemini,
      model: stages.imageGeneration.model,
      timeoutMs: stages.imageGeneration.timeoutMs,
      userPrompt: stages.imageGeneration.userPrompt,
    });
    traces.imageGeneration = result.trace;
    return result.imageBase64;
  } catch (error) {
    console.error("[Pipeline Stage 4] Image generation failed:", error);
    return undefined;
  }
}

async function runStage3And4(ctx: Stage3And4Context): Promise<Stage3And4Result> {
  const { stages, clients, reportProgress } = ctx;
  const result: Stage3And4Result = {};

  if (stages.imageDescription.enabled) {
    reportProgress("image-description");
  }

  const imageDescriptionText = await runStage3ImageDescription(ctx);
  if (imageDescriptionText !== undefined) {
    result.imageDescriptionText = imageDescriptionText;

    if (stages.imageGeneration.enabled && clients.gemini) {
      reportProgress("image-generation");
    }

    const imageBase64 = await runStage4ImageGeneration(ctx, imageDescriptionText);
    if (imageBase64 !== undefined) {
      result.imageBase64 = imageBase64;
    }
  }

  return result;
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Generate a complete AI-powered match review
 *
 * This is the main function that orchestrates the entire pipeline.
 * All dependencies (clients, prompts, configs) are passed in, making
 * this function completely platform-agnostic.
 *
 * @param input - Complete pipeline input with match data, player info, prompts, clients, and stage configs
 * @returns Complete pipeline output with review, traces, intermediate results, and context
 */
export async function generateFullMatchReview(input: ReviewPipelineInput): Promise<ReviewPipelineOutput> {
  const { match, player, prompts, clients, stages, onProgress } = input;

  // Initialize output structures
  const traces: Partial<PipelineTraces> = {};
  const intermediate: PipelineIntermediateResults = {};

  // Set up progress tracking
  const hasGemini = clients.gemini !== undefined;
  const totalStages = countEnabledStages(stages, hasGemini);
  const reportProgress = createProgressReporter(onProgress, totalStages);

  // Stage 1: Parallel Summarization (using raw data)
  // Report progress for both stages before running (they run in parallel)
  const stage1Ctx: Stage1Context = {
    input,
    intermediate,
    traces,
    rawMatch: match.raw,
    rawTimeline: match.rawTimeline,
  };

  // For parallel stages, report the first enabled one
  if (stages.timelineSummary.enabled) {
    reportProgress("timeline-summary");
  } else if (stages.matchSummary.enabled) {
    reportProgress("match-summary");
  }

  const stage1Result = await runStage1Parallel(stage1Ctx);

  // Stage 2: Review Text
  reportProgress("review-text");

  // matchSummaryText is only undefined if the stage was explicitly disabled
  const effectiveMatchSummary = stage1Result.matchSummaryText ?? "Match summary stage is disabled.";

  const reviewTextParams: Parameters<typeof generateReviewTextStage>[0] = {
    match: match.processed,
    personality: prompts.personality,
    laneContext: prompts.laneContext,
    playerIndex: player.index,
    matchSummary: effectiveMatchSummary,
    client: clients.openai,
    model: stages.reviewText.model,
    systemPrompt: stages.reviewText.systemPrompt,
    userPrompt: stages.reviewText.userPrompt,
  };
  if (stage1Result.timelineSummaryText !== undefined) {
    reviewTextParams.timelineSummary = stage1Result.timelineSummaryText;
  }

  const reviewResult = await generateReviewTextStage(reviewTextParams);
  traces.reviewText = reviewResult.trace;

  // Build context
  const context: PipelineContext = {
    reviewerName: reviewResult.reviewerName,
    playerName: reviewResult.playerName,
    playerIndex: player.index,
    personality: { name: prompts.personality.metadata.name },
  };
  if (prompts.personality.filename !== undefined) {
    context.personality.filename = prompts.personality.filename;
  }

  // Stage 3 & 4: Image Description and Generation
  const stage3And4Ctx: Stage3And4Context = {
    reviewText: reviewResult.text,
    stages,
    clients,
    traces,
    intermediate,
    imagePrompts: prompts.personality.metadata.image,
    reportProgress,
  };
  const imageResult = await runStage3And4(stage3And4Ctx);

  // Build Final Output
  const reviewOutput: ReviewPipelineOutput["review"] = { text: reviewResult.text };
  if (imageResult.imageBase64 !== undefined) {
    reviewOutput.imageBase64 = imageResult.imageBase64;
  }

  const finalTraces: PipelineTraces = { reviewText: traces.reviewText };
  if (traces.timelineSummary !== undefined) {
    finalTraces.timelineSummary = traces.timelineSummary;
  }
  if (traces.matchSummary !== undefined) {
    finalTraces.matchSummary = traces.matchSummary;
  }
  if (traces.imageDescription !== undefined) {
    finalTraces.imageDescription = traces.imageDescription;
  }
  if (traces.imageGeneration !== undefined) {
    finalTraces.imageGeneration = traces.imageGeneration;
  }

  return { review: reviewOutput, traces: finalTraces, intermediate, context };
}

/**
 * Run Stage 1 with proper dependency handling
 *
 * This helper ensures Stage 1b can use the timeline summary if available.
 * It runs 1a first, then 1b with the timeline summary.
 */
export async function runStage1Sequential(params: { input: ReviewPipelineInput }): Promise<{
  timelineSummaryText?: string;
  timelineSummaryTrace?: StageTrace;
  matchSummaryText?: string;
  matchSummaryTrace?: StageTrace;
}> {
  const { input } = params;
  const { match, player, prompts, clients, stages } = input;

  let timelineSummaryText: string | undefined;
  let timelineSummaryTrace: StageTrace | undefined;

  // Stage 1a: Timeline Summary
  if (stages.timelineSummary.enabled) {
    const result = await generateTimelineSummary({
      rawTimeline: match.rawTimeline,
      rawMatch: match.raw,
      laneContext: prompts.laneContext,
      client: clients.openai,
      model: stages.timelineSummary.model,
      systemPrompt: stages.timelineSummary.systemPrompt,
      userPrompt: stages.timelineSummary.userPrompt,
    });
    timelineSummaryText = result.text;
    timelineSummaryTrace = result.trace;
  }

  let matchSummaryText: string | undefined;
  let matchSummaryTrace: StageTrace | undefined;

  // Stage 1b: Match Summary
  if (stages.matchSummary.enabled) {
    const result = await generateMatchSummary({
      match: match.processed,
      rawMatch: match.raw,
      playerIndex: player.index,
      client: clients.openai,
      model: stages.matchSummary.model,
      systemPrompt: stages.matchSummary.systemPrompt,
      userPrompt: stages.matchSummary.userPrompt,
    });
    matchSummaryText = result.text;
    matchSummaryTrace = result.trace;
  }

  const result: {
    timelineSummaryText?: string;
    timelineSummaryTrace?: StageTrace;
    matchSummaryText?: string;
    matchSummaryTrace?: StageTrace;
  } = {};
  if (timelineSummaryText !== undefined) {
    result.timelineSummaryText = timelineSummaryText;
  }
  if (timelineSummaryTrace !== undefined) {
    result.timelineSummaryTrace = timelineSummaryTrace;
  }
  if (matchSummaryText !== undefined) {
    result.matchSummaryText = matchSummaryText;
  }
  if (matchSummaryTrace !== undefined) {
    result.matchSummaryTrace = matchSummaryTrace;
  }
  return result;
}
