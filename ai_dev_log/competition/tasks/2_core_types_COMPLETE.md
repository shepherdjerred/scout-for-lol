# Task 2: Core Types - ✅ COMPLETE

## Summary

Successfully created foundational Zod schemas and TypeScript types for the competition system in the shared `packages/data` package. All types use proper branding, validation, and exhaustive pattern matching.

## Completed Items

### ✅ Branded Types Created

- `CompetitionId` - Branded positive integer ID
- `ParticipantId` - Branded positive integer ID
- Both prevent type confusion and ensure only valid IDs are used

### ✅ Enums Defined (with Zod validation)

- `CompetitionVisibility` - OPEN, INVITE_ONLY, SERVER_WIDE
- `ParticipantStatus` - INVITED, JOINED, LEFT
- `SnapshotType` - START, END
- `PermissionType` - CREATE_COMPETITION
- `CompetitionQueueType` - SOLO, FLEX, RANKED_ANY, ARENA, ARAM, ALL

**Note**: Renamed from `QueueType` to `CompetitionQueueType` to avoid conflict with existing `QueueType` in `state.ts` which uses lowercase values.

### ✅ Competition Status Calculation

- `CompetitionStatus` type - DRAFT, ACTIVE, ENDED, CANCELLED
- `getCompetitionStatus()` pure function with comprehensive logic:
  1. Cancellation overrides everything
  2. Ended if endDate is in past
  3. Draft if startDate is in future
  4. Active if between startDate and endDate
  5. Draft if only seasonId is set
  6. Throws error for invalid state (no dates and no seasonId)

### ✅ Helper Functions

- `competitionQueueTypeToString()` - Human-readable queue names
- `visibilityToString()` - Human-readable visibility names
- `participantStatusToString()` - Human-readable status names
- All use `ts-pattern` with `.exhaustive()` for type safety

### ✅ Comprehensive Testing

- **56 tests** covering all functionality
- Branded type validation (positive/negative/zero/float/string)
- Enum validation (valid/invalid values)
- Status calculation with all edge cases
- Helper function output formatting
- All tests pass ✅

### ✅ Code Quality

- ✅ No `any` types used
- ✅ All schemas have proper Zod validation
- ✅ Exhaustive pattern matching with `ts-pattern`
- ✅ Pure functions with no side effects
- ✅ Type checking passes
- ✅ Linting passes
- ✅ Dagger CI passes
- ✅ Code formatted

## Files Modified/Created

### Modified

- `packages/data/src/model/index.ts` - Added export for competition types

### Created

- `packages/data/src/model/competition.ts` - Core types and functions (154 lines)
- `packages/data/src/model/competition.test.ts` - Comprehensive tests (395 lines, 56 tests)

## Test Coverage

### Branded Types (9 tests)

- ✅ CompetitionId: positive, large, negative, zero, float, string validation
- ✅ ParticipantId: positive, negative, zero validation

### Enums (20 tests)

- ✅ CompetitionVisibility: OPEN, INVITE_ONLY, SERVER_WIDE, invalid, lowercase
- ✅ ParticipantStatus: INVITED, JOINED, LEFT, invalid
- ✅ SnapshotType: START, END, invalid
- ✅ PermissionType: CREATE_COMPETITION, invalid
- ✅ CompetitionQueueType: SOLO, FLEX, RANKED_ANY, ARENA, ARAM, ALL, invalid

### Status Calculation (13 tests)

- ✅ CANCELLED: with future/past/current dates, with seasonId
- ✅ DRAFT: future startDate, seasonId only, edge cases
- ✅ ACTIVE: between dates, just started
- ✅ ENDED: past endDate, just ended, exactly now
- ✅ Error cases: no dates and no seasonId, descriptive error message

### Helper Functions (14 tests)

- ✅ competitionQueueTypeToString: all 6 queue types
- ✅ visibilityToString: all 3 visibility types
- ✅ participantStatusToString: all 3 status types

## Design Decisions

### 1. Branded Types

Used `.brand()` for IDs to prevent mixing different ID types at compile time. This catches bugs where you might accidentally pass a CompetitionId where a ParticipantId is expected.

### 2. Status as Calculated Field

Status is NOT stored in the database - it's calculated from `isCancelled`, `startDate`, `endDate`, and `seasonId`. This ensures:

- Single source of truth
- No data inconsistency (can't have `status=ACTIVE` with `endDate` in past)
- Simpler database schema

### 3. Queue Type Naming

Renamed to `CompetitionQueueType` because:

- `QueueType` already exists in `state.ts` with lowercase values ("solo", "flex")
- Competition system uses uppercase to match other enums ("OPEN", "INVITE_ONLY")
- Clear namespace separation between match queues and competition criteria

### 4. Exhaustive Pattern Matching

All helper functions use `ts-pattern` with `.exhaustive()` to ensure:

- TypeScript compiler catches missing cases when new enum values are added
- Runtime safety - can't forget to handle a case
- Better maintainability

## Verification

```bash
# All commands pass ✅
cd packages/data
bun test src/model/competition.test.ts  # 56 pass, 0 fail
bun run typecheck                        # No errors
bun run lint                             # No errors
dagger call check-data                   # Success
```

## Next Steps

Task 3: Criteria Types - Implement discriminated union for competition criteria types (MOST_GAMES_PLAYED, HIGHEST_RANK, etc.)
