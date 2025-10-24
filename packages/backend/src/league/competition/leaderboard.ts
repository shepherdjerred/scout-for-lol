import type { CompetitionCriteria, CompetitionWithCriteria, Rank } from "@scout-for-lol/data";
import { getCompetitionStatus, rankToLeaguePoints, RankSchema, RegionSchema } from "@scout-for-lol/data";
import { sortBy } from "remeda";
import { match } from "ts-pattern";
import { z } from "zod";
import type { PrismaClient } from "../../../generated/prisma/client/index.js";
import { queryMatchesByDateRange } from "../../storage/s3-query.js";
import type { LeaderboardEntry, PlayerWithAccounts } from "./processors/types.js";
import { processCriteria, type SnapshotData } from "./processors/index.js";
import { getSnapshot } from "./snapshots.js";
import { api } from "../api/api.js";
import { mapRegionToEnum } from "../model/region.js";
import { getRank } from "../model/rank.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Leaderboard entry with rank assigned
 */
export type RankedLeaderboardEntry = LeaderboardEntry & {
  rank: number;
};

// ============================================================================
// Snapshot Data Fetching
// ============================================================================

/**
 * Fetch snapshot data for rank-based criteria
 * Returns null if criteria doesn't need snapshots
 *
 * IMPORTANT: Snapshot behavior differs for ACTIVE vs ENDED competitions:
 * - ENDED competitions: Use stored START/END snapshots (captured when events happened)
 * - ACTIVE competitions: Use stored START snapshot + fetch CURRENT rank from Riot API
 *
 * We NEVER reuse old snapshots to display current state. START/END snapshots are
 * only for historical comparison (e.g., MOST_RANK_CLIMB comparing start vs end).
 */
