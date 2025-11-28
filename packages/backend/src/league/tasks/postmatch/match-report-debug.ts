import { z } from "zod";
import type { PlayerConfigEntry, MatchId, MatchDto } from "@scout-for-lol/data";

/**
 * Log detailed error information for debugging
 */
export function logErrorDetails(
  error: unknown,
  matchId: MatchId,
  matchData: MatchDto,
  trackedPlayers: PlayerConfigEntry[],
): void {
  // Extract error details using Zod validation
  const ErrorDetailsSchema = z.object({
    name: z.string().optional(),
    message: z.string(),
    stack: z.string().optional(),
    cause: z.unknown().optional(),
  });
  const errorResult = ErrorDetailsSchema.safeParse(error);

  // Try to extract stack trace directly from error object (even if Zod validation fails)
  const StackSchema = z.string();
  let stackTrace: string | undefined;
  if (errorResult.success && errorResult.data.stack) {
    stackTrace = errorResult.data.stack;
  } else if (error && typeof error === "object" && "stack" in error) {
    const stackResult = StackSchema.safeParse(error.stack);
    if (stackResult.success) {
      stackTrace = stackResult.data;
    }
  }

  // Log basic error info
  console.error(`[generateMatchReport] ❌ Error generating match report for ${matchId}`);
  if (errorResult.success) {
    console.error(`[generateMatchReport] ❌ Error name: ${errorResult.data.name ?? "Unknown"}`);
    console.error(`[generateMatchReport] ❌ Error message: ${errorResult.data.message}`);
    if (errorResult.data.cause) {
      console.error(`[generateMatchReport] ❌ Error cause:`, errorResult.data.cause);
    }
  } else {
    console.error(`[generateMatchReport] ❌ Error (non-standard format):`, error);
  }

  // Always log stack trace if available
  if (stackTrace) {
    console.error(`[generateMatchReport] ❌ Error stack trace:\n${stackTrace}`);
  } else {
    console.error(`[generateMatchReport] ❌ No stack trace available`);
  }

  // Log match context
  console.error(`[generateMatchReport] 📊 Match context:`);
  console.error(`  - Match ID: ${matchId}`);
  console.error(`  - Queue ID: ${matchData.info.queueId.toString()}`);
  console.error(`  - Game Mode: ${matchData.info.gameMode}`);
  console.error(`  - Game Type: ${matchData.info.gameType}`);
  console.error(`  - Map ID: ${matchData.info.mapId.toString()}`);
  console.error(`  - Participants: ${matchData.info.participants.length.toString()}`);
  console.error(`  - Game Duration: ${matchData.info.gameDuration.toString()}s`);
  console.error(`  - Game Start: ${new Date(matchData.info.gameStartTimestamp).toISOString()}`);

  // Log tracked players context
  console.error(`[generateMatchReport] 👥 Tracked players context:`);
  console.error(`  - Total tracked players: ${trackedPlayers.length.toString()}`);
  console.error(`  - Tracked player aliases: ${trackedPlayers.map((p) => p.alias).join(", ")}`);
  console.error(`  - Tracked player PUUIDs: ${trackedPlayers.map((p) => p.league.leagueAccount.puuid).join(", ")}`);

  // Try to determine which step failed by checking if playersInMatch was computed
  try {
    const playersInMatch = trackedPlayers.filter((player) =>
      matchData.metadata.participants.includes(player.league.leagueAccount.puuid),
    );
    console.error(`  - Players in match: ${playersInMatch.length.toString()}`);
    console.error(`  - Players in match aliases: ${playersInMatch.map((p) => p.alias).join(", ")}`);
  } catch (contextError) {
    console.error(`  - Could not determine players in match:`, contextError);
  }

  // Log full error object as JSON for complex errors
  try {
    const errorJson = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    console.error(`[generateMatchReport] ❌ Full error JSON:\n${errorJson}`);
  } catch (jsonError) {
    console.error(`[generateMatchReport] ❌ Could not serialize error to JSON:`, jsonError);
  }
}
