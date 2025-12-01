/**
 * Default configurations and system prompts for the unified AI review pipeline
 *
 * This module contains all the default values that can be overridden by callers.
 */

import type { PipelineStagesConfig, ModelConfig, StageConfig, ImageGenerationStageConfig } from "./pipeline-types.ts";
import { selectRandomStyle } from "@scout-for-lol/data/review/art-styles.ts";

// Import system prompts from TXT files
import TIMELINE_SUMMARY_SYSTEM_PROMPT_RAW from "./prompts/system/1b-timeline-summary.txt";
import MATCH_SUMMARY_SYSTEM_PROMPT_RAW from "./prompts/system/1a-match-summary.txt";
import REVIEW_TEXT_SYSTEM_PROMPT_RAW from "./prompts/system/2-review-text.txt";
import IMAGE_DESCRIPTION_SYSTEM_PROMPT_RAW from "./prompts/system/3-image-description.txt";

// Import user prompts from TXT files
import TIMELINE_SUMMARY_USER_PROMPT_RAW from "./prompts/user/1b-timeline-summary.txt";
import MATCH_SUMMARY_USER_PROMPT_RAW from "./prompts/user/1a-match-summary.txt";
import REVIEW_TEXT_USER_PROMPT_RAW from "./prompts/user/2-review-text.txt";
import IMAGE_DESCRIPTION_USER_PROMPT_RAW from "./prompts/user/3-image-description.txt";
import IMAGE_GENERATION_USER_PROMPT_RAW from "./prompts/user/4-image-generation.txt";

// ============================================================================
// System Prompts
// ============================================================================

/**
 * System prompt for Stage 1a: Timeline Summary
 *
 * Summarizes curated timeline data (kills, objectives, towers, gold snapshots)
 * into a concise narrative of how the game unfolded.
 */
export const TIMELINE_SUMMARY_SYSTEM_PROMPT = TIMELINE_SUMMARY_SYSTEM_PROMPT_RAW.trim();

/**
 * System prompt for Stage 1b: Match Summary
 *
 * Summarizes match data for a single player's performance.
 * Output is factual and will be used by the personality reviewer.
 */
// TODO: include the lane context in the system prompt
export const MATCH_SUMMARY_SYSTEM_PROMPT = MATCH_SUMMARY_SYSTEM_PROMPT_RAW.trim();

/**
 * System prompt for Stage 2: Review Text
 *
 * Uses the personality instructions, style card, and lane context
 * to guide the review generation.
 */
export const REVIEW_TEXT_SYSTEM_PROMPT = REVIEW_TEXT_SYSTEM_PROMPT_RAW.trim();

/**
 * System prompt for Stage 3: Image Description
 *
 * Turns a review into a vivid image concept for Gemini to generate.
 */
export const IMAGE_DESCRIPTION_SYSTEM_PROMPT = IMAGE_DESCRIPTION_SYSTEM_PROMPT_RAW.trim();

// ============================================================================
// User Prompts (Templates with variables)
// ============================================================================

/**
 * User prompt template for Stage 1a: Timeline Summary
 *
 * Variables:
 * - <TIMELINE_DATA> - Minified JSON of enriched timeline data
 */
export const TIMELINE_SUMMARY_USER_PROMPT = TIMELINE_SUMMARY_USER_PROMPT_RAW.trim();

/**
 * User prompt template for Stage 1b: Match Summary
 *
 * Variables:
 * - <PLAYER_NAME> - Player alias
 * - <PLAYER_CHAMPION> - Champion name
 * - <PLAYER_LANE> - Lane (or "arena" for arena queue)
 * - <MATCH_DATA> - Minified JSON containing both processedMatch and rawMatch
 */
export const MATCH_SUMMARY_USER_PROMPT = MATCH_SUMMARY_USER_PROMPT_RAW.trim();

/**
 * User prompt template for Stage 2: Review Text
 *
 * Variables:
 * - <REVIEWER NAME> - Personality name
 * - <PLAYER NAME> - Player being reviewed
 * - <PLAYER CHAMPION> - Their champion
 * - <PLAYER LANE> - Their lane
 * - <OPPONENT CHAMPION> - Enemy laner's champion
 * - <FRIENDS CONTEXT> - Info about other tracked players in match
 * - <RANDOM BEHAVIOR> - Random personality-specific behavior
 * - <MATCH ANALYSIS> - Text output from Stage 1b (match summary)
 * - <QUEUE CONTEXT> - Queue type and context
 * - <REVIEWER PERSONALITY> - Personality instructions text (from style card)
 */
