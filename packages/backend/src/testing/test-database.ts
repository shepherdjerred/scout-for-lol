import { PrismaClient } from "@scout-for-lol/backend/generated/prisma/client/index.js";

/**
 * Creates an isolated test database and returns a PrismaClient instance configured to use it.
 *
 * @param testName - A unique name for this test suite (used in the temp directory name)
 * @returns An object containing the PrismaClient instance and the database path
 */
export function createTestDatabase(testName: string): {
  prisma: PrismaClient;
  dbPath: string;
  dbUrl: string;
} {
  // Create a unique test directory
  const testDir = `${Bun.env["TMPDIR"] ?? "/tmp"}/${testName}-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`;
  Bun.spawnSync(["mkdir", "-p", testDir], { stdio: ["ignore", "ignore", "ignore"] });
  const testDbPath = `${testDir}/test.db`;
  const testDbUrl = `file:${testDbPath}`;

  // Determine schema path relative to the backend package root
  // This works from any test file location
  const schemaPath = `${import.meta.dir}/../../prisma/schema.prisma`;

  // Push schema to test database with retry logic
  // Bun can sometimes crash with a segfault when running prisma db push
  // Adding retry logic makes tests more resilient to this transient failure
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const pushResult = Bun.spawnSync(
      [
        "bunx",
        "prisma",
        "db",
        "push",
        `--schema=${schemaPath}`,
        "--force-reset",
        "--accept-data-loss",
        "--skip-generate",
      ],
      {
        cwd: `${import.meta.dir}/../..`,
        env: {
          ...Bun.env,
          DATABASE_URL: testDbUrl,
          PRISMA_GENERATE_SKIP_AUTOINSTALL: "true",
          PRISMA_SKIP_POSTINSTALL_GENERATE: "true",
          // Consent for Prisma's AI detection (safe for test databases in /tmp)
          PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
        },
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore",
      },
    );

    if (pushResult.exitCode === 0) {
      // Success, break out of retry loop
      lastError = null;
      break;
    }

    const stderr = pushResult.stderr.toString();
    // When Bun crashes with a segfault, stderr contains these messages
    const isBunCrash = stderr.includes("Bun has crashed") || stderr.includes("Segmentation fault");

    if (isBunCrash && attempt < maxRetries) {
      // Bun crash detected, retry with exponential backoff
      const delayMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      console.warn(`db push attempt ${String(attempt)} failed due to Bun crash, retrying in ${String(delayMs)}ms...`);
      Bun.sleepSync(delayMs);
      continue;
    }

    // Non-retryable error or final attempt failed
    console.error("db push failed with exit code:", pushResult.exitCode);
    console.error("stdout:", pushResult.stdout.toString());
    console.error("stderr:", stderr);
    lastError = new Error(`Prisma db push failed for ${testDbPath}`);
  }

  if (lastError) {
    throw lastError;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  return {
    prisma,
    dbPath: testDbPath,
    dbUrl: testDbUrl,
  };
}

/**
 * Helper function to safely delete from tables that might not exist.
 * Useful in beforeEach/afterEach hooks for cleanup.
 *
 * @param fn - A function that returns a Promise (e.g., prisma.table.deleteMany())
 */
export async function deleteIfExists(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch {
    // Table might not exist, ignore
  }
}
