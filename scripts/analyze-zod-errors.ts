#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface ZodError {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
  keys?: string[];
}

interface ErrorContext {
  source: string; // "S3Query" or "fetchMatchData"
  matchId?: string;
  s3Key?: string;
  errors: ZodError[];
  lineNumber: number;
}

function parseZodErrorBlock(
  lines: string[],
  startIndex: number,
  debug = false,
): {
  errors: ZodError[];
  endIndex: number;
} | null {
  const currentLine = lines[startIndex];

  // Find the position of "[" that starts the JSON array (should be after ":")
  const colonIndex = currentLine.indexOf(":");
  if (colonIndex === -1) {
    if (debug) console.log("  DEBUG: No colon found");
    return null;
  }

  const bracketIndex = currentLine.indexOf("[", colonIndex);
  if (bracketIndex === -1) {
    if (debug) console.log("  DEBUG: No bracket after colon found");
    return null;
  }

  // Extract JSON starting from the bracket
  const jsonStart = currentLine.substring(bracketIndex);
  const jsonLines: string[] = [jsonStart];

  // Collect subsequent lines and try parsing after each line that might close the array
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    jsonLines.push(line);

    // Skip lines that look like other log entries (start with [Tag] pattern)
    const trimmedLine = line.trim();
    if (trimmedLine.match(/^\[[A-Za-z][^\]]+\]/) && !trimmedLine.includes('"') && !trimmedLine.includes("{")) {
      // This is a new log line, we've gone too far
      return null;
    }

    // Try parsing after lines that end with "]" (might be the closing bracket)
    const trimmed = line.trim();
    if (trimmed.endsWith("]") || trimmed === "]") {
      try {
        const jsonStr = jsonLines.join("\n");
        const errors = JSON.parse(jsonStr) as ZodError[];
        return { errors, endIndex: i };
      } catch (e) {
        // Not the closing bracket yet, continue
      }
    }

    // Safety limit - don't go too far
    if (i - startIndex > 100) {
      return null;
    }
  }

  return null;
}

function extractMatchId(line: string): string | undefined {
  // Match patterns like "NA1_5421167767" or "matches/2025/10/31/NA1_5403627753.json"
  const matchIdMatch = line.match(/(?:NA\d+_)?(\d{10,})/);
  return matchIdMatch?.[1];
}

function extractS3Key(line: string): string | undefined {
  const s3Match = line.match(/matches\/[^\s]+\.json/);
  return s3Match?.[0];
}

function analyzeLogFile(filePath: string): void {
  console.log(`📊 Analyzing Zod errors in: ${filePath}\n`);

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const errorContexts: ErrorContext[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for S3Query errors
    if (line.includes("[S3Query] Failed to fetch or parse match") || line.includes("Failed to fetch or parse match")) {
      const s3Key = extractS3Key(line);
      const matchId = extractMatchId(line);
      const result = parseZodErrorBlock(lines, i, false);

      if (result) {
        errorContexts.push({
          source: "S3Query",
          s3Key,
          matchId,
          errors: result.errors,
          lineNumber: i + 1,
        });
        i = result.endIndex;
      }
    }
    // Check for fetchMatchData errors
    else if (line.includes("[fetchMatchData] ❌ Match data validation failed")) {
      const matchId = extractMatchId(line);
      const result = parseZodErrorBlock(lines, i, false);

      if (result) {
        errorContexts.push({
          source: "fetchMatchData",
          matchId,
          errors: result.errors,
          lineNumber: i + 1,
        });
        i = result.endIndex;
      }
    }
  }

  // Analysis
  console.log(`Found ${errorContexts.length} Zod error occurrences\n`);

  // Group by error code
  const errorsByCode = new Map<string, number>();
  const errorsByPath = new Map<string, number>();
  const errorsByMessage = new Map<string, number>();
  const matchIds = new Set<string>();

  for (const context of errorContexts) {
    if (context.matchId) {
      matchIds.add(context.matchId);
    }

    for (const error of context.errors) {
      errorsByCode.set(error.code, (errorsByCode.get(error.code) || 0) + 1);

      const pathStr = error.path.join(".");
      errorsByPath.set(pathStr, (errorsByPath.get(pathStr) || 0) + 1);

      errorsByMessage.set(error.message, (errorsByMessage.get(error.message) || 0) + 1);
    }
  }

  // Print summary
  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total error occurrences: ${errorContexts.length}`);
  console.log(`Unique match IDs affected: ${matchIds.size}`);
  console.log(`Total individual errors: ${errorContexts.reduce((sum, ctx) => sum + ctx.errors.length, 0)}\n`);

  console.log("=".repeat(80));
  console.log("ERRORS BY CODE");
  console.log("=".repeat(80));
  const sortedByCode = Array.from(errorsByCode.entries()).sort((a, b) => b[1] - a[1]);
  for (const [code, count] of sortedByCode) {
    console.log(`${code.padEnd(30)} ${count}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("TOP 20 ERROR PATHS");
  console.log("=".repeat(80));
  const sortedByPath = Array.from(errorsByPath.entries()).sort((a, b) => b[1] - a[1]);
  for (const [path, count] of sortedByPath.slice(0, 20)) {
    console.log(`${path.padEnd(60)} ${count}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("TOP 20 ERROR MESSAGES");
  console.log("=".repeat(80));
  const sortedByMessage = Array.from(errorsByMessage.entries()).sort((a, b) => b[1] - a[1]);
  for (const [message, count] of sortedByMessage.slice(0, 20)) {
    console.log(`${message.padEnd(60)} ${count}`);
  }

  // Group by source
  console.log("\n" + "=".repeat(80));
  console.log("ERRORS BY SOURCE");
  console.log("=".repeat(80));
  const bySource = new Map<string, number>();
  for (const context of errorContexts) {
    bySource.set(context.source, (bySource.get(context.source) || 0) + 1);
  }
  for (const [source, count] of Array.from(bySource.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`${source.padEnd(30)} ${count}`);
  }

  // Show unique match IDs
  if (matchIds.size > 0 && matchIds.size <= 50) {
    console.log("\n" + "=".repeat(80));
    console.log("AFFECTED MATCH IDs");
    console.log("=".repeat(80));
    const sortedMatchIds = Array.from(matchIds).sort();
    for (const matchId of sortedMatchIds) {
      console.log(matchId);
    }
  } else if (matchIds.size > 50) {
    console.log(`\n(${matchIds.size} unique match IDs affected - too many to list)`);
  }

  // Show sample errors
  console.log("\n" + "=".repeat(80));
  console.log("SAMPLE ERRORS (first 5)");
  console.log("=".repeat(80));
  for (const context of errorContexts.slice(0, 5)) {
    console.log(`\n[Line ${context.lineNumber}] ${context.source}`);
    if (context.matchId) console.log(`Match ID: ${context.matchId}`);
    if (context.s3Key) console.log(`S3 Key: ${context.s3Key}`);
    console.log(`Errors (${context.errors.length}):`);
    for (const error of context.errors.slice(0, 3)) {
      console.log(`  - ${error.code}: ${error.path.join(".")} - ${error.message}`);
    }
    if (context.errors.length > 3) {
      console.log(`  ... and ${context.errors.length - 3} more`);
    }
  }
}

// Main
const logFile = process.argv[2] || "scout-beta-scout-backend-77b98b7475-d9szd-logs.txt";

if (!logFile) {
  console.error("Usage: bun scripts/analyze-zod-errors.ts <log-file>");
  process.exit(1);
}

try {
  analyzeLogFile(logFile);
} catch (error) {
  console.error("Error analyzing log file:", error);
  process.exit(1);
}
