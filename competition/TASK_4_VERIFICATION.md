# Task 4: Snapshot Schemas - Correctness & Completeness Verification

## Executive Summary

**Status**: ⚠️ **CORRECT BUT INCOMPLETE** - Found 1 critical issue

Task 4 implementation is technically correct, but missing **rank calculation utilities** needed for MOST_RANK_CLIMB criteria. The schemas capture the right data, but we need helper functions to convert rank snapshots to comparable numeric values.

---

## 1. Schema Correctness ✅

### Alignment with Original Requirements

| Requirement | Implementation | Status |
|------------|----------------|--------|
| "Snapshot current state at boundaries" | START/END snapshot types defined | ✅ |
| "What rank they are" | RankSnapshotData with tier/division/LP | ✅ |
| "How many games played" | GamesPlayedSnapshotData per queue | ✅ |
| "Wins tracking" | WinsSnapshotData with wins/games | ✅ |
| "Champion-specific tracking" | championId field in WinsSnapshotData | ✅ |

### Schema-to-Criteria Mapping

| Criteria Type | Factory Returns | Data Captured | Status |
|--------------|----------------|---------------|--------|
| MOST_GAMES_PLAYED | GamesPlayedSnapshotDataSchema | Games per queue | ✅ Correct |
| HIGHEST_RANK | RankSnapshotDataSchema | Rank at snapshot time | ✅ Correct |
| MOST_RANK_CLIMB | RankSnapshotDataSchema | Rank at START and END | ✅ Correct |
| MOST_WINS_PLAYER | WinsSnapshotDataSchema | Wins/games | ✅ Correct |
| MOST_WINS_CHAMPION | WinsSnapshotDataSchema | Wins/games + championId | ✅ Correct |
| HIGHEST_WIN_RATE | WinsSnapshotDataSchema | Wins/games for calculation | ✅ Correct |

---

## 2. Critical Issue Found 🔴

### Problem: MOST_RANK_CLIMB Requires Rank Comparison

**Context**: To calculate rank climb, we need to:
1. Snapshot rank at START (e.g., Gold II 45 LP)
2. Snapshot rank at END (e.g., Platinum IV 12 LP)
3. Calculate the difference

**Current Issue**: RankSnapshotData stores:
```typescript
{
  tier: "GOLD",      // String
  division: "II",    // String
  lp: 45            // Number
}
```

But we have **no way to compare these ranks numerically**!

**Example Problem**:
- Player A: Gold II 45 LP → Platinum IV 12 LP (climbed ~200 LP crossing tier boundary)
- Player B: Gold III 0 LP → Gold II 50 LP (climbed 150 LP within same tier)

Which is bigger? We can't tell without converting to a numeric scale.

### Solution Needed

Add helper functions to `packages/data/src/model/competition.ts`:

```typescript
/**
 * Convert rank to numeric value for comparison
 * Iron IV 0 LP = 0
 * Iron IV 100 LP = 100
 * Iron III 0 LP = 100
 * ...
 * Challenger 0 LP = very high number
 */
export function rankToNumericValue(
  tier: string,
  division: string,
  lp: number
): number;

/**
 * Calculate LP difference between two ranks
 */
export function calculateRankClimb(
  startRank: RankData,
  endRank: RankData
): number;
```

This is **not blocking** for Task 4 (schemas are correct), but **required for Task 18** (criteria processors).

---

## 3. Schema Field Analysis

### RankSnapshotDataSchema

**Fields:**
- `tier: string` - Examples: "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"
- `division: string` - Examples: "IV", "III", "II", "I" (or empty for Master+)
- `lp: number` - 0-100 for most ranks, 0-∞ for Master+

**Concerns:**

1. **Unranked Players**: ❓
   - What if a player has never played ranked?
   - Solution: `soloRank` and `flexRank` are optional, so missing = unranked ✅

