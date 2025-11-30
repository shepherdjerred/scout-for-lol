/**
 * Review generation logic - UI wrapper over shared data package unified pipeline
 *
 * This is a thin wrapper that:
 * 1. Resolves personality and prompts from UI config
 * 2. Initializes AI clients with user-provided API keys
 * 3. Calls the unified generateFullMatchReview() pipeline
 * 4. Returns results with traces for UI display
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  generateFullMatchReview,
  type ArenaMatch,
  type CompletedMatch,
  type RawMatch,
  type RawTimeline,
  type ReviewPipelineOutput,
  type PipelineStagesConfig,
} from "@scout-for-lol/data";
import type { ReviewConfig, GenerationResult, GenerationMetadata, Personality } from "./config/schema.ts";
import { createDefaultPipelineStages } from "./config/schema.ts";
import {
  getBasePrompt,
  selectRandomPersonality,
  getPersonalityById,
  getLaneContext,
  getGenericPlayerMetadata,
} from "./prompts.ts";

export type GenerationStep = "text" | "image" | "complete";

export type GenerationProgress = {
  step: GenerationStep;
  message: string;
};

/**
 * Resolve personality from config
 */
function resolvePersonality(config: ReviewConfig): Personality {
  if (config.prompts.customPersonality) {
    return config.prompts.customPersonality;
  }
  if (config.prompts.personalityId === "random") {
    return selectRandomPersonality();
  }
  const found = getPersonalityById(config.prompts.personalityId);
  if (!found) {
    throw new Error(`Personality not found: ${config.prompts.personalityId}`);
  }
  return found;
}

/**
 * Convert frontend stages config to data package format
 *
 * We need to manually rebuild each object to handle exactOptionalPropertyTypes
 * which requires conditional property assignment for optional fields.
 */
function convertStagesToDataPackageFormat(stages: NonNullable<ReviewConfig["stages"]>): PipelineStagesConfig {
  // Build timeline summary stage
  const timelineSummaryModel: PipelineStagesConfig["timelineSummary"]["model"] = {
    model: stages.timelineSummary.model.model,
    maxTokens: stages.timelineSummary.model.maxTokens,
  };
  if (stages.timelineSummary.model.temperature !== undefined) {
    timelineSummaryModel.temperature = stages.timelineSummary.model.temperature;
  }
  if (stages.timelineSummary.model.topP !== undefined) {
    timelineSummaryModel.topP = stages.timelineSummary.model.topP;
  }
  const timelineSummary: PipelineStagesConfig["timelineSummary"] = {
    enabled: stages.timelineSummary.enabled,
    model: timelineSummaryModel,
  };
  if (stages.timelineSummary.systemPrompt !== undefined) {
    timelineSummary.systemPrompt = stages.timelineSummary.systemPrompt;
  }

  // Build match summary stage
  const matchSummaryModel: PipelineStagesConfig["matchSummary"]["model"] = {
    model: stages.matchSummary.model.model,
    maxTokens: stages.matchSummary.model.maxTokens,
  };
  if (stages.matchSummary.model.temperature !== undefined) {
    matchSummaryModel.temperature = stages.matchSummary.model.temperature;
  }
  if (stages.matchSummary.model.topP !== undefined) {
    matchSummaryModel.topP = stages.matchSummary.model.topP;
  }
  const matchSummary: PipelineStagesConfig["matchSummary"] = {
    enabled: stages.matchSummary.enabled,
    model: matchSummaryModel,
  };
  if (stages.matchSummary.systemPrompt !== undefined) {
    matchSummary.systemPrompt = stages.matchSummary.systemPrompt;
  }

  // Build review text stage
  const reviewTextModel: PipelineStagesConfig["reviewText"]["model"] = {
    model: stages.reviewText.model.model,
    maxTokens: stages.reviewText.model.maxTokens,
  };
  if (stages.reviewText.model.temperature !== undefined) {
    reviewTextModel.temperature = stages.reviewText.model.temperature;
  }
  if (stages.reviewText.model.topP !== undefined) {
    reviewTextModel.topP = stages.reviewText.model.topP;
  }

  // Build image description stage
  const imageDescriptionModel: PipelineStagesConfig["imageDescription"]["model"] = {
    model: stages.imageDescription.model.model,
    maxTokens: stages.imageDescription.model.maxTokens,
  };
  if (stages.imageDescription.model.temperature !== undefined) {
    imageDescriptionModel.temperature = stages.imageDescription.model.temperature;
  }
  if (stages.imageDescription.model.topP !== undefined) {
    imageDescriptionModel.topP = stages.imageDescription.model.topP;
  }
  const imageDescription: PipelineStagesConfig["imageDescription"] = {
    enabled: stages.imageDescription.enabled,
    model: imageDescriptionModel,
  };
  if (stages.imageDescription.systemPrompt !== undefined) {
    imageDescription.systemPrompt = stages.imageDescription.systemPrompt;
  }

  return {
    timelineSummary,
    matchSummary,
    reviewText: { model: reviewTextModel },
    imageDescription,
    imageGeneration: {
      enabled: stages.imageGeneration.enabled,
      model: stages.imageGeneration.model,
      timeoutMs: stages.imageGeneration.timeoutMs,
    },
  };
}

