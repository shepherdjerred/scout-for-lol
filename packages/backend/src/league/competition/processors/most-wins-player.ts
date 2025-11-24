import type { MostWinsPlayerCriteria, MatchDto } from "@scout-for-lol/data";
import type {
  LeaderboardEntry,
  PlayerWithAccounts,
} from "@scout-for-lol/backend/league/competition/processors/types.js";
import {
  getPlayerParticipant,
  isWin,
  matchesQueue,
} from "@scout-for-lol/backend/league/competition/processors/helpers.js";

/**
 * Process "Most Wins (Player)" criteria
 * Counts the total number of wins by each participant in the specified queue
 */
export function processMostWinsPlayer(
  matches: MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostWinsPlayerCriteria,
): LeaderboardEntry[] {
  const winCounts: Record<number, number> = {};
  const totalGames: Record<number, number> = {};

  // Count wins for each player
  for (const match of matches) {
    // Filter by queue
    if (!matchesQueue(match, criteria.queue)) {
      continue;
    }

    for (const participant of participants) {
      const participantData = getPlayerParticipant(participant, match);
      if (participantData) {
        const currentWins = winCounts[participant.id] ?? 0;
        const currentGames = totalGames[participant.id] ?? 0;

        if (isWin(participantData)) {
          winCounts[participant.id] = currentWins + 1;
        }
        totalGames[participant.id] = currentGames + 1;
      }
    }
  }

  // Convert to leaderboard entries
  const entries: LeaderboardEntry[] = [];
  for (const participant of participants) {
    const wins = winCounts[participant.id] ?? 0;
    const games = totalGames[participant.id] ?? 0;

    entries.push({
      playerId: participant.id,
      playerName: participant.alias,
      score: wins,
      metadata: {
        wins,
        games,
        losses: games - wins,
      },
    });
  }

  return entries;
}
