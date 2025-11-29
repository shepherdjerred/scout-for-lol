/* eslint-disable complexity -- Workflow orchestration requires complex sequential logic with many steps */
/**
 * Workflow Orchestrator
 *
 * Orchestrates the complete 5-step AI review workflow:
 * 1a. Match Result Summary
 * 1b. Timeline Summary
 * 2.  Personality Review (with both summaries + randomBehaviors)
 * 3.  Image Description (from review text ONLY)
 * 4.  Image Generation (from description ONLY)
 *
 * All steps capture full request/response for debugging and S3 tracing.
 */

import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import type { RawMatch } from "@scout-for-lol/data/league/raw-match.schema.js";
import type { RawTimeline } from "@scout-for-lol/data/league/raw-timeline.schema.js";
import type { CuratedTimeline } from "./curator-types.js";
import type { CuratedMatchData, Personality, PlayerMetadata } from "./generator.js";
import { curateMatchData } from "./curator.js";
import { selectRandomBehavior } from "./prompts.js";
import {
  summarizeMatchResult,
  summarizeTimelineStep,
  generatePersonalityReview,
  generateImageDescription,
  generateImage,
  type OpenAIClientInterface,
  type GeminiClientInterface,
  type Step1aResult,
  type Step1bResult,
  type Step2Result,
  type Step3Result,
  type Step4Result,
  type WorkflowResult,
} from "./workflow-steps.js";

/**
 * Progress callback for UI updates
 */
export type WorkflowProgressCallback = (progress: {
  step: "setup" | "step1a" | "step1b" | "step2" | "step3" | "step4" | "complete";
  message: string;
  stepResult?: Step1aResult | Step1bResult | Step2Result | Step3Result | Step4Result | undefined;
}) => void;

/**
 * Workflow configuration
 */
export type WorkflowConfig = {
  // Match data
  match: CompletedMatch | ArenaMatch;
  rawMatch?: RawMatch | undefined;
  rawTimeline?: RawTimeline | undefined;

  // Personality and prompts
  personality: Personality;
  basePromptTemplate: string;
  laneContext: string;
  playerMetadata: PlayerMetadata;
  playerIndex: number;

  // Art configuration
  artStyle: string;
  artThemes: string[];

  // AI clients
  openaiClient: OpenAIClientInterface;
  geminiClient?: GeminiClientInterface | undefined;

  // Model configuration
  models?: {
    matchSummary?: string | undefined;
    timelineSummary?: string | undefined;
    personalityReview?: string | undefined;
    imageDescription?: string | undefined;
    imageGeneration?: string | undefined;
  };

  // Generation settings
  textMaxTokens?: number | undefined;
  textTemperature?: number | undefined;
  imageTimeoutMs?: number | undefined;

  // Feature flags
  generateImage?: boolean | undefined;
};

/**
 * Generate a unique workflow ID
 */
