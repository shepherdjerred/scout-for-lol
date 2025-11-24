/**
 * Core review generation functions - shared between backend and review-dev-tool
 *
 * This module contains pure business logic for generating AI-powered reviews.
 * Backend and review-dev-tool provide thin wrappers that handle:
 * - Backend: Environment config, S3 uploads, filesystem operations, logging
 * - Review-dev-tool: UI config, browser clients, progress callbacks, display logic
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { match as matchPattern } from "ts-pattern";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import { generateImagePrompt } from "@scout-for-lol/data/review/image-prompt.js";
import { replaceTemplateVariables } from "@scout-for-lol/data/review/prompts.js";

/**
 * Personality type (from prompts module)
 */
export type Personality = {
  metadata: {
    name: string;
    description: string;
    favoriteChampions: string[];
    favoriteLanes: string[];
  };
  instructions: string;
  filename?: string;
};

/**
 * Player metadata type
 */
export type PlayerMetadata = {
  description: string;
  favoriteChampions: string[];
  favoriteLanes: string[];
};

/**
 * Curated match data type (from curator module)
 */
export type CuratedMatchData = {
  gameInfo: {
    gameDuration: number;
    gameMode: string;
    queueId: number;
  };
  participants: unknown[]; // Full type in curator module
};

/**
 * Review text generation metadata
 */
export type ReviewTextMetadata = {
  textTokensPrompt?: number | undefined;
  textTokensCompletion?: number | undefined;
  textDurationMs: number;
  selectedPersonality?: string | undefined;
  reviewerName: string;
  playerName: string;
  systemPrompt: string;
  userPrompt: string;
  openaiRequestParams?: OpenAI.Chat.ChatCompletionCreateParams | undefined;
};

/**
 * Review image generation metadata
 */
export type ReviewImageMetadata = {
  imageDurationMs: number;
  selectedArtStyle: string;
  selectedArtTheme: string;
  selectedSecondArtTheme?: string | undefined;
  geminiPrompt?: string | undefined;
  geminiModel?: string | undefined;
};

/**
 * Extract match data from a match object
 * Handles both arena and regular matches
 */
export function extractMatchData(match: CompletedMatch | ArenaMatch): {
  matchData: Record<string, string>;
  lane: string | undefined;
} {
  return matchPattern(match)
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
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(num: number): string {
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

/**
 * Core review text generation function
 *
 * This is a pure function that takes all dependencies as parameters.
 * Callers (backend/review-dev-tool) are responsible for:
 * - Initializing the OpenAI client
 * - Loading personality and prompts
 * - Providing configuration
 */
export async function generateReviewText(params: {
  match: CompletedMatch | ArenaMatch;
  personality: Personality;
  basePromptTemplate: string;
  laneContext: string;
  playerMetadata: PlayerMetadata;
  openaiClient: OpenAI;
  model: string;
  maxTokens: number;
  temperature?: number | undefined;
  topP?: number | undefined;
  curatedData?: CuratedMatchData | undefined;
  systemPromptPrefix?: string | undefined;
}): Promise<{ text: string; metadata: ReviewTextMetadata }> {
  const {
    match,
    personality,
    basePromptTemplate,
    laneContext,
    playerMetadata,
    openaiClient,
    model,
    maxTokens,
    temperature,
    topP,
    curatedData,
    systemPromptPrefix = "",
  } = params;

  // Extract match data
  const { matchData } = extractMatchData(match);

  const playerName = matchData["playerName"];
  if (!playerName) {
    throw new Error("No player name found");
  }

  // Extract reviewer information from personality
  const reviewerName = personality.metadata.name;
  const reviewerPersonality = personality.metadata.description;
  const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
  const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

  // Player information
  const playerPersonality = playerMetadata.description;
  const playerFavoriteChampions = JSON.stringify(playerMetadata.favoriteChampions);
  const playerFavoriteLanes = JSON.stringify(playerMetadata.favoriteLanes);

  // Match-specific information
  const playerChampion = matchData["champion"] ?? "unknown champion";
  const playerLane = matchData["lane"] ?? "unknown lane";
  const opponentChampion = matchData["laneOpponent"] ?? "an unknown opponent";
  const laneDescription = laneContext;
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

  // System prompt with personality instructions and lane context
  const systemPrompt = `${systemPromptPrefix}${personality.instructions}\n\n${laneContext}`;

  const startTime = Date.now();

  // Create completion with conditional parameters
  const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
  };

  // Add optional parameters if provided
  if (temperature !== undefined) {
    completionParams.temperature = temperature;
  }
  if (topP !== undefined) {
    completionParams.top_p = topP;
  }

  const completion = await openaiClient.chat.completions.create(completionParams);

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
      selectedPersonality: personality.filename,
      reviewerName,
      playerName,
      systemPrompt,
      userPrompt,
      openaiRequestParams: completionParams,
    },
  };
}

/**
 * Core image generation function
 *
 * This is a pure function that takes all dependencies as parameters.
 * Callers (backend/review-dev-tool) are responsible for:
 * - Initializing the Gemini client
 * - Selecting art style and theme
 * - Handling the image data (S3 upload, display, etc.)
 */
export async function generateReviewImage(params: {
  reviewText: string;
  artStyle: string;
  artTheme: string;
  secondArtTheme?: string | undefined;
  matchData?: string | undefined;
  geminiClient: GoogleGenerativeAI;
  model: string;
  timeoutMs: number;
}): Promise<{ imageData: string; metadata: ReviewImageMetadata }> {
  const { reviewText, artStyle, artTheme, secondArtTheme, matchData, geminiClient, model, timeoutMs } = params;

  const geminiModel = geminiClient.getGenerativeModel({ model });

  const startTime = Date.now();

  // Add timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs.toString()}ms`));
    }, timeoutMs);
  });

  const prompt = generateImagePrompt({
    artStyle,
    artTheme,
    secondArtTheme,
    reviewText,
    matchData,
  });

  const result = await Promise.race([geminiModel.generateContent(prompt), timeoutPromise]);

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

  return {
    imageData,
    metadata: {
      imageDurationMs: duration,
      selectedArtStyle: artStyle,
      selectedArtTheme: artTheme,
      selectedSecondArtTheme: secondArtTheme,
      geminiPrompt: prompt,
      geminiModel: model,
    },
  };
}
