/**
 * Check functions that capture output and generate GitHub Actions annotations
 *
 * These functions run the same checks as the regular check functions,
 * but capture output in a way that allows generating annotations.
 */

/* eslint-disable import/no-unresolved -- Dagger modules and internal paths are resolved at runtime by Dagger */
import type { Directory, Container } from "@dagger.io/dagger";
import { installWorkspaceDeps, getBunNodeContainer } from "@scout-for-lol/.dagger/src/base";
import {
  type CheckResult,
  parseESLintOutput,
  parseTypeScriptOutput,
  parseBunTestOutput,
  formatAllAnnotations,
  createCheckSummary,
} from "@scout-for-lol/.dagger/src/annotations";

/**
 * Run a command and capture its output, allowing the command to fail
 */
async function runAndCapture(
  container: Container,
  command: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Wrap the command to capture exit code
  const wrappedCommand = [
    "sh",
    "-c",
    `${command.join(" ")} > /tmp/stdout.txt 2> /tmp/stderr.txt; echo $? > /tmp/exitcode.txt`,
  ];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const resultContainer = container.withExec(wrappedCommand, { experimentalPrivilegedNesting: true });

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
    stdout = await resultContainer.file("/tmp/stdout.txt").contents();
  } catch {
    // File might not exist if command failed early
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
    stderr = await resultContainer.file("/tmp/stderr.txt").contents();
  } catch {
    // File might not exist if command failed early
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
    const exitCodeStr: string = await resultContainer.file("/tmp/exitcode.txt").contents();
    exitCode = parseInt(exitCodeStr.trim(), 10);
  } catch {
    exitCode = 1;
  }

  return { stdout, stderr, exitCode };
}

/**
 * Package check configuration
 */
type PackageCheckConfig = {
  name: string;
  packagePath: string;
  hasTests: boolean;
  needsPrisma: boolean;
};

const PACKAGE_CONFIGS: PackageCheckConfig[] = [
  { name: "backend", packagePath: "packages/backend", hasTests: true, needsPrisma: true },
  { name: "data", packagePath: "packages/data", hasTests: true, needsPrisma: false },
  { name: "report", packagePath: "packages/report", hasTests: true, needsPrisma: false },
  { name: "frontend", packagePath: "packages/frontend", hasTests: false, needsPrisma: false },
];

/**
 * Run ESLint with JSON output for a package
 */
async function runESLintCheck(container: Container, packagePath: string, packageName: string): Promise<CheckResult> {
  const workdir = `/workspace/${packagePath}`;

  // Run ESLint with JSON format for parsing
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const result = await runAndCapture(container.withWorkdir(workdir), ["bunx", "eslint", "src", "--format", "json"]);

  const annotations = parseESLintOutput(result.stdout);

  return {
    name: `${packageName}/eslint`,
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
    annotations,
  };
}

/**
 * Run TypeScript type check for a package
 */
async function runTypeCheck(container: Container, packagePath: string, packageName: string): Promise<CheckResult> {
  const workdir = `/workspace/${packagePath}`;

  // Run tsc with pretty=false for parseable output
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const result = await runAndCapture(container.withWorkdir(workdir), ["bunx", "tsc", "--noEmit", "--pretty", "false"]);

  const annotations = parseTypeScriptOutput(result.stdout + result.stderr);

  return {
    name: `${packageName}/typecheck`,
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
    annotations,
  };
}

/**
 * Run tests for a package
 */
async function runTestCheck(container: Container, packagePath: string, packageName: string): Promise<CheckResult> {
  const workdir = `/workspace/${packagePath}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const result = await runAndCapture(container.withWorkdir(workdir), ["bun", "test", "--bail"]);

  const annotations = parseBunTestOutput(result.stdout + result.stderr);

  return {
    name: `${packageName}/test`,
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
    annotations,
  };
}

/**
 * Run all checks for a single package and collect results
 */
async function checkPackageWithAnnotations(
  workspaceSource: Directory,
  config: PackageCheckConfig,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Set up container with dependencies
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dagger types not available at lint time
  let container: Container = installWorkspaceDeps(workspaceSource, config.needsPrisma);

  // Generate Prisma if needed
  if (config.needsPrisma) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
    container = container.withWorkdir(`/workspace/${config.packagePath}`).withExec(["bun", "run", "generate"]);
  }

  // Run checks sequentially to avoid resource contention
  const eslintResult = await runESLintCheck(container, config.packagePath, config.name);
  results.push(eslintResult);

  const typeResult = await runTypeCheck(container, config.packagePath, config.name);
  results.push(typeResult);

  if (config.hasTests) {
    const testResult = await runTestCheck(container, config.packagePath, config.name);
    results.push(testResult);
  }

  return results;
}

/**
 * Run ESLint rules tests
 */
async function checkESLintRulesWithAnnotations(workspaceSource: Directory): Promise<CheckResult> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const container = getBunNodeContainer(workspaceSource).withExec(["bun", "install", "--frozen-lockfile"]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const result = await runAndCapture(container.withWorkdir("/workspace"), ["bun", "test", "eslint-rules/"]);

  const annotations = parseBunTestOutput(result.stdout + result.stderr);

  return {
    name: "eslint-rules/test",
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
    annotations,
  };
}

/**
 * Run code duplication check
 */
async function checkDuplicationWithAnnotations(workspaceSource: Directory): Promise<CheckResult> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const container = getBunNodeContainer(workspaceSource).withExec(["bun", "install", "--frozen-lockfile"]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dagger types not available at lint time
  const result = await runAndCapture(container.withWorkdir("/workspace"), [
    "bun",
    "run",
    "scripts/check-duplication.ts",
  ]);

  // Duplication check doesn't produce line-level annotations easily
  return {
    name: "duplication-check",
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
    annotations: [],
  };
}

/**
 * Run all checks with annotations output
 *
 * This function runs all checks and outputs GitHub Actions annotations
 * for any failures, allowing inline feedback on PRs.
 */
export async function runAllChecksWithAnnotations(workspaceSource: Directory): Promise<{
  passed: boolean;
  results: CheckResult[];
  annotationsOutput: string;
  summary: string;
}> {
  const allResults: CheckResult[] = [];

  // Run package checks in parallel
  const packageResults = await Promise.all(
    PACKAGE_CONFIGS.map((config) => checkPackageWithAnnotations(workspaceSource, config)),
  );

  for (const results of packageResults) {
    allResults.push(...results);
  }

  // Run additional checks in parallel
  const [eslintRulesResult, duplicationResult] = await Promise.all([
    checkESLintRulesWithAnnotations(workspaceSource),
    checkDuplicationWithAnnotations(workspaceSource),
  ]);

  allResults.push(eslintRulesResult);
  allResults.push(duplicationResult);

  const passed = allResults.every((r) => r.passed);
  const annotationsOutput = formatAllAnnotations(allResults);
  const summary = createCheckSummary(allResults);

  return {
    passed,
    results: allResults,
    annotationsOutput,
    summary,
  };
}

/**
 * Output annotations to stdout for GitHub Actions to pick up
 */
export function outputAnnotations(results: CheckResult[]): void {
  for (const result of results) {
    if (!result.passed) {
      // Output the raw check output first (collapsed)
      console.log(`::group::${result.name} output`);
      console.log(result.output);
      console.log("::endgroup::");
    }
  }

  // Then output all annotations
  const annotationsOutput = formatAllAnnotations(results);
  if (annotationsOutput !== "") {
    console.log(annotationsOutput);
  }
}
