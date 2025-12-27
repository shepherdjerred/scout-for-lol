import { runWeeklyPairingUpdate as runWeeklyPairingUpdateInternal } from "./weekly-update.ts";

/**
 * Run the weekly Common Denominator pairing update
 * Posts pairing winrates and surrender stats to Discord
 */
export async function runWeeklyPairingUpdate(): Promise<void> {
  await runWeeklyPairingUpdateInternal();
}
