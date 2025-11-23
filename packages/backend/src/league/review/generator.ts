import type { ArenaMatch, CompletedMatch, MatchId } from "@scout-for-lol/data";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { match as matchPattern } from "ts-pattern";
import { z } from "zod";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import config from "../../configuration.js";
import { saveAIReviewImageToS3 } from "../../storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
  replaceTemplateVariables,
} from "./prompts.js";
import { selectRandomStyleAndTheme } from "./art-styles.js";
import { curateMatchData, type CuratedMatchData } from "./curator.js";

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
 * Generate an AI-powered image from review text using Gemini
 */
async function generateReviewImage(
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

    const model = client.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
    });

    // Add timeout protection (60 seconds)
    const TIMEOUT_MS = 60_000;
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Gemini API call timed out after ${TIMEOUT_MS.toString()}ms`));
      }, TIMEOUT_MS);
    });

    // Build theme description
    const themeDescription = isMashup
      ? `Themes (MASHUP - blend these two): ${themes.join(" meets ")}`
      : `Theme (subject matter): ${themes[0] ?? "unknown"}`;

    const mashupInstructions = isMashup
      ? `
MASHUP MODE:
- You have TWO themes to blend together in a creative crossover
- Merge elements from both themes into a single cohesive image
- Think of it as a crossover episode or collaboration between these universes
- Be creative in how you combine the visual elements and characters from both themes
`
      : "";

    const result = await Promise.race([
      model.generateContent(
        `Generate a creative and visually striking image based on this League of Legends match review.

Art style (visual aesthetic): ${style}

${themeDescription}

CRITICAL INSTRUCTIONS:
- You MUST use the EXACT art style specified above for the visual aesthetic (how it looks)
- You MUST incorporate the theme(s) specified above for the subject matter (what's depicted)
- These are SEPARATE elements that must work together - apply the style TO the theme(s)
- Do not change the specified style
- Commit fully to both the visual aesthetic AND the subject matter
${mashupInstructions}
Review text to visualize and elaborate on: "${reviewText}"

Important:
- Interpret and expand on the themes, emotions, and key moments from the review
- Create something visually interesting that captures the essence of the performance and feedback
- Apply the specified art style consistently throughout the entire image
- Incorporate the specified theme(s) into the subject matter and characters
- Add visual storytelling elements - show the action, emotion, and drama beyond the literal text
- Make it feel like cover art or a key moment illustration
- The art style defines HOW it looks, the theme(s) define WHAT is shown
- DO NOT include long text strings or labels (e.g., no "irfan here:", no reviewer names, no text captions)
- Small numerical stats are acceptable (e.g., kill counts, scores), but avoid any prose or identifying text
- Focus on visual storytelling rather than text explanations

Here is the match data: ${JSON.stringify(curatedData ? { processedMatch: match, detailedStats: curatedData } : match, null, 2)}`,
      ),
      timeoutPromise,
    ]);

    const duration = Date.now() - startTime;
    console.log(`[generateReviewImage] Gemini API call completed in ${duration.toString()}ms`);

    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      console.log("[generateReviewImage] No candidates returned from Gemini");
      return undefined;
    }
    const parts = response.candidates[0]?.content.parts;
    if (!parts) {
      console.log("[generateReviewImage] No candidate or parts in response");
      return undefined;
    }
    const imagePart = parts.find((part: { inlineData?: unknown }) => part.inlineData);
    const imageData = imagePart?.inlineData?.data;
    if (!imageData) {
      console.log("[generateReviewImage] No image data in response");
      return undefined;
    }
    const buffer = Buffer.from(imageData, "base64");
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
 * Generate an AI-powered review using OpenAI
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

    // Build match data and lane context based on match type using ts-pattern
    const { matchData, lane } = matchPattern(match)
      .with({ queueType: "arena" }, (arenaMatch: ArenaMatch) => {
        const player = arenaMatch.players[0];
        if (!player) {
          throw new Error("No player data found");
        }

        const placement = player.placement;
        const kills = player.champion.kills;
        const deaths = player.champion.deaths;
        const assists = player.champion.assists;

        return {
          lane: undefined,
          matchData: {
            playerName: player.playerConfig.alias,
            champion: player.champion.championName,
            lane: "arena",
            outcome: `${placement.toString()}${getOrdinalSuffix(placement)} place`,
            kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
            queueType: arenaMatch.queueType,
            teammate: player.teammate.championName,
          },
        };
      })
      .otherwise((regularMatch: CompletedMatch) => {
        const player = regularMatch.players[0];
        if (!player) {
          throw new Error("No player data found");
        }

        const kills = player.champion.kills;
        const deaths = player.champion.deaths;
        const assists = player.champion.assists;

        const data: Record<string, string> = {
          playerName: player.playerConfig.alias,
          champion: player.champion.championName,
          lane: player.lane ?? "unknown",
          outcome: player.outcome,
          kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
          queueType: regularMatch.queueType ?? "unknown",
        };

        // Add lane opponent if available
        if (player.laneOpponent) {
          data["laneOpponent"] = player.laneOpponent.championName;
        }

        return {
          lane: player.lane,
          matchData: data,
        };
      });

    const laneContextInfo = getLaneContext(lane);
    console.log(`[generateAIReview] Selected lane context: ${laneContextInfo.filename}`);

    const playerName = matchData["playerName"];
    if (!playerName) {
      console.log("[generateAIReview] No player name found");
      return undefined;
    }

    // Extract reviewer information from personality metadata
    const reviewerName = personality.metadata.name;
    const reviewerPersonality = personality.metadata.description;
    const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
    const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

    // Load player information from JSON
    const playerMeta = loadPlayerMetadata(playerName);
    const playerPersonality = playerMeta.description;
    const playerFavoriteChampions = JSON.stringify(playerMeta.favoriteChampions);
    const playerFavoriteLanes = JSON.stringify(playerMeta.favoriteLanes);

    // Match-specific information
    const playerChampion = matchData["champion"] ?? "unknown champion";
    const playerLane = matchData["lane"] ?? "unknown lane";
    const opponentChampion = matchData["laneOpponent"] ?? "an unknown opponent";
    const laneDescription = laneContextInfo.content;
    const matchReport = curatedData
      ? JSON.stringify(
          {
            processedMatch: match,
            detailedStats: curatedData,
          },
          null,
          2,
        )
      : JSON.stringify(match, null, 2);

    // Replace all template variables
    const userPrompt = replaceTemplateVariables(basePromptTemplate, {
      reviewerName,
      reviewerPersonality,
      reviewerFavoriteChampions,
      reviewerFavoriteLanes,
      playerName,
      playerPersonality,
      playerFavoriteChampions,
      playerFavoriteLanes,
      playerChampion,
      playerLane,
      opponentChampion,
      laneDescription,
      matchReport,
    });

    // System prompt remains separate with personality instructions and lane context
    const systemPrompt = `${personality.instructions}\n\n${laneContextInfo.content}`;

    console.log("[generateAIReview] Calling OpenAI API...");
    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 25000,
    });

    const firstChoice = completion.choices[0];
    if (!firstChoice) {
      console.log("[generateAIReview] No choices returned from OpenAI");
      return undefined;
    }

    const review = firstChoice.message.content?.trim();
    if (!review) {
      console.log("[generateAIReview] No review content returned from OpenAI");
      return undefined;
    }

    console.log("[generateAIReview] Successfully generated AI review");
    return {
      review,
      metadata: {
        reviewerName,
        playerName,
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

  const reviewImage = await generateReviewImage(reviewText, match, matchId, queueType, style, themes, curatedData);

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

function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
