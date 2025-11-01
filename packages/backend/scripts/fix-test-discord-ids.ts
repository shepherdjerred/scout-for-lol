#!/usr/bin/env bun
/**
 * Fix Discord ID strings in test files to meet validation requirements:
 * - Guild/Channel IDs: 17-20 characters, must match /\d./
 * - Account IDs: 17-18 characters, must match /\d./
 *
 * This script finds and replaces common test ID patterns with valid ones.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Mapping of common test ID patterns to their 17-character replacements
const ID_REPLACEMENTS: Record<string, string> = {
  // Server/Guild IDs
  '"test-server-1"': '"test-server-000001"',
  '"test-server-2"': '"test-server-000002"',
  '"test-server-limited"': '"test-server-lmtd01"',
  '"test-server-count"': '"test-server-cnt001"',
  '"test-server-account-count"': '"tst-srv-acnt-cnt1"',
  '"server-1"': '"server-1000000001"',
  '"server-2"': '"server-2000000002"',
  '"server1"': '"server-1000000001"',
  '"server2"': '"server-2000000002"',
  
  // User/Account IDs - numbered
  '"user-1"': '"user-10000000001"',
  '"user-2"': '"user-20000000002"',
  '"user-3"': '"user-30000000003"',
  '"user-4"': '"user-40000000004"',
  '"user-5"': '"user-50000000005"',
  '"user-6"': '"user-60000000006"',
  '"user-123"': '"user-12300000123"',
  '"user-456"': '"user-45600000456"',
  '"user-789"': '"user-78900000789"',
  '"test-user"': '"test-user-0000001"',
  '"admin-1"': '"admin-100000001"',
  '"admin-2"': '"admin-200000002"',
  '"owner-1"': '"owner-100000001"',
  '"owner-123"': '"owner-12300000123"',
  '"owner-456"': '"owner-45600000456"',
  '"creator-1"': '"creator-10000001"',
  '"creator-123"': '"creator-1230000123"',
  '"player-1"': '"player-100000001"',
  '"player-2"': '"player-200000002"',
  
  // Channel IDs
  '"channel-1"': '"channel-1000000001"',
  '"channel-2"': '"channel-2000000002"',
  '"test-channel"': '"test-channel-00001"',
  '"chan-1"': '"chan-100000000001"',
  
  // Competition-specific IDs
  '"competition-channel"': '"comp-channel-0001"',
  '"leaderboard-test-1"': '"ldrbrd-test-00001"',
  '"daily-update-server"': '"dly-updt-svr-0001"',
  '"lifecycle-server"': '"lifecycle-srv-001"',
  
  // Numbered patterns (e.g., '"1"', '"2"')
  '": "1"': '": "10000000000000001"',
  '": "2"': '": "20000000000000002"',
  '": "3"': '": "30000000000000003"',
};

// Additional regex-based replacements for dynamic IDs
const REGEX_REPLACEMENTS: Array<{ pattern: RegExp; replacement: (match: string) => string }> = [
  // Replace "test-server-<word>" with "test-server-<word padded to 17>"
  {
    pattern: /"test-server-([a-z\-]{1,10})"/g,
    replacement: (match) => {
      const word = match.slice(14, -1); // Extract word
      const padded = word.padEnd(11, "0").slice(0, 11);
      return `"test-server-${padded}"`;
    },
  },
  // Replace serverId: "short" with serverId: "short-padded"
  {
    pattern: /serverId:\s*"([a-z0-9\-]{1,15})"/g,
    replacement: (match) => {
      const parts = match.split('"');
      if (parts[1].length >= 17) return match;
      const padded = parts[1].padEnd(17, "0");
      return `serverId: "${padded}"`;
    },
  },
  // Replace channelId: "short" with channelId: "short-padded"
  {
    pattern: /channelId:\s*"([a-z0-9\-]{1,15})"/g,
    replacement: (match) => {
      const parts = match.split('"');
      if (parts[1].length >= 17) return match;
      const padded = parts[1].padEnd(17, "0");
      return `channelId: "${padded}"`;
    },
  },
];

function getAllTestFiles(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, generated, etc.
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

function fixDiscordIdsInFile(filePath: string): { changed: boolean; replacements: number } {
  let content = readFileSync(filePath, "utf-8");
  const originalContent = content;
  let replacementCount = 0;

  // Apply exact string replacements
  for (const [oldId, newId] of Object.entries(ID_REPLACEMENTS)) {
    const count = (content.match(new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > 0) {
      content = content.replaceAll(oldId, newId);
      replacementCount += count;
    }
  }

  // Apply regex-based replacements
  for (const { pattern, replacement } of REGEX_REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      replacementCount += matches.length;
    }
  }

  const changed = content !== originalContent;
  if (changed) {
    writeFileSync(filePath, content, "utf-8");
  }

  return { changed, replacements: replacementCount };
}

// Main execution
const srcDir = join(import.meta.dir, "..", "src");
const testFiles = getAllTestFiles(srcDir);

console.log(`🔍 Found ${testFiles.length} test files`);
console.log("🔧 Fixing Discord IDs...\n");

let totalFilesChanged = 0;
let totalReplacements = 0;

for (const file of testFiles) {
  const { changed, replacements } = fixDiscordIdsInFile(file);
  if (changed) {
    totalFilesChanged++;
    totalReplacements += replacements;
    const relativePath = file.replace(srcDir, "src");
    console.log(`✓ ${relativePath} (${replacements} replacements)`);
  }
}

console.log(`\n✅ Fixed ${totalReplacements} Discord IDs in ${totalFilesChanged} files`);

if (totalFilesChanged === 0) {
  console.log("💡 No changes needed - all IDs are already valid!");
}
