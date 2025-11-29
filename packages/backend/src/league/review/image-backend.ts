import {
  type ArenaMatch,
  type CompletedMatch,
  type CuratedMatchData,
  type MatchId,
  generateReviewImage,
} from "@scout-for-lol/data";
import { z } from "zod";
import * as Sentry from "@sentry/node";
import { saveAIReviewImageToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { getGeminiClient } from "./ai-clients.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("review-image-backend");

const AI_IMAGES_DIR = `${import.meta.dir}/ai-images`;

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
    logger.info(`[generateReviewImage] Saved image to: ${filepath}`);
  } catch (fsError: unknown) {
    logger.error("[generateReviewImage] Failed to save image to filesystem:", fsError);
  }
}

async function uploadImageToS3(params: {
  matchId: MatchId;
  buffer: Uint8Array;
  match: CompletedMatch | ArenaMatch;
  queueType: string;
}): Promise<void> {
  try {
    const { matchId, buffer, match, queueType } = params;
    const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);
    await saveAIReviewImageToS3(matchId, buffer, queueType, trackedPlayerAliases);
  } catch (s3Error: unknown) {
    logger.error("[generateReviewImage] Failed to save image to S3:", s3Error);
  }
}

function buildMatchDataJson(match: CompletedMatch | ArenaMatch, curatedData?: CuratedMatchData): string {
  return JSON.stringify(curatedData ? { processedMatch: match, detailedStats: curatedData } : match);
}

export async function generateReviewImageBackend(params: {
  reviewText: string;
  artPrompt?: string;
  match: CompletedMatch | ArenaMatch;
  matchId: MatchId;
  queueType: string;
  style: string;
  themes: string[];
  curatedData?: CuratedMatchData;
}): Promise<Uint8Array | undefined> {
  const { reviewText, artPrompt, match, matchId, queueType, style, themes, curatedData } = params;
  const client = getGeminiClient();
  if (!client) {
    logger.info("[generateReviewImage] Gemini API key not configured, skipping image generation");
    return undefined;
  }

  try {
    const isMashup = themes.length > 1;

    logger.info(`[generateReviewImage] Using art style: ${style}`);
    if (isMashup) {
      logger.info(`[generateReviewImage] MASHUP! Themes: ${themes.join(" meets ")}`);
    } else {
      const firstTheme = themes[0];
      logger.info(`[generateReviewImage] Using theme: ${firstTheme ?? "unknown"}`);
    }
    if (artPrompt) {
      logger.info(`[generateReviewImage] Using AI-crafted art prompt (${artPrompt.length.toString()} chars)`);
    }
    logger.info("[generateReviewImage] Calling Gemini API to generate image...");

    const matchDataJson = buildMatchDataJson(match, curatedData);
    const promptForGemini = artPrompt ?? reviewText;

    const result = await generateReviewImage({
      reviewText: promptForGemini,
      artStyle: style,
      artTheme: themes[0] ?? "League of Legends gameplay",
      ...(themes[1] !== undefined ? { secondArtTheme: themes[1] } : {}),
      matchData: matchDataJson,
      geminiClient: client,
      model: "gemini-3-pro-image-preview",
      timeoutMs: 60_000,
    });

    logger.info(`[generateReviewImage] Gemini API call completed in ${result.metadata.imageDurationMs.toString()}ms`);

    const buffer = decodeImageBase64(result.imageData);
    logger.info("[generateReviewImage] Successfully generated image");

    await saveImageLocally(buffer);
    await uploadImageToS3({ matchId, buffer, match, queueType });

    return buffer;
  } catch (error: unknown) {
    const ErrorSchema = z.object({
      message: z.string(),
    });
    const result = ErrorSchema.safeParse(error);

    if (result.success && result.data.message.includes("timed out")) {
      logger.error("[generateReviewImage] Gemini API call timed out - request took too long");
    } else {
      logger.error("[generateReviewImage] Error generating image:", error);
    }
    Sentry.captureException(error, {
      tags: {
        source: "gemini-image-generation",
        matchId,
        queueType,
        style,
        isTimeout: result.success && result.data.message.includes("timed out") ? "true" : "false",
      },
    });
    return undefined;
  }
}
