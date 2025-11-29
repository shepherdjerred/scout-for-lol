/* eslint-disable max-lines, complexity -- Workflow step definitions require comprehensive type definitions and step logic */
/**
 * AI Review Workflow Steps
 *
 * This module defines a clear 5-step pipeline for generating AI-powered match reviews:
 *
 * Step 1a: Match Result Summary - Summarize match stats and outcome
 * Step 1b: Timeline Summary - Summarize game flow from timeline events
 * Step 2:  Personality Review - Generate review text with personality + both summaries + randomBehaviors
 * Step 3:  Image Description - Generate art prompt from review text ONLY
 * Step 4:  Image Generation - Generate image from description ONLY (no match data)
 *
 * Each step captures full request/response for S3 tracing and debugging.
 */

import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import type { CuratedTimeline } from "./curator-types.js";
import type { CuratedMatchData, Personality, PlayerMetadata, ChatCompletionCreateParams } from "./generator.js";

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * OpenAI client interface - minimal interface for chat completions
 */
export type OpenAIClientInterface = {
  chat: {
    completions: {
      create(params: ChatCompletionCreateParams): Promise<{
        choices: { message: { content: string | null } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      }>;
    };
  };
};

/**
 * Base step result with timing and status
 */
export type StepResultBase = {
  stepName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: "success" | "failed" | "skipped";
  error?: string | undefined;
};

// =============================================================================
// STEP 1a: MATCH RESULT SUMMARY
// =============================================================================

export const MATCH_RESULT_SUMMARY_PROMPT = `You are a League of Legends analyst. Analyze this match result data and provide a concise summary of the outcome.

Focus on:
- Final score and game duration
- Which team won and by how much
- Key performance differences between teams (kills, gold, objectives)
- Notable individual performances (high KDA, most damage, etc.)

Keep the summary factual and under 200 words. Reference players by their champion name.

Match data:
`;

export type Step1aRequest = {
  prompt: string;
  matchData: {
    match: CompletedMatch | ArenaMatch;
    curatedData: CuratedMatchData;
  };
  model: string;
  temperature: number;
};

export type Step1aResponse = {
  summary: string;
  tokensPrompt?: number | undefined;
  tokensCompletion?: number | undefined;
};

export type Step1aResult = StepResultBase & {
  stepName: "matchResultSummary";
  request: Step1aRequest;
  response?: Step1aResponse | undefined;
};

/**
 * Step 1a: Summarize match result from curated match data
 */
export async function summarizeMatchResult(params: {
  match: CompletedMatch | ArenaMatch;
  curatedData: CuratedMatchData;
  openaiClient: OpenAIClientInterface;
  model?: string;
}): Promise<Step1aResult> {
  const { match, curatedData, openaiClient, model = "gpt-4o-mini" } = params;
  const startTime = Date.now();

  const matchDataJson = JSON.stringify({
    processedMatch: match,
    detailedStats: curatedData,
  });
  const fullPrompt = MATCH_RESULT_SUMMARY_PROMPT + matchDataJson;

  const request: Step1aRequest = {
    prompt: MATCH_RESULT_SUMMARY_PROMPT,
    matchData: { match, curatedData },
    model,
    temperature: 0.3,
  };

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: fullPrompt }],
      max_completion_tokens: 2000,
      temperature: 0.3,
    });

    const endTime = Date.now();
    const content = response.choices[0]?.message.content;

    if (!content) {
      return {
        stepName: "matchResultSummary",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No content returned from OpenAI",
        request,
      };
    }

    return {
      stepName: "matchResultSummary",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "success",
      request,
      response: {
        summary: content.trim(),
        tokensPrompt: response.usage?.prompt_tokens,
        tokensCompletion: response.usage?.completion_tokens,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      stepName: "matchResultSummary",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      request,
    };
  }
}

// =============================================================================
// STEP 1b: TIMELINE SUMMARY
// =============================================================================

