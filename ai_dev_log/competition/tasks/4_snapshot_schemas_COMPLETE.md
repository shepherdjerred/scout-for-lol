# Task 4: Snapshot Schemas - ✅ COMPLETE

## Summary

Successfully implemented type-specific snapshot data schemas and a factory function using exhaustive pattern matching. The implementation provides full type safety for capturing player state at competition boundaries.

## Completed Items

### ✅ Three Snapshot Schemas Defined

1. **RankSnapshotDataSchema**
   - Fields: `soloRank?` and `flexRank?` (both optional)
   - Each rank contains: `tier`, `division`, `lp` (non-negative integer)
   - Used for: HIGHEST_RANK and MOST_RANK_CLIMB criteria

2. **GamesPlayedSnapshotDataSchema**
   - Fields: `soloGames?`, `flexGames?`, `arenaGames?`, `aramGames?` (all optional)
   - All fields are non-negative integers
   - Used for: MOST_GAMES_PLAYED criteria

3. **WinsSnapshotDataSchema**
   - Fields: `wins` (required), `games` (required), `championId?`, `queue?`
   - Wins and games are non-negative integers
   - ChampionId is positive integer when present
   - Used for: MOST_WINS_PLAYER, MOST_WINS_CHAMPION, HIGHEST_WIN_RATE criteria

### ✅ Factory Function Implemented

**`getSnapshotSchemaForCriteria()`**

- Takes: `CompetitionCriteria`
- Returns: Appropriate snapshot schema (RankSnapshotDataSchema | GamesPlayedSnapshotDataSchema | WinsSnapshotDataSchema)
- Uses `ts-pattern` with `.exhaustive()` for compile-time completeness checking
- Maps criteria types:
  - HIGHEST_RANK → RankSnapshotDataSchema
  - MOST_RANK_CLIMB → RankSnapshotDataSchema
  - MOST_GAMES_PLAYED → GamesPlayedSnapshotDataSchema
  - MOST_WINS_PLAYER → WinsSnapshotDataSchema
  - MOST_WINS_CHAMPION → WinsSnapshotDataSchema
  - HIGHEST_WIN_RATE → WinsSnapshotDataSchema

### ✅ Type Safety Features

- **Exhaustive matching**: Adding a new criteria type without updating the factory will cause a TypeScript compile error
- **Schema validation**: All snapshot data must pass Zod validation
- **Optional fields**: Properly marked based on data requirements
- **Integer constraints**: Games, wins, and LP validated as integers
- **Non-negative constraints**: No negative values allowed for counts
- **Positive championId**: When present, must be > 0

## Files Modified

### Modified

- `packages/data/src/model/competition.ts` - Added 3 snapshot schemas + factory function
- `packages/data/src/model/competition.test.ts` - Added 37 comprehensive tests

## Test Coverage

**37 new tests added** (131 total tests now):

### RankSnapshotDataSchema (9 tests)

- Valid solo rank, valid flex rank, both ranks together
- Empty object (all optional)
- Rejects: negative LP, non-integer LP, missing tier/division/LP

### GamesPlayedSnapshotDataSchema (6 tests)

- Valid games with all/some queues, empty object, zero games
- Rejects: negative games, non-integer games

### WinsSnapshotDataSchema (13 tests)

- Valid wins data with/without championId/queue
- Wins = games (100% win rate), wins = 0
- Schema allows wins > games (business logic validates later)
- Rejects: negative wins/games, non-integer, missing fields, invalid championId/queue

### Factory Function (9 tests)

- Returns correct schema for each of 6 criteria types
- Returned schemas actually work (validates data correctly)

## Verification Results

| Check         | Result                         |
| ------------- | ------------------------------ |
| **Tests**     | ✅ 131/131 pass (37 new tests) |
| **Typecheck** | ✅ Pass                        |
| **Lint**      | ✅ Pass                        |
| **Dagger CI** | ✅ Pass                        |

## Type Safety Validation

**Exhaustive matching verified**: If you comment out one of the `.with()` cases in `getSnapshotSchemaForCriteria()`, TypeScript will error with:

```
Error: Pattern matching is not exhaustive
```

This ensures all criteria types are always handled.

## Design Decisions

### Why three schemas instead of six?

Multiple criteria types share the same underlying data needs:

- **Rank criteria** (HIGHEST_RANK, MOST_RANK_CLIMB): Both need rank snapshots
- **Wins criteria** (MOST_WINS_PLAYER, MOST_WINS_CHAMPION, HIGHEST_WIN_RATE): All need wins/games data

This reduces duplication while maintaining type safety.

### Why optional fields in RankSnapshotDataSchema?

A player might only have one rank (solo or flex), not both. Optional fields allow capturing partial rank data.

### Why allow wins > games in schema?

This is a data integrity issue that should be caught at the business logic level (when creating snapshots), not at the schema level. The schema validates data types, not business rules.

## Next Steps

Task 4 is complete. Ready to proceed to:

- **Task 5**: Competition Validation (business logic)
- **Task 6**: Competition Queries (database operations)

## Notes

- All snapshot data will be stored as JSON in the `CompetitionSnapshot.snapshotData` field
- The factory function enables type-safe snapshot creation based on competition criteria
- The `.exhaustive()` pattern ensures future criteria types won't be forgotten
