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

  // Push schema to test database
  const pushResult = Bun.spawnSync(
    ["bunx", "prisma", "db", "push", `--schema=${schemaPath}`, "--force-reset", "--accept-data-loss"],
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

  if (pushResult.exitCode !== 0) {
    console.error("db push failed with exit code:", pushResult.exitCode);
    console.error("stdout:", pushResult.stdout.toString());
    console.error("stderr:", pushResult.stderr.toString());
    throw new Error(`Prisma db push failed for ${testDbPath}`);
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
