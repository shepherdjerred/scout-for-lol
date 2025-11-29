import { type MatchId, generateReviewImage } from "@scout-for-lol/data";
import { z } from "zod";
import * as Sentry from "@sentry/node";
import { saveAIReviewImageToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { saveImageGenerationToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";
import { getGeminiClient } from "./ai-clients.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("review-image-backend");

const AI_IMAGES_DIR = `${import.meta.dir}/ai-images`;
const GEMINI_MODEL = "gemini-3-pro-image-preview";

function decodeImageBase64(imageData: string): Uint8Array {
  const binaryString = atob(imageData);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

async function saveImageLocally(buffer: Uint8Array): Promise<void> {
  try {
    const filepath = `${AI_IMAGES_DIR}/ai-review-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    await Bun.write(filepath, buffer);
    logger.info(`[generateReviewImageBackend] Saved image to: ${filepath}`);
  } catch (fsError: unknown) {
    logger.error("[generateReviewImageBackend] Failed to save image to filesystem:", fsError);
  }
}

async function uploadImageToS3(params: {
  matchId: MatchId;
  buffer: Uint8Array;
  queueType: string;
  trackedPlayerAliases: string[];
}): Promise<void> {
  try {
    const { matchId, buffer, queueType, trackedPlayerAliases } = params;
    await saveAIReviewImageToS3(matchId, buffer, queueType, trackedPlayerAliases);
  } catch (s3Error: unknown) {
    logger.error("[generateReviewImageBackend] Failed to save image to S3:", s3Error);
  }
}

/**
 * Generate an image from an image description using Gemini.
 * The image description should be the ONLY input - all context should have been
 * processed in the previous step (Step 3: generateImageDescription).
 */
export async function generateReviewImageBackend(params: {
  imageDescription: string;
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
}): Promise<Uint8Array | undefined> {
  const { imageDescription, matchId, queueType, trackedPlayerAliases } = params;
  const client = getGeminiClient();
  if (!client) {
    logger.info("[generateReviewImageBackend] Gemini API key not configured, skipping image generation");
    return undefined;
  }

  const startTime = Date.now();

  try {
    logger.info(`[generateReviewImageBackend] Using image description (${imageDescription.length.toString()} chars)`);
    logger.info("[generateReviewImageBackend] Calling Gemini API to generate image...");

    const result = await generateReviewImage({
      imageDescription,
      geminiClient: client,
      model: GEMINI_MODEL,
      timeoutMs: 60_000,
    });

    const duration = Date.now() - startTime;
    logger.info(
      `[generateReviewImageBackend] Gemini API call completed in ${result.metadata.imageDurationMs.toString()}ms`,
    );

    const buffer = decodeImageBase64(result.imageData);
    logger.info("[generateReviewImageBackend] Successfully generated image");

    // Save S3 tracing for the image generation step
    try {
      await saveImageGenerationToS3({
        matchId,
        queueType,
        trackedPlayerAliases,
        request: {
          imageDescription,
          imageDescriptionLength: imageDescription.length,
          model: GEMINI_MODEL,
        },
        response: {
          imageGenerated: true,
          durationMs: duration,
          imageSizeBytes: buffer.length,
        },
      });
    } catch (s3Error) {
      logger.error("[generateReviewImageBackend] Failed to save image generation trace to S3:", s3Error);
    }

    await saveImageLocally(buffer);
    await uploadImageToS3({ matchId, buffer, queueType, trackedPlayerAliases });

    return buffer;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const ErrorSchema = z.object({
      message: z.string(),
    });
    const parseResult = ErrorSchema.safeParse(error);
    const isTimeout = parseResult.success && parseResult.data.message.includes("timed out");

    if (isTimeout) {
      logger.error("[generateReviewImageBackend] Gemini API call timed out - request took too long");
    } else {
      logger.error("[generateReviewImageBackend] Error generating image:", error);
    }

    // Save S3 tracing for failed image generation
    try {
      await saveImageGenerationToS3({
        matchId,
        queueType,
        trackedPlayerAliases,
        request: {
          imageDescription,
          imageDescriptionLength: imageDescription.length,
          model: GEMINI_MODEL,
        },
        response: {
          imageGenerated: false,
          durationMs: duration,
        },
      });
    } catch (s3Error) {
      logger.error("[generateReviewImageBackend] Failed to save image generation trace to S3:", s3Error);
    }

    Sentry.captureException(error, {
      tags: {
        source: "gemini-image-generation",
        matchId,
        queueType,
        isTimeout: isTimeout ? "true" : "false",
      },
    });
    return undefined;
  }
}
