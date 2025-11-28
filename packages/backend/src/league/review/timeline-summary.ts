import { type MatchId, type CuratedTimeline } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveTimelineSummaryToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { getOpenAIClient } from "./ai-clients.js";

const TIMELINE_SUMMARY_PROMPT = `You are a League of Legends analyst. Analyze this match timeline data and provide a concise summary of how the game unfolded.

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
 * Summarize curated timeline data using OpenAI
 *
 * Takes already-curated timeline data (with champion names, Blue/Red teams, etc.)
 * and generates a narrative summary of the game flow.
 * Saves both the request and response to S3 for debugging/analysis.
 */
export async function summarizeTimeline(
  curatedTimeline: CuratedTimeline,
  matchId: MatchId,
  client?: OpenAI,
): Promise<string | undefined> {
  const openaiClient = client ?? getOpenAIClient();
  if (!openaiClient) {
    console.log("[summarizeTimeline] OpenAI API key not configured, skipping timeline summary");
    return undefined;
  }

  try {
    // Minify JSON to save tokens
    const timelineJson = JSON.stringify(curatedTimeline);
    const fullPrompt = TIMELINE_SUMMARY_PROMPT + timelineJson;

    console.log("[summarizeTimeline] Calling OpenAI to summarize timeline...");
    console.log(`[summarizeTimeline] Timeline JSON size: ${timelineJson.length.toString()} chars`);
    const startTime = Date.now();

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      max_completion_tokens: 3000,
      temperature: 0.3, // Lower temperature for more factual output
    });

    const duration = Date.now() - startTime;
    console.log(`[summarizeTimeline] OpenAI response received in ${duration.toString()}ms`);

    const content = response.choices[0]?.message.content;
    if (!content) {
      console.log("[summarizeTimeline] No content in OpenAI response");
      return undefined;
    }

    const summary = content.trim();
    console.log(`[summarizeTimeline] Generated summary (${summary.length.toString()} chars)`);

    try {
      await saveTimelineSummaryToS3({
        matchId,
        timelineDto: curatedTimeline,
        prompt: TIMELINE_SUMMARY_PROMPT,
        summary,
        durationMs: duration,
      });
    } catch (s3Error) {
      console.error("[summarizeTimeline] Failed to save to S3:", s3Error);
    }

    return summary;
  } catch (error) {
    console.error("[summarizeTimeline] Error summarizing timeline:", error);
    Sentry.captureException(error, {
      tags: {
        source: "timeline-summarization",
        matchId,
      },
    });
    return undefined;
  }
}
