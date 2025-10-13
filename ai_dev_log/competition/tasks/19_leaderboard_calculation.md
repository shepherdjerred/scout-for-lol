# Task 19: Leaderboard Calculation - Ranking Logic

## Overview

Implement the main leaderboard calculation logic that orchestrates S3 queries, criteria processing, snapshot comparison, and final ranking.

## Dependencies

- Task 17 (S3 match query)
- Task 18 (Criteria processors)
- Task 20 (Snapshot system)

## Files to Create/Modify

- `packages/backend/src/league/competition/leaderboard.ts` (new file)

## Acceptance Criteria

1. `calculateLeaderboard()` function implemented:
   - Input: Competition
   - Output: Ranked LeaderboardEntry[]
2. Orchestrates entire pipeline:
   - Get participants
   - Get participant PUUIDs
   - Query matches from S3
   - Process with appropriate criteria processor
   - Sort and assign ranks
   - Handle ties correctly
3. Handles snapshot-based criteria (rank climb)
4. Caches results for performance (optional)
5. Returns sorted, ranked leaderboard ready for display

## Implementation Notes

- Use Remeda's `sortBy` and `groupBy` for sorting/ranking
- Ties get same rank (e.g., two people at rank 2, next is rank 4)
- For descending scores (higher is better), sort desc
- For rank-based (lower is better like HIGHEST_RANK), special handling

## Test Cases

### Unit Tests

File: `packages/backend/src/league/competition/leaderboard.test.ts`

1. **Ranking with no ties**
   - Entries: [100, 80, 60]
   - Ranks: [1, 2, 3]

2. **Ranking with ties**
   - Entries: [100, 80, 80, 60]
   - Ranks: [1, 2, 2, 4] (skip rank 3)

3. **Ranking descending (scores)**
   - Higher score = better
   - Sort descending by score

4. **Ranking ascending (rank values)**
   - Lower rank = better (Diamond > Platinum)
   - Special comparison logic

### Integration Tests

File: `packages/backend/src/league/competition/leaderboard.integration.test.ts`

5. **Calculate leaderboard - MOST_GAMES_PLAYED**
   - Create competition
   - Add participants
   - Upload match data to S3
   - Calculate leaderboard → correct rankings

6. **Calculate leaderboard - HIGHEST_RANK**
   - Create competition with rank criteria
   - Mock Riot API rank responses
   - Calculate leaderboard → ranks sorted correctly

7. **Calculate leaderboard - no matches**
   - Active competition
   - No matches in date range
   - Returns all participants with score 0

8. **Calculate leaderboard - DRAFT status**
   - Competition not started
   - Returns empty or throws error appropriately

9. **Snapshot-based calculation**
   - MOST_RANK_CLIMB criteria
   - Uses START snapshot for baseline
   - Calculates climb from snapshot to current

10. **Performance with many participants**
    - 50 participants, 1000+ matches
    - Calculates in reasonable time (< 5 seconds)
    - Memory usage acceptable

## Example Implementation

```typescript
import { sortBy } from "remeda";

export type RankedLeaderboardEntry = LeaderboardEntry & {
  rank: number;
};

export async function calculateLeaderboard(competition: CompetitionWithCriteria): Promise<RankedLeaderboardEntry[]> {
  const status = getCompetitionStatus(competition);

  if (status === "DRAFT") {
    throw new Error("Cannot calculate leaderboard for DRAFT competition");
  }

  // Get participants
  const participants = await getParticipants(competition.id, "JOINED");

  if (participants.length === 0) {
    return [];
  }

  // Get participant PUUIDs
  const puuids = participants.flatMap((p) => p.player.accounts.map((a) => a.puuid));

  // Query matches
  const matches = await queryMatchesByDateRange(competition.startDate!, competition.endDate ?? new Date(), puuids);

  // Process with criteria
  const entries = processCriteria(
    competition.criteria,
    matches,
    participants.map((p) => p.player),
  );

  // Sort and rank
  const sorted = sortBy(entries, [
    (e) => e.score,
    "desc", // Assuming higher is better; reverse for rank-based
  ]);

  return assignRanks(sorted);
}

function assignRanks(entries: LeaderboardEntry[]): RankedLeaderboardEntry[] {
  const ranked: RankedLeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check for ties
    if (i > 0 && entry.score !== entries[i - 1].score) {
      currentRank = i + 1;
    }

    ranked.push({
      ...entry,
      rank: currentRank,
    });
  }

  return ranked;
}
```

## Validation

- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/league/competition/leaderboard.test.ts`
- Integration test with real data
- Verify performance with large datasets
