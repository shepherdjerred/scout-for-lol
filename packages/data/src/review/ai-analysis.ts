/**
 * Shared AI analysis functions for review generation
 *
 * These functions are used by both the backend (Mastra workflow) and
 * the frontend (review-dev-tool) to ensure consistency.
 *
 * Each function takes an OpenAI client as a parameter to remain platform-agnostic.
 */

import type { CuratedTimeline } from "./curator-types.js";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";

/**
 * Curated match data type for AI analysis
 * Uses unknown[] for participants to be compatible with both
 * the full CuratedParticipant type and simplified versions.
 */
type CuratedMatchDataForAnalysis = {
  gameInfo: {
    gameDuration: number;
    gameMode: string;
    queueId: number;
  };
  participants: unknown[];
  timeline?: CuratedTimeline | undefined;
  timelineSummary?: string | undefined;
};

/**
 * OpenAI client interface - minimal interface for chat completions
 */
export type OpenAIClientInterface = {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: { role: "system" | "user" | "assistant"; content: string }[];
        max_completion_tokens: number;
        temperature?: number;
      }): Promise<{
        choices: { message: { content: string | null } }[];
      }>;
    };
  };
};

// ============================================================================
// PROMPTS - Shared across backend and frontend
// ============================================================================

/**
 * Timeline summary prompt - used to summarize game flow from curated timeline data
 */
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

/**
 * Match analysis system prompt - used for lane-aware player performance analysis
 */
export const MATCH_ANALYSIS_SYSTEM_PROMPT = `You are a League of Legends analyst who writes lane-aware breakdowns for a single player's performance.
Use the provided match context and curated stats (including timeline details) to explain:
- How the game flowed for that player
- Where they excelled or struggled in their specific lane context
- The biggest momentum swings that mattered for them
- Concrete improvement ideas
Keep the writing concise, grounded in the numbers provided, and avoid generic advice.`;

/**
 * Art prompt system prompt - used to generate art descriptions from reviews
 */
export const ART_PROMPT_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.
Blend the specified art style and theme(s) with the mood and key beats from the review text.
If personality-specific visual hints are provided, incorporate elements from them to give the image a unique character.
Describe one vivid scene with the focal action, characters, and environment. Mention color/mood/composition ideas.
Do NOT ask for text to be placed in the image. Keep it under 120 words.`;

// ============================================================================
// FUNCTIONS - Shared logic for AI analysis
// ============================================================================

/**
 * Result type for timeline summarization
 */
export type TimelineSummaryResult = {
  summary: string;
  durationMs: number;
};

/**
 * Summarize curated timeline data using OpenAI
 *
 * Takes already-curated timeline data (with champion names, Blue/Red teams, etc.)
 * and generates a narrative summary of the game flow.
 *
 * @param curatedTimeline - Curated timeline data from curateTimelineData()
 * @param openaiClient - OpenAI client instance
 * @param model - Model to use (default: gpt-4o-mini)
 * @returns Summary and duration, or undefined if failed
 */
export async function summarizeTimeline(
  curatedTimeline: CuratedTimeline,
  openaiClient: OpenAIClientInterface,
  model = "gpt-4o-mini",
): Promise<TimelineSummaryResult | undefined> {
  try {
    const timelineJson = JSON.stringify(curatedTimeline);
    const fullPrompt = TIMELINE_SUMMARY_PROMPT + timelineJson;

    const startTime = Date.now();
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [{ role: "user", content: fullPrompt }],
      max_completion_tokens: 3000,
      temperature: 0.3,
    });
    const durationMs = Date.now() - startTime;

    const content = response.choices[0]?.message.content;
    if (!content) return undefined;

    return { summary: content.trim(), durationMs };
  } catch (error) {
    console.error("[summarizeTimeline] Error:", error);
    return undefined;
  }
}

/**
 * Result type for match analysis
 */
export type MatchAnalysisResult = {
  analysis: string;
  durationMs: number;
};

/**
 * Parameters for match analysis
 */
export type AnalyzeMatchDataParams = {
  match: CompletedMatch | ArenaMatch;
  curatedData: CuratedMatchDataForAnalysis;
  laneContext: string;
  playerIndex: number;
  openaiClient: OpenAIClientInterface;
  model?: string;
  timelineSummary?: string | undefined;
};

/**
 * Build the user prompt for match analysis
 */
function buildMatchAnalysisUserPrompt(params: {
  playerName: string;
  playerChampion: string;
  lane: string;
  laneContext: string;
  timelineSummary: string;
}): string {
  const { playerName, playerChampion, lane, laneContext, timelineSummary } = params;

  return `Analyze ${playerName} playing ${playerChampion} in the ${lane} context. Use the lane primer and timeline summary to stay grounded in role expectations and how the game flowed.

