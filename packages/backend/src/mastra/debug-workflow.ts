#!/usr/bin/env bun
/* eslint-disable max-lines, complexity, max-depth, @typescript-eslint/restrict-template-expressions -- Debug script needs comprehensive command parsing and workflow execution logic with many template literals for logging */
/**
 * Debug script for testing the Mastra review workflow
 *
 * This script allows you to run the review workflow with:
 * - A specific match ID (fetched from S3)
 * - Random recent matches from S3
 * - Example data
 *
 * All intermediate artifacts are saved to S3 and a comprehensive debug JSON
 * is generated for each run.
 *
 * Usage:
 *   # Run with a specific match ID (fetches from S3)
 *   bun run src/mastra/debug-workflow.ts --match-id NA1_1234567890
 *
 *   # Run with random recent matches from S3
 *   bun run src/mastra/debug-workflow.ts --s3 --count 3
 *
 *   # Run with example data
 *   bun run src/mastra/debug-workflow.ts --example
 */

import { executeReviewWorkflow } from "./workflows/review-workflow.js";
import {
  getExampleMatch,
  MatchIdSchema,
  LeaguePuuidSchema,
  parseQueueType,
  RawMatchSchema,
  RawTimelineSchema,
  type ArenaMatch,
  type CompletedMatch,
  type PlayerConfigEntry,
  type RawMatch,
  type RawTimeline,
} from "@scout-for-lol/data";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import configuration from "@scout-for-lol/backend/configuration.js";
import { toMatch, toArenaMatch } from "@scout-for-lol/backend/league/model/match.js";
import { eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";

type DebugOptions = {
  matchId?: string;
  useS3: boolean;
  useExample: boolean;
  count: number;
  s3Days: number;
  skipImage: boolean;
  verbose: boolean;
};

function parseArgs(): DebugOptions {
  const args = process.argv.slice(2);
  const options: DebugOptions = {
    useS3: false,
    useExample: false,
    count: 1,
    s3Days: 7,
    skipImage: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) {continue;}

    switch (arg) {
      case "--match-id":
      case "-m": {
        const nextArg = args[i + 1];
        if (nextArg) {
          options.matchId = nextArg;
          i++;
        }
        break;
      }
      case "--s3": {
        options.useS3 = true;
        break;
      }
      case "--example":
      case "-e": {
        options.useExample = true;
        break;
      }
      case "--count":
      case "-c": {
        const count = parseInt(args[i + 1] ?? "1", 10);
        if (!isNaN(count)) {
          options.count = count;
          i++;
        }
        break;
      }
      case "--s3-days": {
        const days = parseInt(args[i + 1] ?? "7", 10);
        if (!isNaN(days) && days > 0) {
          options.s3Days = days;
          i++;
        }
        break;
      }
      case "--skip-image": {
        options.skipImage = true;
        break;
      }
      case "--verbose":
      case "-v": {
        options.verbose = true;
        break;
      }
      case "--help":
      case "-h": {
        printHelp();
        process.exit(0);
      }
    }
  }

  // Default to example data if nothing specified
  if (!options.matchId && !options.useS3 && !options.useExample) {
    options.useExample = true;
  }

  return options;
}

function printHelp(): void {
  console.log(`
Debug Mastra Review Workflow

Usage: bun run src/mastra/debug-workflow.ts [options]

Options:
  -m, --match-id <id>  Run workflow with a specific match ID (fetched from S3)
  --s3                 Use random recent matches from S3
  --example, -e        Use example data (default if no other source specified)
  -c, --count <n>      Number of matches to process (default: 1)
  --s3-days <n>        Number of recent days to search in S3 (default: 7)
  --skip-image         Skip image generation for faster testing
  -v, --verbose        Show more detailed output
  -h, --help           Show this help message

Examples:
  # Run with a specific match ID
  bun run src/mastra/debug-workflow.ts --match-id NA1_5199614379

  # Run with 3 random recent matches from S3
  bun run src/mastra/debug-workflow.ts --s3 --count 3

  # Run with example data (quick test)
  bun run src/mastra/debug-workflow.ts --example

  # Quick test without image generation
  bun run src/mastra/debug-workflow.ts --example --skip-image

Output:
  - Console logs with step-by-step progress
  - Debug JSON saved to S3: games/{date}/{matchId}/workflow-debug.json
  - All intermediate artifacts (analysis, prompts, etc.) also saved to S3

Environment:
  OPENAI_API_KEY         Required for AI review generation
  GEMINI_API_KEY         Optional for image generation
  S3_BUCKET_NAME         Required for --s3 and --match-id flags
`);
}

/**
 * Generate date prefixes for S3 listing
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
    return `matches/${year}/${month}/${dayStr}/`;
  });
}

/**
 * Find match key in S3 by match ID
 */
