/**
 * Unified AI Review Pipeline
 *
 * This is the main entry point for generating AI-powered match reviews.
 * It orchestrates all stages of the pipeline and returns a complete result
 * with traces for observability.
 *
 * Pipeline stages:
 * 1a. Timeline Summary - Summarize timeline JSON to text (parallel with 1b)
 * 1b. Match Summary - Summarize match JSON to text (parallel with 1a)
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
} from "./pipeline-types.ts";
import type { CuratedMatchData, CuratedTimeline } from "./curator-types.ts";
import {
  generateTimelineSummary,
  generateMatchSummary,
  generateReviewTextStage,
  generateImageDescription,
  generateImage,
} from "./pipeline-stages.ts";
import { curateMatchData } from "./curator.ts";

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
  curatedData?: CuratedMatchData;
  curatedTimeline?: CuratedTimeline;
  intermediate: PipelineIntermediateResults;
  traces: Partial<PipelineTraces>;
};

type Stage3And4Context = {
  reviewText: string;
  stages: PipelineStagesConfig;
  clients: PipelineClientsInput;
  traces: Partial<PipelineTraces>;
  intermediate: PipelineIntermediateResults;
};

type Stage3And4Result = {
  imageDescriptionText?: string;
  imageBase64?: string;
};

// ============================================================================
// Stage 1 Helpers
// ============================================================================

async function runTimelineSummary(ctx: Stage1Context): Promise<{ text: string; trace: StageTrace } | undefined> {
  const { input, curatedTimeline } = ctx;
  const { clients, stages } = input;

  if (!stages.timelineSummary.enabled || !curatedTimeline) {
    return undefined;
  }

  try {
    const params: Parameters<typeof generateTimelineSummary>[0] = {
      curatedTimeline,
      client: clients.openai,
      model: stages.timelineSummary.model,
    };
    if (stages.timelineSummary.systemPrompt !== undefined) {
      params.systemPromptOverride = stages.timelineSummary.systemPrompt;
    }
    return await generateTimelineSummary(params);
  } catch (error) {
    console.error("[Pipeline Stage 1a] Timeline summary failed:", error);
    return undefined;
  }
}

async function runMatchSummary(ctx: Stage1Context): Promise<{ text: string; trace: StageTrace } | undefined> {
  const { input, curatedData } = ctx;
  const { match, player, prompts, clients, stages } = input;

  if (!stages.matchSummary.enabled || !curatedData) {
    return undefined;
  }

  try {
    const params: Parameters<typeof generateMatchSummary>[0] = {
      match: match.processed,
      curatedData,
      playerIndex: player.index,
      laneContext: prompts.laneContext,
      client: clients.openai,
      model: stages.matchSummary.model,
    };
    if (stages.matchSummary.systemPrompt !== undefined) {
      params.systemPromptOverride = stages.matchSummary.systemPrompt;
    }
    return await generateMatchSummary(params);
  } catch (error) {
    console.error("[Pipeline Stage 1b] Match summary failed:", error);
    return undefined;
  }
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
  const { reviewText, stages, clients, traces, intermediate } = ctx;

  if (!stages.imageDescription.enabled) {
    return undefined;
  }

  try {
    const params: Parameters<typeof generateImageDescription>[0] = {
      reviewText,
      client: clients.openai,
      model: stages.imageDescription.model,
    };
    if (stages.imageDescription.systemPrompt !== undefined) {
      params.systemPromptOverride = stages.imageDescription.systemPrompt;
    }

    const result = await generateImageDescription(params);
    traces.imageDescription = result.trace;
    intermediate.imageDescriptionText = result.text;
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
    });
    traces.imageGeneration = result.trace;
    return result.imageBase64;
  } catch (error) {
    console.error("[Pipeline Stage 4] Image generation failed:", error);
    return undefined;
  }
}

async function runStage3And4(ctx: Stage3And4Context): Promise<Stage3And4Result> {
  const result: Stage3And4Result = {};

  const imageDescriptionText = await runStage3ImageDescription(ctx);
  if (imageDescriptionText !== undefined) {
    result.imageDescriptionText = imageDescriptionText;
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
  const { match, player, prompts, clients, stages } = input;

  // Initialize output structures
  const traces: Partial<PipelineTraces> = {};
  const intermediate: PipelineIntermediateResults = {};

  // Data Preparation - curate raw match data if provided
  let curatedData: CuratedMatchData | undefined;
  let curatedTimeline: CuratedTimeline | undefined;

  if (match.raw) {
    curatedData = await curateMatchData(match.raw, match.rawTimeline);
    intermediate.curatedData = curatedData;
    if (curatedData.timeline) {
      curatedTimeline = curatedData.timeline;
      intermediate.curatedTimeline = curatedTimeline;
    }
  }

  // Stage 1: Parallel Summarization
  const stage1Ctx: Stage1Context = { input, intermediate, traces };
  if (curatedData !== undefined) {
    stage1Ctx.curatedData = curatedData;
  }
  if (curatedTimeline !== undefined) {
    stage1Ctx.curatedTimeline = curatedTimeline;
  }
  const stage1Result = await runStage1Parallel(stage1Ctx);

  // Stage 2: Review Text
  const effectiveMatchSummary =
    stage1Result.matchSummaryText ??
    "No match summary was generated. Please analyze the player's performance based on available context.";

  const reviewTextParams: Parameters<typeof generateReviewTextStage>[0] = {
    match: match.processed,
    personality: prompts.personality,
    basePromptTemplate: prompts.baseTemplate,
    laneContext: prompts.laneContext,
    playerMetadata: player.metadata,
    playerIndex: player.index,
    matchSummary: effectiveMatchSummary,
    client: clients.openai,
    model: stages.reviewText.model,
  };
  if (curatedData !== undefined) {
    reviewTextParams.curatedData = curatedData;
  }
  if (stage1Result.timelineSummaryText !== undefined) {
    reviewTextParams.timelineSummary = stage1Result.timelineSummaryText;
  }
  if (prompts.systemPromptPrefix !== undefined) {
    reviewTextParams.systemPromptPrefix = prompts.systemPromptPrefix;
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
export async function runStage1Sequential(params: {
  input: ReviewPipelineInput;
  curatedData?: CuratedMatchData;
  curatedTimeline?: CuratedTimeline;
}): Promise<{
  timelineSummaryText?: string;
  timelineSummaryTrace?: StageTrace;
  matchSummaryText?: string;
  matchSummaryTrace?: StageTrace;
}> {
  const { input, curatedData, curatedTimeline } = params;
  const { match, player, prompts, clients, stages } = input;

  let timelineSummaryText: string | undefined;
  let timelineSummaryTrace: StageTrace | undefined;

  // Stage 1a: Timeline Summary
  if (stages.timelineSummary.enabled && curatedTimeline) {
    try {
      const timelineParams: Parameters<typeof generateTimelineSummary>[0] = {
        curatedTimeline,
        client: clients.openai,
        model: stages.timelineSummary.model,
      };
      if (stages.timelineSummary.systemPrompt !== undefined) {
        timelineParams.systemPromptOverride = stages.timelineSummary.systemPrompt;
      }
      const result = await generateTimelineSummary(timelineParams);
      timelineSummaryText = result.text;
      timelineSummaryTrace = result.trace;
    } catch (error) {
      console.error("[Stage 1a] Timeline summary failed:", error);
    }
  }

  let matchSummaryText: string | undefined;
  let matchSummaryTrace: StageTrace | undefined;

  // Stage 1b: Match Summary (with timeline summary if available)
  if (stages.matchSummary.enabled && curatedData) {
    try {
      const matchParams: Parameters<typeof generateMatchSummary>[0] = {
        match: match.processed,
        curatedData,
        playerIndex: player.index,
        laneContext: prompts.laneContext,
        client: clients.openai,
        model: stages.matchSummary.model,
      };
      if (timelineSummaryText !== undefined) {
        matchParams.timelineSummary = timelineSummaryText;
      }
      if (stages.matchSummary.systemPrompt !== undefined) {
        matchParams.systemPromptOverride = stages.matchSummary.systemPrompt;
      }
      const result = await generateMatchSummary(matchParams);
      matchSummaryText = result.text;
      matchSummaryTrace = result.trace;
    } catch (error) {
      console.error("[Stage 1b] Match summary failed:", error);
    }
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