export const TIMELINE_SUMMARY_PROMPT = `You are a League of Legends analyst. Analyze this match timeline data and provide a concise summary of how the game unfolded.

The timeline contains key events (kills, objectives, towers) and gold snapshots at intervals. Teams are "Blue" and "Red". Players are identified by champion name.

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 300 words. Reference players by their champion name.

Timeline data:
`;

export type Step1bRequest = {
  prompt: string;
  timelineData: CuratedTimeline;
  model: string;
  temperature: number;
};

export type Step1bResponse = {
  summary: string;
  tokensPrompt?: number | undefined;
  tokensCompletion?: number | undefined;
};

export type Step1bResult = StepResultBase & {
  stepName: "timelineSummary";
  request: Step1bRequest;
  response?: Step1bResponse | undefined;
};

/**
 * Step 1b: Summarize timeline from curated timeline data
 */
export async function summarizeTimelineStep(params: {
  curatedTimeline: CuratedTimeline;
  openaiClient: OpenAIClientInterface;
  model?: string;
}): Promise<Step1bResult> {
  const { curatedTimeline, openaiClient, model = "gpt-4o-mini" } = params;
  const startTime = Date.now();

  const timelineJson = JSON.stringify(curatedTimeline);
  const fullPrompt = TIMELINE_SUMMARY_PROMPT + timelineJson;

  const request: Step1bRequest = {
    prompt: TIMELINE_SUMMARY_PROMPT,
    timelineData: curatedTimeline,
    model,
    temperature: 0.3,
  };

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: fullPrompt }],
      max_completion_tokens: 3000,
      temperature: 0.3,
    });

    const endTime = Date.now();
    const content = response.choices[0]?.message.content;

    if (!content) {
      return {
        stepName: "timelineSummary",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No content returned from OpenAI",
        request,
      };
    }

    return {
      stepName: "timelineSummary",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "success",
      request,
      response: {
        summary: content.trim(),
        tokensPrompt: response.usage?.prompt_tokens,
        tokensCompletion: response.usage?.completion_tokens,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      stepName: "timelineSummary",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      request,
    };
  }
}

// =============================================================================
// STEP 2: PERSONALITY REVIEW
// =============================================================================

