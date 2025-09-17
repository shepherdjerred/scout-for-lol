import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import env from "env-var";

/**
 * Generate S3 key (path) for a match file
 */
function generateMatchKey(matchId: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  // Create hierarchical structure: matches/YYYY/MM/DD/matchId.json
  return `matches/${year}/${month}/${day}/${matchId}.json`;
}

/**
 * Create S3 client - lets AWS SDK handle credential discovery automatically
 * (environment variables, IAM roles, credential files, etc.)
 */
function createS3Client(): S3Client {
  return new S3Client();
}

/**
 * Check if S3 storage is configured
 */
function isS3Configured(): boolean {
  const bucket = env.get("S3_BUCKET").asString();
  return !!bucket;
}

/**
 * Save a League of Legends match to S3 storage
 * @param match The match data to save
 * @returns Promise that resolves when the match is saved
 */
export async function saveMatchToS3(match: MatchV5DTOs.MatchDto): Promise<void> {
  const matchId = match.metadata.matchId;

  if (!isS3Configured()) {
    console.warn(`[S3Storage] ⚠️  S3_BUCKET not configured, skipping save for match: ${matchId}`);
    return;
  }

  const bucket = env.get("S3_BUCKET").required().asString();

  console.log(`[S3Storage] 💾 Saving match to S3: ${matchId}`);

  try {
    const client = createS3Client();
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
    console.log(`[S3Storage] ✅ Successfully saved match ${matchId} to S3 in ${uploadTime}ms`);
    console.log(`[S3Storage] 🔗 S3 location: s3://${bucket}/${key}`);
  } catch (error) {
    console.error(`[S3Storage] ❌ Failed to save match ${matchId} to S3:`, error);

    // Re-throw the error so the caller can handle it appropriately
    throw new Error(
      `Failed to save match ${matchId} to S3: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get storage configuration info
 */
export function getS3StorageInfo(): {
  isConfigured: boolean;
  bucket: string | undefined;
  region: string | undefined;
  endpoint: string | undefined;
} {
  const isConfigured = isS3Configured();
  const bucket = env.get("S3_BUCKET").asString();
  const region = env.get("AWS_REGION").default("us-east-1").asString();
  const endpoint = env.get("S3_ENDPOINT").asString();

  return {
    isConfigured,
    bucket: isConfigured ? bucket : undefined,
    region: isConfigured ? region : undefined,
    endpoint: isConfigured ? endpoint : undefined,
  };
}
