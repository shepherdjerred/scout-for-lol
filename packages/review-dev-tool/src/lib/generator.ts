/**
 * Review generation logic (extracted and parameterized from backend)
 */
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { match as matchPattern } from "ts-pattern";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";
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
  replaceTemplateVariables,
} from "./prompts";
import { selectRandomStyleAndTheme } from "./art-styles";
import { modelSupportsParameter } from "./models";

/**
 * Generate AI-powered review text using OpenAI
 */
async function generateReviewText(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
): Promise<{ text: string; metadata: Partial<GenerationMetadata> }> {
  const apiKey = config.api.openaiApiKey;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  // Get personality
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

  // Get base prompt template (use custom or default)
  const basePromptTemplate = config.prompts.basePrompt || getBasePrompt();

  // Build match data and lane context based on match type
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

  // Get lane context (use custom or default)
  const laneContextInfo = config.prompts.laneContext || getLaneContext(lane);

  const playerName = matchData["playerName"];
  if (!playerName) {
    throw new Error("No player name found");
  }

  // Extract reviewer information from personality
  const reviewerName = personality.metadata.name;
  const reviewerPersonality = personality.metadata.description;
  const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
  const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

  // Load player information (use custom or default)
  const playerMeta = config.prompts.playerMetadata || getGenericPlayerMetadata();
  const playerPersonality = playerMeta.description;
  const playerFavoriteChampions = JSON.stringify(playerMeta.favoriteChampions);
  const playerFavoriteLanes = JSON.stringify(playerMeta.favoriteLanes);

  // Match-specific information
  const playerChampion = matchData["champion"] ?? "unknown champion";
  const playerLane = matchData["lane"] ?? "unknown lane";
  const opponentChampion = matchData["laneOpponent"] ?? "an unknown opponent";
  const laneDescription = laneContextInfo;
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

  // System prompt with personality instructions and lane context
  const systemPromptPrefix = config.prompts.systemPromptPrefix || "";
  const systemPrompt = `${systemPromptPrefix}${personality.instructions}\n\n${laneContextInfo}`;

  const startTime = Date.now();

  // Check model capabilities to conditionally include parameters
  const supportsTemperature = modelSupportsParameter(config.textGeneration.model, "temperature");
  const supportsTopP = modelSupportsParameter(config.textGeneration.model, "topP");

  const completion = await client.chat.completions.create({
    model: config.textGeneration.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: config.textGeneration.maxTokens,
    ...(supportsTemperature && { temperature: config.textGeneration.temperature }),
    ...(supportsTopP && { top_p: config.textGeneration.topP }),
  });

  const duration = Date.now() - startTime;

  const firstChoice = completion.choices[0];
  if (!firstChoice) {
    throw new Error("No choices returned from OpenAI");
  }

  const review = firstChoice.message.content?.trim();
  if (!review) {
    throw new Error("No review content returned from OpenAI");
  }

  return {
    text: review,
    metadata: {
      textTokensPrompt: completion.usage?.prompt_tokens,
      textTokensCompletion: completion.usage?.completion_tokens,
      textDurationMs: duration,
      selectedPersonality: personality.id,
    },
  };
}

/**
 * Generate AI-powered image from review text using Gemini
 */
async function generateReviewImage(
  reviewText: string,
  config: ReviewConfig,
): Promise<{ image: string; metadata: Partial<GenerationMetadata> }> {
  const apiKey = config.api.geminiApiKey;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const client = new GoogleGenerativeAI(apiKey);

  // Select art style and theme
  let artStyle: string;
  let artTheme: string;

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

  const model = client.getGenerativeModel({
    model: config.imageGeneration.model,
  });

  const startTime = Date.now();

  // Add timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${config.imageGeneration.timeoutMs.toString()}ms`));
    }, config.imageGeneration.timeoutMs);
  });

  const result = await Promise.race([
    model.generateContent(
      `Generate a creative and visually striking image based on this League of Legends match review.

Art style to use: ${artStyle}

Theme to use: ${artTheme}

CRITICAL: You MUST use ONLY the art style specified above. Do not mix styles or use any other style. Commit fully to this specific aesthetic.

Review text to visualize and elaborate on: "${reviewText}"

Important:
- Interpret and expand on the themes, emotions, and key moments from the review
- Create something visually interesting that captures the essence of the performance and feedback
- Use your chosen art style consistently and make the composition dynamic
- Add visual storytelling elements - show the action, emotion, and drama beyond the literal text
- Make it feel like cover art or a key moment illustration
- Stay true to the specified art style throughout the entire image
- Incorporate the theme naturally into the composition
- DO NOT include long text strings or labels (e.g., no "irfan here:", no reviewer names, no text captions)
- Small numerical stats are acceptable (e.g., kill counts, scores), but avoid any prose or identifying text
- Focus on visual storytelling rather than text explanations`,
    ),
    timeoutPromise,
  ]);

  const duration = Date.now() - startTime;

  const response = result.response;
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini");
  }

  const parts = response.candidates[0]?.content.parts;
  if (!parts) {
    throw new Error("No candidate or parts in response");
  }

  const imagePart = parts.find((part: { inlineData?: unknown }) => part.inlineData);
  const imageData = imagePart?.inlineData?.data;
  if (!imageData) {
    throw new Error("No image data in response");
  }

  // Return base64 encoded image
  return {
    image: imageData as string,
    metadata: {
      imageDurationMs: duration,
      selectedArtStyle: artStyle,
      selectedArtTheme: artTheme,
    },
  };
}

export type GenerationStep = "text" | "image" | "complete";

export interface GenerationProgress {
  step: GenerationStep;
  message: string;
}

/**
 * Generate a complete match review with text and optional image
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  config: ReviewConfig,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<GenerationResult> {
  try {
    // Generate text review
    onProgress?.({ step: "text", message: "Generating review text..." });
    const textResult = await generateReviewText(match, config);

    // Generate image if enabled
    let imageResult: { image: string; metadata: Partial<GenerationMetadata> } | undefined;
    if (config.imageGeneration.enabled) {
      try {
        onProgress?.({ step: "image", message: "Generating image..." });
        imageResult = await generateReviewImage(textResult.text, config);
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
      textDurationMs: textResult.metadata.textDurationMs ?? 0,
      imageDurationMs: imageResult?.metadata.imageDurationMs,
      imageGenerated: Boolean(imageResult),
      selectedPersonality: textResult.metadata.selectedPersonality,
      selectedArtStyle: imageResult?.metadata.selectedArtStyle,
      selectedArtTheme: imageResult?.metadata.selectedArtTheme,
    };

    return {
      text: textResult.text,
      image: imageResult?.image,
      metadata,
    };
  } catch (error) {
    return {
      text: "",
      metadata: {
        textDurationMs: 0,
        imageGenerated: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to get ordinal suffix
 */
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