export type Step2Request = {
  systemPrompt: string;
  userPrompt: string;
  matchResultSummary: string;
  timelineSummary: string;
  randomBehavior?: string | undefined;
  personality: {
    name: string;
    filename?: string | undefined;
  };
  playerName: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type Step2Response = {
  reviewText: string;
  tokensPrompt?: number | undefined;
  tokensCompletion?: number | undefined;
};

export type Step2Result = StepResultBase & {
  stepName: "personalityReview";
  request: Step2Request;
  response?: Step2Response | undefined;
};

/**
 * Step 2: Generate personality review with both summaries + randomBehaviors
 *
 * This step takes the summaries from steps 1a and 1b, plus random behaviors,
 * and generates the personality-driven review text.
 *
 * NOTE: No image hints are passed to this step - they are only used in step 3.
 */
export async function generatePersonalityReview(params: {
  match: CompletedMatch | ArenaMatch;
  personality: Personality;
  basePromptTemplate: string;
  laneContext: string;
  playerMetadata: PlayerMetadata;
  matchResultSummary: string;
  timelineSummary: string;
  randomBehavior?: string | undefined;
  playerIndex: number;
  openaiClient: OpenAIClientInterface;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<Step2Result> {
  const {
    match,
    personality,
    basePromptTemplate,
    laneContext,
    playerMetadata,
    matchResultSummary,
    timelineSummary,
    randomBehavior,
    playerIndex,
    openaiClient,
    model = "gpt-4o",
    maxTokens = 4000,
    temperature = 0.85,
  } = params;

  const startTime = Date.now();

  const player = match.players[playerIndex] ?? match.players[0];
  const playerName = player?.playerConfig.alias ?? "Unknown";
  const playerChampion = player?.champion.championName ?? "Unknown";

  // Get opponent for standard matches
  let opponentChampion = "Unknown";
  if (match.queueType !== "arena" && player && "laneOpponent" in player) {
    const opponent = player.laneOpponent;
    // eslint-disable-next-line custom-rules/prefer-zod-validation -- Simple property access on known match data structure
    if (opponent && typeof opponent === "object" && "championName" in opponent && typeof opponent.championName === "string") {
      opponentChampion = opponent.championName;
    }
  }

  // Get lane
  let playerLane = "unknown";
  if (match.queueType === "arena") {
    playerLane = "arena";
  } else if (player && "lane" in player && typeof player.lane === "string") {
    playerLane = player.lane;
  }

  // Build friends context (other tracked players in the match)
  const otherPlayers = match.players.filter((_, i) => i !== playerIndex);
  const friendsContext =
    otherPlayers.length > 0
      ? `Other friends in this game: ${otherPlayers.map((p) => `${p.playerConfig.alias} (${p.champion.championName})`).join(", ")}`
      : "";

  // Build queue context for Clash and ranked modes
  let queueContext = "";
  if (match.queueType === "clash" || match.queueType === "aram clash") {
    queueContext = `This is a CLASH match - a competitive tournament mode. The stakes are higher and players are typically more coordinated.`;
  } else if (match.queueType === "solo" || match.queueType === "flex") {
    let partySize = 1;
    if (player && "partySize" in player && typeof player.partySize === "number") {
      partySize = player.partySize;
    }
    if (match.queueType === "solo") {
      queueContext =
        partySize === 2
          ? `This is a Solo/Duo ranked match where the player queued as a duo.`
          : `This is a Solo/Duo ranked match where the player queued solo.`;
    } else {
      queueContext =
        partySize > 1
          ? `This is a Flex ranked match where the player queued with ${partySize.toString()} friends.`
          : `This is a Flex ranked match where the player queued solo.`;
    }
  }

  // Build system prompt (personality instructions + lane context)
  const systemPrompt = `${personality.instructions}\n\n${laneContext}`;

  // Build user prompt with template variables replaced
  const userPrompt = basePromptTemplate
    .replaceAll("<REVIEWER NAME>", personality.metadata.name)
    .replaceAll("<REVIEWER PERSONALITY>", personality.metadata.description)
    .replaceAll("<REVIEWER FAVORITE CHAMPIONS>", personality.metadata.favoriteChampions.join(", "))
    .replaceAll("<REVIEWER FAVORITE LANES>", personality.metadata.favoriteLanes.join(", "))
    .replaceAll("<PLAYER NAME>", playerName)
    .replaceAll("<PLAYER PERSONALITY>", playerMetadata.description)
    .replaceAll("<PLAYER FAVORITE CHAMPIONS>", playerMetadata.favoriteChampions.join(", "))
    .replaceAll("<PLAYER FAVORITE LANES>", playerMetadata.favoriteLanes.join(", "))
    .replaceAll("<PLAYER CHAMPION>", playerChampion)
    .replaceAll("<PLAYER LANE>", playerLane)
    .replaceAll("<OPPONENT CHAMPION>", opponentChampion)
    .replaceAll("<LANE DESCRIPTION>", laneContext)
    .replaceAll("<MATCH REPORT>", matchResultSummary)
    .replaceAll("<FRIENDS CONTEXT>", friendsContext)
    .replaceAll("<RANDOM BEHAVIOR>", randomBehavior ?? "")
    .replaceAll("<MATCH ANALYSIS>", matchResultSummary)
    .replaceAll("<TIMELINE SUMMARY>", timelineSummary)
    .replaceAll("<QUEUE CONTEXT>", queueContext);

  const request: Step2Request = {
    systemPrompt,
    userPrompt,
    matchResultSummary,
    timelineSummary,
    randomBehavior,
    personality: {
      name: personality.metadata.name,
      filename: personality.filename,
    },
    playerName,
    model,
    temperature,
    maxTokens,
  };

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: maxTokens,
      temperature,
    });

    const endTime = Date.now();
    const content = response.choices[0]?.message.content;

    if (!content) {
      return {
        stepName: "personalityReview",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No content returned from OpenAI",
        request,
      };
    }

    return {
      stepName: "personalityReview",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "success",
      request,
      response: {
        reviewText: content.trim(),
        tokensPrompt: response.usage?.prompt_tokens,
        tokensCompletion: response.usage?.completion_tokens,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      stepName: "personalityReview",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      request,
    };
  }
}

// =============================================================================
// STEP 3: IMAGE DESCRIPTION
// =============================================================================

export const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.

Your task is to create a vivid scene description based ONLY on the review text provided.
Do NOT reference any match data, statistics, or external context.

Focus on:
- The emotional arc and key moments from the review
- Champion identities and their visual elements
- Mood, atmosphere, and composition
- Color palette suggestions

Describe one vivid scene with the focal action, characters, and environment.
Keep it under 150 words. Do NOT ask for text to be placed in the image.`;

export type Step3Request = {
  systemPrompt: string;
  userPrompt: string;
  reviewTextOnly: string;
  artStyle: string;
  artThemes: string[];
  model: string;
  temperature: number;
};

export type Step3Response = {
  imageDescription: string;
  tokensPrompt?: number | undefined;
  tokensCompletion?: number | undefined;
};

export type Step3Result = StepResultBase & {
  stepName: "imageDescription";
  request: Step3Request;
  response?: Step3Response | undefined;
};

/**
 * Step 3: Generate image description from review text ONLY
 *
 * This step takes ONLY the review text from step 2 and generates
 * an art prompt for image generation. No match data is passed.
 */
export async function generateImageDescription(params: {
  reviewText: string;
  artStyle: string;
  artThemes: string[];
  openaiClient: OpenAIClientInterface;
  model?: string;
}): Promise<Step3Result> {
  const { reviewText, artStyle, artThemes, openaiClient, model = "gpt-4o" } = params;
  const startTime = Date.now();

  const themeSummary = artThemes.join(" + ");

  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.

Art style: ${artStyle}
Theme(s): ${themeSummary}

Focus on the emotions, key moments, and champion identities from the review.
Describe one striking scene with composition and mood cues.
Do NOT include any text in the image description.

Review text:
${reviewText}`;

  const request: Step3Request = {
    systemPrompt: IMAGE_DESCRIPTION_SYSTEM_PROMPT,
    userPrompt,
    reviewTextOnly: reviewText,
    artStyle,
    artThemes,
    model,
    temperature: 0.8,
  };

  try {
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: IMAGE_DESCRIPTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 800,
      temperature: 0.8,
    });

    const endTime = Date.now();
    const content = response.choices[0]?.message.content;

    if (!content) {
      return {
        stepName: "imageDescription",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No content returned from OpenAI",
        request,
      };
    }

    return {
      stepName: "imageDescription",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "success",
      request,
      response: {
        imageDescription: content.trim(),
        tokensPrompt: response.usage?.prompt_tokens,
        tokensCompletion: response.usage?.completion_tokens,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      stepName: "imageDescription",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      request,
    };
  }
}

