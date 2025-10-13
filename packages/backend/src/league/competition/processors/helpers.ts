import type { CompetitionQueueType } from "@scout-for-lol/data";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { parseQueueType } from "@scout-for-lol/data";
import type { PlayerWithAccounts } from "./types.js";

/**
 * Check if a player participated in a match based on their account PUUIDs
 */
export function isPlayerInMatch(player: PlayerWithAccounts, match: MatchV5DTOs.MatchDto): boolean {
  const playerPuuids = player.accounts.map((account) => account.puuid);
  return match.metadata.participants.some((puuid) => playerPuuids.includes(puuid));
}

/**
 * Check if a match belongs to the specified queue type
 */
export function matchesQueue(match: MatchV5DTOs.MatchDto, queueFilter: CompetitionQueueType): boolean {
  const queueType = parseQueueType(match.info.queueId);

  // Handle special queue filters
  if (queueFilter === "RANKED_ANY") {
    return queueType === "solo" || queueType === "flex";
  }

  if (queueFilter === "ALL") {
    return true;
  }

  // Map CompetitionQueueType to QueueType
  const queueMap: Record<string, string> = {
    SOLO: "solo",
    FLEX: "flex",
    ARENA: "arena",
    ARAM: "aram",
  };

  const expectedQueue = queueMap[queueFilter];
  return queueType === expectedQueue;
}

/**
 * Get the participant data for a player in a match
 * Returns undefined if player not found
 */
export function getPlayerParticipant(
  player: PlayerWithAccounts,
  match: MatchV5DTOs.MatchDto,
): MatchV5DTOs.ParticipantDto | undefined {
  const playerPuuids = player.accounts.map((account) => account.puuid);
  return match.info.participants.find((participant) => playerPuuids.includes(participant.puuid));
}

/**
 * Check if a participant won the match
 */
export function isWin(participant: MatchV5DTOs.ParticipantDto): boolean {
  return participant.win;
}
