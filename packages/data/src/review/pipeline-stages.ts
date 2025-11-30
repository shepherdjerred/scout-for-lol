/**
 * Individual stage functions for the unified AI review pipeline
 *
 * Each stage is a pure function that takes dependencies as parameters.
 * All JSON data is minified before being sent to reduce token usage.
 */

import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.ts";
import type { RawMatch } from "@scout-for-lol/data/league/raw-match.schema.ts";
import type { RawTimeline } from "@scout-for-lol/data/league/raw-timeline.schema.ts";
import type { OpenAIClient, ModelConfig, StageTrace, ImageGenerationTrace } from "./pipeline-types.ts";
import type { Personality, PlayerMetadata } from "./prompts.ts";
import { getStageSystemPrompt } from "./pipeline-defaults.ts";
import { generateImagePrompt } from "./image-prompt.ts";
import { replaceTemplateVariables } from "./prompts.ts";
import { buildPromptVariables, extractMatchData } from "./generator-helpers.ts";
import { enrichTimelineData } from "./timeline-enricher.ts";
import type { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

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
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { rawTimeline, rawMatch, client, model, systemPromptOverride } = params;

  // Enrich timeline with participant lookup table for human-readable names
  const enrichedData = enrichTimelineData(rawTimeline, rawMatch);

  const systemPrompt = getStageSystemPrompt("timelineSummary", systemPromptOverride);
  const userPrompt = `Timeline data:\n${minifyJson(enrichedData)}`;

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
  laneContext: string;
  timelineSummary?: string;
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { match, rawMatch, playerIndex, laneContext, timelineSummary, client, model, systemPromptOverride } = params;

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

  const timelineSummarySection =
    timelineSummary && timelineSummary.trim().length > 0
      ? `\n\nTimeline summary:\n${timelineSummary}`
      : "\n\nNo timeline summary available.";

  const userPrompt = `Summarize ${playerName}'s performance playing ${playerChampion} in the ${lane} role.

Lane context:
${laneContext}
${timelineSummarySection}

Match data:
${minifyJson({
  processedMatch: match,
  rawMatch,
})}`;

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
  playerMetadata: PlayerMetadata;
  playerIndex: number;
  matchSummary: string;
  timelineSummary?: string;
  systemPromptPrefix?: string;
  client: OpenAIClient;
  model: ModelConfig;
}): Promise<{ text: string; reviewerName: string; playerName: string; trace: StageTrace }> {
  const {
    match,
    personality,
    basePromptTemplate,
    laneContext,
    playerMetadata,
    playerIndex,
    matchSummary,
    timelineSummary,
    systemPromptPrefix = "",
    client,
    model,
  } = params;

  const { matchData } = extractMatchData(match, playerIndex);

  // Build prompt variables using the text summaries instead of raw JSON
  const promptVariables = buildPromptVariables({
    matchData,
    personality,
    playerMetadata,
    laneContext,
    match,
    playerIndex,
    matchAnalysis: matchSummary, // Use match summary text
    ...(timelineSummary !== undefined && { timelineSummary }),
  });

  const userPrompt = replaceTemplateVariables(basePromptTemplate, promptVariables);
  const styleCardSection = `\n\nReviewer style card (from Discord chat analysis; keep the tone aligned):\n${minifyJsonString(personality.styleCard)}`;
  const systemPrompt = `${systemPromptPrefix}${personality.instructions}${styleCardSection}\n\n${laneContext}`;

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
 * Stage 3: Generate image description from review text
 *
 * Takes the review text and turns it into a vivid art concept
 * that can be used for image generation.
 */
export async function generateImageDescription(params: {
  reviewText: string;
  client: OpenAIClient;
  model: ModelConfig;
  systemPromptOverride?: string;
}): Promise<{ text: string; trace: StageTrace }> {
  const { reviewText, client, model, systemPromptOverride } = params;

  const systemPrompt = getStageSystemPrompt("imageDescription", systemPromptOverride);
  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.
- Lean into the emotions, key moments, and champion identities referenced in the review
- Describe one striking scene with composition and mood cues
- Include color palette and lighting direction

Review text to translate into art:
${reviewText}`;

  return callOpenAI({
    client,
    model,
    systemPrompt,
    userPrompt,
  });
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
  geminiClient: GoogleGenerativeAI;
  model: string;
  timeoutMs: number;
}): Promise<{ imageBase64: string; trace: ImageGenerationTrace }> {
  const { imageDescription, geminiClient, model, timeoutMs } = params;

  const geminiModel = geminiClient.getGenerativeModel({ model });
  const prompt = generateImagePrompt(imageDescription);

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
