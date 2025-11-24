import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import configuration from "@scout-for-lol/backend/configuration.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import type { MatchId } from "@scout-for-lol/data";

/**
 * Generate S3 key (path) for a file with date-based hierarchy
 */
export function generateS3Key(matchId: MatchId, prefix: string, extension: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `${prefix}/${year.toString()}/${month}/${day}/${matchId}.${extension}`;
}

type SaveToS3Config = {
  matchId: MatchId;
  keyPrefix: string;
  keyExtension: string;
  body: string | Uint8Array;
  contentType: string;
  metadata: Record<string, string>;
  logEmoji: string;
  logMessage: string;
  errorContext: string;
  returnUrl?: boolean;
  additionalLogDetails?: Record<string, unknown>;
};

/**
 * Generic function to save content to S3
 */
export async function saveToS3(config: SaveToS3Config): Promise<string | undefined> {
  const {
    matchId,
    keyPrefix,
    keyExtension,
    body,
    contentType,
    metadata,
    logEmoji,
    logMessage,
    errorContext,
    returnUrl,
    additionalLogDetails,
  } = config;
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn(`[S3Storage] ⚠️  S3_BUCKET_NAME not configured, skipping ${errorContext} save for match: ${matchId}`);
    return undefined;
  }

  console.log(`[S3Storage] ${logEmoji} ${logMessage}: ${matchId}`);

  try {
    const client = new S3Client();
    const key = generateS3Key(matchId, keyPrefix, keyExtension);
    const bodyBuffer = typeof body === "string" ? new TextEncoder().encode(body) : body;
    const sizeBytes = bodyBuffer.length;

    console.log(`[S3Storage] 📝 Upload details:`, {
      bucket,
      key,
      sizeBytes,
      ...additionalLogDetails,
    });

    const startTime = Date.now();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyBuffer,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    const uploadTime = Date.now() - startTime;
    const s3Url = `s3://${bucket}/${key}`;
    console.log(`[S3Storage] ✅ Successfully saved ${errorContext} ${matchId} to S3 in ${uploadTime.toString()}ms`);
    console.log(`[S3Storage] 🔗 S3 location: ${s3Url}`);

    return returnUrl ? s3Url : undefined;
  } catch (error) {
    console.error(`[S3Storage] ❌ Failed to save ${errorContext} ${matchId} to S3:`, error);
    throw new Error(`Failed to save ${errorContext} ${matchId} to S3: ${getErrorMessage(error)}`);
  }
}
