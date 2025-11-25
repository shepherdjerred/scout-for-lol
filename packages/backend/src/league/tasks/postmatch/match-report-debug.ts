import { z } from "zod";
import type { PlayerConfigEntry, MatchId, CompletedMatch, MatchDto } from "@scout-for-lol/data";
import type { getPlayer } from "@scout-for-lol/backend/league/model/player.js";

/**
 * Log debug information about player configs
 */
export function logPlayerConfigDebugInfo(playersInMatch: PlayerConfigEntry[]): void {
  for (let i = 0; i < playersInMatch.length; i++) {
    const playerConfig = playersInMatch[i];
    if (playerConfig) {
      console.log(`[debug][generateMatchReport] playersInMatch[${i.toString()}] keys:`, Object.keys(playerConfig));
      console.log(`[debug][generateMatchReport] playersInMatch[${i.toString()}] has puuid:`, "puuid" in playerConfig);
      if ("puuid" in playerConfig) {
        console.error(
          `[debug][generateMatchReport] ⚠️  ERROR: playersInMatch[${i.toString()}] has puuid at top level!`,
          JSON.stringify(playerConfig, null, 2),
        );
      }
    }
  }
}

/**
 * Log debug information about players
 */
export function logPlayerDebugInfo(players: Awaited<ReturnType<typeof getPlayer>>[]): void {
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player) {
      console.log(`[debug][generateMatchReport] Player ${i.toString()} keys:`, Object.keys(player));
      if ("puuid" in player) {
        console.error(`[debug][generateMatchReport] ⚠️  WARNING: Player ${i.toString()} has puuid field!`, player);
      }
      if ("puuid" in player.config) {
        console.error(
          `[debug][generateMatchReport] ⚠️  WARNING: Player ${i.toString()}.config has puuid field!`,
          player.config,
        );
      }
    }
  }
}

/**
 * Log debug information about completed match players
 */
export function logCompletedMatchPlayersDebugInfo(completedMatch: CompletedMatch): void {
  for (let i = 0; i < completedMatch.players.length; i++) {
    const playerObj = completedMatch.players[i];
    if (playerObj) {
      console.log(`[debug][generateMatchReport] CompletedMatch.players[${i.toString()}] keys:`, Object.keys(playerObj));
      if ("puuid" in playerObj) {
        console.error(
          `[debug][generateMatchReport] ⚠️  ERROR: CompletedMatch.players[${i.toString()}] has puuid field!`,
          playerObj,
        );
      }
    }
  }
}

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
