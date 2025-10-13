# Task 4: Snapshot Schemas - ✅ COMPLETE (v2 - Aligned with Existing Types)

## Summary

Successfully implemented type-specific snapshot data schemas using **existing rank utilities** for maximum type safety and code reuse. The implementation aligns with existing codebase patterns and leverages battle-tested rank comparison functions.

## Completed Items

### ✅ Three Snapshot Schemas Defined

1. **RankSnapshotDataSchema** - **USES EXISTING `RankSchema`** ⭐
   - Fields: `soloRank?` and `flexRank?` (both optional)
   - Each rank contains:
     - `tier`: lowercase enum ("iron", "bronze", "gold", "platinum", etc.)
     - `division`: numeric 1-4 (4=IV, 3=III, 2=II, 1=I)
     - `lp`: non-negative integer (unlimited for Master+)
     - `wins` / `losses`: additional statistics
   - **Benefits**: Reuses existing validation and comparison utilities!
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
- Returns: Appropriate snapshot schema
- Uses `ts-pattern` with `.exhaustive()` for compile-time completeness checking
- Maps criteria types to schemas (6 cases, all covered)

### ✅ Type Safety Features

- **Exhaustive matching**: TypeScript compile error if criteria type not handled
- **Schema validation**: All snapshot data validated with Zod
- **Tier validation**: Only valid tiers accepted (iron-challenger)
- **Division validation**: Only 1-4 accepted (Roman numerals converted)
- **Existing utilities**: Can use `rankToLeaguePoints()`, `getLeaguePointsDelta()`, etc.

### ✅ Bonus: Fixed Pre-existing Bug

**Issue**: `RankSchema` had `lp: z.number().nonnegative().max(100)`

**Problem**: Master, Grandmaster, and Challenger players can have LP > 100 (often 500-2000+)

**Fix**: Removed `.max(100)` constraint

**Impact**: This was a latent bug that would have caused issues for high-elo players. Now fixed! 🎉

## Files Modified

### Modified

- `packages/data/src/model/competition.ts`
  - Import `RankSchema` from `./rank.js`
  - Use `RankSchema` in `RankSnapshotDataSchema`
  - Documented conversion requirements (Riot API → our format)
- `packages/data/src/model/rank.ts`
  - Fixed LP max(100) bug for Master+ tiers
- `packages/data/src/model/competition.test.ts`
  - Updated 10 tests to use proper format (lowercase tiers, numeric divisions)
  - Added 1 new test for Master+ tier with high LP

## Test Coverage

**38 snapshot tests** (132 total tests now):

### RankSnapshotDataSchema (10 tests) ⭐

- Valid solo/flex ranks, both together, empty object
- Rejects: negative LP, invalid tier, invalid division (0, 5)
- Rejects: missing required fields
- **NEW**: Accepts Master tier with LP > 100

### GamesPlayedSnapshotDataSchema (6 tests)

- Valid games, zero games, empty object
- Rejects: negative games, non-integer games

### WinsSnapshotDataSchema (13 tests)

- Valid wins, with/without championId/queue
- Edge cases: wins=0, wins=games, wins>games (allowed)
- Rejects: negative values, missing fields, invalid IDs

### Factory Function (9 tests)

- Returns correct schema for each criteria type
- Schemas actually validate data correctly

## Verification Results

| Check         | Result                             |
| ------------- | ---------------------------------- |
| **Tests**     | ✅ 132/132 pass (1 new test added) |
| **Typecheck** | ✅ Pass                            |
| **Lint**      | ✅ Pass                            |
| **Dagger CI** | ✅ Pass                            |

## Key Improvements Over Initial Design

### Before (Original Task 4):

```typescript
const RankDataSchema = z.object({
  tier: z.string(), // ❌ Any string
  division: z.string(), // ❌ Any string
  lp: z.number().int().nonnegative(),
});
```

**Problems**:

- No validation on tier/division values
- Would need custom comparison utilities
- Inconsistent with existing codebase
- Duplicate code

### After (Current Implementation): ✅

```typescript
import { RankSchema } from "./rank.js";

export const RankSnapshotDataSchema = z.object({
  soloRank: RankSchema.optional(), // ✅ Validated enum types
  flexRank: RankSchema.optional(),
});
```

**Benefits**:

- ✅ Tier validated: only "iron"-"challenger" accepted
- ✅ Division validated: only 1-4 accepted
- ✅ Can use existing `rankToLeaguePoints()` for comparison
- ✅ Can use existing `getLeaguePointsDelta()` for MOST_RANK_CLIMB
- ✅ Consistent with codebase patterns
- ✅ No duplicate code

## Integration with Existing Utilities

### For HIGHEST_RANK Criteria:

```typescript
import { rankToLeaguePoints } from "./leaguePoints.js";

// Compare two ranks
const player1LP = rankToLeaguePoints(player1.soloRank);
const player2LP = rankToLeaguePoints(player2.soloRank);
// Higher LP = higher rank
```

### For MOST_RANK_CLIMB Criteria:

```typescript
import { getLeaguePointsDelta } from "./rank.js";

// Calculate rank climb
const climb = getLeaguePointsDelta(startSnapshot.soloRank, endSnapshot.soloRank);
// Positive = climbed, negative = dropped
```

### For Riot API Conversion (Task 20):

```typescript
import { parseDivision } from "./division.js";

// Convert Riot API response
const riotRank = {
  tier: "GOLD", // uppercase
  rank: "II", // Roman numeral
  leaguePoints: 45,
  wins: 50,
  losses: 45,
};

// Convert to our format
const ourRank = {
  tier: riotRank.tier.toLowerCase(), // "gold"
  division: parseDivision(riotRank.rank)!, // 2
  lp: riotRank.leaguePoints,
  wins: riotRank.wins,
  losses: riotRank.losses,
};

// Validate with schema
const validated = RankSchema.parse(ourRank); // ✅
```

## Design Decisions

### Why use existing RankSchema?

1. **Type safety**: Automatic validation of tier/division values
2. **Code reuse**: Leverage existing, tested comparison utilities
3. **Consistency**: Matches patterns used throughout codebase
4. **No duplication**: Don't reinvent rank comparison logic
5. **Battle-tested**: Existing utilities already used in production

### Database Storage Pattern

**In Database** (JSON string):

```json
{
  "soloRank": {
    "tier": "gold",
    "division": 2,
    "lp": 45,
    "wins": 50,
    "losses": 45
  }
}
```

**In Application** (parsed object):

```typescript
const snapshot = RankSnapshotDataSchema.parse(JSON.parse(dbData));
// Now strongly typed with Rank type!
```

### Conversion Requirements

**Riot API → Our Schema**:

- `tier`: uppercase → lowercase
- `rank`: Roman numeral → numeric division
- `leaguePoints` → `lp`

This conversion is straightforward and needed regardless of schema design.

## Next Steps

Task 4 is complete. Ready to proceed to:

- **Task 5**: Competition Validation (business logic)
- **Task 6**: Competition Queries (database operations)

## Notes

- All snapshot data stored as JSON in `CompetitionSnapshot.snapshotData` field
- When loading from DB, parse JSON and validate with schema
- For MOST_RANK_CLIMB, use `getLeaguePointsDelta(startRank, endRank)`
- For HIGHEST_RANK, use `rankToLeaguePoints(rank)` to get comparable value
- Riot API conversion needed in Task 20 (snapshot creation)
- Fixed pre-existing Master+ LP cap bug as bonus! 🎉
