import type { MostRankClimbCriteria, Rank } from "@scout-for-lol/data";
import { rankToLeaguePoints } from "@scout-for-lol/data";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";

/**
 * Process "Most Rank Climb" criteria
 * Calculates LP gained between competition start and end for each participant
 *
 * Uses snapshots taken at competition start (START) and end (END)
 */
export function processMostRankClimb(
  participants: PlayerWithAccounts[],
  criteria: MostRankClimbCriteria,
  startSnapshots: Map<number, { soloRank?: Rank; flexRank?: Rank }>,
  endSnapshots: Map<number, { soloRank?: Rank; flexRank?: Rank }>,
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const participant of participants) {
    const startRanks = startSnapshots.get(participant.id);
    const endRanks = endSnapshots.get(participant.id);

    const startRank = criteria.queue === "SOLO" ? startRanks?.soloRank : startRanks?.flexRank;
    const endRank = criteria.queue === "SOLO" ? endRanks?.soloRank : endRanks?.flexRank;

    // Calculate LP delta
    const startLP = rankToLeaguePoints(startRank);
    const endLP = rankToLeaguePoints(endRank);
    const lpGained = endLP - startLP;

    entries.push({
      playerId: participant.id,
      playerName: participant.alias,
      score: lpGained,
      metadata: {
        startRank: startRank,
        endRank: endRank,
        startLP,
        endLP,
      },
    });
  }

  return entries;
}
