import type { HighestWinRateCriteria, MatchDto } from "@scout-for-lol/data";
import type {
  LeaderboardEntry,
  PlayerWithAccounts,
} from "@scout-for-lol/backend/league/competition/processors/types.js";
import {
  countWinsAndGames,
  buildWinBasedLeaderboard,
} from "@scout-for-lol/backend/league/competition/processors/generic-win-counter.js";

/**
 * Process "Highest Win Rate" criteria
 * Calculates win rate for each participant with minimum games requirement
 * Only includes players who meet the minimum games threshold
 */
export function processHighestWinRate(
  matches: MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: HighestWinRateCriteria,
): LeaderboardEntry[] {
  const { wins: winCounts, games: totalGames } = countWinsAndGames(matches, participants, criteria.queue);

  // minGames has a default value of 10 in the schema
  const minGames = criteria.minGames;

  return buildWinBasedLeaderboard(
    winCounts,
    totalGames,
    participants,
    (wins, games) => (games > 0 ? wins / games : 0), // Score is win rate
    (wins, games) => ({
      wins,
      games,
      losses: games - wins,
      winRate: games > 0 ? wins / games : 0,
    }),
    minGames, // Apply minimum games filter
  );
}
