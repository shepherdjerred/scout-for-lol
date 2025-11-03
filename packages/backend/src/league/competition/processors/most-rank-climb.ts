import type { MostRankClimbCriteria, Ranks } from "@scout-for-lol/data";
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
  startSnapshots: Record<number, Ranks>,
  endSnapshots: Record<number, Ranks>,
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const participant of participants) {
    const startRanks = startSnapshots[participant.id];
    const endRanks = endSnapshots[participant.id];

    // Validate that we have rank data for this participant
    // Without baseline data, we cannot calculate rank climb
    if (!startRanks) {
      throw new Error(
        `Missing start rank data for player ${participant.id.toString()} (${participant.alias}). ` +
          `Cannot calculate rank climb without baseline data.`,
      );
    }

    if (!endRanks) {
      throw new Error(
        `Missing end rank data for player ${participant.id.toString()} (${participant.alias}). ` +
          `Cannot calculate rank climb without current data.`,
      );
    }

    const startRank = criteria.queue === "SOLO" ? startRanks.solo : startRanks.flex;
    const endRank = criteria.queue === "SOLO" ? endRanks.solo : endRanks.flex;

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
