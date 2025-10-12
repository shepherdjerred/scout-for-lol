# Task 18: Criteria Processors - Match Processing Logic

## Overview
Implement processor functions for each criteria type. These functions analyze matches and participants to calculate competition scores.

## Dependencies
- Task 3 (Criteria types)
- Task 17 (S3 match query)

## Files to Create/Modify
- `packages/backend/src/league/competition/processors/most-games-played.ts` (new file)
- `packages/backend/src/league/competition/processors/highest-rank.ts` (new file)
- `packages/backend/src/league/competition/processors/most-rank-climb.ts` (new file)
- `packages/backend/src/league/competition/processors/most-wins-player.ts` (new file)
- `packages/backend/src/league/competition/processors/most-wins-champion.ts` (new file)
- `packages/backend/src/league/competition/processors/highest-win-rate.ts` (new file)
- `packages/backend/src/league/competition/processors/index.ts` - dispatcher with ts-pattern

## Acceptance Criteria
1. All six processor functions implemented with correct signatures
2. Main dispatcher uses `ts-pattern` with `.exhaustive()`
3. Each processor returns `LeaderboardEntry[]` with:
   - playerId
   - playerName
   - score (number or rank object)
   - rank (position, calculated separately)
4. Processors handle edge cases (no matches, invalid data)
5. Queue filtering works correctly
6. Champion filtering works correctly
7. All functions properly typed

## Implementation Notes
- Use Remeda for data transformations
- Rank values need numeric conversion for comparison
- Win rate needs minimum games threshold
- Handle ties appropriately (same rank)

## Test Cases

### Unit Tests
File: `packages/backend/src/league/competition/processors/processors.test.ts`

1. **processMostGamesPlayed**
   - Matches for SOLO queue only
   - Player A: 10 solo games, 5 arena games
   - Player B: 8 solo games, 20 arena games
   - With queue=SOLO → A ranks higher
   - With queue=ARENA → B ranks higher
   - With queue=RANKED_ANY → A ranks higher (combines SOLO+FLEX)

2. **processHighestRank**
   - Player A: Diamond II
   - Player B: Platinum I
   - Player C: Diamond III
   - Ranking: A, C, B
   - Uses current rank from Riot API, not matches

3. **processMostRankClimb**
   - Uses snapshots from competition start/end
   - Player A: Start Gold IV, End Diamond IV → +400 LP equivalent
   - Player B: Start Platinum II, End Platinum I → +100 LP
   - Ranking: A, B

4. **processMostWinsPlayer**
   - Player A: 15 wins, 10 losses
   - Player B: 20 wins, 5 losses
   - Ranking by total wins: B, A

5. **processMostWinsChampion**
   - With championId=157 (Yasuo)
   - Player A: 10 Yasuo wins
   - Player B: 3 Yasuo wins, 50 other wins
   - Ranking: A, B (only Yasuo games count)

6. **processHighestWinRate**
   - With minGames=10
   - Player A: 15-5 (75%)
   - Player B: 8-2 (80%, but < 10 games)
   - Player C: 10-10 (50%)
   - Ranking: A, C (B excluded due to minGames)

7. **Dispatcher exhaustiveness**
   - All criteria types handled
   - TypeScript compile error if case missing

### Integration Tests
File: `packages/backend/src/league/competition/processors/processors.integration.test.ts`

8. **Process real match data**
   - Load actual match JSONs from fixtures
   - Run each processor
   - Verify results match expected rankings

9. **Handle empty match data**
   - No matches for date range
   - Each processor returns empty or zero-scored entries
   - No crashes

10. **Queue filtering accuracy**
    - Mixed match types (solo, flex, arena, ARAM)
    - Each queue filter returns only relevant matches
    - Counts are accurate

## Example Implementation
```typescript
import { match } from 'ts-pattern';

export type LeaderboardEntry = {
  playerId: number;
  playerName: string;
  score: number | RankValue;
  metadata?: Record<string, unknown>;
};

export function processCriteria(
  criteria: CompetitionCriteria,
  matches: MatchDto[],
  participants: PlayerWithAccounts[]
): LeaderboardEntry[] {
  return match(criteria)
    .with({ type: 'MOST_GAMES_PLAYED' }, (c) => processMostGamesPlayed(matches, participants, c))
    .with({ type: 'HIGHEST_RANK' }, (c) => processHighestRank(participants, c))
    .with({ type: 'MOST_RANK_CLIMB' }, (c) => processMostRankClimb(matches, participants, c))
    .with({ type: 'MOST_WINS_PLAYER' }, (c) => processMostWinsPlayer(matches, participants, c))
    .with({ type: 'MOST_WINS_CHAMPION' }, (c) => processMostWinsChampion(matches, participants, c))
    .with({ type: 'HIGHEST_WIN_RATE' }, (c) => processHighestWinRate(matches, participants, c))
    .exhaustive();
}

function processMostGamesPlayed(
  matches: MatchDto[],
  participants: PlayerWithAccounts[],
  criteria: MostGamesPlayedCriteria
): LeaderboardEntry[] {
  const gameCounts = new Map<number, number>();
  
  for (const match of matches) {
    // Filter by queue
    if (!matchesQueue(match, criteria.queue)) continue;
    
    for (const participant of participants) {
      if (isPlayerInMatch(participant, match)) {
        gameCounts.set(
          participant.id,
          (gameCounts.get(participant.id) ?? 0) + 1
        );
      }
    }
  }
  
  return Array.from(gameCounts.entries()).map(([playerId, count]) => {
    const player = participants.find(p => p.id === playerId)!;
    return {
      playerId,
      playerName: player.alias,
      score: count,
    };
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/league/competition/processors/`
- Test with fixture data
- Verify exhaustive matching compiles

