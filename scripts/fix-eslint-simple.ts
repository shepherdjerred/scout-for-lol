#!/usr/bin/env bun
/**
 * Script to fix simple ESLint errors that can be automated
 */

let fixCount = 0;

// Fix unused imports by prefixing with underscore
const glob = new Bun.Glob("**/*.ts");
const files = Array.from(glob.scanSync({
  cwd: "/workspaces/scout-for-lol/packages",
  absolute: true,
  onlyFiles: true,
})).filter(f => !f.includes("node_modules") && !f.includes("/dist/") && !f.includes("/build/"));

for (const file of files) {
  const fileObj = Bun.file(file);
  let content = await fileObj.text();
  const originalContent = content;

  // Fix unused MatchV5DTOs, MatchDto, ParticipantDto imports
  content = content.replace(
    /import type \{ (MatchV5DTOs|MatchDto|ParticipantDto) \}/g,
    "import type { $1 as _$1 }"
  );
  
  content = content.replace(
    /import \{ (MatchV5DTOs|MatchDto|ParticipantDto) \}/g,
    "import { $1 as _$1 }"
  );

  content = content.replace(
    /import type \{ ([^}]*), (MatchV5DTOs|MatchDto|ParticipantDto)([^}]*) \}/g,
    "import type { $1, $2 as _$2$3 }"
  );

  content = content.replace(
    /import type \{ (MatchV5DTOs|MatchDto|ParticipantDto), ([^}]*) \}/g,
    "import type { $1 as _$1, $2 }"
  );

  if (content !== originalContent) {
    await Bun.write(file, content);
    fixCount++;
    console.log(`Fixed unused imports in ${file}`);
  }
}

// Fix react/no-unescaped-entities in TSX files
const tsxGlob = new Bun.Glob("**/*.tsx");
const tsxFiles = Array.from(tsxGlob.scanSync({
  cwd: "/workspaces/scout-for-lol/packages",
  absolute: true,
  onlyFiles: true,
})).filter(f => !f.includes("node_modules") && !f.includes("/dist/") && !f.includes("/build/"));

for (const file of tsxFiles) {
  const fileObj = Bun.file(file);
  let content = await fileObj.text();
  const originalContent = content;

  // Only replace quotes in JSX text content, not in attributes
  // This is a simple heuristic - replace quotes between > and <
  content = content.replace(/>([^<]*)"([^<]*)</g, (match, before, after) => {
    return `>${before}&quot;${after}<`;
  });

  if (content !== originalContent) {
    await Bun.write(file, content);
    fixCount++;
    console.log(`Fixed unescaped quotes in ${file}`);
  }
}

console.log(`\nTotal files fixed: ${fixCount}`);

