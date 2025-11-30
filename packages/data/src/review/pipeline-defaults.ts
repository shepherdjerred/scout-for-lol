/**
 * Default configurations and system prompts for the unified AI review pipeline
 *
 * This module contains all the default values that can be overridden by callers.
 */

import type { PipelineStagesConfig, ModelConfig, StageConfig, ImageGenerationStageConfig } from "./pipeline-types.ts";

// ============================================================================
// System Prompts
// ============================================================================

/**
 * System prompt for Stage 1a: Timeline Summary
 *
 * Summarizes curated timeline data (kills, objectives, towers, gold snapshots)
 * into a concise narrative of how the game unfolded.
 */
export const TIMELINE_SUMMARY_SYSTEM_PROMPT = `You are a League of Legends analyst. Analyze this match timeline data and provide a concise summary of how the game unfolded.

The timeline contains key events (kills, objectives, towers) and gold snapshots at intervals. Teams are "Blue" and "Red". Players are identified by champion name.

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 900 words. Reference players by their champion name.`;

/**
 * System prompt for Stage 1b: Match Summary
 *
 * Summarizes match data for a single player's performance.
 * Output is factual and will be used by the personality reviewer.
 */
// TODO: include the lane context in the system prompt
export const MATCH_SUMMARY_SYSTEM_PROMPT = `You are a League of Legends analyst who writes concise match summaries for a single player's performance.

Use the provided match data to summarize:
- The player's overall performance (KDA, damage, objectives)
- Key moments that defined their game
- How their lane/role went
- Their contribution to team fights and objectives

Keep it factual, grounded in the numbers provided, and under 750 words. Focus on facts not opinions.`;

/**
 * System prompt for Stage 3: Image Description
 *
 * Turns a review into a vivid image concept for Gemini to generate.
 */
export const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.
Focus on the mood, key moments, and emotions from the review text.
Describe one vivid scene with the focal action, characters, and environment.
Include composition ideas, color palette, and mood direction.
Keep it under 160 words.`;

// ============================================================================
// Default Model Configurations
// ============================================================================

/**
 * Default model config for timeline summary (Stage 1a)
 */
export const DEFAULT_TIMELINE_SUMMARY_MODEL: ModelConfig = {
  model: "gpt-4o-mini",
  maxTokens: 6000,
  temperature: 0.3,
};

/**
 * Default model config for match summary (Stage 1b)
 */
export const DEFAULT_MATCH_SUMMARY_MODEL: ModelConfig = {
  model: "gpt-4o-mini",
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
 * Default configuration for image generation stage
 */
const DEFAULT_IMAGE_GENERATION_STAGE: ImageGenerationStageConfig = {
  enabled: true,
  model: DEFAULT_IMAGE_GENERATION_MODEL,
  timeoutMs: DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
};

/**
 * Complete default stage configurations
 *
 * Can be used as a starting point and overridden per-stage by callers.
 */
export const DEFAULT_STAGE_CONFIGS: PipelineStagesConfig = {
  timelineSummary: DEFAULT_TIMELINE_SUMMARY_STAGE,
  matchSummary: DEFAULT_MATCH_SUMMARY_STAGE,
  reviewText: {
    model: DEFAULT_REVIEW_TEXT_MODEL,
  },
  imageDescription: DEFAULT_IMAGE_DESCRIPTION_STAGE,
  imageGeneration: DEFAULT_IMAGE_GENERATION_STAGE,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create stage configs with custom overrides
 *
 * Merges custom overrides with defaults, allowing partial overrides.
 */
export function createStageConfigs(overrides?: Partial<PipelineStagesConfig>): PipelineStagesConfig {
  if (!overrides) {
    return DEFAULT_STAGE_CONFIGS;
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
      ...DEFAULT_IMAGE_GENERATION_STAGE,
      ...overrides.imageGeneration,
    },
  };
}

/**
 * Get the system prompt for a stage, using override if provided
 */
export function getStageSystemPrompt(
  stage: "timelineSummary" | "matchSummary" | "imageDescription",
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
    case "imageDescription":
      return IMAGE_DESCRIPTION_SYSTEM_PROMPT;
  }
}
