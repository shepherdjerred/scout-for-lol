import { spawn } from "bun";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("migrate");

export async function runMigrations(): Promise<void> {
  logger.info("🧱 Applying Prisma migrations (prisma migrate deploy)");
  const proc = spawn(["bunx", "prisma", "migrate", "deploy"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    logger.error("❌ Prisma migrations failed");
    process.exit(exitCode);
  }

  logger.info("✅ All migrations have been successfully applied");
}
