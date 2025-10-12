#!/usr/bin/env bun

import { $ } from "bun";
import { rmSync, existsSync, readdirSync, renameSync } from "fs";
import { join } from "path";

// clear the `generated` folder
try {
  rmSync("./generated", { recursive: true, force: true });
} catch {
  console.log("The 'generated' folder does not exist, skipping removal.");
}

// Run prisma generate using Bun
await $`bunx prisma generate`;

// delete package.json, package-lock.json, and node_modules (if they exist)
try {
  rmSync("package.json");
} catch {
  console.log("package.json does not exist, skipping removal.");
}

try {
  rmSync("package-lock.json");
} catch {
  console.log("package-lock.json does not exist, skipping removal.");
}

try {
  rmSync("node_modules", { recursive: true, force: true });
} catch {
  console.log("node_modules does not exist, skipping removal.");
}

// in the `generated` folder name all `.js` files to `.cjs` recursively
async function renameJsToCjs(dir: string) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isFile() && entry.name.endsWith(".js")) {
      const newPath = fullPath.replace(".js", ".cjs");
      renameSync(fullPath, newPath);

      // add "// @ts-nocheck" to the top of each file
      let content = await Bun.file(newPath).text();
      content = `// @ts-nocheck\n${content}`;

      // update any require('.js') statements to look for .cjs
      content = content.replace(/require\(['"](.+?)\.js['"]\)/g, "require('$1.cjs')");
      await Bun.write(newPath, content);
    } else if (entry.isDirectory()) {
      await renameJsToCjs(fullPath);
    }
  }
}

await renameJsToCjs("./generated");

// in the `generated` folder update `.d.ts` files to change imports and exports
async function updateDtsImportsAndExports(dir: string) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isFile() && entry.name.endsWith(".d.ts")) {
      let content = await Bun.file(fullPath).text();
      content = `// @ts-nocheck\n${content}`;
      content = content.replace(/export \* from ['"](.+?)['"]/g, (_match, p1: string) => `export * from "${p1}.d"`);
      content = content.replace(/export \* from ['"](.+?)\.js['"]/g, (_match, p1: string) => `export * from "${p1}.d"`);
      content = content.replace(
        /import (.+?) from ['"](.+?)['"]/g,
        (_match, p1: string, p2: string) => `import ${p1} from "${p2}.d"`,
      );
      content = content.replace(
        /import (.+?) from ['"](.+?)\.js['"]/g,
        (_match, p1: string, p2: string) => `import ${p1} from "${p2}.d"`,
      );
      content = content.replace(/from ['"](.+?)\.js\.d\.ts['"]/g, (_match, p1: string) => `from "${p1}.d"`);
      await Bun.write(fullPath, content);
    } else if (entry.isDirectory()) {
      await updateDtsImportsAndExports(fullPath);
    }
  }
}

await updateDtsImportsAndExports("./generated");