async function findMatchKeyInS3(matchId: string, daysBack: number): Promise<string | null> {
  const bucket = configuration.s3BucketName;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME not configured");
  }

  const client = new S3Client();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const prefixes = generateDatePrefixes(startDate, endDate);

  console.log(`🔍 Searching for match ${matchId} in S3...`);

  for (const prefix of prefixes) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await client.send(listCommand);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key?.includes(matchId)) {
            return obj.Key;
          }
        }
      }
    } catch {
      // Continue searching other prefixes
    }
  }

  return null;
}

/**
 * Fetch match keys from S3 for the specified date range
 */
async function fetchMatchKeysFromS3(daysBack: number): Promise<string[]> {
  const bucket = configuration.s3BucketName;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME not configured");
  }

  const client = new S3Client();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const prefixes = generateDatePrefixes(startDate, endDate);
  const allKeys: string[] = [];

  console.log(`🔍 Searching S3 for matches in last ${String(daysBack)} days...`);

  for (const prefix of prefixes) {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await client.send(listCommand);

      if (response.Contents) {
        const keys = response.Contents.flatMap((obj) => (obj.Key ? [obj.Key] : []));
        allKeys.push(...keys);
      }
    } catch {
      // Continue
    }
  }

  console.log(`✅ Found ${String(allKeys.length)} total matches\n`);
  return allKeys;
}

/**
 * Fetch and parse a match from S3
 */
async function fetchMatchFromS3(key: string): Promise<RawMatch | null> {
  const bucket = configuration.s3BucketName;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME not configured");
  }

  const client = new S3Client();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return null;
    }

    const bodyString = await response.Body.transformToString();
    const matchData = JSON.parse(bodyString);
    return RawMatchSchema.parse(matchData);
  } catch (error) {
    console.warn(`Failed to fetch match ${key}:`, error);
    return null;
  }
}

/**
 * Fetch timeline from S3 if it exists
 */
async function fetchTimelineFromS3(matchId: string, daysBack: number): Promise<RawTimeline | null> {
  const bucket = configuration.s3BucketName;
  if (!bucket) {
    return null;
  }

  const client = new S3Client();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const prefixes = generateDatePrefixes(startDate, endDate);

  for (const prefix of prefixes) {
    const timelinePrefix = prefix.replace("matches/", "games/").replace(/\/$/, "") + `/${matchId}/`;

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: timelinePrefix,
        MaxKeys: 100,
      });

      const response = await client.send(listCommand);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key?.includes("timeline")) {
            const getCommand = new GetObjectCommand({
              Bucket: bucket,
              Key: obj.Key,
            });

            const getResponse = await client.send(getCommand);
            if (getResponse.Body) {
              const bodyString = await getResponse.Body.transformToString();
              const timelineData = JSON.parse(bodyString);
              return RawTimelineSchema.parse(timelineData);
            }
          }
        }
      }
    } catch {
      // Timeline might not exist, that's OK
    }
  }

  return null;
}

/**
 * Create a minimal player config for testing
 */
function createMinimalPlayerConfig(puuid: string, name: string): PlayerConfigEntry {
  return {
    alias: name,
    league: {
      leagueAccount: {
        puuid: LeaguePuuidSchema.parse(puuid),
        region: "AMERICA_NORTH",
      },
    },
  };
}

/**
 * Convert a raw Riot API match to our internal format
 */
async function convertRawMatchToInternalFormat(rawMatch: RawMatch): Promise<CompletedMatch | ArenaMatch> {
  const queueType = parseQueueType(rawMatch.info.queueId);

  const firstParticipant = rawMatch.info.participants[0];
  if (!firstParticipant) {
    throw new Error("No participants in match");
  }

  const playerName =
    firstParticipant.riotIdGameName && firstParticipant.riotIdTagline
      ? `${firstParticipant.riotIdGameName}#${firstParticipant.riotIdTagline}`
      : "Unknown";

  const playerConfig = createMinimalPlayerConfig(firstParticipant.puuid, playerName);

  const player = {
    config: playerConfig,
    ranks: {},
  };

  if (queueType === "arena") {
    return await toArenaMatch([player], rawMatch);
  } else {
    return toMatch([player], rawMatch, undefined, undefined);
  }
}

