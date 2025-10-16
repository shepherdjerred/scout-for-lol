import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { CachedLeaderboardSchema, type CachedLeaderboard } from "@scout-for-lol/data";
import configuration from "../configuration.js";
import { getErrorMessage } from "../utils/errors.js";

// ============================================================================
// S3 Key Generation
// ============================================================================

/**
 * Generate S3 key for current leaderboard
 * Format: leaderboards/competition-{id}/current.json
 */
function generateCurrentLeaderboardKey(competitionId: number): string {
  return `leaderboards/competition-${competitionId.toString()}/current.json`;
}

/**
 * Generate S3 key for historical leaderboard snapshot
 * Format: leaderboards/competition-{id}/snapshots/YYYY-MM-DD.json
 */
function generateSnapshotLeaderboardKey(competitionId: number, date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `leaderboards/competition-${competitionId.toString()}/snapshots/${year.toString()}-${month}-${day}.json`;
}

// ============================================================================
// Save Leaderboard to S3
// ============================================================================

/**
 * Save leaderboard to S3 with versioning
 *
 * Saves to two locations:
 * 1. Current leaderboard (overwrites previous)
 * 2. Daily snapshot (preserves history)
 *
 * @param leaderboard Leaderboard data to cache
 * @returns Promise that resolves when both saves complete
 */
export async function saveCachedLeaderboard(leaderboard: CachedLeaderboard): Promise<void> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(
      `[S3Leaderboard] ⚠️  S3_BUCKET_NAME not configured, skipping cache for competition: ${leaderboard.competitionId.toString()}`,
    );
    return;
  }

  console.log(`[S3Leaderboard] 💾 Caching leaderboard for competition ${leaderboard.competitionId.toString()}`);

  try {
    const client = new S3Client();
    const body = JSON.stringify(leaderboard, null, 2);

    const currentKey = generateCurrentLeaderboardKey(leaderboard.competitionId);
    const snapshotKey = generateSnapshotLeaderboardKey(leaderboard.competitionId, new Date(leaderboard.calculatedAt));

    console.log(`[S3Leaderboard] 📝 Upload details:`, {
      bucket,
      currentKey,
      snapshotKey,
      sizeBytes: Buffer.byteLength(body, "utf8"),
      entryCount: leaderboard.entries.length,
      version: leaderboard.version,
      calculatedAt: leaderboard.calculatedAt,
    });

    const startTime = Date.now();

    // Save to current location (overwrites)
    const currentCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: currentKey,
      Body: body,
      ContentType: "application/json",
      Metadata: {
        competitionId: leaderboard.competitionId.toString(),
        version: leaderboard.version,
        calculatedAt: leaderboard.calculatedAt,
        entryCount: leaderboard.entries.length.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(currentCommand);

    // Save to snapshot location (preserves history)
    const snapshotCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: snapshotKey,
      Body: body,
      ContentType: "application/json",
      Metadata: {
        competitionId: leaderboard.competitionId.toString(),
        version: leaderboard.version,
        calculatedAt: leaderboard.calculatedAt,
        entryCount: leaderboard.entries.length.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(snapshotCommand);

    const uploadTime = Date.now() - startTime;
    console.log(
      `[S3Leaderboard] ✅ Successfully cached leaderboard for competition ${leaderboard.competitionId.toString()} in ${uploadTime.toString()}ms`,
    );
    console.log(`[S3Leaderboard] 🔗 Current: s3://${bucket}/${currentKey}`);
    console.log(`[S3Leaderboard] 🔗 Snapshot: s3://${bucket}/${snapshotKey}`);
  } catch (error) {
    console.error(
      `[S3Leaderboard] ❌ Failed to cache leaderboard for competition ${leaderboard.competitionId.toString()}:`,
      error,
    );

    // Re-throw the error so the caller can handle it appropriately
    throw new Error(
      `Failed to cache leaderboard for competition ${leaderboard.competitionId.toString()}: ${getErrorMessage(error)}`,
    );
  }
}

// ============================================================================
// Load Leaderboard from S3
// ============================================================================

/**
 * Load current cached leaderboard from S3
 *
 * @param competitionId Competition ID to load leaderboard for
 * @returns Cached leaderboard or null if not found or invalid
 */
export async function loadCachedLeaderboard(competitionId: number): Promise<CachedLeaderboard | null> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(
      `[S3Leaderboard] ⚠️  S3_BUCKET_NAME not configured, cannot load cache for competition: ${competitionId.toString()}`,
    );
    return null;
  }

  const key = generateCurrentLeaderboardKey(competitionId);

  console.log(`[S3Leaderboard] 📥 Loading cached leaderboard for competition ${competitionId.toString()}`);

  try {
    const client = new S3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      console.warn(`[S3Leaderboard] No body in response for key: ${key}`);
      return null;
    }

    // Read the stream to a string
    const bodyString = await response.Body.transformToString();

    // Parse JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(bodyString);
    } catch (error) {
      console.error(`[S3Leaderboard] Failed to parse JSON from S3 key ${key}:`, error);
      return null;
    }

    // Validate against schema
    const result = CachedLeaderboardSchema.safeParse(jsonData);
    if (!result.success) {
      console.error(
        `[S3Leaderboard] Cached leaderboard failed validation for competition ${competitionId.toString()}:`,
        result.error,
      );
      return null;
    }

    console.log(
      `[S3Leaderboard] ✅ Successfully loaded cached leaderboard for competition ${competitionId.toString()}`,
    );
    console.log(
      `[S3Leaderboard] 📊 Cached at: ${result.data.calculatedAt}, Entries: ${result.data.entries.length.toString()}`,
    );

    return result.data;
  } catch (error) {
    // Check if it's a NoSuchKey error (file doesn't exist)
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("NoSuchKey") || errorMessage.includes("NotFound")) {
      console.log(`[S3Leaderboard] No cached leaderboard found for competition ${competitionId.toString()}`);
      return null;
    }

    console.error(
      `[S3Leaderboard] ❌ Error loading cached leaderboard for competition ${competitionId.toString()}:`,
      error,
    );
    return null;
  }
}