function generateWorkflowId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wf_${timestamp}_${random}`;
}

/**
 * Execute the complete AI review workflow
 *
 * This orchestrates all 5 steps in sequence, collecting full request/response
 * data for each step. Steps can fail independently - the workflow continues
 * with available data.
 */
export async function executeWorkflow(
  config: WorkflowConfig,
  matchId: string,
  onProgress?: WorkflowProgressCallback,
): Promise<WorkflowResult> {
  const workflowId = generateWorkflowId();
  const startTime = Date.now();

  const result: WorkflowResult = {
    workflowId,
    matchId,
    startTime,
    endTime: 0,
    totalDurationMs: 0,
    status: "failed",
    steps: {},
    outputs: {},
    metadata: {
      personality: {
        name: config.personality.metadata.name,
        filename: config.personality.filename,
      },
      playerName: config.match.players[config.playerIndex]?.playerConfig.alias,
      playerIndex: config.playerIndex,
      artStyle: config.artStyle,
      artThemes: config.artThemes,
    },
  };

  try {
    // Setup: Curate match data
    onProgress?.({ step: "setup", message: "Curating match data..." });

    let curatedData: CuratedMatchData | undefined;
    let curatedTimeline: CuratedTimeline | undefined;

    if (config.rawMatch) {
      curatedData = await curateMatchData(config.rawMatch, config.rawTimeline);
      curatedTimeline = curatedData.timeline;
    }

    // Select random behavior for personality
    const randomBehavior = selectRandomBehavior(config.personality.metadata.randomBehaviors);
    result.metadata.randomBehavior = randomBehavior;

    // Step 1a: Match Result Summary
    onProgress?.({ step: "step1a", message: "Summarizing match result..." });

    let matchResultSummary: string | undefined;
    if (curatedData) {
      const step1aResult = await summarizeMatchResult({
        match: config.match,
        curatedData,
        openaiClient: config.openaiClient,
        ...(config.models?.matchSummary !== undefined && { model: config.models.matchSummary }),
      });
      result.steps.matchResultSummary = step1aResult;
      onProgress?.({ step: "step1a", message: "Match result summarized", stepResult: step1aResult });

      if (step1aResult.status === "success" && step1aResult.response) {
        matchResultSummary = step1aResult.response.summary;
        result.outputs.matchResultSummary = matchResultSummary;
      }
    } else {
      // Skip step 1a if no curated data
      result.steps.matchResultSummary = {
        stepName: "matchResultSummary",
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        status: "skipped",
        error: "No curated data available",
        request: {
          prompt: "",
          matchData: { match: config.match, curatedData: { gameInfo: { gameDuration: 0, gameMode: "", queueId: 0 }, participants: [] } },
          model: "",
          temperature: 0,
        },
      };
    }

    // Step 1b: Timeline Summary
    onProgress?.({ step: "step1b", message: "Summarizing timeline..." });

    let timelineSummary: string | undefined;
    if (curatedTimeline) {
      const step1bResult = await summarizeTimelineStep({
        curatedTimeline,
        openaiClient: config.openaiClient,
        ...(config.models?.timelineSummary !== undefined && { model: config.models.timelineSummary }),
      });
      result.steps.timelineSummary = step1bResult;
      onProgress?.({ step: "step1b", message: "Timeline summarized", stepResult: step1bResult });

      if (step1bResult.status === "success" && step1bResult.response) {
        timelineSummary = step1bResult.response.summary;
        result.outputs.timelineSummary = timelineSummary;
      }
    } else {
      // Skip step 1b if no timeline
      result.steps.timelineSummary = {
        stepName: "timelineSummary",
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        status: "skipped",
        error: "No timeline data available",
        request: {
          prompt: "",
          timelineData: {
            keyEvents: [],
            snapshots: [],
            summary: { totalKills: 0, dragonsKilled: [], baronsKilled: [], riftHeraldsKilled: [] },
          },
          model: "",
          temperature: 0,
        },
      };
    }

    // Step 2: Personality Review
    onProgress?.({ step: "step2", message: "Generating personality review..." });

    const step2Result = await generatePersonalityReview({
      match: config.match,
      personality: config.personality,
      basePromptTemplate: config.basePromptTemplate,
      laneContext: config.laneContext,
      playerMetadata: config.playerMetadata,
      matchResultSummary: matchResultSummary ?? "Match data not available.",
      timelineSummary: timelineSummary ?? "Timeline not available.",
      randomBehavior,
      playerIndex: config.playerIndex,
      openaiClient: config.openaiClient,
      ...(config.models?.personalityReview !== undefined && { model: config.models.personalityReview }),
      ...(config.textMaxTokens !== undefined && { maxTokens: config.textMaxTokens }),
      ...(config.textTemperature !== undefined && { temperature: config.textTemperature }),
    });
    result.steps.personalityReview = step2Result;
    onProgress?.({ step: "step2", message: "Personality review generated", stepResult: step2Result });

    let reviewText: string | undefined;
    if (step2Result.status === "success" && step2Result.response) {
      reviewText = step2Result.response.reviewText;
      result.outputs.reviewText = reviewText;
    }

    // Step 3: Image Description (only if we have review text)
    if (reviewText && config.generateImage !== false) {
      onProgress?.({ step: "step3", message: "Generating image description..." });

      const step3Result = await generateImageDescription({
        reviewText,
        artStyle: config.artStyle,
        artThemes: config.artThemes,
        openaiClient: config.openaiClient,
        ...(config.models?.imageDescription !== undefined && { model: config.models.imageDescription }),
      });
      result.steps.imageDescription = step3Result;
      onProgress?.({ step: "step3", message: "Image description generated", stepResult: step3Result });

      let imageDescription: string | undefined;
      if (step3Result.status === "success" && step3Result.response) {
        imageDescription = step3Result.response.imageDescription;
        result.outputs.imageDescription = imageDescription;
      }

      // Step 4: Image Generation (only if we have description and Gemini client)
      if (imageDescription && config.geminiClient) {
        onProgress?.({ step: "step4", message: "Generating image..." });

        const step4Result = await generateImage({
          imageDescription,
          artStyle: config.artStyle,
          artThemes: config.artThemes,
          geminiClient: config.geminiClient,
          ...(config.models?.imageGeneration !== undefined && { model: config.models.imageGeneration }),
          ...(config.imageTimeoutMs !== undefined && { timeoutMs: config.imageTimeoutMs }),
        });
        result.steps.imageGeneration = step4Result;
        onProgress?.({ step: "step4", message: "Image generated", stepResult: step4Result });

        if (step4Result.status === "success" && step4Result.response) {
          result.outputs.imageBase64 = step4Result.response.imageBase64;
        }
      }
    }

    // Determine final status
    const hasReview = Boolean(result.outputs.reviewText);
    const hasImage = Boolean(result.outputs.imageBase64);
    const wantedImage = config.generateImage !== false && config.geminiClient !== undefined;

    if (hasReview && (!wantedImage || hasImage)) {
      result.status = "success";
    } else if (hasReview) {
      result.status = "partial";
    } else {
      result.status = "failed";
    }

    result.endTime = Date.now();
    result.totalDurationMs = result.endTime - startTime;

    onProgress?.({ step: "complete", message: "Workflow complete" });

    return result;
  } catch (_error) {
    result.endTime = Date.now();
    result.totalDurationMs = result.endTime - startTime;
    result.status = "failed";
    return result;
  }
}
