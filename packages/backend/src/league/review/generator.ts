import {
  generateReviewText,
  generateReviewImage,
  getOrdinalSuffix,
  type ArenaMatch,
  type CompletedMatch,
  type MatchId,
  selectRandomStyleAndTheme,
  curateMatchData,
  type CuratedMatchData,
} from "@scout-for-lol/data";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import config from "../../configuration.js";
import { saveAIReviewImageToS3 } from "../../storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
} from "./prompts.js";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = dirname(FILENAME);
const AI_IMAGES_DIR = join(DIRNAME, "ai-images");

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
): Promise<Buffer | undefined> {
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

    const buffer = Buffer.from(result.imageData, "base64");
    console.log("[generateReviewImage] Successfully generated image");

    // Save to local filesystem for debugging
    try {
      mkdirSync(AI_IMAGES_DIR, { recursive: true });
      const filepath = join(AI_IMAGES_DIR, `ai-review-${new Date().toISOString().replace(/[:.]/g, "-")}.png`);
      writeFileSync(filepath, buffer);
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
 * @returns A promise that resolves to an object with review text, optional image, and metadata
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  rawMatchData?: MatchV5DTOs.MatchDto,
): Promise<{ text: string; image?: Buffer; metadata?: ReviewMetadata }> {
  // Curate the raw match data if provided
  const curatedData = rawMatchData ? await curateMatchData(rawMatchData) : undefined;

  // Try to generate AI review
  const aiReviewResult = await generateAIReview(match, curatedData);

  if (!aiReviewResult) {
    console.log("[generateMatchReview] Falling back to placeholder review");
    const reviewText = generatePlaceholderReview(match);
    return { text: reviewText };
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

  const reviewImage = await generateReviewImageBackend(reviewText, match, matchId, queueType, style, themes, curatedData);

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

/**
 * Generate a placeholder review (used when AI reviews are disabled or not yet implemented)
 */
function generatePlaceholderReview(match: CompletedMatch | ArenaMatch): string {
  if (match.queueType === "arena") {
    const player = match.players[0];
    if (!player) {
      return "Unable to generate review: no player data found.";
    }
    const placementStr = player.placement.toString();
    return `[Placeholder Review] ${player.playerConfig.alias} finished in ${placementStr}${getOrdinalSuffix(player.placement)} place playing ${player.champion.championName} with ${player.teammate.championName}.`;
  } else {
    const player = match.players[0];
    if (!player) {
      return "Unable to generate review: no player data found.";
    }
    const outcome = player.outcome;
    const champion = player.champion;
    const killsStr = champion.kills.toString();
    const deathsStr = champion.deaths.toString();
    const assistsStr = champion.assists.toString();
    const kda = `${killsStr}/${deathsStr}/${assistsStr}`;
    const queueTypeStr = match.queueType ?? "unknown";
    return `[Placeholder Review] ${player.playerConfig.alias} played ${champion.championName} in ${queueTypeStr} and got a ${outcome} with a ${kda} KDA.`;
  }
}
