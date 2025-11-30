#!/usr/bin/env bun
/**
 * Test script for generating AI reviews
 * Usage: bun run src/league/review/test-reviews.ts [options]
 */

import { generateMatchReview } from "@scout-for-lol/backend/league/review/generator.ts";
import {
  getExampleMatch,
  MatchIdSchema,
  LeaguePuuidSchema,
  parseQueueType,
  RawMatchSchema,
  getOrdinalSuffix,
  type ArenaMatch,
  type CompletedMatch,
  type PlayerConfigEntry,
  type RawMatch,
} from "@scout-for-lol/data/index.ts";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import configuration from "@scout-for-lol/backend/configuration.ts";
import { toMatch, toArenaMatch } from "@scout-for-lol/backend/league/model/match.ts";
import { eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("review-test-reviews");

const MATCH_TYPES = ["ranked", "unranked", "aram", "arena"] as const;
type MatchType = (typeof MATCH_TYPES)[number];

type TestOptions = {
  matchType: MatchType;
  count: number;
  showPrompt: boolean;
  useS3: boolean;
  s3Days: number;
};

function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    matchType: "ranked",
    count: 10,
    showPrompt: false,
    useS3: false,
    s3Days: 7,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) {
      continue;
    }

    switch (arg) {
      case "--type":
      case "-t": {
        const nextArg = args[i + 1];
        if (nextArg) {
          const matchedType = MATCH_TYPES.find((t) => t === nextArg);
          if (matchedType) {
            options.matchType = matchedType;
            i++;
          }
        }
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
      case "--show-prompt":
      case "-p": {
        options.showPrompt = true;
        break;
      }
      case "--s3": {
        options.useS3 = true;
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
      case "--help":
      case "-h": {
        printHelp();
        process.exit(0);
      }
    }
  }

  return options;
}

function printHelp(): void {
  logger.info(`
Test AI Review Generation

Usage: bun run src/league/review/test-reviews.ts [options]

Options:
  -t, --type <type>      Match type: ranked, unranked, aram, arena (default: ranked)
  -c, --count <n>        Number of reviews to generate (default: 10)
  -p, --show-prompt      Show the system prompt used
  --s3                   Fetch random matches from S3 instead of using examples
  --s3-days <n>          Number of recent days to search in S3 (default: 7)
  -h, --help             Show this help message

Examples:
  # Generate 10 ranked match reviews using example data (default)
  bun run src/league/review/test-reviews.ts

  # Generate 5 arena match reviews from S3
  bun run src/league/review/test-reviews.ts --type arena --count 5 --s3

  # Generate reviews from last 30 days of S3 matches
  bun run src/league/review/test-reviews.ts --s3 --s3-days 30

  # Generate review and show the prompt
  bun run src/league/review/test-reviews.ts --show-prompt

Environment:
  OPENAI_API_KEY         Required for AI review generation
  S3_BUCKET_NAME         Required when using --s3 flag
`);
}

function getMatchSummary(match: CompletedMatch | ArenaMatch): string {
  if (match.queueType === "arena") {
    const arenaPlayer = match.players[0];
    if (!arenaPlayer) {
      return "Unknown";
    }
    return `${arenaPlayer.playerConfig.alias} | ${arenaPlayer.champion.championName} | ${String(arenaPlayer.placement)}${getOrdinalSuffix(arenaPlayer.placement)} place | ${String(arenaPlayer.champion.kills)}/${String(arenaPlayer.champion.deaths)}/${String(arenaPlayer.champion.assists)} KDA`;
  } else {
    const player = match.players[0];
    if (!player) {
      return "Unknown";
    }
    return `${player.playerConfig.alias} | ${player.champion.championName} | ${player.lane ?? "unknown"} | ${player.outcome} | ${String(player.champion.kills)}/${String(player.champion.deaths)}/${String(player.champion.assists)} KDA`;
  }
}

/**
 * Generate date prefixes for S3 listing between start and end dates (inclusive)
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

  logger.info(`\n🔍 Searching S3 for matches in last ${String(daysBack)} days...`);

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
        logger.info(`  Found ${String(keys.length)} match(es) in ${prefix}`);
      }
    } catch (error) {
      logger.warn(`  Warning: Could not list ${prefix}:`, error);
    }
  }

  logger.info(`✅ Found ${String(allKeys.length)} total matches\n`);
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
    // Parse and validate the match data with Zod schema
    const matchData = JSON.parse(bodyString);
    return RawMatchSchema.parse(matchData);
  } catch (error) {
    logger.warn(`Failed to fetch match ${key}:`, error);
    return null;
  }
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

  // Pick the first participant as our "tracked player"
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
    return toMatch([player], rawMatch, new Map());
  }
}

/**
 * Get a random match from S3 that matches the specified type
 */
