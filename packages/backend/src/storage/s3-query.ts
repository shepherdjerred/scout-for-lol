import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import configuration from "@scout-for-lol/backend/configuration.ts";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.ts";
import { RawMatchSchema, type RawMatch } from "@scout-for-lol/data/index";
import { eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("storage-s3-query");

/**
 * Generate date prefixes for S3 listing between start and end dates (inclusive)
 * Returns paths in format: games/YYYY/MM/DD/
 */
function generateDatePrefixes(startDate: Date, endDate: Date): string[] {
  const days = eachDayOfInterval({
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  });

  return days.map((day) => {
    const year = format(day, "yyyy");
    const month = format(day, "MM");
    const dayStr = format(day, "dd");
    return `games/${year}/${month}/${dayStr}/`;
  });
}

/**
 * Check if a match includes any of the specified participant PUUIDs
 */
function matchIncludesParticipant(match: RawMatch, puuids: string[]): boolean {
  return match.metadata.participants.some((puuid) => puuids.includes(puuid));
}

/**
 * Process match download results and filter by participant PUUIDs
 */
function processMatchResults(
  results: PromiseSettledResult<{ key: string; match: RawMatch | null }>[],
  puuids: string[],
): RawMatch[] {
  const matches: RawMatch[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.match) {
      continue;
    }

    const { match } = result.value;
    if (!matchIncludesParticipant(match, puuids)) {
      continue;
    }

    matches.push(match);
  }
  return matches;
}

/**
 * Fetch and parse a match from S3
 */
async function getMatchFromS3(client: S3Client, bucket: string, key: string): Promise<RawMatch | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      logger.warn(`[S3Query] No body in response for key: ${key}`);
      return null;
    }

    // Read the stream to a string
    const bodyString = await response.Body.transformToString();
    // Parse and validate the match data with Zod schema for runtime type safety
    const matchData = JSON.parse(bodyString);
    const match = RawMatchSchema.parse(matchData);

    return match;
  } catch (error) {
    logger.warn(`[S3Query] Failed to fetch or parse match from S3 key ${key}: ${getErrorMessage(error)}`);
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
export async function queryMatchesByDateRange(startDate: Date, endDate: Date, puuids: string[]): Promise<RawMatch[]> {
  const bucket = configuration.s3BucketName;

  if (!bucket) {
    logger.warn("[S3Query] S3_BUCKET_NAME not configured, returning empty results");
    return [];
  }

  if (puuids.length === 0) {
    logger.warn("[S3Query] No PUUIDs provided, returning empty results");
    return [];
  }

  logger.info(`[S3Query] 🔍 Querying matches from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  logger.info(`[S3Query] 👥 Filtering for ${puuids.length.toString()} participants`);

  const client = new S3Client();
  const dayPrefixes = generateDatePrefixes(startDate, endDate);
  const matches: RawMatch[] = [];
  let totalObjects = 0;
  let matchedObjects = 0;

  logger.info(`[S3Query] 📅 Scanning ${dayPrefixes.length.toString()} day(s)`);

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
          logger.info(`[S3Query] No objects found for prefix: ${prefix}`);
          continue;
        }

        logger.info(`[S3Query] Found ${response.Contents.length.toString()} object(s) in ${prefix}`);

        // Filter for only match.json files (games/{date}/{matchId}/match.json)
        const matchJsonKeys = response.Contents.flatMap((obj) =>
          obj.Key?.endsWith("/match.json") ? [obj.Key] : [],
        ).slice(0, 1000); // Limit to prevent memory issues

        logger.info(`[S3Query] Found ${matchJsonKeys.length.toString()} match.json file(s) in ${prefix}`);
        totalObjects += matchJsonKeys.length;

        // Get all keys for this day
        const keys = matchJsonKeys;

        if (keys.length === 0) {
          logger.info(`[S3Query] No valid keys found for ${prefix}`);
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
              logger.warn(`[S3Query] Failed to fetch match ${key}: ${getErrorMessage(error)}`);
              return { key, match: null };
            }
          });

          const results = await Promise.allSettled(matchPromises);
          const batchMatches = processMatchResults(results, puuids);
          matches.push(...batchMatches);
          matchedObjects += batchMatches.length;
        }
      } catch (error) {
        logger.error(`[S3Query] Error processing prefix ${prefix}: ${getErrorMessage(error)}`);
        consecutiveErrors++;

        // Circuit breaker: if we get too many consecutive errors, stop processing
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          logger.error(`[S3Query] ❌ Too many consecutive errors (${consecutiveErrors.toString()}), stopping query`);
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
      logger.info(
        `[S3Query] 📈 Progress: ${progress.toString()}% (${i.toString()}/${dayPrefixes.length.toString()} days processed, ${matchedObjects.toString()} matches found)`,
      );
    }

    // Add a small delay between batches to be nice to S3
    if (i + BATCH_SIZE < dayPrefixes.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  logger.info(
    `[S3Query] ✅ Query complete: ${matchedObjects.toString()}/${totalObjects.toString()} matches matched filter`,
  );
  logger.info(`[S3Query] 📊 Returning ${matches.length.toString()} matches`);

  return matches;
}
