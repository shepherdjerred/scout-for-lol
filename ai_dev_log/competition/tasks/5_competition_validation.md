# Task 5: Competition Validation - Business Logic

## Overview

Implement comprehensive validation functions for competition creation and management. This includes date validation, XOR constraints, limit checking, and owner restrictions.

## Dependencies

- Task 1 (Prisma schema)
- Task 2 (Core types)
- Task 3 (Criteria types)

## Files to Create/Modify

- `packages/backend/src/database/competition/validation.ts` (new file)
- `packages/backend/src/database/competition/index.ts` (new file, re-exports)

## Acceptance Criteria

1. `validateCompetitionCreation()` function implemented with all checks:
   - XOR: either (startDate AND endDate) OR seasonId, not both
   - Date order: startDate < endDate
   - Duration limit: max 90 days
   - Owner limit: max 1 active competition per owner
   - Server limit: max 5 active competitions per server
2. Helper function `isCompetitionActive()` for checking active status
3. All validation throws descriptive errors
4. All database queries properly typed
5. No race conditions in limit checking

## Implementation Notes

- "Active" means: not cancelled AND (not ended OR not started yet)
- Use Prisma `findFirst` for checking existing competitions
- Duration calculation in milliseconds, then convert to days
- Consider timezone handling for date comparisons

## Test Cases

### Unit Tests

File: `packages/backend/src/database/competition/validation.test.ts`

1. **Date validation - XOR constraint**
   - Both fixed dates AND seasonId provided → throws error
   - Neither fixed dates NOR seasonId provided → throws error
   - Only fixed dates → passes
   - Only seasonId → passes

2. **Date validation - order**
   - startDate before endDate → passes
   - startDate equals endDate → throws error
   - startDate after endDate → throws error

3. **Date validation - duration**
   - 1 day duration → passes
   - 89 days duration → passes
   - 90 days duration → passes
   - 91 days duration → throws error
   - 365 days duration → throws error

### Integration Tests

File: `packages/backend/src/database/competition/validation.integration.test.ts`

4. **Owner limit check**
   - No existing competitions → passes
   - Owner has ended competition → passes
   - Owner has cancelled competition → passes
   - Owner has active competition → throws error with message "You already have an active competition"

5. **Server limit check**
   - Server has 0 active competitions → passes
   - Server has 4 active competitions → passes
   - Server has 5 active competitions → throws error
   - Server has 5 competitions but all ended → passes
   - Server has 5 competitions but some cancelled → counts only active

6. **Active competition definition**
   - Not cancelled, endDate in future → active
   - Not cancelled, startDate null (season-based) → active
   - Cancelled, endDate in future → not active
   - Not cancelled, endDate in past → not active

## Example Implementation

```typescript
export async function validateCompetitionCreation(
  serverId: string,
  ownerId: string,
  startDate: Date | null,
  endDate: Date | null,
  seasonId: string | null,
): Promise<void> {
  // XOR validation
  const hasFixedDates = startDate !== null && endDate !== null;
  const hasSeasonId = seasonId !== null;

  if (hasFixedDates === hasSeasonId) {
    throw new Error("Must specify either fixed dates or season ID, not both");
  }

  // More validations...
}
```

## Validation

- Run `bun run typecheck` in backend package
- Run `bun test packages/backend/src/database/competition/`
- All tests must pass
- Use test database for integration tests