2. **Master+ Tiers**: ⚠️
   - Master, Grandmaster, Challenger don't have divisions
   - Should `division` be optional? Or empty string ""?
   - Current: Required field, so would need to be "" for Master+
   - **Recommendation**: Document that division is "" for Master+ tiers

3. **LP Range**: ✅
   - Validated as non-negative integer
   - No upper bound (correct for Master+ where LP can be 1000+)

4. **Tier String Format**: ⚠️
   - Not validated - any string accepted
   - **Recommendation**: Consider enum or validation in Task 5

### GamesPlayedSnapshotDataSchema

**Fields:**
- `soloGames?`, `flexGames?`, `arenaGames?`, `aramGames?` (all optional)

**Concerns:**

1. **All Optional**: ✅
   - Correct - player might not have played all queues
   - Missing field = 0 games in that queue

2. **No "All Games" Total**: ⚠️
   - For `MOST_GAMES_PLAYED` with `queue: "ALL"`, do we calculate sum?
   - Or should schema include `totalGames` field?
   - **Current**: Processors will sum (decided in Task 18) ✅
   - Storing individual queues is more flexible

3. **Normal Game Modes**: ⚠️
   - What about normal draft, blind pick, etc.?
   - **Current decision**: Competition only tracks ranked + special modes ✅
   - Non-ranked games not included (intentional)

### WinsSnapshotDataSchema

**Fields:**
- `wins: number` (required)
- `games: number` (required)
- `championId?: number` (optional)
- `queue?: CompetitionQueueType` (optional)

**Concerns:**

1. **Wins > Games**: ✅
   - Schema allows (correctly noted as business logic validation)
   - Will be validated when creating snapshots

2. **ChampionId Validation**: ✅
   - Must be positive integer when present
   - Matches Riot's champion IDs (1-900 range)

3. **Queue Type**: ✅
   - Uses CompetitionQueueType enum
   - Properly validated

4. **Win Rate Calculation**: ✅
   - `wins / games` can be calculated from this data
   - `minGames` threshold enforced at criteria level, not snapshot level

---

## 4. Factory Function Correctness

### Exhaustive Matching Verification

**Test**: Comment out the MOST_WINS_PLAYER case:

```typescript
// .with({ type: "MOST_WINS_PLAYER" }, () => WinsSnapshotDataSchema)
```

**Result**: TypeScript error ✅
```
Error: Pattern matching is not exhaustive
```

This proves the `.exhaustive()` pattern works correctly.

### Return Type Correctness

Factory returns union type:
```typescript
RankSnapshotDataSchema | GamesPlayedSnapshotDataSchema | WinsSnapshotDataSchema
```

**Concern**: ⚠️ This is a type union, not a generic

**Issue**: Callers can't know which schema is returned at compile time

**Example Problem**:
```typescript
const schema = getSnapshotSchemaForCriteria(criteria);
// TypeScript doesn't know which schema this is!
// Can't narrow the type based on criteria.type
```

**Impact**: Low - This is only used internally for validation
**Future Enhancement**: Consider discriminated return type if needed

---

## 5. Broader Feature Context

### How Snapshots Will Be Used

**Competition Lifecycle**:

1. **Competition Starts** (DRAFT → ACTIVE transition)
   - Create START snapshots for all participants
   - Use `getSnapshotSchemaForCriteria()` to validate snapshot data
   - Store as JSON in `CompetitionSnapshot.snapshotData`

2. **Competition Ends** (ACTIVE → ENDED transition)
   - Create END snapshots for all participants
   - Use same schema for validation

3. **Leaderboard Calculation** (Task 19)
   - For rank climb: Compare START vs END snapshots
   - For other criteria: Use latest match data from S3
   - Snapshots provide baseline for comparison

### Snapshot Creation Process (Task 20)

**For RankSnapshotData**:
1. Query Riot API: `/lol/league/v4/entries/by-summoner/{summonerId}`
2. Extract: tier, division, leaguePoints
3. Validate with RankSnapshotDataSchema
4. Store as JSON

