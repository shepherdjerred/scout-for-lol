/**
 * Mastra AI Agents for review generation
 *
 * Each agent is configured for a specific task in the review generation pipeline.
 */

import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import config from "@scout-for-lol/backend/configuration.js";

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!config.openaiApiKey;
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!config.geminiApiKey;
}

/**
 * Agent for summarizing match timelines
 * Uses GPT-4o-mini for efficient, factual summaries
 */
export const timelineSummaryAgent = new Agent({
  name: "TimelineSummaryAgent",
  instructions: `You are a League of Legends analyst. Analyze match timeline data and provide a concise summary of how the game unfolded.

The timeline contains key events (kills, objectives, towers) and gold snapshots at intervals. Teams are "Blue" and "Red". Players are identified by champion name.

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 300 words. Reference players by their champion name.`,
  model: openai("gpt-4o-mini"),
});

/**
 * Agent for analyzing match data from a player's perspective
 * Uses GPT-4o-mini for detailed, lane-aware analysis
 */
export const matchAnalysisAgent = new Agent({
  name: "MatchAnalysisAgent",
  instructions: `You are a League of Legends analyst who writes lane-aware breakdowns for a single player's performance.
Use the provided match context and curated stats (including timeline details) to explain:
- How the game flowed for that player
- Where they excelled or struggled in their specific lane context
- The biggest momentum swings that mattered for them
- Concrete improvement ideas
Keep the writing concise, grounded in the numbers provided, and avoid generic advice.`,
  model: openai("gpt-4o-mini"),
});

/**
 * Agent for generating art prompts from review text
 * Uses GPT-5.1 for creative, vivid art direction
 */
export const artPromptAgent = new Agent({
  name: "ArtPromptAgent",
  instructions: `You are an art director turning a League of Legends performance review into a single striking image concept.
Blend the specified art style and theme(s) with the mood and key beats from the review text.
Describe one vivid scene with the focal action, characters, and environment. Mention color/mood/composition ideas.
Do NOT ask for text to be placed in the image. Keep it under 120 words.`,
  model: openai("gpt-5.1"),
});

// Note: Review text generation uses the shared generateReviewText function from @scout-for-lol/data
// which requires direct OpenAI client access for its specific completion parameters.
// Image generation uses the shared generateReviewImage function from @scout-for-lol/data
// which requires direct Gemini client access for imagen model.
