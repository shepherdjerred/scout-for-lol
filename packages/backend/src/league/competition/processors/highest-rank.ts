import type { HighestRankCriteria, Rank } from "@scout-for-lol/data";
import { rankToLeaguePoints } from "@scout-for-lol/data";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";

/**
 * Process "Highest Rank" criteria
 * Ranks participants by their current rank in the specified queue (SOLO or FLEX)
 *
 * Note: This processor requires rank data to be provided separately,
 * as ranks come from snapshots or live API calls, not from match history
 */
export function processHighestRank(
  participants: PlayerWithAccounts[],
  criteria: HighestRankCriteria,
  ranks: Map<number, { soloRank?: Rank; flexRank?: Rank }>,
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const participant of participants) {
    const playerRanks = ranks.get(participant.id);
    const rank = criteria.queue === "SOLO" ? playerRanks?.soloRank : playerRanks?.flexRank;

    if (rank) {
      entries.push({
        playerId: participant.id,
        playerName: participant.alias,
        score: rank,
        metadata: {
          leaguePoints: rankToLeaguePoints(rank),
        },
      });
    } else {
      // Player has no rank - they're unranked (Iron IV, 0 LP)
      const unrankedRank: Rank = {
        tier: "iron",
        division: 4,
        lp: 0,
        wins: 0,
        losses: 0,
      };
      entries.push({
        playerId: participant.id,
        playerName: participant.alias,
        score: unrankedRank,
        metadata: {
          leaguePoints: 0,
        },
      });
    }
  }

  return entries;
}
