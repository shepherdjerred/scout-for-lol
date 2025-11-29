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
  type RawMatch,
} from "@scout-for-lol/data";
import type { ReviewConfig, GenerationResult, GenerationMetadata, Personality } from "./config/schema";
import {
  getBasePrompt,
  selectRandomPersonality,
  getPersonalityById,
  getLaneContext,
  getGenericPlayerMetadata,
} from "./prompts";

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

const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.
Focus on the mood, key moments, and emotions from the review text.
Describe one vivid scene with the focal action, characters, and environment.
Include composition ideas, color palette, and mood direction.
Do NOT ask for text to be placed in the image.
Keep it under 120 words.`;

/**
 * Generate an image description from review text (Step 3)
 */
async function generateImageDescription(
  reviewText: string,
  openaiClient: OpenAI,
  model: string,
): Promise<string | undefined> {
  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.
- Lean into the emotions, key moments, and champion identities referenced in the review
- Describe one striking scene with composition and mood cues
- Include color palette and lighting direction
- Do NOT ask for any text to be drawn in the image

Review text to translate into art:
${reviewText}`;

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: IMAGE_DESCRIPTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 600,
      temperature: 0.8,
    });

    return response.choices[0]?.message.content?.trim();
  } catch (error) {
    console.error("Failed to generate image description:", error);
    return undefined;
  }
}

/**
 * Build generation metadata from results
 */
function buildGenerationMetadata(
  textResult: Awaited<ReturnType<typeof generateReviewText>>,
  imageResult?: { imageData: string; metadata: ReviewImageMetadata },
  imageDescription?: string,
): GenerationMetadata {
  return {
    textTokensPrompt: textResult.metadata.textTokensPrompt,
    textTokensCompletion: textResult.metadata.textTokensCompletion,
    textDurationMs: textResult.metadata.textDurationMs,
    imageDurationMs: imageResult?.metadata.imageDurationMs,
    imageGenerated: Boolean(imageResult),
    selectedPersonality: textResult.metadata.selectedPersonality,
    reviewerName: textResult.metadata.reviewerName,
    systemPrompt: textResult.metadata.systemPrompt,
    userPrompt: textResult.metadata.userPrompt,
    openaiRequestParams: textResult.metadata.openaiRequestParams,
    geminiPrompt: imageResult?.metadata.geminiPrompt,
    geminiModel: imageResult?.metadata.geminiModel,
    imageDescription,
  };
}

/**
 * Generate a complete match review with text and optional image
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
  rawMatch?: RawMatch,
): Promise<GenerationResult> {
  try {
    // Curate match data if provided (like backend does)
    let curatedData: CuratedMatchData | undefined;
    if (rawMatch) {
      curatedData = await curateMatchData(rawMatch);
    }

    // Generate text review
    onProgress?.({ step: "text", message: "Generating review text..." });

    // Get personality from config
    const personality = resolvePersonality(config);
    if (!personality.styleCard || personality.styleCard.trim().length === 0) {
      throw new Error(
        `Style card missing for personality "${personality.id}". Add a corresponding file under packages/analysis/llm-out/<name>_style.json and wire it into the personality loader.`,
      );
    }

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
    let imageDescription: string | undefined;
    if (config.imageGeneration.enabled) {
      try {
        onProgress?.({ step: "image", message: "Generating image description..." });

        // Step 3: Generate image description from review text
        imageDescription = await generateImageDescription(textResult.text, openaiClient, config.textGeneration.model);

        if (imageDescription) {
          onProgress?.({ step: "image", message: "Generating image..." });

          // Initialize Gemini client
          const geminiClient = new GoogleGenerativeAI(config.api.geminiApiKey ?? "");

          // Step 4: Generate image from description only
          imageResult = await generateReviewImage({
            imageDescription,
            geminiClient,
            model: config.imageGeneration.model,
            timeoutMs: config.imageGeneration.timeoutMs,
          });
        }
      } catch (error) {
        console.error("Failed to generate image:", error);
        // Continue without image
      }
    }

    onProgress?.({ step: "complete", message: "Complete!" });

    // Build metadata
    const metadata = buildGenerationMetadata(textResult, imageResult, imageDescription);

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