export const REVIEW_TEXT_USER_PROMPT = REVIEW_TEXT_USER_PROMPT_RAW.trim();

/**
 * User prompt template for Stage 3: Image Description
 *
 * Variables:
 * - <REVIEW_TEXT> - Output from Stage 2
 * - <ART_STYLE> - Selected art style description
 */
export const IMAGE_DESCRIPTION_USER_PROMPT = IMAGE_DESCRIPTION_USER_PROMPT_RAW.trim();

/**
 * User prompt template for Stage 4: Image Generation
 *
 * Variables:
 * - <IMAGE_DESCRIPTION> - Output from Stage 3
 */
export const IMAGE_GENERATION_USER_PROMPT = IMAGE_GENERATION_USER_PROMPT_RAW.trim();

// ============================================================================
// Default Model Configurations
// ============================================================================

/**
 * Default model config for timeline summary (Stage 1a)
 *
 * TODO: We use gpt-5.1 (400k context) instead of gpt-4o-mini (128k context) because
 * the full raw timeline from Riot API can be 100k+ tokens (one frame per minute with
 * 10 participants' detailed stats + hundreds of events). Filtering the timeline to
 * fit in 128k would lose important game narrative data. Consider switching back to
 * gpt-4o-mini if costs become a concern, but would require implementing timeline
 * segmentation (e.g., summarize 10-min chunks separately then combine).
 */
export const DEFAULT_TIMELINE_SUMMARY_MODEL: ModelConfig = {
  model: "gpt-5.1",
  maxTokens: 6000,
  temperature: 0.3,
};

/**
 * Default model config for match summary (Stage 1b)
 *
 * TODO: We use gpt-5.1 (400k context) instead of gpt-4o-mini (128k context) because
 * the full raw match from Riot API can be 100k+ tokens (10 players × 150+ fields each,
 * including challenges, perks, missions). Filtering would lose detailed stats that
 * help the AI understand player performance. Consider switching back to gpt-4o-mini
 * if costs become a concern, but would require significant data filtering.
 */
export const DEFAULT_MATCH_SUMMARY_MODEL: ModelConfig = {
  model: "gpt-5.1",
  maxTokens: 6000,
  temperature: 0.4,
};

/**
 * Default model config for review text (Stage 2)
 */
export const DEFAULT_REVIEW_TEXT_MODEL: ModelConfig = {
  model: "gpt-5.1",
  maxTokens: 3000,
};

/**
 * Default model config for image description (Stage 3)
 */
export const DEFAULT_IMAGE_DESCRIPTION_MODEL: ModelConfig = {
  model: "gpt-5.1",
  maxTokens: 1800,
  temperature: 0.8,
};

/**
 * Default model for image generation (Stage 4)
 */
export const DEFAULT_IMAGE_GENERATION_MODEL = "gemini-3-pro-image-preview";

/**
 * Default timeout for image generation (Stage 4)
 */
export const DEFAULT_IMAGE_GENERATION_TIMEOUT_MS = 60_000;

// ============================================================================
// Default Stage Configurations
// ============================================================================

/**
 * Default configuration for timeline summary stage
 */
const DEFAULT_TIMELINE_SUMMARY_STAGE: StageConfig = {
  enabled: true,
  model: DEFAULT_TIMELINE_SUMMARY_MODEL,
  systemPrompt: TIMELINE_SUMMARY_SYSTEM_PROMPT,
};

/**
 * Default configuration for match summary stage
 */
const DEFAULT_MATCH_SUMMARY_STAGE: StageConfig = {
  enabled: true,
  model: DEFAULT_MATCH_SUMMARY_MODEL,
  systemPrompt: MATCH_SUMMARY_SYSTEM_PROMPT,
};

/**
 * Default configuration for image description stage
 */
const DEFAULT_IMAGE_DESCRIPTION_STAGE: StageConfig = {
  enabled: true,
  model: DEFAULT_IMAGE_DESCRIPTION_MODEL,
  systemPrompt: IMAGE_DESCRIPTION_SYSTEM_PROMPT,
};

/**
 * Create default configuration for image generation stage
 * Selects a random art style for each call
 */
function createDefaultImageGenerationStage(): ImageGenerationStageConfig {
  return {
    enabled: true,
    model: DEFAULT_IMAGE_GENERATION_MODEL,
    timeoutMs: DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
    artStyle: selectRandomStyle(),
  };
}

/**
 * Create complete default stage configurations
 *
 * Returns a new config each time to ensure fresh random art style selection.
 * Use this instead of a constant to get proper per-generation randomization.
 */