/**
 * Get pipeline stages config from ReviewConfig
 * Falls back to default if not provided
 */
function getStagesConfig(config: ReviewConfig): PipelineStagesConfig {
  if (config.stages) {
    return convertStagesToDataPackageFormat(config.stages);
  }

  // Fall back to defaults, but override with legacy textGeneration/imageGeneration settings
  const defaults = createDefaultPipelineStages();

  // Build review text model config carefully for exactOptionalPropertyTypes
  const reviewTextModel: PipelineStagesConfig["reviewText"]["model"] = {
    model: config.textGeneration.model,
    maxTokens: config.textGeneration.maxTokens,
    temperature: config.textGeneration.temperature,
    topP: config.textGeneration.topP,
  };

  // Build the result object piece by piece to handle exactOptionalPropertyTypes correctly
  const result: PipelineStagesConfig = {
    timelineSummary: {
      enabled: defaults.timelineSummary.enabled,
      model: {
        model: defaults.timelineSummary.model.model,
        maxTokens: defaults.timelineSummary.model.maxTokens,
      },
    },
    matchSummary: {
      enabled: defaults.matchSummary.enabled,
      model: {
        model: defaults.matchSummary.model.model,
        maxTokens: defaults.matchSummary.model.maxTokens,
      },
    },
    reviewText: {
      model: reviewTextModel,
    },
    imageDescription: {
      enabled: defaults.imageDescription.enabled,
      model: {
        model: defaults.imageDescription.model.model,
        maxTokens: defaults.imageDescription.model.maxTokens,
      },
    },
    imageGeneration: {
      enabled: config.imageGeneration.enabled,
      model: config.imageGeneration.model,
      timeoutMs: config.imageGeneration.timeoutMs,
    },
  };

  // Add optional properties
  if (defaults.timelineSummary.model.temperature !== undefined) {
    result.timelineSummary.model.temperature = defaults.timelineSummary.model.temperature;
  }
  if (defaults.timelineSummary.model.topP !== undefined) {
    result.timelineSummary.model.topP = defaults.timelineSummary.model.topP;
  }
  if (defaults.timelineSummary.systemPrompt !== undefined) {
    result.timelineSummary.systemPrompt = defaults.timelineSummary.systemPrompt;
  }

  if (defaults.matchSummary.model.temperature !== undefined) {
    result.matchSummary.model.temperature = defaults.matchSummary.model.temperature;
  }
  if (defaults.matchSummary.model.topP !== undefined) {
    result.matchSummary.model.topP = defaults.matchSummary.model.topP;
  }
  if (defaults.matchSummary.systemPrompt !== undefined) {
    result.matchSummary.systemPrompt = defaults.matchSummary.systemPrompt;
  }

  if (defaults.imageDescription.model.temperature !== undefined) {
    result.imageDescription.model.temperature = defaults.imageDescription.model.temperature;
  }
  if (defaults.imageDescription.model.topP !== undefined) {
    result.imageDescription.model.topP = defaults.imageDescription.model.topP;
  }
  if (defaults.imageDescription.systemPrompt !== undefined) {
    result.imageDescription.systemPrompt = defaults.imageDescription.systemPrompt;
  }

  return result;
}

/**
 * Build generation metadata from pipeline output
 */
