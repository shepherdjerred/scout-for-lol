#!/usr/bin/env bun
/**
 * Automatically fix ALL Discord IDs that are too short by detecting Schema.parse() patterns
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

function getAllTestFiles(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (["node_modules", "dist", "build", "generated", ".cache"].includes(item)) {
        continue;
      }
      files.push(...getAllTestFiles(fullPath));
    } else if (item.endsWith(".test.ts") || item.endsWith(".integration.test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixFile(filePath: string): { changed: boolean; count: number } {
  let content = readFileSync(filePath, "utf-8");
  const original = content;
  let count = 0;

  // Pattern: DiscordGuildIdSchema.parse("short")
  // Pattern: DiscordAccountIdSchema.parse("short")
  // Pattern: DiscordChannelIdSchema.parse("short")
  const patterns = [
    /DiscordGuildIdSchema\.parse\("([^"]{1,16})"\)/g,
    /DiscordAccountIdSchema\.parse\("([^"]{1,16})"\)/g,
    /DiscordChannelIdSchema\.parse\("([^"]{1,16})"\)/g,
  ];

  const schemaNames = ["DiscordGuildIdSchema", "DiscordAccountIdSchema", "DiscordChannelIdSchema"];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const schemaName = schemaNames[i];

    content = content.replace(pattern, (match, shortId) => {
      // Pad the ID to 17 characters
      const padded = shortId.padEnd(17, "0");
      count++;
      return `${schemaName}.parse("${padded}")`;
    });
  }

  const changed = content !== original;
  if (changed) {
    writeFileSync(filePath, content, "utf-8");
  }

  return { changed, count };
}

// Main
const srcDir = join(import.meta.dir, "..", "src");
const testFiles = getAllTestFiles(srcDir);

console.log(`🔍 Found ${testFiles.length} test files`);
console.log("🔧 Fixing all short Discord IDs in Schema.parse() calls...\n");

let totalFiles = 0;
let totalReplacements = 0;

for (const file of testFiles) {
  const { changed, count } = fixFile(file);
  if (changed) {
    totalFiles++;
    totalReplacements += count;
    const rel = file.replace(srcDir, "src");
    console.log(`✓ ${rel} (${count} IDs padded)`);
  }
}

console.log(`\n✅ Fixed ${totalReplacements} Discord IDs in ${totalFiles} files`);

