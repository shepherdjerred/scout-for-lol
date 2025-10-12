# Task 5: Competition Validation - Correctness & Completeness Verification

## Executive Summary

**Status**: ⚠️ **CORRECT BUT INCOMPLETE** - Found 3 issues

Task 5 implementation is technically correct with excellent type safety, but **missing critical validations** that will cause problems in later tasks.

---

## 1. What's Correct ✅

### Type Safety Excellence

- ✅ **Discriminated union** enforces XOR at compile time
- ✅ **Zod refinements** validate date ordering and duration
- ✅ **No `any` types** - fully typed throughout
- ✅ **Async database checks** properly integrated
- ✅ **25 comprehensive unit tests** all passing

### Validation Logic

- ✅ **Date ordering** - startDate must be < endDate
- ✅ **Duration limit** - max 90 days enforced
- ✅ **Owner limit** - 1 active competition per owner
- ✅ **Server limit** - 5 active competitions per server
- ✅ **isCompetitionActive()** correctly identifies active competitions

---

## 2. Critical Issues Found 🔴

### Issue 1: Missing Criteria Validation ❌

**Problem**: No validation that `criteriaConfig` JSON matches the `criteriaType`.

**Example of what's currently allowed:**

```typescript
{
  criteriaType: "MOST_WINS_CHAMPION", // Says champion-specific
  criteriaConfig: JSON.stringify({
    queue: "SOLO"  // ❌ Missing required championId!
  })
}
```

**Impact**:

- Task 9 (Command Create) will fail at runtime when trying to parse criteriaConfig
- Database will contain invalid data
- Leaderboard calculation (Task 19) will crash

**Fix Needed**:

```typescript
// In CompetitionCreationSchema, add:
criteriaType: z.string(),
criteriaConfig: z.string(), // JSON string
}).refine((data) => {
  // Parse and validate criteriaConfig matches criteriaType
  const config = JSON.parse(data.criteriaConfig);
  const criteria = { type: data.criteriaType, ...config };
  return CompetitionCriteriaSchema.safeParse(criteria).success;
}, {
  message: "criteriaConfig must match the criteriaType schema"
})
```

---

### Issue 2: Missing Visibility Validation ❌

**Problem**: No validation for `visibility` field or participant limits.

**What's missing:**

- `visibility` must be one of: OPEN, INVITE_ONLY, SERVER_WIDE
- `maxParticipants` must be validated (min 2, max 100?)
- SERVER_WIDE visibility might need special permission check

**Impact**:

- Invalid visibility values stored in database
- Commands will crash when trying to check visibility
- No protection against unreasonable participant limits (e.g., 0 or 10,000)

**Fix Needed**:

```typescript
import { CompetitionVisibilitySchema } from "@scout-for-lol/data";

export const CompetitionCreationSchema = z.object({
  // ... existing fields
  visibility: CompetitionVisibilitySchema,
  maxParticipants: z.number().int().min(2).max(100).default(50),
})
```

---

### Issue 3: Missing Title/Description Validation ❌

**Problem**: No validation for title and description fields.

**What's missing:**

- Title: min/max length, no empty strings
- Description: min/max length, no empty strings
- Sanitization for special characters?

**Impact**:

- Empty titles/descriptions stored in database
- Extremely long titles break Discord embeds (256 char limit)
- Extremely long descriptions break Discord embeds (4096 char limit)

**Fix Needed**:

```typescript
export const CompetitionCreationSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
  // ... other fields
})
```

---

## 3. Alignment with Broader Feature ✅⚠️

### Requirements Coverage

| Requirement | Validated? | Notes |
|------------|-----------|-------|
| **"One active competition per owner"** | ✅ YES | validateOwnerLimit() |
| **"Max 5 per server"** | ✅ YES | validateServerLimit() |
| **"Fixed dates OR season"** | ✅ YES | Discriminated union |
| **"Duration limit (90 days)"** | ✅ YES | Zod refinement |
| **"Start < End dates"** | ✅ YES | Zod refinement |
| **"Criteria type validation"** | ❌ NO | **Missing!** |
| **"Visibility validation"** | ❌ NO | **Missing!** |
| **"Title/description limits"** | ❌ NO | **Missing!** |
| **"Max participants"** | ❌ NO | **Missing!** |
| **"Channel exists"** | ❌ NO | **Missing!** (Discord validation) |

**Summary**: 5/10 requirements validated ❌

---

## 4. Integration with Other Tasks 🔗

### Task 6 (Competition Queries) Dependencies

- ✅ **Will work** - CompetitionCreationInput type is correct
- ⚠️ **But** - Invalid data will pass validation and be stored

### Task 9 (Command Create) Dependencies

- ❌ **Will fail** - Command expects to parse criteriaConfig JSON safely
- ❌ **Will fail** - Command expects visibility to be validated
- ❌ **Will fail** - Command expects title/description limits enforced

### Task 18 (Criteria Processors) Dependencies

- ❌ **Will crash** - Processors expect criteriaConfig to be valid for the criteria type
- Example: `MOST_WINS_CHAMPION` processor expects `championId` to exist