function buildGenerationMetadata(pipelineOutput: ReviewPipelineOutput): GenerationMetadata {
  const { traces, intermediate, context } = pipelineOutput;

  // Calculate total image duration if image was generated
  let imageDurationMs: number | undefined;
  if (traces.imageDescription) {
    imageDurationMs = traces.imageDescription.durationMs;
  }
  if (traces.imageGeneration) {
    imageDurationMs = (imageDurationMs ?? 0) + traces.imageGeneration.durationMs;
  }

  return {
    // Legacy fields for backward compatibility
    textTokensPrompt: traces.reviewText.tokensPrompt,
    textTokensCompletion: traces.reviewText.tokensCompletion,
    textDurationMs: traces.reviewText.durationMs,
    imageDurationMs,
    imageGenerated: pipelineOutput.review.imageBase64 !== undefined,
    selectedPersonality: context.personality.name,
    reviewerName: context.reviewerName,
    systemPrompt: traces.reviewText.request.systemPrompt,
    userPrompt: traces.reviewText.request.userPrompt,
    geminiPrompt: traces.imageGeneration?.request.prompt,
    geminiModel: traces.imageGeneration?.model,
    imageDescription: intermediate.imageDescriptionText,
    // New pipeline fields
    traces,
    intermediate,
    context,
  };
}

/**
 * Parameters for generating a match review
 */
export type GenerateMatchReviewParams = {
  match: CompletedMatch | ArenaMatch;
  config: ReviewConfig;
  onProgress?: (progress: GenerationProgress) => void;
  rawMatch?: RawMatch;
  rawTimeline?: RawTimeline;
};

/**
 * Generate a complete match review using the unified pipeline
 */
export async function generateMatchReview(params: GenerateMatchReviewParams): Promise<GenerationResult> {
  const { match, config, onProgress, rawMatch, rawTimeline } = params;
  const startTime = Date.now();

  try {
    // Validate OpenAI API key
    if (!config.api.openaiApiKey) {
      throw new Error("OpenAI API key is required");
    }

    // Get personality from config
    const personality = resolvePersonality(config);
    if (!personality.styleCard || personality.styleCard.trim().length === 0) {
      throw new Error(
        `Style card missing for personality "${personality.id}". Add a corresponding file under packages/analysis/llm-out/<name>_style.json and wire it into the personality loader.`,
      );
    }

    // Get prompt context
    const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();
    const player = match.players[0];
    const lane = match.queueType === "arena" ? undefined : player && "lane" in player ? player.lane : undefined;
    const laneContext = config.prompts.laneContext ?? getLaneContext(lane);
    const playerMetadata = config.prompts.playerMetadata ?? getGenericPlayerMetadata();

    // Initialize OpenAI client
    const openaiClient = new OpenAI({
      apiKey: config.api.openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    // Initialize Gemini client if API key provided
    let geminiClient: GoogleGenerativeAI | undefined;
    if (config.api.geminiApiKey) {
      geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey);
    }

    // Get stage configs
    const stages = getStagesConfig(config);

    // Build match input
    const matchInput: Parameters<typeof generateFullMatchReview>[0]["match"] = {
      processed: match,
    };
    if (rawMatch !== undefined) {
      matchInput.raw = rawMatch;
    }
    if (rawTimeline !== undefined) {
      matchInput.rawTimeline = rawTimeline;
    }

    // Build clients input
    const clientsInput: Parameters<typeof generateFullMatchReview>[0]["clients"] = {
      openai: openaiClient,
    };
    if (geminiClient !== undefined) {
      clientsInput.gemini = geminiClient;
    }

    // Build prompts input
    const promptsInput: Parameters<typeof generateFullMatchReview>[0]["prompts"] = {
      personality,
      baseTemplate: basePromptTemplate,
      laneContext,
    };
    if (config.prompts.systemPromptPrefix !== undefined) {
      promptsInput.systemPromptPrefix = config.prompts.systemPromptPrefix;
    }

    // Report progress
    onProgress?.({ step: "text", message: "Generating review..." });

    // Call unified pipeline
    const pipelineOutput = await generateFullMatchReview({
      match: matchInput,
      player: {
        index: 0, // Always review first player in frontend
        metadata: playerMetadata,
      },
      prompts: promptsInput,
      clients: clientsInput,
      stages,
    });

    onProgress?.({ step: "complete", message: "Complete!" });

    // Build metadata
    const metadata = buildGenerationMetadata(pipelineOutput);

    // Return result
    const result: GenerationResult = {
      text: pipelineOutput.review.text,
      metadata,
    };

    if (pipelineOutput.review.imageBase64 !== undefined) {
      result.image = pipelineOutput.review.imageBase64;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      text: "",
      metadata: {
        textDurationMs: Date.now() - startTime,
        imageGenerated: false,
      },
      error: errorMessage,
    };
  }
}