export function getDefaultStageConfigs(): PipelineStagesConfig {
  return {
    timelineSummary: DEFAULT_TIMELINE_SUMMARY_STAGE,
    matchSummary: DEFAULT_MATCH_SUMMARY_STAGE,
    reviewText: {
      model: DEFAULT_REVIEW_TEXT_MODEL,
    },
    imageDescription: DEFAULT_IMAGE_DESCRIPTION_STAGE,
    imageGeneration: createDefaultImageGenerationStage(),
  };
}

/**
 * @deprecated Use getDefaultStageConfigs() instead to get fresh random art style per generation
 */
export const DEFAULT_STAGE_CONFIGS: PipelineStagesConfig = {
  timelineSummary: DEFAULT_TIMELINE_SUMMARY_STAGE,
  matchSummary: DEFAULT_MATCH_SUMMARY_STAGE,
  reviewText: {
    model: DEFAULT_REVIEW_TEXT_MODEL,
  },
  imageDescription: DEFAULT_IMAGE_DESCRIPTION_STAGE,
  imageGeneration: createDefaultImageGenerationStage(),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create stage configs with custom overrides
 *
 * Merges custom overrides with defaults, allowing partial overrides.
 * Selects a fresh random art style if not provided in overrides.
 */
export function createStageConfigs(overrides?: Partial<PipelineStagesConfig>): PipelineStagesConfig {
  const defaultImageGeneration = createDefaultImageGenerationStage();

  if (!overrides) {
    return {
      timelineSummary: DEFAULT_TIMELINE_SUMMARY_STAGE,
      matchSummary: DEFAULT_MATCH_SUMMARY_STAGE,
      reviewText: {
        model: DEFAULT_REVIEW_TEXT_MODEL,
      },
      imageDescription: DEFAULT_IMAGE_DESCRIPTION_STAGE,
      imageGeneration: defaultImageGeneration,
    };
  }

  return {
    timelineSummary: {
      ...DEFAULT_TIMELINE_SUMMARY_STAGE,
      ...overrides.timelineSummary,
      model: {
        ...DEFAULT_TIMELINE_SUMMARY_MODEL,
        ...overrides.timelineSummary?.model,
      },
    },
    matchSummary: {
      ...DEFAULT_MATCH_SUMMARY_STAGE,
      ...overrides.matchSummary,
      model: {
        ...DEFAULT_MATCH_SUMMARY_MODEL,
        ...overrides.matchSummary?.model,
      },
    },
    reviewText: {
      model: {
        ...DEFAULT_REVIEW_TEXT_MODEL,
        ...overrides.reviewText?.model,
      },
    },
    imageDescription: {
      ...DEFAULT_IMAGE_DESCRIPTION_STAGE,
      ...overrides.imageDescription,
      model: {
        ...DEFAULT_IMAGE_DESCRIPTION_MODEL,
        ...overrides.imageDescription?.model,
      },
    },
    imageGeneration: {
      ...defaultImageGeneration,
      ...overrides.imageGeneration,
    },
  };
}

/**
 * Get the system prompt for a stage, using override if provided
 */
export function getStageSystemPrompt(
  stage: "timelineSummary" | "matchSummary" | "reviewText" | "imageDescription",
  override?: string,
): string {
  if (override) {
    return override;
  }

  switch (stage) {
    case "timelineSummary":
      return TIMELINE_SUMMARY_SYSTEM_PROMPT;
    case "matchSummary":
      return MATCH_SUMMARY_SYSTEM_PROMPT;
    case "reviewText":
      return REVIEW_TEXT_SYSTEM_PROMPT;
    case "imageDescription":
      return IMAGE_DESCRIPTION_SYSTEM_PROMPT;
  }
}

/**
 * Get the user prompt template for a stage, using override if provided
 */
export function getStageUserPrompt(
  stage: "timelineSummary" | "matchSummary" | "reviewText" | "imageDescription" | "imageGeneration",
  override?: string,
): string {
  if (override) {
    return override;
  }

  switch (stage) {
    case "timelineSummary":
      return TIMELINE_SUMMARY_USER_PROMPT;
    case "matchSummary":
      return MATCH_SUMMARY_USER_PROMPT;
    case "reviewText":
      return REVIEW_TEXT_USER_PROMPT;
    case "imageDescription":
      return IMAGE_DESCRIPTION_USER_PROMPT;
    case "imageGeneration":
      return IMAGE_GENERATION_USER_PROMPT;
  }
}
