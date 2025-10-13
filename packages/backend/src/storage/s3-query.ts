import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import configuration from "../configuration.js";
import { getErrorMessage } from "../utils/errors.js";

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
    // eslint-disable-next-line no-restricted-syntax -- I'm okay with this since we're loading a saved API response
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

  for (const prefix of dayPrefixes) {
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

      for (const object of response.Contents) {
        if (!object.Key) continue;

        const match = await getMatchFromS3(client, bucket, object.Key);

        if (match && matchIncludesParticipant(match, puuids)) {
          matches.push(match);
          matchedObjects++;
        }
      }
    } catch (error) {
      console.error(`[S3Query] Error listing objects for prefix ${prefix}: ${getErrorMessage(error)}`);
      // Continue with other prefixes
    }
  }

  console.log(
    `[S3Query] ✅ Query complete: ${matchedObjects.toString()}/${totalObjects.toString()} matches matched filter`,
  );
  console.log(`[S3Query] 📊 Returning ${matches.length.toString()} matches`);

  return matches;
}
