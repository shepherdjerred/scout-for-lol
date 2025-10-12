import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import configuration from "../configuration.js";

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
    throw new Error(
      `Failed to save match ${matchId} to S3: ${z.instanceof(Error).safeParse(error).success ? (error as Error).message : String(error)}`,
    );
  }
}
