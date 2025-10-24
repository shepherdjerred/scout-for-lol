import type { CompetitionCriteria, LeaguePuuid, Rank } from "@scout-for-lol/data";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { match } from "ts-pattern";
import { processMostGamesPlayed } from "./most-games-played.js";
import { processHighestRank } from "./highest-rank.js";
import { processMostRankClimb } from "./most-rank-climb.js";
import { processMostWinsPlayer } from "./most-wins-player.js";
import { processMostWinsChampion } from "./most-wins-champion.js";
import { processHighestWinRate } from "./highest-win-rate.js";
import type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";

/**
 * Snapshot data that may be needed for rank-based criteria
 */
export type SnapshotData = {
  startSnapshots: Map<LeaguePuuid, { soloRank?: Rank; flexRank?: Rank }>;
  endSnapshots: Map<LeaguePuuid, { soloRank?: Rank; flexRank?: Rank }>;
  currentRanks: Map<LeaguePuuid, { soloRank?: Rank; flexRank?: Rank }>;
};

/**
 * Main dispatcher for processing competition criteria
 * Uses exhaustive pattern matching to ensure all criteria types are handled
 *
 * @param criteria - The competition criteria to process
 * @param matches - Array of match data from S3
 * @param participants - Array of participants with their accounts
 * @param snapshotData - Rank snapshot data (optional, needed for rank-based criteria)
 * @returns Array of leaderboard entries
 */
export function processCriteria(
  criteria: CompetitionCriteria,
  matches: MatchV5DTOs.MatchDto[],
  participants: PlayerWithAccounts[],
  snapshotData?: SnapshotData,
): LeaderboardEntry[] {
  return match(criteria)
    .with({ type: "MOST_GAMES_PLAYED" }, (c) => processMostGamesPlayed(matches, participants, c))
    .with({ type: "HIGHEST_RANK" }, (c) => {
      if (!snapshotData) {
        throw new Error("Snapshot data required for HIGHEST_RANK criteria");
      }
      return processHighestRank(participants, c, snapshotData.currentRanks);
    })
    .with({ type: "MOST_RANK_CLIMB" }, (c) => {
      if (!snapshotData) {
        throw new Error("Snapshot data required for MOST_RANK_CLIMB criteria");
      }
      return processMostRankClimb(participants, c, snapshotData.startSnapshots, snapshotData.endSnapshots);
    })
    .with({ type: "MOST_WINS_PLAYER" }, (c) => processMostWinsPlayer(matches, participants, c))
    .with({ type: "MOST_WINS_CHAMPION" }, (c) => processMostWinsChampion(matches, participants, c))
    .with({ type: "HIGHEST_WIN_RATE" }, (c) => processHighestWinRate(matches, participants, c))
    .exhaustive();
}

// Re-export types
export type { LeaderboardEntry, PlayerWithAccounts } from "./types.js";
