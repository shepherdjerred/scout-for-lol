import type { MostWinsPlayerCriteria } from "@scout-for-lol/data";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";
import { getPlayerParticipant, isWin, matchesQueue } from "./helpers.js";

/**
 * Process "Most Wins (Player)" criteria
 * Counts the total number of wins by each participant in the specified queue
 */
export function processMostWinsPlayer(
  matches: MatchV5DTOs.MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostWinsPlayerCriteria,
): LeaderboardEntry[] {
  const winCounts = new Map<number, number>();
  const totalGames = new Map<number, number>();

  // Count wins for each player
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

  // Convert to leaderboard entries
  const entries: LeaderboardEntry[] = [];
  for (const participant of participants) {
    const wins = winCounts.get(participant.id) ?? 0;
    const games = totalGames.get(participant.id) ?? 0;

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
