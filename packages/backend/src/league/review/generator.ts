import {
  generateReviewText,
  generateReviewImage,
  type ArenaMatch,
  type CompletedMatch,
  type MatchId,
  selectRandomStyleAndTheme,
  curateMatchData,
  type CuratedMatchData,
} from "@scout-for-lol/data";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import config from "@scout-for-lol/backend/configuration.js";
import { saveAIReviewImageToS3 } from "@scout-for-lol/backend/storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
} from "@scout-for-lol/backend/league/review/prompts.js";

const FILENAME = import.meta.path;
const _DIRNAME = dirname(FILENAME);
const AI_IMAGES_DIR = `DIRNAME/ai-images`;

/**
 * Initialize OpenAI client if API key is configured
 */
function getOpenAIClient(): OpenAI | undefined {
  if (!config.openaiApiKey) {
    return undefined;
  }
  return new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Initialize Gemini client if API key is configured
 */
function getGeminiClient(): GoogleGenerativeAI | undefined {
  if (!config.geminiApiKey) {
    return undefined;
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
}

/**
 * Generate an AI-powered image from review text using Gemini (backend wrapper)
 */
async function generateReviewImageBackend(
  reviewText: string,
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  queueType: string,
  style: string,
  themes: string[],
  curatedData?: CuratedMatchData,
): Promise<Uint8Array | undefined> {
  const client = getGeminiClient();
  if (!client) {
    console.log("[generateReviewImage] Gemini API key not configured, skipping image generation");
    return undefined;
  }

  try {
    const isMashup = themes.length > 1;

    console.log(`[generateReviewImage] Using art style: ${style}`);
    if (isMashup) {
      console.log(`[generateReviewImage] MASHUP! Themes: ${themes.join(" meets ")}`);
    } else {
      const firstTheme = themes[0];
      console.log(`[generateReviewImage] Using theme: ${firstTheme ?? "unknown"}`);
    }
    console.log("[generateReviewImage] Calling Gemini API to generate image...");

    // Call shared image generation function
    const result = await generateReviewImage({
      reviewText,
      artStyle: style,
      artTheme: themes[0] ?? "League of Legends gameplay",
      secondArtTheme: themes[1],
      matchData: JSON.stringify(curatedData ? { processedMatch: match, detailedStats: curatedData } : match, null, 2),
      geminiClient: client,
      model: "gemini-3-pro-image-preview",
      timeoutMs: 60_000,
    });

    console.log(`[generateReviewImage] Gemini API call completed in ${result.metadata.imageDurationMs.toString()}ms`);

    // Decode base64 to Uint8Array
    const binaryString = atob(result.imageData);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }
    console.log("[generateReviewImage] Successfully generated image");

    // Save to local filesystem for debugging
    try {
      await Bun.write(`AI_IMAGES_DIR, { recursive: true }/.keep`, "");
      const filepath = join(AI_IMAGES_DIR, `ai-review-${new Date().toISOString().replace(/[:.]/g, "-")}.png`);
      await Bun.write(filepath, buffer);
      console.log(`[generateReviewImage] Saved image to: ${filepath}`);
    } catch (fsError: unknown) {
      console.error("[generateReviewImage] Failed to save image to filesystem:", fsError);
    }

    // Upload to S3
    try {
      await saveAIReviewImageToS3(matchId, buffer, queueType);
    } catch (s3Error: unknown) {
      console.error("[generateReviewImage] Failed to save image to S3:", s3Error);
      // Continue even if S3 upload fails
    }

    return buffer;
  } catch (error) {
    // Validate error structure with Zod
    const ErrorSchema = z.object({
      message: z.string(),
    });
    const result = ErrorSchema.safeParse(error);

    if (result.success && result.data.message.includes("timed out")) {
      console.error("[generateReviewImage] Gemini API call timed out - request took too long");
    } else {
      console.error("[generateReviewImage] Error generating image:", error);
    }
    return undefined;
  }
}

/**
 * Metadata about the generated review
 */
export type ReviewMetadata = {
  reviewerName: string;
  playerName: string;
  style?: string;
  themes?: string[];
};

/**
 * Generate an AI-powered review using OpenAI (backend wrapper)
 */
async function generateAIReview(
  match: CompletedMatch | ArenaMatch,
  curatedData?: CuratedMatchData,
): Promise<{ review: string; metadata: ReviewMetadata } | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[generateAIReview] OpenAI API key not configured, skipping AI review");
    return undefined;
  }

  try {
    // Get personality and base prompt template
    const personality = selectRandomPersonality();
    const basePromptTemplate = loadPromptFile("base.txt");

    console.log(`[generateAIReview] Selected personality: ${personality.filename}`);

    // Get lane context
    const player = match.players[0];
    const lane = match.queueType === "arena" ? undefined : player && "lane" in player ? player.lane : undefined;
    const laneContextInfo = getLaneContext(lane);
    console.log(`[generateAIReview] Selected lane context: ${laneContextInfo.filename}`);

    // Get player metadata
    const playerName = player?.playerConfig.alias;
    if (!playerName) {
      console.log("[generateAIReview] No player name found");
      return undefined;
    }
    const playerMeta = loadPlayerMetadata(playerName);

    console.log("[generateAIReview] Calling OpenAI API...");

    // Call shared review text generation function
    const result = await generateReviewText({
      match,
      personality,
      basePromptTemplate,
      laneContext: laneContextInfo.content,
      playerMetadata: playerMeta,
      openaiClient: client,
      model: "gpt-5",
      maxTokens: 25000,
      curatedData,
    });

    console.log("[generateAIReview] Successfully generated AI review");
    return {
      review: result.text,
      metadata: {
        reviewerName: result.metadata.reviewerName,
        playerName: result.metadata.playerName,
      },
    };
  } catch (error) {
    console.error("[generateAIReview] Error generating AI review:", error);
    return undefined;
  }
}

/**
 * Generates a post-game review for a player's performance with optional AI-generated image.
 * @param match - The completed match data (regular or arena)
 * @param matchId - The match ID for S3 storage
 * @param rawMatchData - Optional raw match data from Riot API for detailed stats
 * @returns A promise that resolves to an object with review text, optional image, and metadata, or undefined if API keys are not configured
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  rawMatchData?: MatchV5DTOs.MatchDto,
): Promise<{ text: string; image?: Uint8Array; metadata?: ReviewMetadata } | undefined> {
  // Curate the raw match data if provided
  const curatedData = rawMatchData ? await curateMatchData(rawMatchData) : undefined;

  // Try to generate AI review
  const aiReviewResult = await generateAIReview(match, curatedData);

  if (!aiReviewResult) {
    console.log("[generateMatchReview] OpenAI API key not configured, skipping review generation");
    return undefined;
  }

  const { review: reviewText, metadata } = aiReviewResult;

  // Generate AI image from the review text (only if we have a real AI review)
  const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
  const { style, themes } = selectRandomStyleAndTheme();

  // Add style and theme to metadata
  const fullMetadata: ReviewMetadata = {
    ...metadata,
    style,
    themes,
  };

  const reviewImage = await generateReviewImageBackend(
    reviewText,
    match,
    matchId,
    queueType,
    style,
    themes,
    curatedData,
  );

  if (reviewImage) {
    return {
      text: reviewText,
      image: reviewImage,
      metadata: fullMetadata,
    };
  }

  return {
    text: reviewText,
    metadata: fullMetadata,
  };
}