Lane primer:
${laneContext}

Timeline summary:
${timelineSummary}

Provide three sections:
1) Summary (2-3 sentences about their game flow)
2) Lane Highlights (3-5 bullets referencing concrete numbers from the data: KDA, CS/min, damage, objective participation, gold swings, etc.)
3) Improvement Ideas (2 bullets of actionable, lane-aware advice)

Keep it under 220 words and avoid generic platitudes.`;
}

/**
 * Analyze match data using OpenAI
 *
 * Generates a lane-aware breakdown of a player's performance using
 * curated match data and timeline summary.
 *
 * @param params - Analysis parameters
 * @returns Analysis and duration, or undefined if failed
 */
export async function analyzeMatchData(
  params: AnalyzeMatchDataParams,
): Promise<MatchAnalysisResult | undefined> {
  const {
    match,
    curatedData,
    laneContext,
    playerIndex,
    openaiClient,
    model = "gpt-4o-mini",
    timelineSummary,
  } = params;

  const player = match.players[playerIndex] ?? match.players[0];
  if (!player) return undefined;

  const playerName = player.playerConfig.alias;
  const playerChampion = player.champion.championName;

  let lane = "unknown lane";
  if (match.queueType === "arena") {
    lane = "arena";
  } else if ("lane" in player && typeof player.lane === "string") {
    lane = player.lane;
  }

  const matchDataForPrompt = JSON.stringify({
    processedMatch: match,
    detailedStats: curatedData,
  });
  const timelineSummaryText = timelineSummary ?? "No timeline summary available.";

  const userPrompt = buildMatchAnalysisUserPrompt({
    playerName,
    playerChampion,
    lane,
    laneContext,
    timelineSummary: timelineSummaryText,
  });

  try {
    const startTime = Date.now();
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: MATCH_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `${userPrompt}\n\nMatch data JSON:\n${matchDataForPrompt}` },
      ],
      max_completion_tokens: 3000,
      temperature: 0.4,
    });
    const durationMs = Date.now() - startTime;

    const analysis = response.choices[0]?.message.content?.trim();
    if (!analysis) return undefined;

    return { analysis, durationMs };
  } catch (error) {
    console.error("[analyzeMatchData] Error:", error);
    return undefined;
  }
}

/**
 * Result type for art prompt generation
 */
export type ArtPromptResult = {
  artPrompt: string;
  durationMs: number;
};

/**
 * Parameters for art prompt generation
 */
export type GenerateArtPromptParams = {
  reviewText: string;
  style: string;
  themes: string[];
  openaiClient: OpenAIClientInterface;
  model?: string;
  personalityImageHints?: string[] | undefined;
};

/**
 * Generate an art prompt from a review using OpenAI
 *
 * Creates a vivid art description based on the review text, art style,
 * and themes. Used to guide image generation.
 *
 * @param params - Art prompt parameters
 * @returns Art prompt and duration, or undefined if failed
 */
export async function generateArtPrompt(
  params: GenerateArtPromptParams,
): Promise<ArtPromptResult | undefined> {
  const {
    reviewText,
    style,
    themes,
    openaiClient,
    model = "gpt-5.1",
    personalityImageHints,
  } = params;

  const themeSummary = themes.join(" + ");

  const personalityHintsSection =
    personalityImageHints && personalityImageHints.length > 0
      ? `\n- Personality visual hints (incorporate elements from these): ${personalityImageHints.join("; ")}`
      : "";

  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.
- Art style: ${style}
- Theme(s): ${themeSummary}${personalityHintsSection}
- Lean into the emotions, key moments, and champion identities referenced in the review
- Describe one striking scene with composition and mood cues, but keep it concise
- Do NOT ask for any text to be drawn in the image

Review text to translate into art:
${reviewText}`;

  try {
    const startTime = Date.now();
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: ART_PROMPT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 600,
      temperature: 0.8,
    });
    const durationMs = Date.now() - startTime;

    const artPrompt = response.choices[0]?.message.content?.trim();
    if (!artPrompt) return undefined;

    return { artPrompt, durationMs };
  } catch (error) {
    console.error("[generateArtPrompt] Error:", error);
    return undefined;
  }
}
