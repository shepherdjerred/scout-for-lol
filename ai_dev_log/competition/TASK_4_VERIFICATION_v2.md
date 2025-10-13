# Task 4: Snapshot Schemas - Correctness & Completeness Verification (v2)

## Executive Summary

**Status**: ⚠️ **CORRECT BUT NEEDS ALIGNMENT**

Task 4 schemas are correct, and the codebase **DOES have rank comparison utilities**! However, there's a **type mismatch** between our snapshot schema and the existing rank types.

---

## 1. Existing Rank Comparison Utilities ✅

### Found in `/packages/data/src/model/`:

**`rank.ts`:**

```typescript
export const RankSchema = z.strictObject({
  division: DivisionSchema, // numeric: 1, 2, 3, 4
  tier: TierSchema, // lowercase: "iron", "bronze", "gold"
  lp: z.number().nonnegative().max(100),
  wins: z.number().nonnegative(),
  losses: z.number().nonnegative(),
});

// Get LP difference between ranks
export function getLeaguePointsDelta(oldRank: Rank, newRank: Rank): number {
  return rankToLeaguePoints(newRank) - rankToLeaguePoints(oldRank);
}
```

**`leaguePoints.ts`:**

```typescript
// Convert rank to numeric LP value for comparison
export function rankToLeaguePoints(rank: Rank | undefined): LeaguePoints {
  if (rank === undefined) return 0;

  const divisionLp = (numberOfDivisions - rank.division) * 100;
  const tierLp = tierToLeaguePoints(rank.tier);
  return divisionLp + tierLp + rank.lp;
}
```

**Tier ordinal mapping:**

- Iron = 0 (0 LP base)
- Bronze = 1 (400 LP base)
- Silver = 2 (800 LP base)
- Gold = 3 (1200 LP base)
- Platinum = 4 (1600 LP base)
- Emerald = 5 (2000 LP base)
- Diamond = 6 (2400 LP base)
- Master = 7 (2800 LP base)
- Grandmaster = 8 (3200 LP base)
- Challenger = 9 (3600 LP base)

**Division mapping:**

- 4 = IV (0 LP offset)
- 3 = III (100 LP offset)
- 2 = II (200 LP offset)
- 1 = I (300 LP offset)

---

## 2. The Type Mismatch Issue 🔴

### Task 4 Snapshot Schema (Current):

```typescript
const RankDataSchema = z.object({
  tier: z.string(), // ❌ Any string (e.g., "GOLD", "PLATINUM")
  division: z.string(), // ❌ Any string (e.g., "II", "IV")
  lp: z.number().int().nonnegative(),
});
```

### Existing Rank Schema:

```typescript
export const RankSchema = z.strictObject({
  division: DivisionSchema, // ✅ 1 | 2 | 3 | 4
  tier: TierSchema, // ✅ "iron" | "bronze" | "gold" | ...
  lp: z.number().nonnegative().max(100),
  wins: z.number().nonnegative(),
  losses: z.number().nonnegative(),
});
```

### Problems with Current Snapshot Schema:

1. **Tier mismatch**: Snapshot uses uppercase strings ("GOLD"), existing uses lowercase enums ("gold")
2. **Division mismatch**: Snapshot uses Roman numeral strings ("II"), existing uses numeric (2)
3. **No validation**: Snapshot accepts any string for tier/division
4. **LP cap**: Snapshot allows unlimited LP, existing caps at 100 (wrong for Master+)
5. **Missing fields**: Existing schema includes wins/losses (useful for snapshots!)

---

## 3. Recommended Fix

### Option A: Use Existing Rank Schema (Recommended ✅)

**Update Task 4 snapshot to use existing types:**

```typescript
import { RankSchema } from "./rank.js";

export type RankSnapshotData = z.infer<typeof RankSnapshotDataSchema>;
export const RankSnapshotDataSchema = z.object({
  soloRank: RankSchema.optional(),
  flexRank: RankSchema.optional(),
});
```

**Benefits:**

- ✅ Reuses existing, well-tested rank types
- ✅ Automatic validation (tier must be valid, division 1-4)
- ✅ Can use `rankToLeaguePoints()` and `getLeaguePointsDelta()` directly
- ✅ Includes wins/losses (useful for additional stats!)
- ✅ Consistent with rest of codebase

**Trade-offs:**

- ⚠️ Must convert Riot API response format to existing schema
- ⚠️ LP capped at 100 (need to fix for Master+)