async function fetchSnapshotData(
  prisma: PrismaClient,
  competitionId: number,
  criteria: CompetitionCriteria,
  participants: PlayerWithAccounts[],
  competitionStatus: ReturnType<typeof getCompetitionStatus>,
): Promise<SnapshotData | null> {
  // Only fetch snapshots for criteria that need them
  const needsSnapshots = match(criteria)
    .with({ type: "HIGHEST_RANK" }, () => true)
    .with({ type: "MOST_RANK_CLIMB" }, () => true)
    .otherwise(() => false);

  if (!needsSnapshots) {
    return null;
  }

  console.log(`[Leaderboard] Fetching snapshot data for ${participants.length.toString()} participants`);

  const startSnapshots = new Map<number, { soloRank?: Rank; flexRank?: Rank }>();
  const endSnapshots = new Map<number, { soloRank?: Rank; flexRank?: Rank }>();
  const currentRanks = new Map<number, { soloRank?: Rank; flexRank?: Rank }>();

  // Fetch snapshots in parallel
  await Promise.all(
    participants.map(async (participant) => {
      const playerId = participant.id;

      // Helper function to fetch current rank from Riot API
      const fetchCurrentRank = async (): Promise<{ soloRank?: Rank; flexRank?: Rank }> => {
        const rankData: { soloRank?: Rank; flexRank?: Rank } = {};

        // Try each account until we get rank data
        for (const account of participant.accounts) {
          try {
            const region = RegionSchema.parse(account.region);
            const response = await api.League.byPUUID(account.puuid, mapRegionToEnum(region));

            const soloRank = getRank(response.response, "RANKED_SOLO_5x5");
            const flexRank = getRank(response.response, "RANKED_FLEX_SR");

            if (soloRank) rankData.soloRank = soloRank;
            if (flexRank) rankData.flexRank = flexRank;

            // If we got any rank data, we're done
            if (soloRank ?? flexRank) {
              break;
            }
          } catch (error) {
            console.warn(
              `[Leaderboard] Failed to fetch rank data for player ${playerId.toString()} account ${account.puuid}: ${String(error)}`,
            );
            // Continue to next account
          }
        }

        return rankData;
      };

      // For MOST_RANK_CLIMB, we need START (stored) and current/end (stored if ended, live if active)
      if (criteria.type === "MOST_RANK_CLIMB") {
        // Always get START snapshot (captured when competition began)
        const startSnapshot = await getSnapshot(prisma, competitionId, playerId, "START", criteria);

        if (startSnapshot && "soloRank" in startSnapshot) {
          const data: { soloRank?: Rank; flexRank?: Rank } = {};
          if (startSnapshot.soloRank) data.soloRank = startSnapshot.soloRank;
          if (startSnapshot.flexRank) data.flexRank = startSnapshot.flexRank;
          startSnapshots.set(playerId, data);
        }

        if (competitionStatus === "ENDED") {
          // For ended competitions, use the stored END snapshot
          const endSnapshot = await getSnapshot(prisma, competitionId, playerId, "END", criteria);
          if (endSnapshot && "soloRank" in endSnapshot) {
            const data: { soloRank?: Rank; flexRank?: Rank } = {};
            if (endSnapshot.soloRank) data.soloRank = endSnapshot.soloRank;
            if (endSnapshot.flexRank) data.flexRank = endSnapshot.flexRank;
            endSnapshots.set(playerId, data);
          }
        } else {
          // For active competitions, fetch CURRENT rank from Riot API
          const currentRankData = await fetchCurrentRank();
          if (currentRankData.soloRank ?? currentRankData.flexRank) {
            endSnapshots.set(playerId, currentRankData);
          }
        }
      }

      // For HIGHEST_RANK, we just need current rank
      if (criteria.type === "HIGHEST_RANK") {
        if (competitionStatus === "ENDED") {
          // For ended competitions, use the stored END snapshot
          const endSnapshot = await getSnapshot(prisma, competitionId, playerId, "END", criteria);
          if (endSnapshot && "soloRank" in endSnapshot) {
            const data: { soloRank?: Rank; flexRank?: Rank } = {};
            if (endSnapshot.soloRank) data.soloRank = endSnapshot.soloRank;
            if (endSnapshot.flexRank) data.flexRank = endSnapshot.flexRank;
            currentRanks.set(playerId, data);
          }
        } else {
          // For active competitions, fetch CURRENT rank from Riot API
          const currentRankData = await fetchCurrentRank();
          if (currentRankData.soloRank ?? currentRankData.flexRank) {
            currentRanks.set(playerId, currentRankData);
          }
        }
      }
    }),
  );

  console.log(
    `[Leaderboard] Fetched snapshots: ${startSnapshots.size.toString()} start, ${endSnapshots.size.toString()} end, ${currentRanks.size.toString()} current`,
  );

  return {
    startSnapshots,
    endSnapshots,
    currentRanks,
  };
}

// ============================================================================
// Ranking Logic
// ============================================================================

/**
 * Check if two scores are equal
 */
function scoresAreEqual(a: number | Rank, b: number | Rank): boolean {
  const aNumResult = z.number().safeParse(a);
  const bNumResult = z.number().safeParse(b);

  // Both are numbers
  if (aNumResult.success && bNumResult.success) {
    return aNumResult.data === bNumResult.data;
  }

  const aRankResult = RankSchema.safeParse(a);
  const bRankResult = RankSchema.safeParse(b);

  // Both are Rank objects
  if (aRankResult.success && bRankResult.success) {
    const aLP = rankToLeaguePoints(aRankResult.data);
    const bLP = rankToLeaguePoints(bRankResult.data);
    return aLP === bLP;
  }

  // Mixed types or invalid - not equal
  return false;
}

/**
 * Assign ranks to sorted leaderboard entries
 * Handles ties by giving the same rank and skipping subsequent ranks
 *
 * Example: [100, 80, 80, 60] → ranks [1, 2, 2, 4]
 */
function assignRanks(entries: LeaderboardEntry[]): RankedLeaderboardEntry[] {
  if (entries.length === 0) {
    return [];
  }

  const ranked: RankedLeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue; // Skip if undefined

    // Check for ties with previous entry
    if (i > 0) {
      const previousEntry = entries[i - 1];
      if (previousEntry && !scoresAreEqual(entry.score, previousEntry.score)) {
        // Not a tie - update rank to current position
        currentRank = i + 1;
      }
      // If it's a tie, keep the same rank
    }

    ranked.push({
      playerId: entry.playerId,
      playerName: entry.playerName,
      score: entry.score,
      ...(entry.metadata !== undefined && { metadata: entry.metadata }),
      rank: currentRank,
    });
  }

  return ranked;
}

