import {
  type MatchId,
  type CuratedTimeline,
  summarizeTimeline as summarizeTimelineCore,
  TIMELINE_SUMMARY_PROMPT,
} from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveTimelineSummaryToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { getOpenAIClient } from "./ai-clients.js";

/**
 * Summarize curated timeline data using OpenAI
 *
 * This is a backend wrapper around the shared summarizeTimeline function.
 * It adds:
 * - OpenAI client management (getOpenAIClient)
 * - S3 persistence for debugging
 * - Sentry error tracking
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
    console.log("[summarizeTimeline] Calling OpenAI to summarize timeline...");
    console.log(`[summarizeTimeline] Timeline JSON size: ${JSON.stringify(curatedTimeline).length.toString()} chars`);

    // Use shared function from @scout-for-lol/data
    const result = await summarizeTimelineCore(curatedTimeline, openaiClient);

    if (!result) {
      console.log("[summarizeTimeline] No summary generated");
      return undefined;
    }

    console.log(`[summarizeTimeline] OpenAI response received in ${result.durationMs.toString()}ms`);
    console.log(`[summarizeTimeline] Generated summary (${result.summary.length.toString()} chars)`);

    // Save to S3 for debugging/analysis
    try {
      await saveTimelineSummaryToS3({
        matchId,
        rawTimeline: curatedTimeline,
        prompt: TIMELINE_SUMMARY_PROMPT,
        summary: result.summary,
        durationMs: result.durationMs,
      });
    } catch (s3Error) {
      console.error("[summarizeTimeline] Failed to save to S3:", s3Error);
    }

    return result.summary;
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
