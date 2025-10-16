import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import configuration from "../configuration.js";
import { getErrorMessage } from "../utils/errors.js";

/**
 * Generate S3 key (path) for a match file
 */
function generateMatchKey(matchId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  // Create hierarchical structure: matches/YYYY/MM/DD/matchId.json
  return `matches/${year.toString()}/${month}/${day}/${matchId}.json`;
}

/**
 * Generate S3 key (path) for a match image
 */
function generateImageKey(matchId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  // Create hierarchical structure: images/YYYY/MM/DD/matchId.png
  return `images/${year.toString()}/${month}/${day}/${matchId}.png`;
}

/**
 * Save a League of Legends match to S3 storage
 * @param match The match data to save
 * @returns Promise that resolves when the match is saved
 */
export async function saveMatchToS3(match: MatchV5DTOs.MatchDto): Promise<void> {
  const matchId = match.metadata.matchId;
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(`[S3Storage] ⚠️  S3_BUCKET_NAME not configured, skipping save for match: ${matchId}`);
    return;
  }

  console.log(`[S3Storage] 💾 Saving match to S3: ${matchId}`);

  try {
    const client = new S3Client();
    const key = generateMatchKey(matchId);
    const body = JSON.stringify(match, null, 2);

    console.log(`[S3Storage] 📝 Upload details:`, {
      bucket,
      key,
      sizeBytes: Buffer.byteLength(body, "utf8"),
      participants: match.info.participants.length,
      gameMode: match.info.gameMode,
      gameDuration: match.info.gameDuration,
    });

    const startTime = Date.now();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
      Metadata: {
        matchId: matchId,
        gameMode: match.info.gameMode,
        queueId: match.info.queueId.toString(),
        participantCount: match.info.participants.length.toString(),
        gameDuration: match.info.gameDuration.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    const uploadTime = Date.now() - startTime;
    console.log(`[S3Storage] ✅ Successfully saved match ${matchId} to S3 in ${uploadTime.toString()}ms`);
    console.log(`[S3Storage] 🔗 S3 location: s3://${bucket}/${key}`);
  } catch (error) {
    console.error(`[S3Storage] ❌ Failed to save match ${matchId} to S3:`, error);

    // Re-throw the error so the caller can handle it appropriately
    throw new Error(`Failed to save match ${matchId} to S3: ${getErrorMessage(error)}`);
  }
}

/**
 * Save a generated match image (PNG) to S3 storage
 * @param matchId The match ID
 * @param imageBuffer The PNG image buffer
 * @param queueType The queue type (for metadata)
 * @returns Promise that resolves to the S3 URL when the image is saved, or undefined if S3 is not configured
 */
export async function saveImageToS3(
  matchId: string,
  imageBuffer: Buffer,
  queueType: string,
): Promise<string | undefined> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(`[S3Storage] ⚠️  S3_BUCKET_NAME not configured, skipping PNG save for match: ${matchId}`);
    return undefined;
  }

  console.log(`[S3Storage] 🖼️  Saving PNG to S3: ${matchId}`);

  try {
    const client = new S3Client();
    const key = generateImageKey(matchId);

    console.log(`[S3Storage] 📝 PNG upload details:`, {
      bucket,
      key,
      sizeBytes: imageBuffer.length,
      queueType,
    });

    const startTime = Date.now();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/png",
      Metadata: {
        matchId: matchId,
        queueType: queueType,
        format: "png",
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    const uploadTime = Date.now() - startTime;
    const s3Url = `s3://${bucket}/${key}`;
    console.log(`[S3Storage] ✅ Successfully saved PNG ${matchId} to S3 in ${uploadTime.toString()}ms`);
    console.log(`[S3Storage] 🔗 S3 location: ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error(`[S3Storage] ❌ Failed to save PNG ${matchId} to S3:`, error);

    // Re-throw the error so the caller can handle it appropriately
    throw new Error(`Failed to save image ${matchId} to S3: ${getErrorMessage(error)}`);
  }
}

/**
 * Generate S3 key (path) for a match SVG image
 */
function generateSvgKey(matchId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  // Create hierarchical structure: images/YYYY/MM/DD/matchId.svg
  return `images/${year.toString()}/${month}/${day}/${matchId}.svg`;
}

/**
 * Save a generated match SVG to S3 storage
 * @param matchId The match ID
 * @param svgContent The SVG content string
 * @param queueType The queue type (for metadata)
 * @returns Promise that resolves to the S3 URL when the SVG is saved, or undefined if S3 is not configured
 */
export async function saveSvgToS3(matchId: string, svgContent: string, queueType: string): Promise<string | undefined> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(`[S3Storage] ⚠️  S3_BUCKET_NAME not configured, skipping SVG save for match: ${matchId}`);
    return undefined;
  }

  console.log(`[S3Storage] 📄 Saving SVG to S3: ${matchId}`);

  try {
    const client = new S3Client();
    const key = generateSvgKey(matchId);
    const svgBuffer = Buffer.from(svgContent, "utf8");

    console.log(`[S3Storage] 📝 SVG upload details:`, {
      bucket,
      key,
      sizeBytes: svgBuffer.length,
      queueType,
    });

    const startTime = Date.now();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: svgBuffer,
      ContentType: "image/svg+xml",
      Metadata: {
        matchId: matchId,
        queueType: queueType,
        format: "svg",
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    const uploadTime = Date.now() - startTime;
    const s3Url = `s3://${bucket}/${key}`;
    console.log(`[S3Storage] ✅ Successfully saved SVG ${matchId} to S3 in ${uploadTime.toString()}ms`);
    console.log(`[S3Storage] 🔗 S3 location: ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error(`[S3Storage] ❌ Failed to save SVG ${matchId} to S3:`, error);

    // Re-throw the error so the caller can handle it appropriately
    throw new Error(`Failed to save SVG ${matchId} to S3: ${getErrorMessage(error)}`);
  }
}
