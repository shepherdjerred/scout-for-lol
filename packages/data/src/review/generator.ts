/**
 * Core review generation functions - shared between backend and review-dev-tool
 *
 * This module contains pure business logic for generating AI-powered reviews.
 * Backend and review-dev-tool provide thin wrappers that handle:
 * - Backend: Environment config, S3 uploads, filesystem operations, logging
 * - Review-dev-tool: UI config, browser clients, progress callbacks, display logic
 */

import type { GoogleGenerativeAI } from "@google/generative-ai";
import type { CuratedTimeline } from "./curator-types.js";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import { generateImagePrompt } from "@scout-for-lol/data/review/image-prompt.js";
import { replaceTemplateVariables, type Personality, type PlayerMetadata } from "@scout-for-lol/data/review/prompts.js";
import {
  buildPromptVariables,
  createCompletionParams,
  extractMatchData,
} from "@scout-for-lol/data/review/generator-helpers.js";

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
  playerIndex?: number | undefined;
  matchAnalysis?: string | undefined;
  timelineSummary?: string | undefined;
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
    playerIndex = 0,
    matchAnalysis,
    timelineSummary,
  } = params;

  const { matchData } = extractMatchData(match, playerIndex);
  const promptVariables = buildPromptVariables({
    matchData,
    personality,
    playerMetadata,
    laneContext,
    match,
    playerIndex,
    ...(curatedData !== undefined && { curatedData }),
    ...(matchAnalysis !== undefined && { matchAnalysis }),
    ...(timelineSummary !== undefined && { timelineSummary }),
  });
  const userPrompt = replaceTemplateVariables(basePromptTemplate, promptVariables);
  const styleCardSection = `\n\nReviewer style card (from Discord chat analysis; keep the tone aligned):\n${personality.styleCard}`;
  const systemPrompt = `${systemPromptPrefix}${personality.instructions}${styleCardSection}\n\n${laneContext}`;
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
    const refusal = firstChoice.message.refusal;
    const finishReason = firstChoice.finish_reason;
    const details: string[] = [];
    if (refusal) {
      details.push(`refusal: ${refusal}`);
    }
    if (finishReason) {
      details.push(`finish_reason: ${finishReason}`);
    }
    const detailStr = details.length > 0 ? ` (${details.join(", ")})` : "";
    throw new Error(`No review content returned from OpenAI${detailStr}`);
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
 * The image description should be the ONLY input for what to generate -
 * all context (review text, match data, etc.) should have been processed
 * in the previous step (Step 3: generateImageDescription).
 *
 * Callers (backend/review-dev-tool) are responsible for:
 * - Initializing the Gemini client
 * - Generating the image description (Step 3)
 * - Handling the image data (S3 upload, display, etc.)
 */
export async function generateReviewImage(params: {
  imageDescription: string;
  geminiClient: GoogleGenerativeAI;
  model: string;
  timeoutMs: number;
}): Promise<{ imageData: string; metadata: ReviewImageMetadata }> {
  const { imageDescription, geminiClient, model, timeoutMs } = params;

  const geminiModel = geminiClient.getGenerativeModel({ model });

  const startTime = Date.now();

  // Add timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs.toString()}ms`));
    }, timeoutMs);
  });

  const prompt = generateImagePrompt(imageDescription);

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
      geminiPrompt: prompt,
      geminiModel: model,
    },
  };
}

import { z } from "zod";

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

export const OpenAIChatCompletionChoiceSchema = z.object({
  message: z.object({
    content: z.string().nullable(),
    refusal: z.string().nullable().optional(),
  }),
  finish_reason: z.string().nullable().optional(),
});

export const OpenAIChatCompletionUsageSchema = z
  .object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
  })
  .loose();

export const OpenAIChatCompletionSchema = z
  .object({
    choices: z.array(OpenAIChatCompletionChoiceSchema),
    usage: OpenAIChatCompletionUsageSchema.optional(),
  })
  .loose();

export const GeminiImagePartSchema = z
  .object({
    inlineData: z.object({
      data: z.string(),
    }),
  })
  .loose();

export const GeminiResponseSchema = z
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

// Note: Personality and PlayerMetadata types are exported from prompts.ts
// via the data package index.ts (export * from "./review/prompts.js")
// Consumers should import them from @scout-for-lol/data directly

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
  timeline?: CuratedTimeline | undefined;
  timelineSummary?: string | undefined;
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
  geminiPrompt?: string | undefined;
  geminiModel?: string | undefined;
};
