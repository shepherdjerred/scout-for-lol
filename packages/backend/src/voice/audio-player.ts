/**
 * Audio Player
 *
 * Handles audio streaming from various sources (files, URLs, S3, YouTube).
 */

import { Readable } from "stream";
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import crypto from "crypto";
import type { SoundSource } from "@scout-for-lol/data";
import configuration from "@scout-for-lol/backend/configuration.ts";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("audio-player");

// In-memory tracking of URLs being downloaded
const downloadingUrls = new Set<string>();

/**
 * Get an audio stream from a sound source
 */
export async function getAudioStream(source: SoundSource): Promise<Readable> {
  if (source.type === "file") {
    // For S3 URLs stored as "file" type with s3:// prefix
    if (source.path.startsWith("s3://")) {
      return getS3AudioStream(source.path);
    }
    // Local file (shouldn't happen in production backend)
    if (existsSync(source.path)) {
      return createReadStream(source.path);
    }
    throw new Error(`File not found: ${source.path}`);
  }

  if (source.type === "url") {
    // Check if it's a YouTube URL
    if (isYouTubeUrl(source.url)) {
      return getCachedYouTubeAudio(source.url);
    }
    // Direct URL - fetch and stream
    const response = await fetch(source.url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch audio from ${source.url}`);
    }
    return Readable.fromWeb(response.body as never);
  }

  throw new Error(`Unknown sound source type`);
}

/**
 * Check if a URL is a YouTube URL
 */
function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Get audio stream from S3
 */
async function getS3AudioStream(s3Url: string): Promise<Readable> {
  // Parse s3://bucket/key format
  const match = s3Url.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid S3 URL: ${s3Url}`);
  }
  const [, bucket, key] = match;

  const s3Client = new S3Client({});
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`No body in S3 response for ${s3Url}`);
  }

  return response.Body as Readable;
}

/**
 * Generate S3 key from YouTube URL
 */
function urlToS3Key(url: string): string {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return `youtube-cache/${hash.substring(0, 8)}/${hash}.mp3`;
}

/**
 * Check if a YouTube URL is cached in S3
 */
async function isInS3Cache(key: string): Promise<boolean> {
  if (!configuration.s3BucketName) {
    return false;
  }

  const s3Client = new S3Client({});
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: configuration.s3BucketName,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get audio stream from S3 cache
 */
async function getFromS3Cache(key: string): Promise<Readable> {
  if (!configuration.s3BucketName) {
    throw new Error("S3 bucket not configured");
  }

  const s3Client = new S3Client({});
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: configuration.s3BucketName,
      Key: key,
    })
  );
  return response.Body as Readable;
}

/**
 * Get cached YouTube audio, downloading if needed
 */
async function getCachedYouTubeAudio(url: string): Promise<Readable> {
  const s3Key = urlToS3Key(url);

  // Check if already cached in S3
  if (await isInS3Cache(s3Key)) {
    logger.debug(`YouTube audio cache hit: ${url}`);
    return getFromS3Cache(s3Key);
  }

  // Download and cache
  logger.info(`YouTube audio cache miss, downloading: ${url}`);
  await downloadYouTubeAudio(url, s3Key);
  return getFromS3Cache(s3Key);
}

/**
 * Download YouTube audio and cache to S3
 */
async function downloadYouTubeAudio(url: string, s3Key: string): Promise<void> {
  // Prevent duplicate downloads
  if (downloadingUrls.has(url)) {
    // Wait for existing download
    while (downloadingUrls.has(url)) {
      await new Promise((r) => setTimeout(r, 500));
    }
    return;
  }

  downloadingUrls.add(url);

  try {
    // Use yt-dlp to download audio
    const tempDir = "/tmp/yt-cache";
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const tempFile = join(tempDir, `${crypto.randomUUID()}.mp3`);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("yt-dlp", [
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "-o",
        tempFile.replace(".mp3", ".%(ext)s"),
        "--no-playlist",
        "--max-filesize",
        "10M",
        url,
      ]);

      let stderr = "";
      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      });
      proc.on("error", reject);
    });

    // Upload to S3
    if (configuration.s3BucketName) {
      const fileStream = createReadStream(tempFile);
      const s3Client = new S3Client({});
      await s3Client.send(
        new PutObjectCommand({
          Bucket: configuration.s3BucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: "audio/mpeg",
        })
      );

      logger.info(`Cached YouTube audio to S3: ${s3Key}`);
    }
  } finally {
    downloadingUrls.delete(url);
  }
}

/**
 * Pre-cache a YouTube URL (async, doesn't block)
 */
export async function cacheYouTubeUrl(url: string): Promise<{ cached: boolean; key?: string }> {
  if (!isYouTubeUrl(url)) {
    return { cached: false };
  }

  const s3Key = urlToS3Key(url);

  if (await isInS3Cache(s3Key)) {
    return { cached: true, key: s3Key };
  }

  // Start download in background
  downloadYouTubeAudio(url, s3Key).catch((error) => {
    logger.error(`Failed to cache YouTube URL: ${url}`, error);
  });

  return { cached: false, key: s3Key };
}

/**
 * Check if a URL is cached
 */
export async function getCacheStatus(url: string): Promise<"cached" | "downloading" | "not-cached"> {
  if (downloadingUrls.has(url)) {
    return "downloading";
  }

  const s3Key = urlToS3Key(url);
  if (await isInS3Cache(s3Key)) {
    return "cached";
  }

  return "not-cached";
}
