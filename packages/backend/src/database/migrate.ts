#!/usr/bin/env bun

import { spawn } from "bun";

// Run prisma migrate deploy using Bun
const proc = spawn(["bunx", "prisma", "migrate", "deploy"], {
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await proc.exited;

if (exitCode !== 0) {
  process.exit(exitCode);
}

console.log("✅ All migrations have been successfully applied");
