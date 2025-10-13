# Task 6: Competition Queries - ✅ COMPLETE

## Summary

Successfully implemented type-safe database query functions for competitions with full CRUD operations, parsing from raw database format to domain types, and comprehensive integration testing.

## Completed Items

### ✅ Data Package - parseCompetition Function

**File**: `packages/data/src/model/competition.ts`

- Created `RawCompetition` interface (database format with criteriaType + criteriaConfig as strings)
- Created `CompetitionWithCriteria` interface (domain format with parsed criteria object)
- Implemented `parseCompetition()` function that:
  - Parses `criteriaConfig` JSON string
  - Validates with `CompetitionCriteriaSchema`
  - Returns strongly-typed domain object
  - Throws descriptive errors on invalid data
- **11 unit tests** covering all 6 criteria types, error cases, and field preservation

### ✅ Backend Query Functions

**File**: `packages/backend/src/database/competition/queries.ts`

**1. createCompetition()**

- Takes `CreateCompetitionInput` with parsed criteria
- Separates criteria type from config for database storage
- Stores criteriaConfig as JSON string
- Returns parsed `CompetitionWithCriteria`

**2. getCompetitionById()**

- Fetches by ID
- Returns parsed competition or null if not found
- Proper error handling

**3. getCompetitionsByServer()**

- Lists competitions for a server
- Supports filtering:
  - `activeOnly`: only non-cancelled, non-ended competitions
  - `ownerId`: filter by competition owner
- Sorted by createdTime desc
- Returns parsed competitions

**4. getActiveCompetitions()**

- Returns all active competitions across all servers
- Excludes cancelled competitions
- Excludes ended competitions (fixed dates with endDate < now)
- Includes DRAFT status (not yet started)
- Used by cron jobs

**5. cancelCompetition()**

- Sets `isCancelled` flag to true
- Updates `updatedTime`
- Returns updated parsed competition
- Throws if competition not found

### ✅ Type Safety

- Created `CreateCompetitionInput` type separate from validation schema
- Validation schema (`CompetitionCreationInput`) includes raw strings for validation
- Query functions use `CreateCompetitionInput` with parsed `CompetitionCriteria` object
- All query functions return `CompetitionWithCriteria` (domain type, not raw Prisma)
- No raw database types leak into application code

### ✅ Integration Tests

**File**: `packages/backend/src/database/competition/queries.integration.test.ts`

**13 comprehensive integration tests**:

1. Create competition with fixed dates and MOST_GAMES_PLAYED
2. Create competition with season ID and HIGHEST_RANK
3. Criteria round-trips correctly with MOST_WINS_CHAMPION
4. Get competition by ID (found)
5. Get competition by ID (not found returns null)
6. Get competitions by server (returns all)
7. Get competitions by server (filters by activeOnly)
8. Get competitions by server (filters by ownerId) ⭐
9. Get active competitions (multiple servers)
10. Get active competitions (excludes cancelled)
11. Get active competitions (excludes ended) ⭐
12. Cancel competition (sets flag)
13. Cancel competition (throws for non-existent)

⭐ = Added during verification phase for complete coverage

All tests use proper `CreateCompetitionInput` structure with inline criteria.

## Files Created/Modified

### Created

- `packages/backend/src/database/competition/queries.ts` - Query functions
- `packages/backend/src/database/competition/queries.integration.test.ts` - Integration tests

### Modified

- `packages/data/src/model/competition.ts` - Added parseCompetition() + types
- `packages/data/src/model/competition.test.ts` - Added 11 unit tests for parseCompetition()
- `packages/backend/src/database/competition/index.ts` - Export query functions

## Test Results

### Data Package (Unit Tests)

```
✅ 143 tests pass (11 new for parseCompetition)
✅ 0 failures
✅ No lint errors
✅ No type errors
```

### Backend Package (Competition Module Tests)

```
✅ 79 tests pass across 3 files
  - validation.test.ts: 58 tests
  - competition.integration.test.ts: 8 tests (from Task 1)
  - queries.integration.test.ts: 13 tests (Task 6)
✅ 0 failures
✅ No lint errors
✅ No type errors
✅ Dagger CI: Backend check passed
```

## Key Design Decisions

### 1. Separate Input Types

- **Validation Schema** (`CompetitionCreationInput`): Raw strings (criteriaType + criteriaConfig) for input validation
- **Query Input** (`CreateCompetitionInput`): Parsed criteria object for type-safe operations

**Rationale**: Validation happens at boundaries (Discord commands), but internal operations use strongly-typed objects.

### 2. Parse on Read, Not on Write

- Competitions are stored with `criteriaType` (string) + `criteriaConfig` (JSON string)
- Parsed to `CompetitionWithCriteria` when reading from database
- All application code works with parsed domain types

**Rationale**: Database stores serialized JSON for flexibility, application code uses strong types for safety.

### 3. Domain Types vs Raw Prisma Types

- Never expose raw Prisma `Competition` type
- Always return `CompetitionWithCriteria` from queries
- Type system prevents using unparsed data

**Rationale**: Type safety and consistent domain model throughout application.

### 4. Active Competition Logic

- Active means: `!isCancelled AND (endDate === null OR endDate > now)`
- Includes DRAFT status (future start date)
- Implemented consistently in `getCompetitionsByServer()` and `getActiveCompetitions()`

**Rationale**: Cron jobs and UI both need same definition of "active".

## Verification

All acceptance criteria from task definition met:
✅ parseCompetition() converts raw to domain type  
✅ All 5 query functions implemented  
✅ Proper typing throughout
✅ Queries return parsed domain types  
✅ Not-found cases handled appropriately  
✅ Criteria round-trips correctly (create then read)  
✅ All integration tests pass  
✅ Zero type errors  
✅ Zero lint errors

## Next Steps

Task 6 is complete! Ready to move on to Task 7 (Participant Management).
