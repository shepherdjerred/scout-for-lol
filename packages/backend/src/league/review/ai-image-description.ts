import type { MatchId } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveImageDescriptionToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("ai-image-description");

const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You are an art director turning a League of Legends performance review into a single striking image concept.
Focus on the mood, key moments, and emotions from the review text.
Describe one vivid scene with the focal action, characters, and environment.
Include composition ideas, color palette, and mood direction.
Do NOT ask for text to be placed in the image.
Keep it under 120 words.`;

export async function generateImageDescriptionFromReview(params: {
  reviewText: string;
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  openaiClient: OpenAI;
}): Promise<string | undefined> {
  const { reviewText, matchId, queueType, trackedPlayerAliases, openaiClient } = params;

  const userPrompt = `Create a vivid art description for a single image inspired by the League of Legends review below.
- Lean into the emotions, key moments, and champion identities referenced in the review
- Describe one striking scene with composition and mood cues
- Include color palette and lighting direction
- Do NOT ask for any text to be drawn in the image

Review text to translate into art:
${reviewText}`;

  logger.info(`[generateImageDescriptionFromReview] Calling OpenAI to craft image description from review`);
  const startTime = Date.now();
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: IMAGE_DESCRIPTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_completion_tokens: 600,
      temperature: 0.8,
    });

    const duration = Date.now() - startTime;
    const imageDescription = response.choices[0]?.message.content?.trim();
    if (!imageDescription) {
      logger.info("[generateImageDescriptionFromReview] No image description content returned from OpenAI");
      return undefined;
    }
    logger.info(
      `[generateImageDescriptionFromReview] Generated image description (${imageDescription.length.toString()} chars)`,
    );

    try {
      await saveImageDescriptionToS3({
        matchId,
        queueType,
        trackedPlayerAliases,
        request: {
          reviewText,
          reviewTextLength: reviewText.length,
        },
        response: {
          imageDescription,
          durationMs: duration,
          model: "gpt-5.1",
        },
      });
    } catch (s3Error) {
      logger.error("[generateImageDescriptionFromReview] Failed to save image description to S3:", s3Error);
    }

    return imageDescription;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("[generateImageDescriptionFromReview] Error generating image description:", err);
    Sentry.captureException(err, {
      tags: {
        source: "openai-image-description",
        queueType,
      },
    });
    return undefined;
  }
}