### Task 19 (Leaderboard Calculation) Dependencies

- ❌ **Will crash** - Cannot calculate leaderboard if criteriaConfig is invalid

---

## 5. Missing Edge Cases

### 5.1 Start Date in the Past

**Current behavior**: Allowed ✅
**Is this correct?** Maybe not - should we allow competitions that start in the past?

**Consideration**: If `startDate < now`, competition is immediately ACTIVE. Is this intended?

### 5.2 End Date Too Close to Start

**Current behavior**: 1 second duration allowed ✅
**Is this correct?** Probably not - competitions should have minimum duration (1 hour? 1 day?)

**Fix needed**:

```typescript
.refine((data) => {
  const durationMs = data.endDate.getTime() - data.startDate.getTime();
  const minDurationMs = 1 * 60 * 60 * 1000; // 1 hour
  return durationMs >= minDurationMs;
}, {
  message: "Competition must last at least 1 hour"
})
```

### 5.3 ChannelId Validation

**Current behavior**: No validation ❌
**Should validate**:

- Channel exists in Discord server
- Bot has permission to post in channel
- Channel is text channel (not voice/category)

**This is Discord-specific and should be in command layer, not validation layer**

---

## 6. Type Safety Issues

### 6.1 Prisma Client Type

```typescript
export async function validateOwnerLimit(
  prisma: PrismaClient,  // ✅ Correct type
  serverId: string,
  ownerId: string
): Promise<void>
```

✅ Correct - uses generated Prisma type

### 6.2 CompetitionCreationInput

```typescript
export type CompetitionCreationInput = z.infer<
  typeof CompetitionCreationSchema
>;
```

✅ Correct - derived from Zod schema

### 6.3 Missing Exports

⚠️ **Potential issue**: `CompetitionDatesSchema` is exported but individual schemas (`FixedDateCompetitionSchema`, `SeasonCompetitionSchema`) are not.

**Is this correct?** YES - internal implementation details should not be exported.

---

## 7. Test Coverage Analysis

### What's Tested ✅

- XOR constraint (fixed dates OR season)
- Date ordering
- Duration limits
- isCompetitionActive() helper

### What's NOT Tested ❌

- Owner limit database validation
- Server limit database validation
- Integration with actual Prisma client
- Invalid criteriaConfig parsing
- Visibility validation
- Title/description validation

---

## 8. Recommended Fixes

### Priority 1: Critical (Blocks Feature)

1. ✅ Add `criteriaConfig` validation against `CompetitionCriteriaSchema`
2. ✅ Add `visibility` validation
3. ✅ Add `title`/`description` length limits
4. ✅ Add `maxParticipants` validation

### Priority 2: Important (Quality of Life)

5. ⚠️ Add minimum duration check (1 hour?)
6. ⚠️ Add check for start date not too far in past?
7. ⚠️ Add integration tests for database limits

### Priority 3: Nice to Have

8. ⚠️ Add `channelId` format validation (Discord snowflake)
9. ⚠️ Add `serverId`/`ownerId` format validation (Discord snowflake)

---

## 9. Conclusion

### Current State

Task 5 is **architecturally excellent** with great type safety principles, but **functionally incomplete** for the broader feature.

### What Works

- ✅ Type-safe discriminated union
- ✅ Date/duration validation
- ✅ Database limit checks
- ✅ Clean, testable code

### What's Missing (Critical)

- ❌ Criteria config validation
- ❌ Visibility validation
- ❌ Title/description limits
- ❌ Participant limits

### Impact if Not Fixed

Tasks 6-24 will encounter runtime errors and store invalid data in the database. The feature will appear to work but crash during actual usage.

### Recommendation

**Fix Priority 1 items before proceeding to Task 6.**

---

## 10. Proposed Complete Schema

```typescript
import { CompetitionCriteriaSchema, CompetitionVisibilitySchema } from "@scout-for-lol/data";

export const CompetitionCreationSchema = z.object({
  // Identity
  serverId: z.string().regex(/^\d{17,19}$/), // Discord snowflake
  ownerId: z.string().regex(/^\d{17,19}$/),  // Discord snowflake
  channelId: z.string().regex(/^\d{17,19}$/), // Discord snowflake

  // Content
  title: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),

  // Configuration
  visibility: CompetitionVisibilitySchema,
  maxParticipants: z.number().int().min(2).max(100).default(50),

  // Dates (discriminated union)
  dates: CompetitionDatesSchema,

  // Criteria
  criteriaType: z.string(),
  criteriaConfig: z.string(), // JSON string
}).refine((data) => {
  // Validate criteriaConfig matches criteriaType
  try {
    const config = JSON.parse(data.criteriaConfig);
    const criteria = { type: data.criteriaType, ...config };
    return CompetitionCriteriaSchema.safeParse(criteria).success;
  } catch {
    return false;
  }
}, {
  message: "criteriaConfig must be valid JSON matching the criteriaType schema",
  path: ["criteriaConfig"],
});
```

This ensures **ALL invalid states are caught at validation time**, not at runtime.
