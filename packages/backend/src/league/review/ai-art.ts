import type { MatchId } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveArtPromptToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";

const ART_PROMPT_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.
Blend the specified art style and theme(s) with the mood and key beats from the review text.
Describe one vivid scene with the focal action, characters, and environment. Mention color/mood/composition ideas.
Do NOT ask for text to be placed in the image. Keep it under 120 words.`;

export async function generateArtPromptFromReview(params: {
  reviewText: string;
  style: string;
  themes: string[];
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  openaiClient: OpenAI;
}): Promise<string | undefined> {
  const { reviewText, style, themes, matchId, queueType, trackedPlayerAliases, openaiClient } = params;
  const themeSummary = themes.join(" + ");

  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.
- Art style: ${style}
- Theme(s): ${themeSummary}
- Lean into the emotions, key moments, and champion identities referenced in the review
- Describe one striking scene with composition and mood cues, but keep it concise
- Do NOT ask for any text to be drawn in the image

Review text to translate into art:
${reviewText}`;

  console.log(
    `[generateArtPromptFromReview] Calling OpenAI to craft art prompt with style "${style}" and themes "${themeSummary}"`,
  );
  const startTime = Date.now();
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ART_PROMPT_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_completion_tokens: 600,
      temperature: 0.8,
    });

    const duration = Date.now() - startTime;
    const artPrompt = response.choices[0]?.message.content?.trim();
    if (!artPrompt) {
      console.log("[generateArtPromptFromReview] No art prompt content returned from OpenAI");
      return undefined;
    }
    console.log(`[generateArtPromptFromReview] Generated art prompt (${artPrompt.length.toString()} chars)`);

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
        },
        response: {
          artPrompt,
          durationMs: duration,
          model: "gpt-4o-mini",
        },
      });
    } catch (s3Error) {
      console.error("[generateArtPromptFromReview] Failed to save art prompt to S3:", s3Error);
    }

    return artPrompt;
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
