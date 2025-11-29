/**
 * Review generation logic - UI wrapper over shared data package functions
 *
 * Implements the same workflow as the Mastra backend:
 * 1. Setup - Load personality, prompts, select player
 * 2. Curate match data - Transform raw Riot API data
 * 3. Summarize timeline (optional) - AI summary of game flow
 * 4. Analyze match (optional) - AI analysis of player performance
 * 5. Generate review text - Main AI review
 * 6. Generate art prompt (optional) - AI art direction
 * 7. Generate image - Gemini image generation
 *
 * All AI analysis functions (timeline summary, match analysis, art prompt)
 * are imported from @scout-for-lol/data to ensure consistency with the backend.
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  generateReviewText,
  generateReviewImage,
  curateMatchData,
  // Shared AI analysis functions
  summarizeTimeline,
  analyzeMatchData,
  generateArtPrompt,
  type ArenaMatch,
  type CompletedMatch,
  type CuratedMatchData,
  type ReviewImageMetadata,
  type RawMatch,
  type RawTimeline,
} from "@scout-for-lol/data";
import type { ReviewConfig, GenerationResult, GenerationMetadata, Personality } from "./config/schema";
import {
  getBasePrompt,
  selectRandomPersonality,
  getPersonalityById,
  getLaneContext,
  getGenericPlayerMetadata,
} from "./prompts";
import { selectRandomStyleAndTheme } from "./art-styles";

export type GenerationStep =
  | "setup"
  | "curate"
  | "timeline"
  | "analysis"
  | "text"
  | "art-prompt"
  | "image"
  | "complete";

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
 * Select art styles and themes for image generation
 * Returns themes as an array (matching Mastra workflow format)
 */
function selectArtThemes(config: ReviewConfig): {
  artStyle: string;
  artThemes: string[];
} {
  // Use the shared selectRandomStyleAndTheme from @scout-for-lol/data
  // which uses category-based matching and returns { style, themes[] }
  if (config.imageGeneration.artStyle === "random" || config.imageGeneration.artTheme === "random") {
    const selected = selectRandomStyleAndTheme({
      mashupMode: config.imageGeneration.mashupMode,
      useMatchingPairs: config.imageGeneration.useMatchingPairs,
      matchingPairProbability: config.imageGeneration.matchingPairProbability,
    });

    // If style is specified (not random), use it; otherwise use selected
    const artStyle =
      config.imageGeneration.artStyle === "random" ? selected.style : config.imageGeneration.artStyle;

    // If theme is specified (not random), use it; otherwise use selected themes
    let artThemes: string[];
    if (config.imageGeneration.artTheme === "random") {
      artThemes = selected.themes;
    } else {
      artThemes = [config.imageGeneration.artTheme];
      // Add second theme for mashup if configured
      if (config.imageGeneration.mashupMode) {
        if (config.imageGeneration.secondArtTheme === "random") {
          const secondSelected = selectRandomStyleAndTheme({
            mashupMode: false,
            useMatchingPairs: config.imageGeneration.useMatchingPairs,
            matchingPairProbability: config.imageGeneration.matchingPairProbability,
          });
          artThemes.push(secondSelected.themes[0] ?? "League of Legends gameplay");
        } else {
          artThemes.push(config.imageGeneration.secondArtTheme);
        }
      }
    }

    return { artStyle, artThemes };
  }

  // Both style and theme are explicitly specified
  const artThemes = [config.imageGeneration.artTheme];
  if (config.imageGeneration.mashupMode && config.imageGeneration.secondArtTheme) {
    artThemes.push(config.imageGeneration.secondArtTheme);
  }

  return {
    artStyle: config.imageGeneration.artStyle,
    artThemes,
  };
}

/**
 * Resolve player index from config
 */
function resolvePlayerIndex(config: ReviewConfig, match: CompletedMatch | ArenaMatch): number {
  const selection = config.advancedAI.playerSelection;
  if (selection === "random") {
    return Math.floor(Math.random() * match.players.length);
  }
  if (selection === "first") {
    return 0;
  }
  // Specific index - clamp to valid range
  return Math.min(selection, match.players.length - 1);
}

/**
 * Extended metadata for Mastra workflow features
 */
type ExtendedMetadata = {
  playerIndex?: number | undefined;
  playerName?: string | undefined;
  artThemes?: string[] | undefined;
  timelineSummary?: string | undefined;
  timelineSummaryDurationMs?: number | undefined;
  matchAnalysis?: string | undefined;
  matchAnalysisDurationMs?: number | undefined;
  artPrompt?: string | undefined;
  artPromptDurationMs?: number | undefined;
};

/**
 * Build generation metadata from results
 */
function buildGenerationMetadata(
  textResult: Awaited<ReturnType<typeof generateReviewText>>,
  imageResult?: { imageData: string; metadata: ReviewImageMetadata },
  extended?: ExtendedMetadata,
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
    selectedArtThemes: extended?.artThemes,
    selectedSecondArtTheme: imageResult?.metadata.selectedSecondArtTheme,
    systemPrompt: textResult.metadata.systemPrompt,
    userPrompt: textResult.metadata.userPrompt,
    openaiRequestParams: textResult.metadata.openaiRequestParams,
    geminiPrompt: imageResult?.metadata.geminiPrompt,
    geminiModel: imageResult?.metadata.geminiModel,
    // Mastra workflow metadata
    playerIndex: extended?.playerIndex,
    playerName: extended?.playerName ?? textResult.metadata.playerName,
    timelineSummary: extended?.timelineSummary,
    timelineSummaryDurationMs: extended?.timelineSummaryDurationMs,
    matchAnalysis: extended?.matchAnalysis,
    matchAnalysisDurationMs: extended?.matchAnalysisDurationMs,
    artPrompt: extended?.artPrompt,
    artPromptDurationMs: extended?.artPromptDurationMs,
  };
}

