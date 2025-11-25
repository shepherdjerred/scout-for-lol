/**
 * Review generation logic - UI wrapper over shared data package functions
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  generateReviewText,
  generateReviewImage,
  curateMatchData,
  type ArenaMatch,
  type CompletedMatch,
  type CuratedMatchData,
  type ReviewImageMetadata,
  type MatchDto,
} from "@scout-for-lol/data";
import type {
  ReviewConfig,
  GenerationResult,
  GenerationMetadata,
  Personality,
} from "../config/schema";
import {
  getBasePrompt,
  selectRandomPersonality,
  getPersonalityById,
  getLaneContext,
  getGenericPlayerMetadata,
} from "../lib/prompts";
import { selectRandomStyleAndTheme } from "../lib/art-styles";

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
 * Get prompt context from config and match
 */
function getPromptContext(config: ReviewConfig, match: CompletedMatch | ArenaMatch) {
  const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();
  const player = match.players[0];
  const lane = match.queueType === "arena" ? undefined : player && "lane" in player ? player.lane : undefined;
  const laneContextInfo = config.prompts.laneContext ?? getLaneContext(lane);
  const playerMeta = config.prompts.playerMetadata ?? getGenericPlayerMetadata();

  return { basePromptTemplate, laneContextInfo, playerMeta };
}

/**
 * Select art styles and themes for image generation
 */
function selectArtThemes(config: ReviewConfig): {
  artStyle: string;
  artTheme: string;
  secondArtTheme?: string;
} {
  let artStyle: string;
  let artTheme: string;
  let secondArtTheme: string | undefined;

  if (config.imageGeneration.artStyle === "random" || config.imageGeneration.artTheme === "random") {
    const selected = selectRandomStyleAndTheme(
      config.imageGeneration.useMatchingPairs,
      config.imageGeneration.matchingPairProbability,
    );
    artStyle = config.imageGeneration.artStyle === "random" ? selected.style : config.imageGeneration.artStyle;
    artTheme = config.imageGeneration.artTheme === "random" ? selected.theme : config.imageGeneration.artTheme;
  } else {
    artStyle = config.imageGeneration.artStyle;
    artTheme = config.imageGeneration.artTheme;
  }

  if (config.imageGeneration.mashupMode) {
    if (config.imageGeneration.secondArtTheme === "random") {
      const selected = selectRandomStyleAndTheme(
        config.imageGeneration.useMatchingPairs,
        config.imageGeneration.matchingPairProbability,
      );
      secondArtTheme = selected.theme;
    } else {
      secondArtTheme = config.imageGeneration.secondArtTheme;
    }
  }

  const result: { artStyle: string; artTheme: string; secondArtTheme?: string } = {
    artStyle,
    artTheme,
  };
  if (secondArtTheme) {
    result.secondArtTheme = secondArtTheme;
  }
  return result;
}

/**
 * Build generation metadata from results
 */
function buildGenerationMetadata(
  textResult: Awaited<ReturnType<typeof generateReviewText>>,
  imageResult?: { imageData: string; metadata: ReviewImageMetadata },
): GenerationMetadata {
  return {
    textTokensPrompt: textResult.metadata.textTokensPrompt,
    textTokensCompletion: textResult.metadata.textTokensCompletion,
    textDurationMs: textResult.metadata.textDurationMs,
    imageDurationMs: imageResult?.metadata.imageDurationMs,
    imageGenerated: Boolean(imageResult),
    selectedPersonality: textResult.metadata.selectedPersonality,
    reviewerName: textResult.metadata.reviewerName,
    selectedArtStyle: imageResult?.metadata.selectedArtStyle,
    selectedArtTheme: imageResult?.metadata.selectedArtTheme,
    selectedSecondArtTheme: imageResult?.metadata.selectedSecondArtTheme,
    systemPrompt: textResult.metadata.systemPrompt,
    userPrompt: textResult.metadata.userPrompt,
    openaiRequestParams: textResult.metadata.openaiRequestParams,
    geminiPrompt: imageResult?.metadata.geminiPrompt,
    geminiModel: imageResult?.metadata.geminiModel,
  };
}

/**
 * Generate a complete match review with text and optional image
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
  rawMatchData?: MatchDto,
): Promise<GenerationResult> {
  try {
    // Curate match data if provided (like backend does)
    let curatedData: CuratedMatchData | undefined;
    if (rawMatchData) {
      curatedData = await curateMatchData(rawMatchData);
    }

    // Generate text review
    onProgress?.({ step: "text", message: "Generating review text..." });

    // Get personality from config
    const personality = resolvePersonality(config);

    // Get prompt context
    const { basePromptTemplate, laneContextInfo, playerMeta } = getPromptContext(config, match);

    // Initialize OpenAI client
    const openaiClient = new OpenAI({
      apiKey: config.api.openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    // Call shared review text generation
    const textResult = await generateReviewText({
      match,
      personality,
      basePromptTemplate,
      laneContext: laneContextInfo,
      playerMetadata: playerMeta,
      openaiClient,
      model: config.textGeneration.model,
      maxTokens: config.textGeneration.maxTokens,
      temperature: config.textGeneration.temperature,
      topP: config.textGeneration.topP,
      curatedData,
      systemPromptPrefix: config.prompts.systemPromptPrefix,
    });

    // Generate image if enabled
    let imageResult: { imageData: string; metadata: ReviewImageMetadata } | undefined;
    if (config.imageGeneration.enabled) {
      try {
        onProgress?.({ step: "image", message: "Generating image..." });

        // Select art style and theme
        const { artStyle, artTheme, secondArtTheme } = selectArtThemes(config);

        // Initialize Gemini client
        const geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey ?? "");

        // Call shared image generation
        imageResult = await generateReviewImage({
          reviewText: textResult.text,
          artStyle,
          artTheme,
          ...(secondArtTheme ? { secondArtTheme } : {}),
          matchData: JSON.stringify(
            curatedData ? { processedMatch: match, detailedStats: curatedData } : match,
            null,
            2,
          ),
          geminiClient,
          model: config.imageGeneration.model,
          timeoutMs: config.imageGeneration.timeoutMs,
        });
      } catch (error) {
        console.error("Failed to generate image:", error);
        // Continue without image
      }
    }

    onProgress?.({ step: "complete", message: "Complete!" });

    // Build metadata
    const metadata = buildGenerationMetadata(textResult, imageResult);

    return {
      text: textResult.text,
      ...(imageResult?.imageData !== undefined && { image: imageResult.imageData }),
      metadata,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      text: "",
      metadata: {
        textDurationMs: 0,
        imageGenerated: false,
      },
      error: errorMessage,
    };
  }
}
