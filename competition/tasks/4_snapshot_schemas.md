# Task 4: Snapshot Schemas - Factory Pattern

## Overview
Create type-specific snapshot data schemas that define what data is captured at competition boundaries. Implement a factory function that returns the correct schema based on criteria type using exhaustive pattern matching.

## Dependencies
- Task 3 (Criteria types) - uses CompetitionCriteria types

## Files to Create/Modify
- `packages/data/src/model/competition.ts` - add snapshot schemas

## Acceptance Criteria
1. Three snapshot schemas defined:
   - `RankSnapshotDataSchema` (soloRank, flexRank with tier/division/LP)
   - `GamesPlayedSnapshotDataSchema` (games per queue)
   - `WinsSnapshotDataSchema` (wins, games, optional championId/queue)
2. `getSnapshotSchemaForCriteria()` factory function implemented
3. Factory uses `ts-pattern` with `.exhaustive()` for type safety
4. All schemas properly validate their data shape
5. Optional fields correctly marked
6. LP (League Points) is a number
7. Function has correct return type for each criteria branch

## Implementation Notes
- Install `ts-pattern` if not already: `bun add ts-pattern`
- Use `.with()` to match on criteria type
- Use `.exhaustive()` to ensure all cases handled
- Rank data includes tier, division, and LP
- Games/wins are non-negative integers

## Test Cases

### Unit Tests
File: `packages/data/src/model/competition.test.ts`

1. **RankSnapshotData validation**
   - Valid solo rank data passes
   - Valid flex rank data passes
   - Both ranks together passes
   - Empty object passes (both optional)
   - Negative LP fails
   - Missing tier when rank present fails

2. **GamesPlayedSnapshotData validation**
   - Valid games data with all queues passes
   - Negative games fails
   - Non-integer games fails
   - Missing required queue field fails

3. **WinsSnapshotData validation**
   - Valid wins data passes
   - Wins without championId passes
   - Wins with championId passes
   - Negative wins fails
   - Games < wins passes validation (validation not enforced at schema level)

4. **Factory function - schema selection**
   - `HIGHEST_RANK` criteria returns RankSnapshotDataSchema
   - `MOST_RANK_CLIMB` criteria returns RankSnapshotDataSchema
   - `MOST_GAMES_PLAYED` criteria returns GamesPlayedSnapshotDataSchema
   - `MOST_WINS_PLAYER` criteria returns WinsSnapshotDataSchema
   - `MOST_WINS_CHAMPION` criteria returns WinsSnapshotDataSchema
   - `HIGHEST_WIN_RATE` criteria returns WinsSnapshotDataSchema

5. **Type safety - exhaustive matching**
   - TypeScript compile error if new criteria type added but not handled
   - (This is a compile-time test, verified by type checking)

## Example Test
```typescript
import { match } from 'ts-pattern';

describe('Snapshot schemas', () => {
  test('RankSnapshotData accepts valid rank structure', () => {
    const data = {
      soloRank: {
        tier: 'DIAMOND',
        division: 'II',
        lp: 67,
      },
    };
    const result = RankSnapshotDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  test('GamesPlayedSnapshotData requires non-negative integers', () => {
    const invalid = GamesPlayedSnapshotDataSchema.safeParse({
      soloGames: -5,
      flexGames: 10,
      arenaGames: 0,
      aramGames: 3,
    });
    expect(invalid.success).toBe(false);
  });
});

describe('getSnapshotSchemaForCriteria factory', () => {
  test('returns RankSnapshotDataSchema for HIGHEST_RANK', () => {
    const criteria: CompetitionCriteria = {
      type: 'HIGHEST_RANK',
      queue: 'SOLO',
    };
    const schema = getSnapshotSchemaForCriteria(criteria);
    expect(schema).toBe(RankSnapshotDataSchema);
  });

  test('returns GamesPlayedSnapshotDataSchema for MOST_GAMES_PLAYED', () => {
    const criteria: CompetitionCriteria = {
      type: 'MOST_GAMES_PLAYED',
      queue: 'RANKED_ANY',
    };
    const schema = getSnapshotSchemaForCriteria(criteria);
    expect(schema).toBe(GamesPlayedSnapshotDataSchema);
  });
});
```

## Validation
- Run `bun run typecheck:all` - must pass
- Run `bun test packages/data/src/model/competition.test.ts`
- Verify `.exhaustive()` catches missing patterns (remove one case, verify compile error)