async function getRandomMatchFromS3(matchType: MatchType, daysBack: number): Promise<CompletedMatch | ArenaMatch> {
  const keys = await fetchMatchKeysFromS3(daysBack);

  if (keys.length === 0) {
    throw new Error("No matches found in S3");
  }

  // Shuffle and try matches until we find one of the right type
  const shuffled = keys.sort(() => Math.random() - 0.5);

  for (const key of shuffled) {
    const rawMatch = await fetchMatchFromS3(key);
    if (!rawMatch) {
      continue;
    }

    const queueType = parseQueueType(rawMatch.info.queueId);

    // Check if this match type matches what we're looking for
    const isMatchingType =
      (matchType === "arena" && queueType === "arena") ||
      (matchType === "aram" && queueType === "aram") ||
      (matchType === "ranked" && (queueType === "solo" || queueType === "flex")) ||
      (matchType === "unranked" && (queueType === "quickplay" || queueType === "draft pick"));

    if (isMatchingType) {
      logger.info(`📦 Using match from S3: ${key}`);
      return await convertRawMatchToInternalFormat(rawMatch);
    }
  }

  throw new Error(`Could not find a ${matchType} match in the last ${String(daysBack)} days of S3 data`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  logger.info(`\n${"=".repeat(80)}`);
  logger.info(`Testing AI Review Generation`);
  logger.info(`${"=".repeat(80)}\n`);
  logger.info(`Match Type: ${options.matchType}`);
  logger.info("Review Count:", options.count);
  logger.info(`Source: ${options.useS3 ? `S3 (last ${String(options.s3Days)} days)` : "Example data"}`);
  logger.info();

  // Generate multiple reviews
  for (let i = 0; i < options.count; i++) {
    if (options.count > 1) {
      logger.info("─".repeat(80));
      logger.info(`Review ${String(i + 1)}/${String(options.count)}`);
      logger.info("─".repeat(80) + "\n");
    }

    // Get the match (from S3 or example data)
    const match = options.useS3
      ? await getRandomMatchFromS3(options.matchType, options.s3Days)
      : getExampleMatch(options.matchType);

    const matchSummary = getMatchSummary(match);

    logger.info(`Match: ${matchSummary}`);
    logger.info(`Queue: ${match.queueType ?? "unknown"}\n`);

    const startTime = Date.now();
    const testMatchId = MatchIdSchema.parse(`NA1_${Date.now().toString()}`);
    const reviewResult = await generateMatchReview(match, testMatchId);
    const duration = Date.now() - startTime;

    if (!reviewResult) {
      logger.info("❌ No review generated - API keys not configured");
      logger.info(`   Set OPENAI_API_KEY environment variable to generate AI reviews`);
      logger.info();
      continue;
    }

    logger.info("Generated Review:");
    logger.info(`┌${"─".repeat(78)}┐`);
    // Word wrap the review to 76 chars
    const words = reviewResult.text.split(" ");
    let line = "│ ";
    for (const word of words) {
      if (line.length + word.length + 1 > 77) {
        logger.info(line.padEnd(79, " ") + "│");
        line = "│ " + word + " ";
      } else {
        line += word + " ";
      }
    }
    if (line.length > 2) {
      logger.info(line.padEnd(79, " ") + "│");
    }
    logger.info(`└${"─".repeat(78)}┘`);
    logger.info();

    logger.info(`Stats:`);
    logger.info(`  - Length: ${String(reviewResult.text.length)} characters`);
    logger.info(`  - Generation time: ${String(duration)}ms`);
    if (reviewResult.image) {
      logger.info(`  - AI Image: Generated (${String(reviewResult.image.length)} bytes)`);
    }
    logger.info();

    if (reviewResult.text.length > 400) {
      logger.info(`⚠️  Warning: Review exceeds 400 character limit!`);
      logger.info();
    }

    if (i < options.count - 1) {
      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  logger.info(`${"=".repeat(80)}\n`);
}

void (async () => {
  try {
    await main();
  } catch (error) {
    logger.error("Error generating review:", error);
    process.exit(1);
  }
})();
