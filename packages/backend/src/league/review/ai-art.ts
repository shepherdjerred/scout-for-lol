import { type MatchId, generateArtPrompt as generateArtPromptCore } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveArtPromptToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";

/**
 * Generate an art prompt from a review using OpenAI
 *
 * This is a backend wrapper around the shared generateArtPrompt function.
 * It adds:
 * - S3 persistence for debugging
 * - Sentry error tracking
 */
export async function generateArtPromptFromReview(params: {
  reviewText: string;
  style: string;
  themes: string[];
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  openaiClient: OpenAI;
  personalityImageHints?: string[];
}): Promise<string | undefined> {
  const { reviewText, style, themes, matchId, queueType, trackedPlayerAliases, openaiClient, personalityImageHints } =
    params;

  const themeSummary = themes.join(" + ");
  const hintsInfo = personalityImageHints?.length
    ? ` with ${personalityImageHints.length.toString()} personality hints`
    : "";
  console.log(
    `[generateArtPromptFromReview] Calling OpenAI to craft art prompt with style "${style}" and themes "${themeSummary}"${hintsInfo}`,
  );

  try {
    // Use shared function from @scout-for-lol/data
    const result = await generateArtPromptCore({
      reviewText,
      style,
      themes,
      openaiClient,
      model: "gpt-5.1",
      personalityImageHints,
    });

    if (!result) {
      console.log("[generateArtPromptFromReview] No art prompt content returned from OpenAI");
      return undefined;
    }

    console.log(`[generateArtPromptFromReview] Generated art prompt (${result.artPrompt.length.toString()} chars)`);

    // Save to S3 for debugging/analysis
    try {
      await saveArtPromptToS3({
        matchId,
        queueType,
        trackedPlayerAliases,
        request: {
          reviewText,
          reviewTextLength: reviewText.length,
          artStyle: style,
          artThemes: themes,
          ...(personalityImageHints && personalityImageHints.length > 0 && { personalityImageHints }),
        },
        response: {
          artPrompt: result.artPrompt,
          durationMs: result.durationMs,
          model: "gpt-5.1",
        },
      });
    } catch (s3Error) {
      console.error("[generateArtPromptFromReview] Failed to save art prompt to S3:", s3Error);
    }

    return result.artPrompt;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[generateArtPromptFromReview] Error generating art prompt:", err);
    Sentry.captureException(err, {
      tags: {
        source: "openai-art-prompt",
        queueType,
        artStyle: style,
      },
    });
    return undefined;
  }
}
