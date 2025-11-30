/**
 * Configuration schemas for review generation settings
 *
 * Updated to use unified pipeline stage configuration
 */
import { z } from "zod";
import {
  DEFAULT_TIMELINE_SUMMARY_MODEL,
  DEFAULT_MATCH_SUMMARY_MODEL,
  DEFAULT_REVIEW_TEXT_MODEL,
  DEFAULT_IMAGE_DESCRIPTION_MODEL,
  DEFAULT_IMAGE_GENERATION_MODEL,
  DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
  TIMELINE_SUMMARY_SYSTEM_PROMPT,
  MATCH_SUMMARY_SYSTEM_PROMPT,
  IMAGE_DESCRIPTION_SYSTEM_PROMPT,
} from "@scout-for-lol/data";

/**
 * API settings schema
 */
export const ApiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  s3BucketName: z.string().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().default("us-east-1"),
  s3Endpoint: z.string().optional(), // For Cloudflare R2 or custom S3 endpoints
});

export type ApiSettings = z.infer<typeof ApiSettingsSchema>;

// ============================================================================
// Pipeline Stage Configuration Schemas
// ============================================================================

/**
 * Model configuration schema (matches pipeline-types.ts)
 */
export const ModelConfigSchema = z.object({
  model: z.string(),
  maxTokens: z.number().int().min(100).max(100000),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/**
 * Stage configuration schema for stages that can be enabled/disabled
 */
export const StageConfigSchema = z.object({
  enabled: z.boolean(),
  model: ModelConfigSchema,
  systemPrompt: z.string().optional(),
});

export type StageConfig = z.infer<typeof StageConfigSchema>;

/**
 * Review text stage config (always enabled)
 */
export const ReviewTextStageConfigSchema = z.object({
  model: ModelConfigSchema,
});

export type ReviewTextStageConfig = z.infer<typeof ReviewTextStageConfigSchema>;

/**
 * Image generation stage config
 */
export const ImageGenerationStageConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string(),
  timeoutMs: z.number().int().min(10000).max(300000),
});

export type ImageGenerationStageConfig = z.infer<typeof ImageGenerationStageConfigSchema>;

/**
 * All pipeline stages configuration
 */
export const PipelineStagesConfigSchema = z.object({
  timelineSummary: StageConfigSchema,
  matchSummary: StageConfigSchema,
  reviewText: ReviewTextStageConfigSchema,
  imageDescription: StageConfigSchema,
  imageGeneration: ImageGenerationStageConfigSchema,
});

export type PipelineStagesConfig = z.infer<typeof PipelineStagesConfigSchema>;

// ============================================================================
// Legacy settings schemas (kept for backward compatibility in UI)
// ============================================================================

/**
 * Text generation settings schema (legacy - maps to reviewText stage)
 */
export const TextGenerationSettingsSchema = z.object({
  model: z.string().default("gpt-5"),
  maxTokens: z.number().int().min(100).max(100000).default(25000),
  temperature: z.number().min(0).max(2).default(1.0),
  topP: z.number().min(0).max(1).default(1.0),
});

export type TextGenerationSettings = z.infer<typeof TextGenerationSettingsSchema>;

/**
 * Image generation settings schema (legacy - for art style UI)
 */
export const ImageGenerationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  model: z.string().default(DEFAULT_IMAGE_GENERATION_MODEL),
  timeoutMs: z.number().int().min(10000).max(300000).default(DEFAULT_IMAGE_GENERATION_TIMEOUT_MS),
  artStyle: z
    .union([
      z.literal("random"),
      z.string(), // specific art style
    ])
    .default("random"),
  useMatchingPairs: z.boolean().default(true),
  matchingPairProbability: z.number().min(0).max(1).default(0.7),
  mashupMode: z.boolean().default(false),
});

export type ImageGenerationSettings = z.infer<typeof ImageGenerationSettingsSchema>;

/**
 * Random behavior schema - weighted random prompts
 */
export const RandomBehaviorSchema = z.object({
  prompt: z.string(),
  weight: z.number().min(0).max(100), // Percentage chance (0-100)
});

export type RandomBehavior = z.infer<typeof RandomBehaviorSchema>;

