#!/usr/bin/env bun
/**
 * Automated fixer for branded type errors in test files
 *
 * This script applies common patterns to fix branded type errors:
 * - Adds necessary imports
 * - Wraps Discord ID string literals with Schema.parse()
 */

import { readFileSync, writeFileSync } from "node:fs";
import { glob } from "glob";

const DRY_RUN = process.argv.includes("--dry-run");

// Patterns to fix
const FIXES = [
  // Prisma data object patterns (in create/update calls)
  {
    pattern: /serverId:\s*"(\d{17,19})"/g,
    replacement: 'serverId: DiscordGuildIdSchema.parse("$1")',
  },
  {
    pattern: /channelId:\s*"(\d{17,19})"/g,
    replacement: 'channelId: DiscordChannelIdSchema.parse("$1")',
  },
  {
    pattern: /ownerId:\s*"([\w-]+)"/g,
    replacement: 'ownerId: DiscordAccountIdSchema.parse("$1")',
  },
  {
    pattern: /discordId:\s*"([\w-]+)"/g,
    replacement: 'discordId: DiscordAccountIdSchema.parse("$1")',
  },
  {
    pattern: /creatorDiscordId:\s*"([\w-]+)"/g,
    replacement: 'creatorDiscordId: DiscordAccountIdSchema.parse("$1")',
  },
];

function addImports(content: string): string {
  // Find existing @scout-for-lol/data imports
  const importMatch = content.match(/import\s+({[^}]+})\s+from\s+"@scout-for-lol\/data";/);

  const neededImports = [
    "DiscordAccountIdSchema",
    "DiscordChannelIdSchema",
    "DiscordGuildIdSchema",
  ];

  if (importMatch) {
    // Add to existing import
    const existingImports = importMatch[1]
      .slice(1, -1) // Remove { and }
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const allImports = [...new Set([...existingImports, ...neededImports])].sort();

    const newImportStatement = `import { ${allImports.join(", ")} } from "@scout-for-lol/data";`;
    return content.replace(importMatch[0], newImportStatement);
  } else {
    // Add new import after the last import statement
    const lastImportMatch = content.match(/(import[^;]+;)(?=\s*\n)/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPoint = content.indexOf(lastImport) + lastImport.length;
      const newImport = `\nimport { ${neededImports.join(", ")} } from "@scout-for-lol/data";`;
      return content.slice(0, insertPoint) + newImport + content.slice(insertPoint);
    }
  }

  return content;
}

function applyFixes(content: string): string {
  let fixed = content;

  for (const { pattern, replacement } of FIXES) {
    fixed = fixed.replace(pattern, replacement);
  }

  return fixed;
}

async function main() {
  const testFiles = await glob("src/**/*.integration.test.ts", {
    cwd: "/workspaces/scout-for-lol/packages/backend",
    absolute: true,
  });

  console.log(`Found ${testFiles.length} test files`);

  let fixedCount = 0;
  let totalChanges = 0;

  for (const file of testFiles) {
    const originalContent = readFileSync(file, "utf-8");
    let content = originalContent;

    // Apply fixes
    content = applyFixes(content);

    // Always add imports if schemas are used (even if they were already in use)
    if (content.includes("DiscordAccountIdSchema") || content.includes("DiscordGuildIdSchema") || content.includes("DiscordChannelIdSchema")) {
      content = addImports(content);
    }

    if (content !== originalContent) {
      const changes = content.length - originalContent.length;
      totalChanges += Math.abs(changes);

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would fix: ${file.replace("/workspaces/scout-for-lol/packages/backend/", "")}`);
      } else {
        writeFileSync(file, content, "utf-8");
        console.log(`✓ Fixed: ${file.replace("/workspaces/scout-for-lol/packages/backend/", "")}`);
      }
      fixedCount++;
    }
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] Would fix" : "Fixed"} ${fixedCount} files with ~${totalChanges} character changes`);
}

main().catch(console.error);
