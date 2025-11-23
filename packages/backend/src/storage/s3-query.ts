import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import configuration from "@scout-for-lol/backend/configuration.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";

/**
 * Generate date prefixes for S3 listing between start and end dates (inclusive)
 * Returns paths in format: matches/YYYY/MM/DD/
 */
function generateDatePrefixes(startDate: Date, endDate: Date): string[] {
  const prefixes: string[] = [];
  const current = new Date(startDate);

  // Normalize to start of day in UTC
  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, "0");
    const day = String(current.getUTCDate()).padStart(2, "0");

    prefixes.push(`matches/${year.toString()}/${month}/${day}/`);

    // Move to next day
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return prefixes;
}

/**
 * Check if a match includes any of the specified participant PUUIDs
 */
function matchIncludesParticipant(match: MatchV5DTOs.MatchDto, puuids: string[]): boolean {
  return match.metadata.participants.some((puuid) => puuids.includes(puuid));
}

/**
 * Fetch and parse a match from S3
 */
async function getMatchFromS3(client: S3Client, bucket: string, key: string): Promise<MatchV5DTOs.MatchDto | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      console.warn(`[S3Query] No body in response for key: ${key}`);
      return null;
    }

    // Read the stream to a string
    const bodyString = await response.Body.transformToString();
    // Parse JSON - we trust S3 storage contains valid match data since we control what we upload
    // This is the ONE acceptable case for type assertion without Zod validation because:
    // 1. We control all data written to S3 (see saveMatchToS3)
    // 2. MatchV5DTOs.MatchDto is an external API type we can't easily create a Zod schema for
    // 3. S3 is a trusted data source we manage
    // eslint-disable-next-line no-restricted-syntax -- Trusted S3 data source we control
    const match = JSON.parse(bodyString) as MatchV5DTOs.MatchDto;

    return match;
  } catch (error) {
    console.warn(`[S3Query] Failed to fetch or parse match from S3 key ${key}: ${getErrorMessage(error)}`);
    return null;
  }
}

/**
 * Query matches from S3 within a date range, filtered by participant PUUIDs
 *
 * @param startDate Start of date range (inclusive)
 * @param endDate End of date range (inclusive)
 * @param puuids Array of participant PUUIDs to filter by
 * @returns Array of matches that occurred in the date range and include any of the specified participants
 */
export async function queryMatchesByDateRange(
  startDate: Date,
  endDate: Date,
  puuids: string[],
): Promise<MatchV5DTOs.MatchDto[]> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    console.warn("[S3Query] S3_BUCKET_NAME not configured, returning empty results");
    return [];
  }

  if (puuids.length === 0) {
    console.warn("[S3Query] No PUUIDs provided, returning empty results");
    return [];
  }

  console.log(`[S3Query] 🔍 Querying matches from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`[S3Query] 👥 Filtering for ${puuids.length.toString()} participants`);

  const client = new S3Client();
  const dayPrefixes = generateDatePrefixes(startDate, endDate);
  const matches: MatchV5DTOs.MatchDto[] = [];
  let totalObjects = 0;
  let matchedObjects = 0;

  console.log(`[S3Query] 📅 Scanning ${dayPrefixes.length.toString()} day(s)`);

  // Process days in batches to avoid overwhelming S3 and memory
  const BATCH_SIZE = 5; // Process 5 days at a time
  const MAX_CONCURRENT_DOWNLOADS = 10; // Limit concurrent match downloads
  const MAX_CONSECUTIVE_ERRORS = 3; // Stop if we get too many consecutive errors

  let consecutiveErrors = 0;

  for (let i = 0; i < dayPrefixes.length; i += BATCH_SIZE) {
    const batch = dayPrefixes.slice(i, i + BATCH_SIZE);

    for (const prefix of batch) {
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
        });

        const response = await client.send(listCommand);

        if (!response.Contents || response.Contents.length === 0) {
          console.log(`[S3Query] No objects found for prefix: ${prefix}`);
          continue;
        }

        console.log(`[S3Query] Found ${response.Contents.length.toString()} object(s) in ${prefix}`);
        totalObjects += response.Contents.length;

        // Get all keys for this day
        const keys = response.Contents.flatMap((obj) => (obj.Key ? [obj.Key] : [])).slice(0, 1000); // Limit to prevent memory issues

        if (keys.length === 0) {
          console.log(`[S3Query] No valid keys found for ${prefix}`);
          continue;
        }

        // Process matches in smaller concurrent batches to avoid overwhelming S3
        for (let j = 0; j < keys.length; j += MAX_CONCURRENT_DOWNLOADS) {
          const keyBatch = keys.slice(j, j + MAX_CONCURRENT_DOWNLOADS);

          const matchPromises = keyBatch.map(async (key) => {
            try {
              const match = await getMatchFromS3(client, bucket, key);
              return { key, match };
            } catch (error) {
              console.warn(`[S3Query] Failed to fetch match ${key}: ${getErrorMessage(error)}`);
              return { key, match: null };
            }
          });

          const results = await Promise.allSettled(matchPromises);

          for (const result of results) {
            if (result.status === "fulfilled" && result.value.match) {
              const { match } = result.value;
              if (matchIncludesParticipant(match, puuids)) {
                matches.push(match);
                matchedObjects++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`[S3Query] Error processing prefix ${prefix}: ${getErrorMessage(error)}`);
        consecutiveErrors++;

        // Circuit breaker: if we get too many consecutive errors, stop processing
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`[S3Query] ❌ Too many consecutive errors (${consecutiveErrors.toString()}), stopping query`);
          throw new Error(
            `S3 query failed after ${consecutiveErrors.toString()} consecutive errors. Last error: ${getErrorMessage(error)}`,
          );
        }

        continue;
      }

      // Reset error counter on successful processing
      consecutiveErrors = 0;
    }

    // Log progress every few batches
    if ((i / BATCH_SIZE) % 5 === 0 && i > 0) {
      const progress = Math.round((i / dayPrefixes.length) * 100);
      console.log(
        `[S3Query] 📈 Progress: ${progress.toString()}% (${i.toString()}/${dayPrefixes.length.toString()} days processed, ${matchedObjects.toString()} matches found)`,
      );
    }

    // Add a small delay between batches to be nice to S3
    if (i + BATCH_SIZE < dayPrefixes.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(
    `[S3Query] ✅ Query complete: ${matchedObjects.toString()}/${totalObjects.toString()} matches matched filter`,
  );
  console.log(`[S3Query] 📊 Returning ${matches.length.toString()} matches`);

  return matches;
}