/**
 * Personality metadata schema
 */
export const PersonalityMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  randomBehaviors: z.array(RandomBehaviorSchema).optional(),
});

export type PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;

/**
 * Personality schema (metadata + instructions)
 */
export const PersonalitySchema = z.object({
  id: z.string(),
  metadata: PersonalityMetadataSchema,
  instructions: z.string(),
  styleCard: z.string(),
});

export type Personality = z.infer<typeof PersonalitySchema>;

/**
 * Prompt settings schema
 */
export const PromptSettingsSchema = z.object({
  basePrompt: z.string(),
  personalityId: z
    .union([
      z.literal("random"),
      z.string(), // specific personality ID
    ])
    .default("random"),
  customPersonality: PersonalitySchema.optional(),
  laneContext: z.string().optional(), // Override lane context
});

export type PromptSettings = z.infer<typeof PromptSettingsSchema>;

/**
 * Global configuration (shared across all tabs)
 */
export const GlobalConfigSchema = z.object({
  api: ApiSettingsSchema,
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

/**
 * Tab-specific configuration (per-tab settings)
 *
 * Updated to include pipeline stage configurations
 */
export const TabConfigSchema = z.object({
  // Legacy settings (still used by existing UI components)
  textGeneration: TextGenerationSettingsSchema,
  imageGeneration: ImageGenerationSettingsSchema,
  prompts: PromptSettingsSchema,
  // Pipeline stage configurations (new unified pipeline)
  stages: PipelineStagesConfigSchema.optional(),
});

export type TabConfig = z.infer<typeof TabConfigSchema>;

/**
 * Complete review generation configuration (merged from GlobalConfig + TabConfig)
 */
export type ReviewConfig = {
  api: ApiSettings;
  textGeneration: TextGenerationSettings;
  imageGeneration: ImageGenerationSettings;
  prompts: PromptSettings;
  stages?: PipelineStagesConfig;
};

/**
 * Stage trace schema (for pipeline output)
 */
export const StageTraceSchema = z.object({
  request: z.object({
    systemPrompt: z.string().optional(),
    userPrompt: z.string(),
  }),
  response: z.object({
    text: z.string(),
  }),
  model: ModelConfigSchema,
  durationMs: z.number(),
  tokensPrompt: z.number().optional(),
  tokensCompletion: z.number().optional(),
});

export type StageTrace = z.infer<typeof StageTraceSchema>;

/**
 * Image generation trace schema
 */
export const ImageGenerationTraceSchema = z.object({
  request: z.object({
    prompt: z.string(),
  }),
  response: z.object({
    imageGenerated: z.boolean(),
    imageSizeBytes: z.number().optional(),
  }),
  model: z.string(),
  durationMs: z.number(),
});

export type ImageGenerationTrace = z.infer<typeof ImageGenerationTraceSchema>;

/**
 * Pipeline traces schema
 */
export const PipelineTracesSchema = z.object({
  timelineSummary: StageTraceSchema.optional(),
  matchSummary: StageTraceSchema.optional(),
  reviewText: StageTraceSchema,
  imageDescription: StageTraceSchema.optional(),
  imageGeneration: ImageGenerationTraceSchema.optional(),
});

export type PipelineTraces = z.infer<typeof PipelineTracesSchema>;

/**
 * Pipeline intermediate results schema
 */
export const PipelineIntermediateResultsSchema = z.object({
  timelineSummaryText: z.string().optional(),
  matchSummaryText: z.string().optional(),
  imageDescriptionText: z.string().optional(),
});

export type PipelineIntermediateResults = z.infer<typeof PipelineIntermediateResultsSchema>;

/**
 * Pipeline context schema
 */
export const PipelineContextSchema = z.object({
  reviewerName: z.string(),
  playerName: z.string(),
  playerIndex: z.number(),
  personality: z.object({
    filename: z.string().optional(),
    name: z.string(),
  }),
});

export type PipelineContext = z.infer<typeof PipelineContextSchema>;

/**
 * Generation result metadata (updated for unified pipeline)
 */
export const GenerationMetadataSchema = z.object({
  // Legacy fields (kept for backward compatibility)
  textTokensPrompt: z.number().optional(),
  textTokensCompletion: z.number().optional(),
  textDurationMs: z.number(),
  imageDurationMs: z.number().optional(),
  imageGenerated: z.boolean(),
  selectedPersonality: z.string().optional(),
  reviewerName: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  openaiRequestParams: z.unknown().optional(),
  geminiPrompt: z.string().optional(),
  geminiModel: z.string().optional(),
  imageDescription: z.string().optional(),
  // New pipeline fields
  traces: PipelineTracesSchema.optional(),
  intermediate: PipelineIntermediateResultsSchema.optional(),
  context: PipelineContextSchema.optional(),
});

export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;

/**
 * Generation result with costs
 */
export type GenerationResult = {
  text: string;
  image?: string; // base64 encoded
  metadata: GenerationMetadata;
  error?: string;
};

/**
 * Cost breakdown schema
 */
export const CostBreakdownSchema = z.object({
  textInputCost: z.number(),
  textOutputCost: z.number(),
  imageCost: z.number(),
  totalCost: z.number(),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

/**
 * Default global configuration factory
 */
export function createDefaultGlobalConfig(): GlobalConfig {
  return GlobalConfigSchema.parse({
    api: {
      awsRegion: "us-east-1",
    },
  });
}

/**
 * Create default pipeline stages configuration
 */
export function createDefaultPipelineStages(): PipelineStagesConfig {
  return {
    timelineSummary: {
      enabled: true,
      model: { ...DEFAULT_TIMELINE_SUMMARY_MODEL },
      systemPrompt: TIMELINE_SUMMARY_SYSTEM_PROMPT,
    },
    matchSummary: {
      enabled: true,
      model: { ...DEFAULT_MATCH_SUMMARY_MODEL },
      systemPrompt: MATCH_SUMMARY_SYSTEM_PROMPT,
    },
    reviewText: {
      model: { ...DEFAULT_REVIEW_TEXT_MODEL },
    },
    imageDescription: {
      enabled: true,
      model: { ...DEFAULT_IMAGE_DESCRIPTION_MODEL },
      systemPrompt: IMAGE_DESCRIPTION_SYSTEM_PROMPT,
    },
    imageGeneration: {
      enabled: true,
      model: DEFAULT_IMAGE_GENERATION_MODEL,
      timeoutMs: DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
    },
  };
}

/**
 * Default tab configuration factory
 */
export function createDefaultTabConfig(): TabConfig {
  return TabConfigSchema.parse({
    textGeneration: {
      model: DEFAULT_REVIEW_TEXT_MODEL.model,
      maxTokens: DEFAULT_REVIEW_TEXT_MODEL.maxTokens,
      temperature: 1.0,
      topP: 1.0,
    },
    imageGeneration: {
      enabled: true,
      model: DEFAULT_IMAGE_GENERATION_MODEL,
      timeoutMs: DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
      artStyle: "random",
      useMatchingPairs: true,
      matchingPairProbability: 0.7,
      mashupMode: false,
    },
    prompts: {
      basePrompt: "", // Will be loaded from file
      personalityId: "random",
    },
    stages: createDefaultPipelineStages(),
  });
}

/**
 * Merge global and tab configs into a complete ReviewConfig
 */
export function mergeConfigs(global: GlobalConfig, tab: TabConfig): ReviewConfig {
  const result: ReviewConfig = {
    api: global.api,
    textGeneration: tab.textGeneration,
    imageGeneration: tab.imageGeneration,
    prompts: tab.prompts,
  };
  if (tab.stages !== undefined) {
    result.stages = tab.stages;
  }
  return result;
}

/**
 * Split a ReviewConfig into global and tab configs
 */
export function splitConfig(config: ReviewConfig): { global: GlobalConfig; tab: TabConfig } {
  const tab: TabConfig = {
    textGeneration: config.textGeneration,
    imageGeneration: config.imageGeneration,
    prompts: config.prompts,
  };
  if (config.stages !== undefined) {
    tab.stages = config.stages;
  }
  return {
    global: {
      api: config.api,
    },
    tab,
  };
}
