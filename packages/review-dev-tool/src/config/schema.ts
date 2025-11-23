/**
 * Configuration schemas for review generation settings
 */
import { z } from "zod";

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

/**
 * Text generation settings schema
 */
export const TextGenerationSettingsSchema = z.object({
  model: z.string().default("gpt-5"),
  maxTokens: z.number().int().min(100).max(100000).default(25000),
  temperature: z.number().min(0).max(2).default(1.0),
  topP: z.number().min(0).max(1).default(1.0),
});

export type TextGenerationSettings = z.infer<typeof TextGenerationSettingsSchema>;

/**
 * Image generation settings schema
 */
export const ImageGenerationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  model: z.string().default("gemini-3-pro-image-preview"),
  timeoutMs: z.number().int().min(10000).max(300000).default(60000),
  artStyle: z.union([
    z.literal("random"),
    z.string(), // specific art style
  ]).default("random"),
  artTheme: z.union([
    z.literal("random"),
    z.string(), // specific art theme
  ]).default("random"),
  useMatchingPairs: z.boolean().default(true),
  matchingPairProbability: z.number().min(0).max(1).default(0.7),
});

export type ImageGenerationSettings = z.infer<typeof ImageGenerationSettingsSchema>;

/**
 * Personality metadata schema
 */
export const PersonalityMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

export type PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;

/**
 * Personality schema (metadata + instructions)
 */
export const PersonalitySchema = z.object({
  id: z.string(),
  metadata: PersonalityMetadataSchema,
  instructions: z.string(),
});

export type Personality = z.infer<typeof PersonalitySchema>;

/**
 * Player metadata schema
 */
export const PlayerMetadataSchema = z.object({
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;

/**
 * Prompt settings schema
 */
export const PromptSettingsSchema = z.object({
  basePrompt: z.string(),
  systemPromptPrefix: z.string().optional(),
  personalityId: z.union([
    z.literal("random"),
    z.string(), // specific personality ID
  ]).default("random"),
  customPersonality: PersonalitySchema.optional(),
  laneContext: z.string().optional(), // Override lane context
  playerMetadata: PlayerMetadataSchema.optional(), // Override player metadata
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
 */
export const TabConfigSchema = z.object({
  textGeneration: TextGenerationSettingsSchema,
  imageGeneration: ImageGenerationSettingsSchema,
  prompts: PromptSettingsSchema,
});

export type TabConfig = z.infer<typeof TabConfigSchema>;

/**
 * Complete review generation configuration
 * @deprecated Use GlobalConfig + TabConfig instead
 */
export const ReviewConfigSchema = z.object({
  api: ApiSettingsSchema,
  textGeneration: TextGenerationSettingsSchema,
  imageGeneration: ImageGenerationSettingsSchema,
  prompts: PromptSettingsSchema,
});

export type ReviewConfig = z.infer<typeof ReviewConfigSchema>;

/**
 * Generation result metadata
 */
export const GenerationMetadataSchema = z.object({
  textTokensPrompt: z.number().optional(),
  textTokensCompletion: z.number().optional(),
  textDurationMs: z.number(),
  imageDurationMs: z.number().optional(),
  imageGenerated: z.boolean(),
  selectedPersonality: z.string().optional(),
  selectedArtStyle: z.string().optional(),
  selectedArtTheme: z.string().optional(),
});

export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;

/**
 * Generation result with costs
 */
export const GenerationResultSchema = z.object({
  text: z.string(),
  image: z.string().optional(), // base64 encoded
  metadata: GenerationMetadataSchema,
  error: z.string().optional(),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;

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
 * Default tab configuration factory
 */
export function createDefaultTabConfig(): TabConfig {
  return TabConfigSchema.parse({
    textGeneration: {
      model: "gpt-5",
      maxTokens: 25000,
      temperature: 1.0,
      topP: 1.0,
    },
    imageGeneration: {
      enabled: true,
      model: "gemini-3-pro-image-preview",
      timeoutMs: 60000,
      artStyle: "random",
      artTheme: "random",
      useMatchingPairs: true,
      matchingPairProbability: 0.7,
    },
    prompts: {
      basePrompt: "", // Will be loaded from file
      personalityId: "random",
    },
  });
}

/**
 * Default configuration factory
 * @deprecated Use createDefaultGlobalConfig() + createDefaultTabConfig() instead
 */
export function createDefaultConfig(): ReviewConfig {
  return ReviewConfigSchema.parse({
    api: {
      awsRegion: "us-east-1",
    },
    textGeneration: {
      model: "gpt-5",
      maxTokens: 25000,
      temperature: 1.0,
      topP: 1.0,
    },
    imageGeneration: {
      enabled: true,
      model: "gemini-3-pro-image-preview",
      timeoutMs: 60000,
      artStyle: "random",
      artTheme: "random",
      useMatchingPairs: true,
      matchingPairProbability: 0.7,
    },
    prompts: {
      basePrompt: "", // Will be loaded from file
      personalityId: "random",
    },
  });
}

/**
 * Merge global and tab configs into a complete ReviewConfig
 */
export function mergeConfigs(global: GlobalConfig, tab: TabConfig): ReviewConfig {
  return {
    api: global.api,
    textGeneration: tab.textGeneration,
    imageGeneration: tab.imageGeneration,
    prompts: tab.prompts,
  };
}

/**
 * Split a ReviewConfig into global and tab configs
 */
export function splitConfig(config: ReviewConfig): { global: GlobalConfig; tab: TabConfig } {
  return {
    global: {
      api: config.api,
    },
    tab: {
      textGeneration: config.textGeneration,
      imageGeneration: config.imageGeneration,
      prompts: config.prompts,
    },
  };
}
