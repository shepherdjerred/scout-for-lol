import type { ChatInputCommandInteraction } from "discord.js";
import { runWeeklyPairingUpdate } from "@scout-for-lol/backend/league/tasks/pairing/index.ts";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("debug-force-pairing-update");

export async function executeDebugForcePairingUpdate(interaction: ChatInputCommandInteraction) {
  logger.info("🐛 Executing debug force-pairing-update command");

  // Defer reply since this might take time
  await interaction.deferReply({ ephemeral: true });

  try {
    logger.info("📊 Running weekly pairing update (Common Denominator)");

    await runWeeklyPairingUpdate();

    await interaction.editReply("✅ Weekly pairing update (Common Denominator) completed successfully");

    logger.info("✅ Successfully ran weekly pairing update");
  } catch (error) {
    logger.error("❌ Error running pairing update:", error);
    await interaction.editReply(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
