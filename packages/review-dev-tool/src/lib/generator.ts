/**
 * Review generation logic - UI wrapper over shared data package functions
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  generateReviewText,
  generateReviewImage,
  type ArenaMatch,
  type CompletedMatch,
  type CuratedMatchData,
  type ReviewImageMetadata,
} from "@scout-for-lol/data";
import type { ReviewConfig, GenerationResult, GenerationMetadata, Personality } from "../config/schema";
import {
  getBasePrompt,
  selectRandomPersonality,
  getPersonalityById,
  getLaneContext,
  getGenericPlayerMetadata,
} from "./prompts";
import { selectRandomStyleAndTheme } from "./art-styles";

export type GenerationStep = "text" | "image" | "complete";

export type GenerationProgress = {
  step: GenerationStep;
  message: string;
};

/**
 * Generate a complete match review with text and optional image
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
  rawMatchData?: unknown,
): Promise<GenerationResult> {
  try {
    // Curate match data if provided (like backend does)
    let curatedData: CuratedMatchData | undefined;
    if (rawMatchData) {
      // Validate and curate if it's a MatchDto
      // For now, skip validation - just pass undefined
      // TODO: Add MatchDto validation if needed
    }

    // Generate text review
    onProgress?.({ step: "text", message: "Generating review text... (this takes ~60s)" });

    // Get personality from config
    let personality: Personality;
    if (config.prompts.customPersonality) {
      personality = config.prompts.customPersonality;
    } else if (config.prompts.personalityId === "random") {
      personality = selectRandomPersonality();
    } else {
      const found = getPersonalityById(config.prompts.personalityId);
      if (!found) {
        throw new Error(`Personality not found: ${config.prompts.personalityId}`);
      }
      personality = found;
    }

    // Get base prompt and lane context
    const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();
    const player = match.players[0];
    const lane = match.queueType === "arena" ? undefined : player && "lane" in player ? player.lane : undefined;
    const laneContextInfo = config.prompts.laneContext ?? getLaneContext(lane);
    const playerMeta = config.prompts.playerMetadata ?? getGenericPlayerMetadata();

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
      // eslint-disable-next-line no-restricted-syntax -- OpenAI version mismatch between packages, safe to cast
      openaiClient: openaiClient as never,
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
        onProgress?.({ step: "image", message: "Generating image... (this takes ~20s)" });

        // Select art style and theme
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

        // Initialize Gemini client
        const geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey ?? "");

        // Call shared image generation
        imageResult = await generateReviewImage({
          reviewText: textResult.text,
          artStyle,
          artTheme,
          secondArtTheme,
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

    // Combine metadata
    const metadata: GenerationMetadata = {
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
    };

    return {
      text: textResult.text,
      image: imageResult?.imageData,
      metadata,
    };
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- Error handling requires instanceof check
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
