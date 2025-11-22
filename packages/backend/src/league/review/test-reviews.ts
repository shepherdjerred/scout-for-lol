#!/usr/bin/env bun
/**
 * Test script for generating AI reviews
 * Usage: bun run src/league/review/test-reviews.ts [options]
 */

import { generateMatchReview } from "./generator.js";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example.js";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";

const MATCH_TYPES = ["ranked", "unranked", "aram", "arena"] as const;
type MatchType = (typeof MATCH_TYPES)[number];

type TestOptions = {
  matchType: MatchType;
  count: number;
  showPrompt: boolean;
};

function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    matchType: "ranked",
    count: 1,
    showPrompt: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

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
  console.log(`
Test AI Review Generation

Usage: bun run src/league/review/test-reviews.ts [options]

Options:
  -t, --type <type>      Match type: ranked, unranked, aram, arena (default: ranked)
  -c, --count <n>        Number of reviews to generate (default: 1)
  -p, --show-prompt      Show the system prompt used
  -h, --help             Show this help message

Examples:
  # Generate 1 ranked match review
  bun run src/league/review/test-reviews.ts

  # Generate 5 arena match reviews
  bun run src/league/review/test-reviews.ts --type arena --count 5

  # Generate review and show the prompt
  bun run src/league/review/test-reviews.ts --show-prompt

Environment:
  OPENAI_API_KEY         Required for AI review generation
`);
}

function getMatchSummary(match: CompletedMatch | ArenaMatch): string {
  if (match.queueType === "arena") {
    const arenaPlayer = match.players[0];
    if (!arenaPlayer) return "Unknown";
    return `${arenaPlayer.playerConfig.alias} | ${arenaPlayer.champion.championName} | ${String(arenaPlayer.placement)}${getOrdinalSuffix(arenaPlayer.placement)} place | ${String(arenaPlayer.champion.kills)}/${String(arenaPlayer.champion.deaths)}/${String(arenaPlayer.champion.assists)} KDA`;
  } else {
    const player = match.players[0];
    if (!player) return "Unknown";
    return `${player.playerConfig.alias} | ${player.champion.championName} | ${player.lane ?? "unknown"} | ${player.outcome} | ${String(player.champion.kills)}/${String(player.champion.deaths)}/${String(player.champion.assists)} KDA`;
  }
}

function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log(`\n${"=".repeat(80)}`);
  console.log(`Testing AI Review Generation`);
  console.log(`${"=".repeat(80)}\n`);
  console.log(`Match Type: ${options.matchType}`);
  console.log("Review Count:", options.count);
  console.log();

  // Get the example match
  const match = getExampleMatch(options.matchType);
  const matchSummary = getMatchSummary(match);

  console.log(`Match: ${matchSummary}`);
  console.log(`Queue: ${match.queueType ?? "unknown"}\n`);

  // Generate multiple reviews
  for (let i = 0; i < options.count; i++) {
    if (options.count > 1) {
      console.log("─".repeat(80));
      console.log(`Review ${String(i + 1)}/${String(options.count)}`);
      console.log("─".repeat(80) + "\n");
    }

    const startTime = Date.now();
    const reviewResult = await generateMatchReview(match);
    const duration = Date.now() - startTime;

    console.log("Generated Review:");
    console.log(`┌${"─".repeat(78)}┐`);
    // Word wrap the review to 76 chars
    const words = reviewResult.text.split(" ");
    let line = "│ ";
    for (const word of words) {
      if (line.length + word.length + 1 > 77) {
        console.log(line.padEnd(79, " ") + "│");
        line = "│ " + word + " ";
      } else {
        line += word + " ";
      }
    }
    if (line.length > 2) {
      console.log(line.padEnd(79, " ") + "│");
    }
    console.log(`└${"─".repeat(78)}┘`);
    console.log();

    console.log(`Stats:`);
    console.log(`  - Length: ${String(reviewResult.text.length)} characters`);
    console.log(`  - Generation time: ${String(duration)}ms`);
    if (reviewResult.image) {
      console.log(`  - AI Image: Generated (${String(reviewResult.image.length)} bytes)`);
    }
    console.log();

    if (reviewResult.text.length > 400) {
      console.log(`⚠️  Warning: Review exceeds 400 character limit!`);
      console.log();
    }

    if (i < options.count - 1) {
      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`${"=".repeat(80)}\n`);
}

main().catch((error) => {
  console.error("Error generating review:", error);
  process.exit(1);
});
