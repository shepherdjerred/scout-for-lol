#!/usr/bin/env bun
/**
 * Runs only tests relevant to the changed files using TypeScript dependency analysis
 * Usage: run-relevant-tests.ts <package-dir> <changed-files...>
 */

import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: run-relevant-tests.ts <package-dir> <changed-files...>");
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const packageDir = args[0]!;
const changedFiles = args.slice(1);

// Find relevant test files using TypeScript compiler API
const scriptDir = import.meta.dir;
const findTestsScript = join(scriptDir, "find-dependent-tests.ts");

const findResult = spawnSync("bun", [findTestsScript, packageDir, ...changedFiles], {
  encoding: "utf-8",
  maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
});

if (findResult.error) {
  console.error(`Failed to find test files: ${findResult.error.message}`);
  process.exit(1);
}

if (findResult.status !== 0) {
  console.error("Error finding test files:");
  console.error(findResult.stderr);
  process.exit(findResult.status ?? 1);
}

// Parse test files from stdout (one per line)
const testFiles = findResult.stdout
  .trim()
  .split("\n")
  .filter((line) => line.length > 0);

// Log stderr (diagnostics) from find-dependent-tests
if (findResult.stderr) {
  console.error(findResult.stderr);
}

// Check if we got any test files
if (testFiles.length === 0) {
  console.log("No test files found for changed files, skipping tests.");
  process.exit(0);
}

console.log(`Running ${String(testFiles.length)} relevant test file(s)...`);

// Resolve package directory
const repoRoot = resolve(join(scriptDir, ".."));
const absolutePackageDir = resolve(join(repoRoot, packageDir));

// Run the tests
const testResult = spawnSync("bun", ["test", ...testFiles], {
  cwd: absolutePackageDir,
  stdio: "inherit", // Pass through stdin/stdout/stderr
});

if (testResult.error) {
  console.error(`Failed to run tests: ${testResult.error.message}`);
  process.exit(1);
}

process.exit(testResult.status ?? 0);
