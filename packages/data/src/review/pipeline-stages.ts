/**
 * Individual stage functions for the unified AI review pipeline
 *
 * Each stage is a pure function that takes dependencies as parameters.
 * All JSON data is minified before being sent to reduce token usage.
 */

import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index";
import type { RawMatch } from "@scout-for-lol/data/league/raw-match.schema";
import type { RawTimeline } from "@scout-for-lol/data/league/raw-timeline.schema";
import type { OpenAIClient, ModelConfig, StageTrace, ImageGenerationTrace } from "./pipeline-types.ts";
import type { Personality } from "./prompts.ts";
import type { ArtStyle } from "@scout-for-lol/data/review/art-categories";
import { getStageSystemPrompt } from "./pipeline-defaults.ts";
import { generateImagePrompt } from "./image-prompt.ts";
import { replaceTemplateVariables, selectRandomImagePrompts } from "./prompts.ts";
import { buildPromptVariables, extractMatchData } from "./generator-helpers.ts";
import { enrichTimelineData } from "./timeline-enricher.ts";
import type { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Import user prompts from TXT files
import TIMELINE_SUMMARY_USER_PROMPT_TEMPLATE from "./prompts/user/1b-timeline-summary.txt";
import MATCH_SUMMARY_USER_PROMPT_TEMPLATE from "./prompts/user/1a-match-summary.txt";
import IMAGE_DESCRIPTION_USER_PROMPT_TEMPLATE from "./prompts/user/3-image-description.txt";

// Import system prompt templates
import REVIEW_TEXT_SYSTEM_PROMPT_TEMPLATE from "./prompts/system/2-review-text.txt";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Minify JSON string to reduce token usage
 */
function minifyJson(data: unknown): string {
  return JSON.stringify(data);
}

/**
 * Replace template variables in a prompt template using <VARIABLE> syntax
 */
function replacePromptVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`<${key}>`, value);
  }
  return result;
}

/**
 * Make an OpenAI chat completion call and return the trace
 */