/**
 * Load historical leaderboard snapshot from S3
 *
 * @param competitionId Competition ID to load leaderboard for
 * @param date Date of the snapshot to load
 * @returns Cached leaderboard or null if not found or invalid
 */
export async function loadSnapshotLeaderboard(competitionId: number, date: Date): Promise<CachedLeaderboard | null> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(
      `[S3Leaderboard] ⚠️  S3_BUCKET_NAME not configured, cannot load snapshot for competition: ${competitionId.toString()}`,
    );
    return null;
  }

  const key = generateSnapshotLeaderboardKey(competitionId, date);

  console.log(
    `[S3Leaderboard] 📥 Loading snapshot leaderboard for competition ${competitionId.toString()} at ${date.toISOString()}`,
  );

  try {
    const client = new S3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      console.warn(`[S3Leaderboard] No body in response for key: ${key}`);
      return null;
    }

    // Read the stream to a string
    const bodyString = await response.Body.transformToString();

    // Parse JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(bodyString);
    } catch (error) {
      console.error(`[S3Leaderboard] Failed to parse JSON from S3 key ${key}:`, error);
      return null;
    }

    // Validate against schema
    const result = CachedLeaderboardSchema.safeParse(jsonData);
    if (!result.success) {
      console.error(
        `[S3Leaderboard] Snapshot leaderboard failed validation for competition ${competitionId.toString()}:`,
        result.error,
      );
      return null;
    }

    console.log(
      `[S3Leaderboard] ✅ Successfully loaded snapshot leaderboard for competition ${competitionId.toString()}`,
    );

    return result.data;
  } catch (error) {
    // Check if it's a NoSuchKey error (file doesn't exist)
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("NoSuchKey") || errorMessage.includes("NotFound")) {
      console.log(
        `[S3Leaderboard] No snapshot found for competition ${competitionId.toString()} at ${date.toISOString()}`,
      );
      return null;
    }

    console.error(`[S3Leaderboard] ❌ Error loading snapshot for competition ${competitionId.toString()}:`, error);
    return null;
  }
}
