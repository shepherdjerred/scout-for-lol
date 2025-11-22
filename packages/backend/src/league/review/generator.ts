import type { ArenaMatch, CompletedMatch, MatchId } from "@scout-for-lol/data";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { match as matchPattern } from "ts-pattern";
import config from "../../configuration.js";
import { saveAIReviewImageToS3 } from "../../storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
  replaceTemplateVariables,
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
 * Generate an AI-powered image from review text using Gemini
 */
async function generateReviewImage(
  reviewText: string,
  matchId: MatchId,
  queueType: string,
): Promise<Buffer | undefined> {
  const client = getGeminiClient();
  if (!client) {
    console.log("[generateReviewImage] Gemini API key not configured, skipping image generation");
    return undefined;
  }
  try {
    console.log("[generateReviewImage] Calling Gemini API to generate image...");
    const model = client.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
    });
    const result = await model.generateContent(
      `Generate a creative and visually striking image based on this League of Legends match review.

Pick a unique and interesting art style - make it distinctive and engaging! Here are some ideas:

COMIC BOOK STYLES (especially great):
- Marvel/Avengers style with bold inking and dynamic action
- DC Comics dramatic shadows and heroic poses
- Manga/anime styles: Studio Ghibli's dreamy aesthetic, Naruto's energetic action, Avatar: The Last Airbender's fluid movement
- Indie comic book with unique line work and color palettes
- Golden age comics with Ben-Day dots and vintage feel
- Graphic novel noir with high contrast

OTHER EXCITING STYLES:
- Cyberpunk neon-soaked futuristic aesthetic
- Fantasy illustration with epic composition
- Retro pixel art or 8-bit/16-bit game style
- Watercolor or ink wash with artistic flair
- Art nouveau with decorative frames
- Synthwave/vaporwave aesthetic
- Movie poster or cinematic style

Review text to visualize and elaborate on: "${reviewText}"

Important:
- Interpret and expand on the themes, emotions, and key moments from the review
- Create something visually interesting that captures the essence of the performance and feedback
- Use your chosen art style consistently and make the composition dynamic
- Add visual storytelling elements - show the action, emotion, and drama beyond the literal text
- Make it feel like cover art or a key moment illustration`,
    );
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
    const imagePart = parts.find((part) => part.inlineData);
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
    console.error("[generateReviewImage] Error generating image:", error);
    return undefined;
  }
}

/**
 * Generate an AI-powered review using OpenAI
 */
async function generateAIReview(match: CompletedMatch | ArenaMatch): Promise<string | undefined> {
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
    const matchReport = JSON.stringify(match, null, 2);

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
      model: "gpt-5-nano",
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
    return review;
  } catch (error) {
    console.error("[generateAIReview] Error generating AI review:", error);
    return undefined;
  }
}

/**
 * Generates a post-game review for a player's performance with optional AI-generated image.
 * @param match - The completed match data (regular or arena)
 * @param matchId - The match ID for S3 storage
 * @returns A promise that resolves to an object with review text and optional image
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
): Promise<{ text: string; image?: Buffer }> {
  // Try to generate AI review
  const aiReview = await generateAIReview(match);
  const reviewText = aiReview ?? generatePlaceholderReview(match);
  if (!aiReview) {
    console.log("[generateMatchReview] Falling back to placeholder review");
  }
  // Generate AI image from the review text (only if we have a real AI review)
  if (aiReview) {
    const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
    const reviewImage = await generateReviewImage(aiReview, matchId, queueType);
    if (reviewImage) {
      return {
        text: reviewText,
        image: reviewImage,
      };
    }
  }
  return {
    text: reviewText,
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