async function callOpenAI(params: {
  client: OpenAIClient;
  model: ModelConfig;
  systemPrompt?: string;
  userPrompt: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { client, model, systemPrompt, userPrompt } = params;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  const startTime = Date.now();

  const response = await client.chat.completions.create({
    model: model.model,
    messages,
    max_completion_tokens: model.maxTokens,
    ...(model.temperature !== undefined && { temperature: model.temperature }),
    ...(model.topP !== undefined && { top_p: model.topP }),
  });

  const durationMs = Date.now() - startTime;

  const content = response.choices[0]?.message.content;
  if (!content || content.trim().length === 0) {
    const refusal = response.choices[0]?.message.refusal;
    const finishReason = response.choices[0]?.finish_reason;
    const details: string[] = [];
    if (refusal) {
      details.push(`refusal: ${refusal}`);
    }
    if (finishReason) {
      details.push(`finish_reason: ${finishReason}`);
    }
    const detailStr = details.length > 0 ? ` (${details.join(", ")})` : "";
    throw new Error(`No content returned from OpenAI${detailStr}`);
  }

  const text = content.trim();

  const trace: StageTrace = {
    request: {
      userPrompt,
    },
    response: { text },
    model,
    durationMs,
  };

  if (systemPrompt) {
    trace.request.systemPrompt = systemPrompt;
  }
  if (response.usage?.prompt_tokens !== undefined) {
    trace.tokensPrompt = response.usage.prompt_tokens;
  }
  if (response.usage?.completion_tokens !== undefined) {
    trace.tokensCompletion = response.usage.completion_tokens;
  }

  return { text, trace };
}

// ============================================================================
// Stage 1a: Timeline Summary
// ============================================================================

/**
 * Stage 1a: Summarize raw timeline data into a narrative
 *
 * Takes raw timeline data from Riot API along with match data for participant
 * context, and generates a narrative summary of how the game unfolded.
 * The timeline is enriched with a participant lookup table for champion/team names.
 */
export async function generateTimelineSummary(params: {
  rawTimeline: RawTimeline;
  rawMatch: RawMatch;
  laneContext: string;
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { rawTimeline, rawMatch, laneContext, client, model, systemPromptOverride } = params;

  // Enrich timeline with participant lookup table for human-readable names
  const enrichedData = enrichTimelineData(rawTimeline, rawMatch);

  const systemPromptTemplate = getStageSystemPrompt("timelineSummary", systemPromptOverride);
  const systemPrompt = replacePromptVariables(systemPromptTemplate, {
    LANE_CONTEXT: laneContext,
  });
  const userPrompt = replacePromptVariables(TIMELINE_SUMMARY_USER_PROMPT_TEMPLATE, {
    TIMELINE_DATA: minifyJson(enrichedData),
  });

  return callOpenAI({
    client,
    model,
    systemPrompt,
    userPrompt,
  });
}

// ============================================================================
// Stage 1b: Match Summary
// ============================================================================

/**
 * Stage 1b: Summarize match data for a single player
 *
 * Takes raw match data from Riot API to generate a factual summary
 * of the player's performance. This summary is used by the personality
 * reviewer instead of raw JSON.
 */
export async function generateMatchSummary(params: {
  match: CompletedMatch | ArenaMatch;
  rawMatch: RawMatch;
  playerIndex: number;
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { match, rawMatch, playerIndex, client, model, systemPromptOverride } = params;

  const player = match.players[playerIndex] ?? match.players[0];
  if (!player) {
    throw new Error("No player found for match summary");
  }

  const playerName = player.playerConfig.alias;
  const playerChampion = player.champion.championName;
  let lane = "unknown lane";
  if (match.queueType === "arena") {
    lane = "arena";
  } else if ("lane" in player && typeof player.lane === "string") {
    lane = player.lane;
  }

  const systemPrompt = getStageSystemPrompt("matchSummary", systemPromptOverride);

  const userPrompt = replacePromptVariables(MATCH_SUMMARY_USER_PROMPT_TEMPLATE, {
    PLAYER_NAME: playerName,
    PLAYER_CHAMPION: playerChampion,
    PLAYER_LANE: lane,
    MATCH_DATA: minifyJson({
      processedMatch: match,
      rawMatch,
    }),
  });

  return callOpenAI({
    client,
    model,
    systemPrompt,
    userPrompt,
  });
}

// ============================================================================
// Stage 2: Review Text (Personality)
// ============================================================================

/**
 * Minify a JSON string (used for style card)
 */
function minifyJsonString(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * Stage 2: Generate review text using personality
 *
 * Takes text summaries (NOT raw JSON) from stages 1a and 1b,
 * and generates the final review using the personality's voice.
 */
export async function generateReviewTextStage(params: {
  match: CompletedMatch | ArenaMatch;
  personality: Personality;
  basePromptTemplate: string;
  laneContext: string;
  playerIndex: number;
  matchSummary: string;
  timelineSummary?: string;
  client: OpenAIClient;
  model: ModelConfig;
}): Promise<{ text: string; reviewerName: string; playerName: string; trace: StageTrace }> {
  const {
    match,
    personality,
    basePromptTemplate,
    laneContext,
    playerIndex,
    matchSummary,
    timelineSummary,
    client,
    model,
  } = params;

  const { matchData } = extractMatchData(match, playerIndex);

  // Build prompt variables using the text summaries instead of raw JSON
  const promptVariables = buildPromptVariables({
    matchData,
    personality,
    laneContext,
    match,
    playerIndex,
    matchAnalysis: matchSummary, // Use match summary text
    ...(timelineSummary !== undefined && { timelineSummary }),
  });

  const userPrompt = replaceTemplateVariables(basePromptTemplate, promptVariables);
  const systemPrompt = replacePromptVariables(REVIEW_TEXT_SYSTEM_PROMPT_TEMPLATE, {
    PERSONALITY_INSTRUCTIONS: personality.instructions,
    STYLE_CARD: minifyJsonString(personality.styleCard),
    LANE_CONTEXT: laneContext,
  });

  const { text, trace } = await callOpenAI({
    client,
    model,
    systemPrompt,
    userPrompt,
  });

  return {
    text,
    reviewerName: promptVariables.reviewerName,
    playerName: promptVariables.playerName,
    trace,
  };
}

// ============================================================================
// Stage 3: Image Description
// ============================================================================

/**
 * Build the image inspirations section for the prompt
 *
 * @param selectedPrompts - Array of already-selected image prompts
 * @returns Formatted string for the prompt, or empty string if no prompts
 */
function buildImageInspirationsSection(selectedPrompts: string[]): string {
  if (selectedPrompts.length === 0) {
    return "";
  }

  const formattedPrompts = selectedPrompts.map((p) => `- ${p}`).join("\n");
  return `\n\nFor visual inspiration, consider incorporating elements from these themes:\n${formattedPrompts}`;
}

/**
 * Stage 3: Generate image description from review text
 *
 * Takes the review text and turns it into a vivid art concept
 * that can be used for image generation.
 *
 * @param params.imagePrompts - Optional array of image prompts from personality metadata to influence the art concept
 */
export async function generateImageDescription(params: {
  reviewText: string;
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string | undefined;
  imagePrompts?: string[] | undefined;
}): Promise<{ text: string; trace: StageTrace; selectedImagePrompts: string[] }> {
  const { reviewText, client, model, systemPromptOverride, imagePrompts } = params;

  // Select 2-3 random image prompts from personality
  const selectedImagePrompts = selectRandomImagePrompts(imagePrompts);

  const systemPrompt = getStageSystemPrompt("imageDescription", systemPromptOverride);
  const imageInspirations = buildImageInspirationsSection(selectedImagePrompts);
  const userPrompt = replacePromptVariables(IMAGE_DESCRIPTION_USER_PROMPT_TEMPLATE, {
    REVIEW_TEXT: reviewText,
    IMAGE_INSPIRATIONS: imageInspirations,
  });

  const { text, trace } = await callOpenAI({
    client,
    model,
    systemPrompt,
    userPrompt,
  });

  return { text, trace, selectedImagePrompts };
}

// ============================================================================
// Stage 4: Image Generation (Gemini)
// ============================================================================

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
 * Stage 4: Generate image from description using Gemini
 *
 * Takes the image description and generates an actual image.
 */
export async function generateImage(params: {
  imageDescription: string;
  artStyle: ArtStyle;
  geminiClient: GoogleGenerativeAI;
  model: string;
  timeoutMs: number;
}): Promise<{ imageBase64: string; trace: ImageGenerationTrace }> {
  const { imageDescription, artStyle, geminiClient, model, timeoutMs } = params;

  const geminiModel = geminiClient.getGenerativeModel({ model });
  const prompt = generateImagePrompt(imageDescription, artStyle);

  const startTime = Date.now();

  // Add timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs.toString()}ms`));
    }, timeoutMs);
  });

  const resultRaw = await Promise.race([geminiModel.generateContent(prompt), timeoutPromise]);
  const durationMs = Date.now() - startTime;

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

  const imageBase64 = imagePart.inlineData.data;
  if (imageBase64.length === 0) {
    throw new Error("Empty image data in response");
  }

  // Estimate image size from base64 (base64 is ~33% larger than binary)
  const imageSizeBytes = Math.floor((imageBase64.length * 3) / 4);

  return {
    imageBase64,
    trace: {
      request: { prompt },
      response: {
        imageGenerated: true,
        imageSizeBytes,
      },
      model,
      durationMs,
    },
  };
}
