/**
 * Review generation logic - UI wrapper over the shared workflow orchestrator
 *
 * Uses the new 5-step workflow:
 * 1a. Match Result Summary
 * 1b. Timeline Summary
 * 2.  Personality Review (with both summaries + randomBehaviors)
 * 3.  Image Description (from review text ONLY)
 * 4.  Image Generation (from description ONLY)
 *
 * All steps capture full request/response for debugging in the UI.
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  executeWorkflow,
  type ArenaMatch,
  type CompletedMatch,
  type RawMatch,
  type RawTimeline,
  type WorkflowResult,
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
  | "step1a"
  | "step1b"
  | "step2"
  | "step3"
  | "step4"
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
 * Returns themes as an array (matching workflow format)
 */
function selectArtThemes(config: ReviewConfig): {
  artStyle: string;
  artThemes: string[];
} {
  // Use the shared selectRandomStyleAndTheme from @scout-for-lol/data
  if (config.imageGeneration.artStyle === "random" || config.imageGeneration.artTheme === "random") {
    const selected = selectRandomStyleAndTheme({
      mashupMode: config.imageGeneration.mashupMode,
      useMatchingPairs: config.imageGeneration.useMatchingPairs,
      matchingPairProbability: config.imageGeneration.matchingPairProbability,
    });

    const artStyle =
      config.imageGeneration.artStyle === "random" ? selected.style : config.imageGeneration.artStyle;

    let artThemes: string[];
    if (config.imageGeneration.artTheme === "random") {
      artThemes = selected.themes;
    } else {
      artThemes = [config.imageGeneration.artTheme];
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
 * Build generation metadata from workflow result
 */
function buildGenerationMetadata(workflowResult: WorkflowResult): GenerationMetadata {
  const step1a = workflowResult.steps.matchResultSummary;
  const step1b = workflowResult.steps.timelineSummary;
  const step2 = workflowResult.steps.personalityReview;
  const step3 = workflowResult.steps.imageDescription;
  const step4 = workflowResult.steps.imageGeneration;

  return {
    // Text generation timing
    textDurationMs:
      (step1a?.durationMs ?? 0) +
      (step1b?.durationMs ?? 0) +
      (step2?.durationMs ?? 0),
    textTokensPrompt: step2?.response?.tokensPrompt,
    textTokensCompletion: step2?.response?.tokensCompletion,

    // Image generation timing
    imageDurationMs: (step3?.durationMs ?? 0) + (step4?.durationMs ?? 0),
    imageGenerated: step4?.status === "success",

    // Personality info
    selectedPersonality: workflowResult.metadata.personality?.filename,
    reviewerName: workflowResult.metadata.personality?.name,

    // Art info
    selectedArtStyle: workflowResult.metadata.artStyle,
    selectedArtThemes: workflowResult.metadata.artThemes,
    selectedArtTheme: workflowResult.metadata.artThemes?.[0],
    selectedSecondArtTheme: workflowResult.metadata.artThemes?.[1],

    // Prompts from step 2
    systemPrompt: step2?.request.systemPrompt,
    userPrompt: step2?.request.userPrompt,

    // Image prompts from step 3 & 4
    geminiPrompt: step3?.response?.imageDescription,
    artPrompt: step3?.response?.imageDescription,
    artPromptDurationMs: step3?.durationMs,

    // Player info
    playerIndex: workflowResult.metadata.playerIndex,
    playerName: workflowResult.metadata.playerName,

    // Step summaries
    matchAnalysis: step1a?.response?.summary,
    matchAnalysisDurationMs: step1a?.durationMs,
    timelineSummary: step1b?.response?.summary,
    timelineSummaryDurationMs: step1b?.durationMs,
  };
}

/**
 * Generate a complete match review with text and optional image
 *
 * Uses the new 5-step workflow:
 * 1a. Match Result Summary
 * 1b. Timeline Summary
 * 2.  Personality Review (with both summaries + randomBehaviors)
 * 3.  Image Description (from review text ONLY)
 * 4.  Image Generation (from description ONLY)
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
  rawMatch?: RawMatch,
  rawTimeline?: RawTimeline,
): Promise<GenerationResult> {
  try {
    // Step 1: Setup
    onProgress?.({ step: "setup", message: "Setting up..." });

    // Get personality from config
    const personality = resolvePersonality(config);

    // Initialize OpenAI client
    const openaiClient = new OpenAI({
      apiKey: config.api.openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    // Resolve player index
    const playerIndex = resolvePlayerIndex(config, match);

    // Get prompt context for the selected player
    const player = match.players[playerIndex];
    const lane =
      match.queueType === "arena"
        ? undefined
        : player && "lane" in player
          ? (player.lane as string | undefined)
          : undefined;
    const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();
    const laneContextInfo = config.prompts.laneContext ?? getLaneContext(lane);
    const playerMeta = config.prompts.playerMetadata ?? getGenericPlayerMetadata();

    // Select art style and themes
    const { artStyle, artThemes } = selectArtThemes(config);

    // Initialize Gemini client if image generation is enabled
    let geminiClient: GoogleGenerativeAI | undefined;
    if (config.imageGeneration.enabled && config.api.geminiApiKey) {
      geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey);
    }

    // Convert personality to workflow format (add filename from id)
    const workflowPersonality = {
      metadata: personality.metadata,
      instructions: personality.instructions,
      filename: personality.id,
    };

    // Execute the workflow
    const workflowResult = await executeWorkflow(
      {
        match,
        rawMatch,
        rawTimeline,
        personality: workflowPersonality,
        basePromptTemplate,
        laneContext: laneContextInfo,
        playerMetadata: playerMeta,
        playerIndex,
        artStyle,
        artThemes,
        openaiClient,
        geminiClient,
        models: {
          matchSummary: config.advancedAI.matchAnalysisModel,
          timelineSummary: config.advancedAI.timelineSummaryModel,
          personalityReview: config.textGeneration.model,
          imageDescription: config.advancedAI.artPromptModel,
          imageGeneration: config.imageGeneration.model,
        },
        textMaxTokens: config.textGeneration.maxTokens,
        textTemperature: config.textGeneration.temperature,
        imageTimeoutMs: config.imageGeneration.timeoutMs,
        generateImage: config.imageGeneration.enabled,
      },
      rawMatch?.metadata.matchId ?? "unknown",
      (progress) => {
        // Map workflow progress to UI progress
        const stepMap: Record<string, GenerationStep> = {
          setup: "setup",
          step1a: "step1a",
          step1b: "step1b",
          step2: "step2",
          step3: "step3",
          step4: "step4",
          complete: "complete",
        };
        onProgress?.({
          step: stepMap[progress.step] ?? "setup",
          message: progress.message,
        });
      },
    );

    // Build result
    const metadata = buildGenerationMetadata(workflowResult);

    const result: GenerationResult = {
      text: workflowResult.outputs.reviewText ?? "",
      metadata,
      workflowResult,
    };
    if (workflowResult.outputs.imageBase64) {
      result.image = workflowResult.outputs.imageBase64;
    }
    if (workflowResult.status === "failed") {
      result.error = "Workflow failed";
    }
    return result;
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
