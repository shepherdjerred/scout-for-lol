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

const AI_IMAGES_DIR = `${import.meta.dir}/ai-images`;

function logMatchStructure(match: CompletedMatch | ArenaMatch): void {
  if (match.queueType === "arena") {
    return;
  }

  console.log(`[debug][generateReviewImage] Match has ${match.players.length.toString()} player(s)`);
  for (let i = 0; i < match.players.length; i++) {
    const playerObj = match.players[i];
    if (!playerObj) {
      continue;
    }
    console.log(
      `[debug][generateReviewImage] Match.players[${i.toString()}] keys before JSON.stringify:`,
      Object.keys(playerObj),
    );
    if ("puuid" in playerObj) {
      console.error(
        `[debug][generateReviewImage] ⚠️  ERROR: Match.players[${i.toString()}] has puuid field before JSON.stringify!`,
        playerObj,
      );
    }
  }
}

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
    console.log(`[generateReviewImage] Saved image to: ${filepath}`);
  } catch (fsError: unknown) {
    console.error("[generateReviewImage] Failed to save image to filesystem:", fsError);
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
    console.error("[generateReviewImage] Failed to save image to S3:", s3Error);
  }
}

function buildMatchDataJson(match: CompletedMatch | ArenaMatch, curatedData?: CuratedMatchData): string {
  return JSON.stringify(curatedData ? { processedMatch: match, detailedStats: curatedData } : match, null, 2);
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
    console.log("[generateReviewImage] Gemini API key not configured, skipping image generation");
    return undefined;
  }

  try {
    const isMashup = themes.length > 1;

    console.log(`[generateReviewImage] Using art style: ${style}`);
    if (isMashup) {
      console.log(`[generateReviewImage] MASHUP! Themes: ${themes.join(" meets ")}`);
    } else {
      const firstTheme = themes[0];
      console.log(`[generateReviewImage] Using theme: ${firstTheme ?? "unknown"}`);
    }
    if (artPrompt) {
      console.log(`[generateReviewImage] Using AI-crafted art prompt (${artPrompt.length.toString()} chars)`);
    }
    console.log("[generateReviewImage] Calling Gemini API to generate image...");

    console.log(`[debug][generateReviewImage] About to serialize match for Gemini API`);
    logMatchStructure(match);

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

    console.log(`[generateReviewImage] Gemini API call completed in ${result.metadata.imageDurationMs.toString()}ms`);

    const buffer = decodeImageBase64(result.imageData);
    console.log("[generateReviewImage] Successfully generated image");

    await saveImageLocally(buffer);
    await uploadImageToS3({ matchId, buffer, match, queueType });

    return buffer;
  } catch (error: unknown) {
    const ErrorSchema = z.object({
      message: z.string(),
    });
    const result = ErrorSchema.safeParse(error);

    if (result.success && result.data.message.includes("timed out")) {
      console.error("[generateReviewImage] Gemini API call timed out - request took too long");
    } else {
      console.error("[generateReviewImage] Error generating image:", error);
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
