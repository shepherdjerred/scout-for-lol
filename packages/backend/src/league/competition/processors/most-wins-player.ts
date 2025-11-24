import type { MostWinsPlayerCriteria, MatchDto } from "@scout-for-lol/data";
import type {
  LeaderboardEntry,
  PlayerWithAccounts,
} from "@scout-for-lol/backend/league/competition/processors/types.js";
import {
  countWinsAndGames,
  buildWinBasedLeaderboard,
} from "@scout-for-lol/backend/league/competition/processors/generic-win-counter.js";

/**
 * Process "Most Wins (Player)" criteria
 * Counts the total number of wins by each participant in the specified queue
 */
export function processMostWinsPlayer(
  matches: MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostWinsPlayerCriteria,
): LeaderboardEntry[] {
  const { wins: winCounts, games: totalGames } = countWinsAndGames(matches, participants, criteria.queue);

  return buildWinBasedLeaderboard(
    winCounts,
    totalGames,
    participants,
    (wins) => wins, // Score is just wins
    (wins, games) => ({
      wins,
      games,
      losses: games - wins,
    }),
  );
}
