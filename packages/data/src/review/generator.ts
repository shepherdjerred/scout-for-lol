/**
 * Core review generation functions - shared between backend and review-dev-tool
 *
 * This module contains pure business logic for generating AI-powered reviews.
 * Backend and review-dev-tool provide thin wrappers that handle:
 * - Backend: Environment config, S3 uploads, filesystem operations, logging
 * - Review-dev-tool: UI config, browser clients, progress callbacks, display logic
 */

import type { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { match as matchPattern } from "ts-pattern";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import { generateImagePrompt } from "@scout-for-lol/data/review/image-prompt.js";
import { replaceTemplateVariables } from "@scout-for-lol/data/review/prompts.js";

/**
 * Chat completion parameters - extracted to avoid dependency on concrete OpenAI types
 */
export type ChatCompletionCreateParams = {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  max_completion_tokens: number;
  temperature?: number;
  top_p?: number;
};

const OpenAIChatCompletionChoiceSchema = z.object({
  message: z.object({
    content: z.string().nullable(),
  }),
});

const OpenAIChatCompletionUsageSchema = z
  .object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
  })
  .loose();

const OpenAIChatCompletionSchema = z
  .object({
    choices: z.array(OpenAIChatCompletionChoiceSchema),
    usage: OpenAIChatCompletionUsageSchema.optional(),
  })
  .loose();

const GeminiImagePartSchema = z
  .object({
    inlineData: z.object({
      data: z.string(),
    }),
  })
  .loose();

const GeminiResponseSchema = z
  .object({
    response: z.object({
      candidates: z.array(
        z.object({
          content: z.object({
            parts: z.array(GeminiImagePartSchema),
          }),
        }),
      ),
    }),
  })
  .loose();

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
  openaiRequestParams?: ChatCompletionCreateParams | undefined;
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

function buildPromptVariables(params: {
  matchData: Record<string, string>;
  personality: Personality;
  playerMetadata: PlayerMetadata;
  laneContext: string;
  match: CompletedMatch | ArenaMatch;
  curatedData?: CuratedMatchData;
}): {
  reviewerName: string;
  reviewerPersonality: string;
  reviewerFavoriteChampions: string;
  reviewerFavoriteLanes: string;
  playerName: string;
  playerPersonality: string;
  playerFavoriteChampions: string;
  playerFavoriteLanes: string;
  playerChampion: string;
  playerLane: string;
  opponentChampion: string;
  laneDescription: string;
  matchReport: string;
} {
  const { matchData, personality, playerMetadata, laneContext, match, curatedData } = params;
  const playerName = matchData["playerName"];
  if (!playerName) {
    throw new Error("No player name found");
  }

  const reviewerName = personality.metadata.name;
  const reviewerPersonality = personality.metadata.description;
  const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
  const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

  const playerPersonality = playerMetadata.description;
  const playerFavoriteChampions = JSON.stringify(playerMetadata.favoriteChampions);
  const playerFavoriteLanes = JSON.stringify(playerMetadata.favoriteLanes);

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

  return {
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
  };
}

function createCompletionParams(params: {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens: number;
  temperature?: number;
  topP?: number;
}): ChatCompletionCreateParams {
  const { systemPrompt, userPrompt, model, maxTokens, temperature, topP } = params;
  const completionParams: ChatCompletionCreateParams = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
  };

  if (temperature !== undefined) {
    completionParams.temperature = temperature;
  }
  if (topP !== undefined) {
    completionParams.top_p = topP;
  }

  return completionParams;
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
  openaiClient: {
    chat: {
      completions: {
        create(params: ChatCompletionCreateParams): Promise<{
          choices: {
            message: {
              content: string | null;
            };
          }[];
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
          };
        }>;
      };
    };
  };
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

  const { matchData } = extractMatchData(match);
  const promptVariables = buildPromptVariables({
    matchData,
    personality,
    playerMetadata,
    laneContext,
    match,
    ...(curatedData !== undefined && { curatedData }),
  });
  const userPrompt = replaceTemplateVariables(basePromptTemplate, promptVariables);
  const systemPrompt = `${systemPromptPrefix}${personality.instructions}\n\n${laneContext}`;
  const completionParams = createCompletionParams({
    systemPrompt,
    userPrompt,
    model,
    maxTokens,
    ...(temperature !== undefined && { temperature }),
    ...(topP !== undefined && { topP }),
  });

  const startTime = Date.now();
  const completionRaw = await openaiClient.chat.completions.create(completionParams);
  const duration = Date.now() - startTime;

  const completion = OpenAIChatCompletionSchema.parse(completionRaw);

  if (completion.choices.length === 0) {
    throw new Error("No choices returned from OpenAI");
  }

  const firstChoice = completion.choices[0];
  if (!firstChoice) {
    throw new Error("No choices returned from OpenAI");
  }
  const messageContent = firstChoice.message.content;
  if (!messageContent || messageContent.trim().length === 0) {
    throw new Error("No review content returned from OpenAI");
  }

  const review = messageContent.trim();
  const usage = completion.usage;

  return {
    text: review,
    metadata: {
      textTokensPrompt: usage?.prompt_tokens,
      textTokensCompletion: usage?.completion_tokens,
      textDurationMs: duration,
      selectedPersonality: personality.filename,
      reviewerName: promptVariables.reviewerName,
      playerName: promptVariables.playerName,
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
  secondArtTheme?: string;
  matchData?: string;
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

  const resultRaw = await Promise.race([geminiModel.generateContent(prompt), timeoutPromise]);

  const duration = Date.now() - startTime;

  const result = GeminiResponseSchema.parse(resultRaw);

  if (result.response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini");
  }

  const firstCandidate = result.response.candidates[0];
  if (!firstCandidate) {
    throw new Error("No candidates returned from Gemini");
  }
  const parts = firstCandidate.content.parts;

  if (parts.length === 0) {
    throw new Error("No parts found in response");
  }

  const imagePart = parts[0];
  if (!imagePart) {
    throw new Error("No image part found in response");
  }
  const imageData = imagePart.inlineData.data;
  if (imageData.length === 0) {
    throw new Error("Empty image data in response");
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