// ============================================================================
// Main Leaderboard Calculation
// ============================================================================

/**
 * Calculate leaderboard for a competition
 *
 * Orchestrates the entire pipeline:
 * 1. Validate competition status
 * 2. Get participants
 * 3. Get participant PUUIDs
 * 4. Query matches from S3
 * 5. Fetch snapshot data if needed
 * 6. Process with appropriate criteria processor
 * 7. Sort and assign ranks
 *
 * @param prisma Prisma client instance
 * @param competition Competition with parsed criteria
 * @returns Sorted and ranked leaderboard entries
 * @throws Error if competition is in DRAFT status
 */
export async function calculateLeaderboard(
  prisma: PrismaClient,
  competition: CompetitionWithCriteria,
): Promise<RankedLeaderboardEntry[]> {
  const status = getCompetitionStatus(competition);

  console.log(`[Leaderboard] Calculating leaderboard for competition ${competition.id.toString()} (${status})`);

  // DRAFT competitions don't have a leaderboard yet
  if (status === "DRAFT") {
    throw new Error("Cannot calculate leaderboard for DRAFT competition");
  }

  // Get all JOINED participants with their player data and accounts
  const participants = await prisma.competitionParticipant.findMany({
    where: {
      competitionId: competition.id,
      status: "JOINED",
    },
    include: {
      player: {
        include: {
          accounts: true,
        },
      },
    },
  });

  if (participants.length === 0) {
    console.log("[Leaderboard] No participants found");
    return [];
  }

  // Map to PlayerWithAccounts type
  const players: PlayerWithAccounts[] = participants.map((participant) => ({
    id: participant.player.id,
    alias: participant.player.alias,
    discordId: participant.player.discordId,
    accounts: participant.player.accounts.map((account) => ({
      id: account.id,
      alias: account.alias,
      puuid: account.puuid,
      region: account.region,
    })),
  }));

  console.log(`[Leaderboard] Found ${players.length.toString()} participants`);

  // Get all PUUIDs for match querying
  const puuids = players.flatMap((p) => p.accounts.map((a) => a.puuid));

  console.log(`[Leaderboard] Querying matches for ${puuids.length.toString()} accounts`);

  // Determine date range
  // For active competitions, use current time as end date
  const startDate = competition.startDate;
  const endDate = competition.endDate ?? new Date();

  // Query matches from S3
  // If no start date (shouldn't happen for non-DRAFT), use empty results
  const matches = startDate ? await queryMatchesByDateRange(startDate, endDate, puuids) : [];

  console.log(`[Leaderboard] Found ${matches.length.toString()} matches in date range`);

  // Fetch snapshot data if needed for rank-based criteria
  const snapshotData = await fetchSnapshotData(prisma, competition.id, competition.criteria, players, status);

  // Process matches with criteria processor
  const entries = processCriteria(competition.criteria, matches, players, snapshotData ?? undefined);

  console.log(`[Leaderboard] Processed ${entries.length.toString()} leaderboard entries`);

  // Sort entries by score
  const sorted = sortBy(entries, [
    (entry) => {
      // Use a comparator that works for both numbers and Ranks
      // We'll sort by converting to a sortable value
      const numResult = z.number().safeParse(entry.score);
      if (numResult.success) {
        return numResult.data;
      }
      // For Rank, validate and use league points as the sort key
      const rankResult = RankSchema.safeParse(entry.score);
      if (rankResult.success) {
        return rankToLeaguePoints(rankResult.data);
      }
      // Fallback for invalid data
      return 0;
    },
    "desc", // Higher is better
  ]);

  // Assign ranks with tie handling
  const ranked = assignRanks(sorted);

  console.log(`[Leaderboard] ✅ Leaderboard calculated with ${ranked.length.toString()} entries`);

  return ranked;
}
