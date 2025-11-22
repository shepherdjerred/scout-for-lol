import type { ArenaMatch, CompletedMatch, MatchId } from "@scout-for-lol/data";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { match as matchPattern } from "ts-pattern";
import { z } from "zod";
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
 * Art styles for AI-generated review images
 */
const ART_STYLES = [
  // Comic & Graphic Novel Styles
  "Marvel/Avengers style with bold inking and dynamic action poses",
  "DC Comics with dramatic shadows, heroic composition, and intense atmosphere",
  "Naruto/Shonen manga style with energetic action and bold line work",
  "Avatar: The Last Airbender style with fluid movement and elemental effects",
  "Indie comic book with unique line work, creative paneling, and distinctive color palette",
  "Golden age comics with Ben-Day dots, vintage feel, and retro typography",
  "Graphic novel noir with high contrast, moody shadows, and cinematic angles",
  "Graphic novel style with dynamic paneling, dramatic angles, and sequential storytelling",

  // Classic & Fine Art
  "Impressionist painting style with visible brushstrokes, dappled light, and soft color blending",
  "Oil painting with rich textures, classical composition, and painterly brushstrokes",
  "Watercolor painting with artistic flair, flowing brushwork, and soft gradients",
  "Art nouveau with decorative frames, elegant curves, and ornamental details",
  "Art deco with geometric patterns, luxurious gold accents, and streamlined elegance",
  "Surrealist dreamscape with impossible geometry, symbolic imagery, and ethereal atmosphere",
  "Expressionist style with bold emotional colors, distorted forms, and raw intensity",
  "Baroque painting with dramatic lighting, rich details, and dynamic movement",

  // Illustration & Poster Art
  "Movie poster style with cinematic composition and dramatic lighting",
  "Epic fantasy illustration with dramatic composition and magical atmosphere",
  "Soviet propaganda poster with bold typography, heroic figures, and striking red colors",
  "Psychedelic 60s poster art with swirling patterns, vibrant colors, and groovy typography",
  "Victorian Gothic illustration with intricate details, dark romanticism, and ornate borders",
  "Medieval manuscript illumination with gold leaf, intricate borders, and vibrant miniatures",
  "Tarot card art with mystical symbols, ornate frames, and esoteric imagery",

  // Modern & Contemporary
  "Pop art style with bold colors, Ben-Day dots, and comic-inspired compositions",
  "Memphis design with bold geometric shapes, bright colors, and 80s postmodern aesthetic",
  "Minimalist flat design with clean lines, limited color palette, and geometric simplicity",
  "Bauhaus geometric style with primary colors, circles, squares, and functional beauty",
  "Glitch art with digital corruption, chromatic aberration, and databending effects",

  // Cultural & Traditional
  "Ukiyo-e Japanese woodblock print style with flat colors and elegant lines",
  "Chinese ink wash painting with flowing brushwork, misty atmosphere, and calligraphic elegance",
  "Aztec/Mayan art with geometric patterns, bold symbols, and ancient iconography",
  "Persian miniature painting with intricate patterns, rich colors, and delicate detail",
  "Aboriginal dot painting with symbolic patterns, earth tones, and dreamtime storytelling",

  // Urban & Contemporary
  "Graffiti/street art style with bold colors, urban energy, and spray paint texture",
  "Stencil art style with sharp edges, high contrast, and urban activist aesthetic",
  "Neon sign art with glowing tubes, retro typography, and nighttime city vibes",

  // Digital & Gaming
  "Retro pixel art in detailed 16-bit game style with vibrant colors",
  "Cyberpunk aesthetic with neon-soaked futuristic elements and urban grit",
  "Synthwave/vaporwave aesthetic with pink and purple gradients, retro-futuristic vibes",
  "Isometric game art with precise angles, pixel-perfect details, and strategic perspective",
  "Bowling alley strike animation with campy over-the-top 3D CGI, dramatic explosions, and cheesy special effects",

  // Textures & Materials
  "Stained glass window style with bold outlines and colorful geometric segments",
  "Paper cut-out art with layered depth, bold shapes, and clean shadows",
  "Mosaic tile art with small colorful pieces forming larger images and patterns",
  "Carved wood relief with dimensional depth, natural grain, and tactile texture",
  "Embroidered tapestry style with thread texture, cross-stitch detail, and textile warmth",

  // Photographic & Realistic
  "Film noir photography with dramatic shadows, high contrast, and moody black and white",
  "Hyperrealistic digital painting with meticulous detail, perfect lighting, and lifelike textures",
  "Double exposure photography with overlapping images, dreamy transparency, and poetic layering",

  // Animation Styles
  "Studio Ghibli's dreamy, whimsical aesthetic with soft colors and emotional depth",
  "Disney Renaissance style with expressive characters, musical energy, and theatrical storytelling",
] as const;

/**
 * Randomly select an art style for image generation
 */
function selectRandomArtStyle(): string {
  const randomIndex = Math.floor(Math.random() * ART_STYLES.length);
  const style = ART_STYLES[randomIndex];
  if (!style) {
    throw new Error("Failed to select art style");
  }
  return style;
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
    const artStyle = selectRandomArtStyle();
    console.log(`[generateReviewImage] Selected art style: ${artStyle}`);
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

    const result = await Promise.race([
      model.generateContent(
        `Generate a creative and visually striking image based on this League of Legends match review.

Art style to use: ${artStyle}

CRITICAL: You MUST use ONLY the art style specified above. Do not mix styles or use any other style. Commit fully to this specific aesthetic.

Review text to visualize and elaborate on: "${reviewText}"

Important:
- Interpret and expand on the themes, emotions, and key moments from the review
- Create something visually interesting that captures the essence of the performance and feedback
- Use your chosen art style consistently and make the composition dynamic
- Add visual storytelling elements - show the action, emotion, and drama beyond the literal text
- Make it feel like cover art or a key moment illustration
- Stay true to the specified art style throughout the entire image`,
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