// =============================================================================
// STEP 4: IMAGE GENERATION
// =============================================================================

export type Step4Request = {
  imageDescriptionOnly: string;
  artStyle: string;
  artThemes: string[];
  model: string;
};

export type Step4Response = {
  imageBase64: string;
  imageSizeBytes: number;
};

export type Step4Result = StepResultBase & {
  stepName: "imageGeneration";
  request: Step4Request;
  response?: Step4Response | undefined;
};

/**
 * Gemini client interface for image generation
 *
 * This is a minimal interface that matches the GoogleGenerativeAI library.
 * The response is typed loosely to allow for the actual library's complex types.
 */
export type GeminiClientInterface = {
  getGenerativeModel(config: { model: string }): {
    generateContent(prompt: string): Promise<{
      response: {
        candidates: {
          content: {
            parts: { inlineData?: { data: string } | undefined }[];
          };
        }[];
      };
    }>;
  };
};

/**
 * Step 4: Generate image from description ONLY
 *
 * This step takes ONLY the image description from step 3 and generates
 * an image using Gemini. No match data is passed.
 */
export async function generateImage(params: {
  imageDescription: string;
  artStyle: string;
  artThemes: string[];
  geminiClient: GeminiClientInterface;
  model?: string;
  timeoutMs?: number;
}): Promise<Step4Result> {
  const {
    imageDescription,
    artStyle,
    artThemes,
    geminiClient,
    model = "gemini-2.0-flash-preview-image-generation",
    timeoutMs = 60000,
  } = params;
  const startTime = Date.now();

  const themeSummary = artThemes.join(" + ");

  // Build a simple prompt that ONLY uses the image description
  const prompt = `Generate an image based on this art direction:

Art Style: ${artStyle}
Theme: ${themeSummary}

Scene Description:
${imageDescription}

Create a visually striking image that captures this scene. No text in the image.`;

  const request: Step4Request = {
    imageDescriptionOnly: imageDescription,
    artStyle,
    artThemes,
    model,
  };

  try {
    const geminiModel = geminiClient.getGenerativeModel({ model });

    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Gemini API call timed out after ${timeoutMs.toString()}ms`));
      }, timeoutMs);
    });

    const resultRaw = await Promise.race([geminiModel.generateContent(prompt), timeoutPromise]);

    const endTime = Date.now();

    if (resultRaw.response.candidates.length === 0) {
      return {
        stepName: "imageGeneration",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No candidates returned from Gemini",
        request,
      };
    }

    const firstCandidate = resultRaw.response.candidates[0];
    if (!firstCandidate) {
      return {
        stepName: "imageGeneration",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No candidates returned from Gemini",
        request,
      };
    }

    const parts = firstCandidate.content.parts;
    if (parts.length === 0) {
      return {
        stepName: "imageGeneration",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No parts found in response",
        request,
      };
    }

    const imagePart = parts[0];
    if (!imagePart || !imagePart.inlineData) {
      return {
        stepName: "imageGeneration",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "No image part found in response",
        request,
      };
    }

    const imageData = imagePart.inlineData.data;
    if (!imageData || imageData.length === 0) {
      return {
        stepName: "imageGeneration",
        startTime,
        endTime,
        durationMs: endTime - startTime,
        status: "failed",
        error: "Empty image data in response",
        request,
      };
    }

    return {
      stepName: "imageGeneration",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "success",
      request,
      response: {
        imageBase64: imageData,
        imageSizeBytes: imageData.length,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      stepName: "imageGeneration",
      startTime,
      endTime,
      durationMs: endTime - startTime,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      request,
    };
  }
}

// =============================================================================
// COMPLETE WORKFLOW RESULT
// =============================================================================

/**
 * Complete workflow result with all step results
 */
export type WorkflowResult = {
  workflowId: string;
  matchId: string;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  status: "success" | "partial" | "failed";

  // Step results with full request/response for S3 tracing
  steps: {
    matchResultSummary?: Step1aResult | undefined;
    timelineSummary?: Step1bResult | undefined;
    personalityReview?: Step2Result | undefined;
    imageDescription?: Step3Result | undefined;
    imageGeneration?: Step4Result | undefined;
  };

  // Final outputs
  outputs: {
    matchResultSummary?: string | undefined;
    timelineSummary?: string | undefined;
    reviewText?: string | undefined;
    imageDescription?: string | undefined;
    imageBase64?: string | undefined;
  };

  // Metadata for display
  metadata: {
    personality?: { name: string; filename?: string | undefined } | undefined;
    playerName?: string | undefined;
    playerIndex?: number | undefined;
    artStyle?: string | undefined;
    artThemes?: string[] | undefined;
    randomBehavior?: string | undefined;
  };
};