**For GamesPlayedSnapshotData**:
1. Query player's match history from S3
2. Count games per queue
3. Validate with GamesPlayedSnapshotDataSchema
4. Store as JSON

**For WinsSnapshotData**:
1. Query match history (optionally filtered by champion/queue)
2. Count wins and total games
3. Validate with WinsSnapshotDataSchema
4. Store as JSON

---

## 6. Missing Functionality

### 🔴 Critical: Rank Comparison Utilities

**Status**: NOT IMPLEMENTED

**Required For**: Task 18 (Criteria Processors) - MOST_RANK_CLIMB

**Functions Needed**:

1. `rankToNumericValue(tier, division, lp)` - Convert rank to single number
2. `calculateRankClimb(startRank, endRank)` - Calculate LP difference

**Rank Value Scale** (suggested):
```
Iron IV 0 LP = 0
Iron IV 100 LP = 100
Iron III 0 LP = 100
Iron III 100 LP = 200
...
Iron I 100 LP = 400
Bronze IV 0 LP = 400
...
Gold IV 0 LP = 2400
...
Master 0 LP = 4000
Master 500 LP = 4500
```

**Recommendation**: Add these utilities to Task 4 OR create a separate task before Task 18.

### ⚠️ Minor: Unranked Handling Documentation

**Issue**: Not explicitly documented how to handle unranked players

**Current Behavior**: 
- `soloRank` and `flexRank` are optional
- Missing = player is unranked in that queue

**Recommendation**: Document this in code comments ✅ (can do now)

### ⚠️ Minor: Master+ Division Handling

**Issue**: Master, Grandmaster, Challenger don't have divisions

**Current Behavior**: division field is required but should be "" for Master+

**Recommendation**: Document this in schema comments ✅ (can do now)

---

## 7. Test Coverage Analysis

**Current Coverage**: 37 tests for snapshot schemas

**Gaps**:

1. ✅ **Positive cases**: Well covered (valid data, optional fields, edge cases)
2. ✅ **Negative cases**: Well covered (invalid types, negative values, missing fields)
3. ⚠️ **Edge cases**: Missing:
   - Master+ ranks (no division)
   - Unranked players (empty rank data)
   - Very high LP values (Master+ with 1000+ LP)

**Recommendation**: Add 3 more tests for edge cases (can do now)

---

## 8. Recommendations

### Immediate (Add to Task 4)

1. **Document unranked handling** in schema comments
2. **Document Master+ tier handling** (empty division string)
3. **Add 3 edge case tests**:
   - Master tier with no division
   - Unranked player (empty rank data)
   - High LP value (1000+)

### Before Task 18 (Criteria Processors)

4. **Add rank comparison utilities**:
   - `rankToNumericValue()` function
   - `calculateRankClimb()` function
   - Tests for rank comparison logic

### Nice to Have (Future Enhancement)

5. **Tier enum validation** - Validate tier strings against known values
6. **Generic factory return type** - Type-safe return based on criteria type

---

## 9. Final Assessment

### What's Correct ✅

- ✅ Schema design correctly captures all needed data
- ✅ Factory pattern with exhaustive matching works perfectly
- ✅ Validation logic is sound (non-negative, integers, optional fields)
- ✅ Schema-to-criteria mapping is correct
- ✅ Test coverage is comprehensive for basic cases

### What's Missing 🔴

- 🔴 **Rank comparison utilities** (critical for MOST_RANK_CLIMB)
- ⚠️ Documentation for unranked players and Master+ tiers
- ⚠️ Edge case tests (Master+, unranked, high LP)

### Verdict

**Task 4 schemas are CORRECT** but the feature is **INCOMPLETE without rank comparison utilities**.

**Recommendation**: 
- Option A: Add rank comparison utilities to Task 4 now ✅ (recommended)
- Option B: Create Task 4.5 for rank utilities before Task 18
- Option C: Note as dependency for Task 18 and handle there

Which approach would you prefer?

