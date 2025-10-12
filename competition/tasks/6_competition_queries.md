# Task 6: Competition Queries - Database Helpers

## Overview
Implement type-safe database query functions for competitions. This includes CRUD operations, parsing from raw DB format to domain types, and common query patterns.

## Dependencies
- Task 1 (Prisma schema)
- Task 2 (Core types)
- Task 3 (Criteria types)
- Task 5 (Validation)

## Files to Create/Modify
- `packages/backend/src/database/competition/queries.ts` (new file)
- `packages/backend/src/database/competition/index.ts` - export queries
- `packages/data/src/model/competition.ts` - add `parseCompetition()` function

## Acceptance Criteria
1. `parseCompetition()` function converts raw Prisma Competition to domain type
   - Parses JSON criteriaConfig
   - Validates with CompetitionCriteriaSchema
   - Returns `CompetitionWithCriteria` type
   - Throws on invalid data
2. Query functions implemented:
   - `createCompetition()` - insert new competition
   - `getCompetitionById()` - fetch by ID, returns parsed
   - `getCompetitionsByServer()` - list for server with filters
   - `getActiveCompetitions()` - all active across servers
   - `cancelCompetition()` - set isCancelled flag
3. All functions properly typed
4. All queries return parsed domain types, not raw Prisma types
5. Handle not-found cases appropriately (return null or throw)

## Implementation Notes
- Store criteria as JSON in DB: `JSON.stringify({ queue: 'SOLO', ... })`
- Store criteriaType separately as discriminator
- Parse on read, validate on write
- Use Prisma's `include` for relations when needed

## Test Cases

### Unit Tests
File: `packages/data/src/model/competition.test.ts`

1. **parseCompetition - valid data**
   - Raw competition with MOST_GAMES_PLAYED criteria → parses correctly
   - Raw competition with HIGHEST_RANK criteria → parses correctly
   - Parsed result has `criteria` field with correct type
   - Original fields preserved

2. **parseCompetition - invalid data**
   - Invalid JSON in criteriaConfig → throws error
   - criteriaType doesn't match config → throws error
   - Missing required criteria fields → throws error

### Integration Tests
File: `packages/backend/src/database/competition/queries.integration.test.ts`

3. **createCompetition**
   - Create with fixed dates → succeeds
   - Create with seasonId → succeeds
   - Created competition can be retrieved
   - Criteria round-trips correctly (create then read)

4. **getCompetitionById**
   - Existing competition → returns parsed competition
   - Non-existent ID → returns null
   - Returned competition has proper domain type

5. **getCompetitionsByServer**
   - Server with multiple competitions → returns all
   - Filter by active only → returns only active
   - Filter by owner → returns only owner's competitions
   - Empty server → returns empty array
   - Results are sorted by createdTime desc

6. **getActiveCompetitions**
   - Returns competitions from multiple servers
   - Only includes active (not cancelled, not ended)
   - Includes DRAFT status competitions

7. **cancelCompetition**
   - Cancel by ID → sets isCancelled to true
   - Updates updatedTime
   - Non-existent ID → throws error
   - Already cancelled → idempotent (no error)

## Example Implementation
```typescript
export function parseCompetition(raw: Competition): CompetitionWithCriteria {
  const criteriaConfig = JSON.parse(raw.criteriaConfig);
  const criteria = CompetitionCriteriaSchema.parse({
    type: raw.criteriaType,
    ...criteriaConfig,
  });
  
  return {
    ...raw,
    criteria,
  };
}

export async function getCompetitionById(
  id: number
): Promise<CompetitionWithCriteria | null> {
  const raw = await prisma.competition.findUnique({
    where: { id },
  });
  
  if (!raw) return null;
  
  return parseCompetition(raw);
}
```

## Validation
- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/database/competition/`
- Verify no type errors
- All integration tests pass