### Option B: Add Conversion Utilities

Keep snapshot schema as strings, add converters:

```typescript
// Convert snapshot rank to existing Rank type
function snapshotToRank(snapshot: RankData): Rank {
  return {
    tier: snapshot.tier.toLowerCase() as Tier,
    division: parseDivision(snapshot.division)!,
    lp: snapshot.lp,
    wins: 0, // placeholder
    losses: 0,
  };
}
```

**Benefits:**

- ✅ Snapshot schema mirrors Riot API format
- ✅ Flexible (can store any tier/division strings)

**Trade-offs:**

- ❌ More conversion code
- ❌ No validation at snapshot level
- ❌ Extra complexity

---

## 4. Riot API Response Format

For reference, Riot API returns:

```json
{
  "tier": "GOLD", // Uppercase
  "rank": "II", // Roman numerals
  "leaguePoints": 45,
  "wins": 120,
  "losses": 98
}
```

Our existing schema uses:

```typescript
{
  tier: "gold",             // Lowercase
  division: 2,              // Numeric
  lp: 45,
  wins: 120,
  losses: 98
}
```

**Conversion needed either way** when fetching from Riot API.

---

## 5. Master+ Tier Issue

**Current Problem**: Existing `RankSchema` has `lp: z.number().nonnegative().max(100)`

**Issue**: Master, Grandmaster, and Challenger can have LP > 100 (often 500-2000+)

**Fix Needed**: Update existing schema:

```typescript
// In rank.ts
export const RankSchema = z.strictObject({
  division: DivisionSchema,
  tier: TierSchema,
  lp: z.number().nonnegative(), // ✅ Remove .max(100)
  wins: z.number().nonnegative(),
  losses: z.number().nonnegative(),
});
```

This is a **pre-existing bug** in the codebase, not caused by Task 4.

---

## 6. Recommended Actions

### Immediate (Task 4 Completion)

1. ✅ **Update RankDataSchema to use existing Rank schema**
   - Import `RankSchema` from `./rank.js`
   - Use it directly in `RankSnapshotDataSchema`
   - Benefits: consistency, validation, reuses utilities

2. ⚠️ **Fix Master+ LP cap bug** (optional but recommended)
   - Remove `.max(100)` from `RankSchema.lp`
   - This fixes a pre-existing issue

3. ✅ **Update tests to use proper tier/division format**
   - tier: lowercase strings
   - division: numeric 1-4
   - Update 9 RankSnapshotData tests

### For Task 20 (Snapshot Creation)

4. ✅ **Use existing conversion utilities**
   - Use `parseDivision()` to convert "II" → 2
   - Use `tier.toLowerCase()` to convert "GOLD" → "gold"
   - Validate with existing `RankSchema`

### For Task 18 (Criteria Processors)

5. ✅ **Use existing rank comparison functions**
   - Use `getLeaguePointsDelta()` for MOST_RANK_CLIMB
   - Use `rankToLeaguePoints()` for HIGHEST_RANK
   - Use `wasPromoted()` / `wasDemoted()` for additional insights

---

## 7. Impact Assessment

### If We Fix Now (Recommended)

**Pros:**

- ✅ Consistent with existing codebase
- ✅ No conversion utilities needed
- ✅ Automatic validation
- ✅ Can use existing comparison functions directly
- ✅ Fixes pre-existing LP cap bug

**Cons:**

- ⚠️ Need to update 9 tests (5 minutes)
- ⚠️ Breaking change to Task 4 schema (but not used anywhere yet)

### If We Keep Current Schema

**Pros:**

- ✅ No changes needed to Task 4

**Cons:**

- ❌ Inconsistent with codebase
- ❌ Need conversion utilities in Task 20
- ❌ No validation on tier/division strings
- ❌ More complexity in Task 18

---

## 8. Final Recommendation

**Align Task 4 with existing rank types** by:

1. Import and use `RankSchema` instead of custom `RankDataSchema`
2. Fix the Master+ LP cap bug in existing `RankSchema`
3. Update 9 tests to use proper format
4. Document in Task 20 that Riot API responses need conversion

This takes ~15 minutes but ensures:

- ✅ Consistency across codebase
- ✅ Reuse of existing, tested utilities
- ✅ No need for new conversion code
- ✅ Automatic validation
- ✅ MOST_RANK_CLIMB criteria works out of the box

**Should I proceed with this fix?**
