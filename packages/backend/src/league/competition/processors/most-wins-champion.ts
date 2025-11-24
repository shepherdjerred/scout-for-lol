import type { MostWinsChampionCriteria, MatchDto } from "@scout-for-lol/data";
import type {
  LeaderboardEntry,
  PlayerWithAccounts,
} from "@scout-for-lol/backend/league/competition/processors/types.js";
import {
  countWinsAndGames,
  buildWinBasedLeaderboard,
} from "@scout-for-lol/backend/league/competition/processors/generic-win-counter.js";

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
  const { wins: winCounts, games: totalGames } = countWinsAndGames(
    matches,
    participants,
    criteria.queue ?? "ALL",
    (participantData) => participantData.championId === criteria.championId,
  );

  return buildWinBasedLeaderboard({
    winCounts,
    totalGames,
    participants,
    scoreFn: (wins) => wins, // Score is just wins
    metadataFn: (wins, games) => ({
      championId: criteria.championId,
      wins,
      games,
      losses: games - wins,
    }),
  });
}
