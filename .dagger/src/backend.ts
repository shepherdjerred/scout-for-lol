import { Directory, Container, Secret } from "@dagger.io/dagger";
import { installWorkspaceDeps, getBunContainer } from "@scout-for-lol/.dagger/src/base";

/**
 * Install dependencies for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The container with dependencies installed
 */
export function installBackendDeps(workspaceSource: Directory): Container {
  // Backend needs OpenSSL for Prisma
  return installWorkspaceDeps(workspaceSource, true);
}

/**
 * Update the Bun lockfile
 * @param source The source directory
 * @returns The updated lockfile
 */
export function updateLockfile(source: Directory): Directory {
  return getBunContainer()
    .withMountedDirectory("/workspace", source)
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "install"])
    .directory("/workspace/packages/backend");
}

/**
 * Run type checking, linting, and tests for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The test results
 */
export function checkBackend(workspaceSource: Directory): Container {
  return (
    installBackendDeps(workspaceSource)
      .withWorkdir("/workspace/packages/backend")
      .withExec(["bun", "run", "generate"])
      // .terminal()
      .withExec(["sh", "-c", "echo '🔍 [CI] Running TypeScript type checking for backend...'"])
      .withExec(["bun", "run", "typecheck"])
      .withExec(["sh", "-c", "echo '✅ [CI] TypeScript type checking passed!'"])
      .withExec(["sh", "-c", "echo '🔍 [CI] Running ESLint for backend...'"])
      .withExec(["bun", "run", "lint"])
      .withExec(["sh", "-c", "echo '✅ [CI] ESLint passed!'"])
      .withExec(["sh", "-c", "echo '🧪 [CI] Running tests with coverage for backend...'"])
      .withExec(["bun", "run", "test:ci"])
      .withExec(["sh", "-c", "echo '✅ [CI] All backend checks completed successfully!'"])
  );
}

/**
 * Export test coverage for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The coverage directory
 */
export function getBackendCoverage(workspaceSource: Directory): Directory {
  return checkBackend(workspaceSource).directory("/workspace/packages/backend/coverage");
}

/**
 * Export test report for the backend
 * @param workspaceSource The full workspace source directory
 * @returns The test report file
 */
export function getBackendTestReport(workspaceSource: Directory): Directory {
  return checkBackend(workspaceSource).directory("/workspace/packages/backend");
}

/**
 * Build the backend Docker image
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param gitSha The git SHA
 * @returns The built container
 */
export function buildBackendImage(workspaceSource: Directory, version: string, gitSha: string): Container {
  return installBackendDeps(workspaceSource)
    .withEnvVariable("VERSION", version)
    .withEnvVariable("GIT_SHA", gitSha)
    .withDirectory(
      "/workspace/packages/backend/prisma",
      workspaceSource.directory("packages/backend").directory("prisma"),
    )
    .withWorkdir("/workspace/packages/backend")
    .withExec(["bun", "run", "generate"])
    .withEntrypoint(["sh", "-c", "bun run src/database/migrate.ts && bun run src/index.ts"])
    .withLabel("org.opencontainers.image.title", "scout-for-lol-backend")
    .withLabel("org.opencontainers.image.description", "Scout for LoL Discord bot backend");
}

/**
 * Smoke test the backend Docker image
 * @param workspaceSource The full workspace source directory
 * @param version The version tag
 * @param gitSha The git SHA
 * @returns Test result with logs
 */
export async function smokeTestBackendImage(
  workspaceSource: Directory,
  version: string,
  gitSha: string,
): Promise<string> {
  const image = buildBackendImage(workspaceSource, version, gitSha);

  // Use a unique database name for this test run to avoid caching issues
  const testDbName = `test-${Date.now().toString()}.sqlite`;

  // Copy example.env to .env and override DATABASE_URL for clean test
  const containerWithEnv = image
    .withFile(".env", workspaceSource.directory("packages/backend").file("example.env"))
    .withEnvVariable("DATABASE_URL", `file:./${testDbName}`)
    .withEntrypoint([]); // Clear the entrypoint so we can run our own commands

  // Run the container with a timeout and capture output using combined stdout/stderr
  // Increased timeout to 60s to account for dependency installation at runtime
  const container = containerWithEnv.withExec([
    "sh",
    "-c",
    "timeout 60s bun run src/database/migrate.ts && timeout 60s bun run src/index.ts 2>&1 || true",
  ]);

  let output = "";

  try {
    output = await container.stdout();
  } catch (error) {
    // Try to get stderr if stdout fails
    try {
      output = await container.stderr();
    } catch (_stderrError) {
      return `❌ Smoke test failed: Could not capture container output. Error: ${String(error)}`;
    }
  }

  // Check for expected success patterns
  const expectedSuccessPatterns = [
    "All migrations have been successfully applied",
    "Starting registration of",
    "Logging into Discord",
  ];

  const expectedFailurePatterns = ["401: Unauthorized", "An invalid token was provided", "TokenInvalid"];

  const hasExpectedSuccess = expectedSuccessPatterns.some((pattern) => output.includes(pattern));

  const hasExpectedFailure = expectedFailurePatterns.some((pattern) => output.includes(pattern));

  if (hasExpectedSuccess && hasExpectedFailure) {
    const foundSuccess = expectedSuccessPatterns.filter((p) => output.includes(p));
    const foundFailure = expectedFailurePatterns.filter((p) => output.includes(p));

    return `✅ Smoke test passed: Container started successfully and failed as expected due to auth issues.\n\nKey success indicators found:\n${foundSuccess.map((p) => `- ${p}`).join("\n")}\n\nExpected failures found:\n${foundFailure.map((p) => `- ${p}`).join("\n")}`;
  } else if (hasExpectedSuccess && !hasExpectedFailure) {
    return `⚠️ Smoke test partial: Container started successfully but didn't fail as expected.\nOutput:\n${output}`;
  } else if (!hasExpectedSuccess && hasExpectedFailure) {
    return `❌ Smoke test failed: Container failed but didn't show expected startup success.\nOutput:\n${output}`;
  } else {
    return `❌ Smoke test failed: Container behavior doesn't match expectations.\nOutput:\n${output}`;
  }
}

type PublishBackendImageOptions = {
  workspaceSource: Directory;
  version: string;
  gitSha: string;
  registryAuth?: {
    username: string;
    password: Secret;
  };
};

/**
 * Publish the backend Docker image
 * @param options Publishing options including workspace source, version, git SHA, and optional registry auth
 * @returns The published image references
 */
export async function publishBackendImage(options: PublishBackendImageOptions): Promise<string[]> {
  let image = buildBackendImage(options.workspaceSource, options.version, options.gitSha);

  // Set up registry authentication if credentials provided
  if (options.registryAuth) {
    image = image.withRegistryAuth("ghcr.io", options.registryAuth.username, options.registryAuth.password);
  }

  const versionRef = await image.publish(`ghcr.io/shepherdjerred/scout-for-lol:${options.version}`);
  const shaRef = await image.publish(`ghcr.io/shepherdjerred/scout-for-lol:${options.gitSha}`);

  return [versionRef, shaRef];
}
