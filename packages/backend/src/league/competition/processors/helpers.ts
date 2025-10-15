import type { CompetitionQueueType, QueueType } from "@scout-for-lol/data";
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
  // Note: RANKED_ANY and ALL are handled by special cases above
  const queueMap: Partial<Record<CompetitionQueueType, QueueType>> = {
    SOLO: "solo",
    FLEX: "flex",
    ARENA: "arena",
    ARAM: "aram",
    URF: "urf",
    ARURF: "arurf",
    QUICKPLAY: "quickplay",
    SWIFTPLAY: "swiftplay",
    BRAWL: "brawl",
    DRAFT_PICK: "draft pick",
    CUSTOM: "custom",
  };

  const expectedQueue = queueMap[queueFilter];
  return expectedQueue !== undefined && queueType === expectedQueue;
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

/**
 * Get all participants for all tracked players in a match
 * Returns array of [player, participant] pairs for each tracked player found in the match
 */
export function getAllPlayersInMatch(
  players: PlayerWithAccounts[],
  match: MatchV5DTOs.MatchDto,
): [PlayerWithAccounts, MatchV5DTOs.ParticipantDto][] {
  const results: [PlayerWithAccounts, MatchV5DTOs.ParticipantDto][] = [];

  for (const player of players) {
    const participant = getPlayerParticipant(player, match);
    if (participant) {
      results.push([player, participant]);
    }
  }

  return results;
}