async function runWithMatchId(matchId: string, options: DebugOptions): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎯 Running workflow for match: ${matchId}`);
  console.log(`${"=".repeat(60)}\n`);

  // Find and fetch match from S3
  const matchKey = await findMatchKeyInS3(matchId, options.s3Days);
  if (!matchKey) {
    throw new Error(`Match ${matchId} not found in S3 (searched last ${String(options.s3Days)} days)`);
  }

  console.log(`📦 Found match at: ${matchKey}`);

  const rawMatch = await fetchMatchFromS3(matchKey);
  if (!rawMatch) {
    throw new Error(`Failed to fetch match ${matchId} from S3`);
  }

  // Try to fetch timeline
  const timeline = await fetchTimelineFromS3(matchId, options.s3Days);
  if (timeline) {
    console.log(`📊 Found timeline with ${String(timeline.info.frames.length)} frames`);
  } else {
    console.log(`📊 No timeline found (will skip timeline-based analysis)`);
  }

  // Convert to internal format
  const match = await convertRawMatchToInternalFormat(rawMatch);
  const parsedMatchId = MatchIdSchema.parse(matchId);

  // Run the workflow
  const startTime = Date.now();
  const result = await executeReviewWorkflow(match, parsedMatchId, rawMatch, timeline ?? undefined);
  const duration = Date.now() - startTime;

  printResult(result, duration);
}

async function runWithS3Random(options: DebugOptions): Promise<void> {
  const keys = await fetchMatchKeysFromS3(options.s3Days);

  if (keys.length === 0) {
    throw new Error("No matches found in S3");
  }

  // Shuffle and take count
  const shuffled = keys.sort(() => Math.random() - 0.5).slice(0, options.count);

  for (let i = 0; i < shuffled.length; i++) {
    const key = shuffled[i];
    if (!key) {continue;}

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎲 Processing match ${String(i + 1)}/${String(shuffled.length)}`);
    console.log(`${"=".repeat(60)}\n`);

    const rawMatch = await fetchMatchFromS3(key);
    if (!rawMatch) {
      console.warn(`⚠️  Failed to fetch match, skipping: ${key}`);
      continue;
    }

    const matchId = rawMatch.metadata.matchId;
    console.log(`📦 Match ID: ${matchId}`);

    // Try to fetch timeline
    const timeline = await fetchTimelineFromS3(matchId, options.s3Days);
    if (timeline) {
      console.log(`📊 Found timeline with ${timeline.info.frames.length} frames`);
    }

    const match = await convertRawMatchToInternalFormat(rawMatch);
    const parsedMatchId = MatchIdSchema.parse(matchId);

    const startTime = Date.now();
    const result = await executeReviewWorkflow(match, parsedMatchId, rawMatch, timeline ?? undefined);
    const duration = Date.now() - startTime;

    printResult(result, duration);

    // Small delay between requests
    if (i < shuffled.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function runWithExample(options: DebugOptions): Promise<void> {
  for (let i = 0; i < options.count; i++) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📝 Processing example match ${i + 1}/${options.count}`);
    console.log(`${"=".repeat(60)}\n`);

    const match = getExampleMatch("ranked");
    const testMatchId = MatchIdSchema.parse(`NA1_DEBUG_${Date.now()}`);

    // No raw match data for example matches
    const startTime = Date.now();
    const result = await executeReviewWorkflow(match, testMatchId);
    const duration = Date.now() - startTime;

    printResult(result, duration);

    if (i < options.count - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

function printResult(
  result: { text: string; image?: Uint8Array; metadata?: unknown } | undefined,
  durationMs: number,
): void {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📊 RESULTS`);
  console.log(`${"─".repeat(60)}\n`);

  if (!result) {
    console.log("❌ No result generated - check API keys and logs above");
    return;
  }

  console.log(`✅ Review generated in ${durationMs}ms\n`);

  console.log(`📝 Review Text (${result.text.length} chars):`);
  console.log(`┌${"─".repeat(58)}┐`);
  const words = result.text.split(" ");
  let line = "│ ";
  for (const word of words) {
    if (line.length + word.length + 1 > 57) {
      console.log(line.padEnd(59, " ") + "│");
      line = "│ " + word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.length > 2) {
    console.log(line.padEnd(59, " ") + "│");
  }
  console.log(`└${"─".repeat(58)}┘\n`);

  if (result.image) {
    console.log(`🖼️  Image: Generated (${result.image.length} bytes)`);
  } else {
    console.log(`🖼️  Image: Not generated`);
  }

  if (result.metadata) {
    console.log(`\n📋 Metadata:`, JSON.stringify(result.metadata, null, 2));
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔧 Mastra Review Workflow Debug Tool`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`Configuration:`);
  console.log(`  - OpenAI API Key: ${configuration.openaiApiKey ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`  - Gemini API Key: ${configuration.geminiApiKey ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`  - S3 Bucket: ${configuration.s3BucketName ?? "❌ Not configured"}`);
  console.log();

  try {
    if (options.matchId) {
      await runWithMatchId(options.matchId, options);
    } else if (options.useS3) {
      await runWithS3Random(options);
    } else {
      await runWithExample(options);
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ Debug run completed`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

void (async () => {
  try {
    await main();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();
