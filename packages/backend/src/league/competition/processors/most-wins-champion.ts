import type { MostWinsChampionCriteria } from "@scout-for-lol/data";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";
import { getPlayerParticipant, isWin, matchesQueue } from "./helpers.js";

/**
 * Process "Most Wins (Champion)" criteria
 * Counts wins with a specific champion for each participant
 * Optionally filters by queue type
 */
export function processMostWinsChampion(
  matches: MatchV5DTOs.MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostWinsChampionCriteria,
): LeaderboardEntry[] {
  const winCounts = new Map<number, number>();
  const totalGames = new Map<number, number>();

  // Count wins with the specific champion for each player
  for (const match of matches) {
    // Filter by queue if specified
    if (criteria.queue && !matchesQueue(match, criteria.queue)) continue;

    for (const participant of participants) {
      const participantData = getPlayerParticipant(participant, match);

      if (participantData && participantData.championId === criteria.championId) {
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
        championId: criteria.championId,
        wins,
        games,
        losses: games - wins,
      },
    });
  }

  return entries;
}
