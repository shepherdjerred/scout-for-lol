#!/usr/bin/env bun
/**
 * Migration script to replace console.log/error/warn with structured logger
 */

import { readFileSync, writeFileSync } from "node:fs";
import { glob } from "glob";

// Get all TypeScript files in src directory
const files = await glob("src/**/*.ts", {
  ignore: ["src/logger.ts", "**/*.test.ts", "**/*.integration.test.ts"],
});

// Map file paths to logger names
function getLoggerName(filePath: string): string {
  // Remove src/ prefix and .ts suffix
  const normalized = filePath
    .replace(/^src\//, "")
    .replace(/\.ts$/, "")
    .replace(/\/index$/, "");

  // Convert path to logger name
  const parts = normalized.split("/");

  // Take last 2 meaningful parts for the name
  if (parts.length >= 2) {
    return parts.slice(-2).join("-");
  }
  return parts[parts.length - 1] ?? "app";
}

// Calculate relative import path to logger.ts from a given file
function getLoggerImportPath(filePath: string): string {
  const depth = filePath.split("/").length - 2; // -2 for src/ at start
  if (depth === 0) return "./logger.js";
  return "../".repeat(depth) + "logger.js";
}

let migratedCount = 0;
let skippedCount = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");

  // Skip if no console statements
  if (!content.match(/console\.(log|error|warn|debug|info)/)) {
    continue;
  }

  // Skip if already has logger import
  if (content.includes('from "./logger') || content.includes('from "../logger') || content.includes('createLogger')) {
    console.log(`⏭️  Skipping ${file} (already migrated)`);
    skippedCount++;
    continue;
  }

  console.log(`📝 Migrating ${file}`);

  const loggerName = getLoggerName(file);
  const importPath = getLoggerImportPath(file);

  let newContent = content;

  // Find the last import statement to insert after
  const importMatches = [...newContent.matchAll(/^import .+;$/gm)];
  if (importMatches.length > 0) {
    const lastImport = importMatches[importMatches.length - 1];
    const insertPos = (lastImport?.index ?? 0) + (lastImport?.[0].length ?? 0);

    const loggerImport = `\nimport { createLogger } from "${importPath}";\n\nconst logger = createLogger("${loggerName}");`;

    newContent = newContent.slice(0, insertPos) + loggerImport + newContent.slice(insertPos);
  }

  // Replace console statements
  newContent = newContent.replace(/console\.log\(/g, "logger.info(");
  newContent = newContent.replace(/console\.error\(/g, "logger.error(");
  newContent = newContent.replace(/console\.warn\(/g, "logger.warn(");
  newContent = newContent.replace(/console\.debug\(/g, "logger.debug(");
  newContent = newContent.replace(/console\.info\(/g, "logger.info(");

  writeFileSync(file, newContent);
  migratedCount++;
}

console.log(`\n✅ Migration complete!`);
console.log(`📊 Migrated: ${migratedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files (already migrated)`);
