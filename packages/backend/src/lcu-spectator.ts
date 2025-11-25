#!/usr/bin/env bun
/**
 * LCU Spectator Service
 *
 * Standalone service that runs on a local machine to:
 * - Connect to League of Legends client via LCU API
 * - Monitor live games for kill events
 * - Send kill announcements to Discord
 *
 * Usage:
 *   bun run src/lcu-spectator.ts
 *
 * Environment variables:
 *   DISCORD_TOKEN - Discord bot token
 *   DISCORD_CHANNEL_ID - Discord channel ID to send announcements to
 *   LCU_LOCKFILE_PATH - (Optional) Custom path to League lockfile
 *   LCU_POLL_INTERVAL_MS - (Optional) Polling interval in milliseconds (default: 2000)
 *   LCU_GUI_PORT - (Optional) Port for web GUI (default: 8080, set to 0 to disable)
 */

import "dotenv/config";
import env from "env-var";
import { SpectatorService } from "./league/lcu/spectator.js";
import { startGUIServer } from "./league/lcu/gui.js";

console.log("🎮 Starting LCU Spectator Service");

function getRequiredEnvVar(name: string): string {
  try {
    const value = env.get(name).required().asString();
    console.log(`✅ ${name}: configured`);
    return value;
  } catch (error) {
    console.error(`❌ Missing required environment variable: ${name}`);
    throw error;
  }
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  const value = env.get(name).asString();
  if (value) {
    console.log(`✅ ${name}: configured`);
    return value;
  }
  if (defaultValue) {
    console.log(`⚠️  ${name}: using default value (${defaultValue})`);
    return defaultValue;
  }
  console.log(`⚠️  ${name}: not configured`);
  return undefined;
}

// Load configuration
const config = {
  discordToken: getRequiredEnvVar("DISCORD_TOKEN"),
  discordChannelId: getRequiredEnvVar("DISCORD_CHANNEL_ID"),
  lockfilePath: getOptionalEnvVar("LCU_LOCKFILE_PATH"),
  pollIntervalMs: env.get("LCU_POLL_INTERVAL_MS").asIntPositive() ?? 2000,
};

const guiPort = env.get("LCU_GUI_PORT").asIntPositive() ?? 8080;

// Create and start spectator service
const spectator = new SpectatorService(config);

// Start GUI server if port is specified
let guiServer: Awaited<ReturnType<typeof startGUIServer>> | null = null;
if (guiPort > 0) {
  startGUIServer(spectator, guiPort)
    .then((server) => {
      guiServer = server;
    })
    .catch((error) => {
      console.warn("⚠️  Failed to start GUI server:", error);
    });
}

// Handle graceful shutdown
async function shutdown(): Promise<void> {
  console.log("🛑 Shutting down gracefully...");
  spectator.stop();
  if (guiServer) {
    await guiServer.stop();
  }
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

// Start the service
spectator
  .start()
  .then(() => {
    console.log("✅ Spectator service started successfully");
    if (guiPort > 0) {
      console.log(`🌐 Web GUI available at http://localhost:${guiPort.toString()}`);
    }
  })
  .catch((error) => {
    console.error("❌ Failed to start spectator service:", error);
    process.exit(1);
  });