// All AI analysis functions (summarizeTimeline, analyzeMatchData, generateArtPrompt)
// are now imported from @scout-for-lol/data to ensure consistency with the backend.

/**
 * Generate a complete match review with text and optional image
 *
 * Implements the same workflow as the Mastra backend:
 * 1. Setup - Load personality, prompts, select player
 * 2. Curate match data - Transform raw Riot API data
 * 3. Summarize timeline (optional) - AI summary of game flow
 * 4. Analyze match (optional) - AI analysis of player performance
 * 5. Generate review text - Main AI review
 * 6. Generate art prompt (optional) - AI art direction
 * 7. Generate image - Gemini image generation
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
  rawMatch?: RawMatch,
  rawTimeline?: RawTimeline,
): Promise<GenerationResult> {
  try {
    // Initialize extended metadata to collect Mastra workflow data
    const extendedMeta: ExtendedMetadata = {};

    // Step 1: Setup
    onProgress?.({ step: "setup", message: "Setting up..." });

    // Get personality from config
    const personality = resolvePersonality(config);

    // Initialize OpenAI client
    const openaiClient = new OpenAI({
      apiKey: config.api.openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    // Resolve player index (random, first, or specific)
    const playerIndex = resolvePlayerIndex(config, match);
    extendedMeta.playerIndex = playerIndex;
    const player = match.players[playerIndex];
    extendedMeta.playerName = player?.playerConfig.alias;

    // Get prompt context for the selected player
    const lane =
      match.queueType === "arena"
        ? undefined
        : player && "lane" in player
          ? (player.lane as string | undefined)
          : undefined;
    const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();
    const laneContextInfo = config.prompts.laneContext ?? getLaneContext(lane);
    const playerMeta = config.prompts.playerMetadata ?? getGenericPlayerMetadata();

    // Step 2: Curate match data
    onProgress?.({ step: "curate", message: "Curating match data..." });
    let curatedData: CuratedMatchData | undefined;
    if (rawMatch) {
      curatedData = await curateMatchData(rawMatch, rawTimeline);
    }

    // Step 3: Summarize timeline (always enabled - Mastra workflow)
    let timelineSummary: string | undefined;
    if (curatedData?.timeline) {
      onProgress?.({ step: "timeline", message: "Summarizing timeline..." });
      const timelineResult = await summarizeTimeline(
        curatedData.timeline,
        openaiClient,
        config.advancedAI.timelineSummaryModel,
      );
      if (timelineResult) {
        timelineSummary = timelineResult.summary;
        extendedMeta.timelineSummary = timelineResult.summary;
        extendedMeta.timelineSummaryDurationMs = timelineResult.durationMs;
        // Add to curated data like backend does
        curatedData = { ...curatedData, timelineSummary };
      }
    }

    // Step 4: Analyze match (always enabled - Mastra workflow)
    let matchAnalysis: string | undefined;
    if (curatedData) {
      onProgress?.({ step: "analysis", message: "Analyzing match..." });
      const analysisResult = await analyzeMatchData({
        match,
        curatedData,
        laneContext: laneContextInfo,
        playerIndex,
        openaiClient,
        model: config.advancedAI.matchAnalysisModel,
        timelineSummary,
      });
      if (analysisResult) {
        matchAnalysis = analysisResult.analysis;
        extendedMeta.matchAnalysis = analysisResult.analysis;
        extendedMeta.matchAnalysisDurationMs = analysisResult.durationMs;
      }
    }

    // Step 5: Generate review text
    onProgress?.({ step: "text", message: "Generating review text..." });

    // Call shared review text generation (includes playerIndex, matchAnalysis, timelineSummary like backend)
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
      playerIndex,
      ...(matchAnalysis !== undefined && { matchAnalysis }),
      ...(timelineSummary !== undefined && { timelineSummary }),
    });

    // Step 6 & 7: Image generation (if enabled)
    let imageResult: { imageData: string; metadata: ReviewImageMetadata } | undefined;
    if (config.imageGeneration.enabled) {
      try {
        // Select art style and themes (now returns themes array)
        const { artStyle, artThemes } = selectArtThemes(config);
        extendedMeta.artThemes = artThemes;

        // Step 6: Generate art prompt (always enabled - Mastra workflow)
        let artPromptText: string | undefined;
        onProgress?.({ step: "art-prompt", message: "Generating art prompt..." });
        const artPromptResult = await generateArtPrompt({
          reviewText: textResult.text,
          style: artStyle,
          themes: artThemes,
          openaiClient,
          model: config.advancedAI.artPromptModel,
        });
        if (artPromptResult) {
          artPromptText = artPromptResult.artPrompt;
          extendedMeta.artPrompt = artPromptResult.artPrompt;
          extendedMeta.artPromptDurationMs = artPromptResult.durationMs;
        }

        // Step 7: Generate image
        onProgress?.({ step: "image", message: "Generating image..." });

        // Initialize Gemini client
        const geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey ?? "");

        // Use art prompt if generated, otherwise use review text (like backend)
        const promptForGemini = artPromptText ?? textResult.text;

        // Call shared image generation
        imageResult = await generateReviewImage({
          reviewText: promptForGemini,
          artStyle,
          artTheme: artThemes[0] ?? "League of Legends gameplay",
          ...(artThemes[1] !== undefined ? { secondArtTheme: artThemes[1] } : {}),
          matchData: JSON.stringify(curatedData ? { processedMatch: match, detailedStats: curatedData } : match),
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

    // Build metadata with extended Mastra workflow data
    const metadata = buildGenerationMetadata(textResult, imageResult, extendedMeta);

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
