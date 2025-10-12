# Task 3: Criteria Types - Discriminated Union

## Overview
Implement the discriminated union type system for competition criteria. This includes six different criteria types, each with their own configuration schema, all unified under a single discriminated union.

## Dependencies
- Task 2 (Core types) - uses QueueType enum

## Files to Create/Modify
- `packages/data/src/model/competition.ts` - add criteria schemas

## Acceptance Criteria
1. All six criteria schemas defined:
   - `MostGamesPlayedCriteriaSchema` (type + queue)
   - `HighestRankCriteriaSchema` (type + queue: SOLO/FLEX only)
   - `MostRankClimbCriteriaSchema` (type + queue: SOLO/FLEX only)
   - `MostWinsPlayerCriteriaSchema` (type + queue)
   - `MostWinsChampionCriteriaSchema` (type + championId + optional queue)
   - `HighestWinRateCriteriaSchema` (type + minGames + queue)
2. `CompetitionCriteriaSchema` discriminated union created
3. Union uses `type` field as discriminator
4. All schemas properly typed with Zod
5. TypeScript can narrow types based on `type` field
6. No `any` types used

## Implementation Notes
- Use `z.literal()` for the type discriminator
- Use `.extend()` to build on base criteria schema
- `z.discriminatedUnion()` requires consistent discriminator field
- Default `minGames` to 10 for win rate criteria
- ChampionId should be positive integer

## Test Cases

### Unit Tests
File: `packages/data/src/model/competition.test.ts`

1. **MostGamesPlayed validation**
   - Valid criteria with all queue types passes
   - Missing queue field fails
   - Invalid queue type fails

2. **HighestRank validation**
   - Valid criteria with SOLO queue passes
   - Valid criteria with FLEX queue passes
   - ARENA queue fails (not allowed for rank)
   - Missing queue fails

3. **MostRankClimb validation**
   - Similar to HighestRank
   - Only SOLO and FLEX allowed

4. **MostWinsPlayer validation**
   - All queue types allowed
   - Valid criteria passes

5. **MostWinsChampion validation**
   - Valid with championId and queue passes
   - Valid with championId only (no queue) passes
   - Missing championId fails
   - Negative championId fails
   - Zero championId fails

6. **HighestWinRate validation**
   - Valid criteria with minGames passes
   - Default minGames is 10
   - Negative minGames fails
   - Zero minGames fails

7. **Discriminated union parsing**
   - Parse JSON with `type: 'MOST_GAMES_PLAYED'` returns correct type
   - TypeScript narrows type correctly based on discriminator
   - Invalid type fails validation

8. **Type narrowing (compile-time check)**
   ```typescript
   const criteria = CompetitionCriteriaSchema.parse({
     type: 'MOST_WINS_CHAMPION',
     championId: 157,
   });
   
   if (criteria.type === 'MOST_WINS_CHAMPION') {
     // TypeScript should know championId exists here
     expect(criteria.championId).toBe(157);
   }
   ```

## Example Test
```typescript
describe('CompetitionCriteria discriminated union', () => {
  test('parses MOST_GAMES_PLAYED criteria', () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: 'MOST_GAMES_PLAYED',
      queue: 'SOLO',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('MOST_GAMES_PLAYED');
      expect(result.data.queue).toBe('SOLO');
    }
  });

  test('fails with invalid criteria type', () => {
    const result = CompetitionCriteriaSchema.safeParse({
      type: 'INVALID_TYPE',
      queue: 'SOLO',
    });
    expect(result.success).toBe(false);
  });

  test('HIGHEST_RANK only allows SOLO or FLEX', () => {
    const invalid = CompetitionCriteriaSchema.safeParse({
      type: 'HIGHEST_RANK',
      queue: 'ARENA',
    });
    expect(invalid.success).toBe(false);

    const valid = CompetitionCriteriaSchema.safeParse({
      type: 'HIGHEST_RANK',
      queue: 'SOLO',
    });
    expect(valid.success).toBe(true);
  });
});
```

## Validation
- Run `bun run typecheck:all` - should pass with no errors
- Run tests: `bun test packages/data/src/model/competition.test.ts`
- Verify TypeScript properly narrows types in IDE

