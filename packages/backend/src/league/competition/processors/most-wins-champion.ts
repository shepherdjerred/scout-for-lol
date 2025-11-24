import type { MostWinsChampionCriteria, MatchDto } from "@scout-for-lol/data";
import type {
  LeaderboardEntry,
  PlayerWithAccounts,
} from "@scout-for-lol/backend/league/competition/processors/types.js";
import { createWinBasedProcessor } from "@scout-for-lol/backend/league/competition/processors/processor-helpers.js";

/**
 * Process "Most Wins (Champion)" criteria
 * Counts wins with a specific champion for each participant
 * Optionally filters by queue type
 */
export function processMostWinsChampion(
  matches: MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostWinsChampionCriteria,
): LeaderboardEntry[] {
  return createWinBasedProcessor({
    matches,
    participants,
    queue: criteria.queue ?? "ALL",
    participantFilter: (participantData) => participantData.championId === criteria.championId,
    scoreFn: (wins) => wins, // Score is just wins
    metadataFn: (wins, games, criteria) => ({
      championId: criteria.championId,
      wins,
      games,
      losses: games - wins,
    }),
    criteria,
  });
}
