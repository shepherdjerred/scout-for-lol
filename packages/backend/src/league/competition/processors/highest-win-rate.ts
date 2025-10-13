import type { HighestWinRateCriteria } from "@scout-for-lol/data";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";
import { getPlayerParticipant, isWin, matchesQueue } from "./helpers.js";

/**
 * Process "Highest Win Rate" criteria
 * Calculates win rate for each participant with minimum games requirement
 * Only includes players who meet the minimum games threshold
 */
export function processHighestWinRate(
  matches: MatchV5DTOs.MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: HighestWinRateCriteria,
): LeaderboardEntry[] {
  const winCounts = new Map<number, number>();
  const totalGames = new Map<number, number>();

  // Count wins and games for each player
  for (const match of matches) {
    // Filter by queue
    if (!matchesQueue(match, criteria.queue)) continue;

    for (const participant of participants) {
      const participantData = getPlayerParticipant(participant, match);
      if (participantData) {
        const currentWins = winCounts.get(participant.id) ?? 0;
        const currentGames = totalGames.get(participant.id) ?? 0;

        if (isWin(participantData)) {
          winCounts.set(participant.id, currentWins + 1);
        }
        totalGames.set(participant.id, currentGames + 1);
      }
    }
  }

  // Convert to leaderboard entries, applying minimum games filter
  const entries: LeaderboardEntry[] = [];
  // minGames has a default value of 10 in the schema
  const minGames = criteria.minGames;

  for (const participant of participants) {
    const wins = winCounts.get(participant.id) ?? 0;
    const games = totalGames.get(participant.id) ?? 0;

    // Only include if they meet the minimum games requirement
    if (games >= minGames) {
      const winRate = games > 0 ? wins / games : 0;

      entries.push({
        playerId: participant.id,
        playerName: participant.alias,
        score: winRate,
        metadata: {
          wins,
          games,
          losses: games - wins,
          winRate,
        },
      });
    }
  }

  return entries;
}
