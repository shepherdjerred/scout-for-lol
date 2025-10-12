# Task 2: Core Types - Branded Types and Enums

## Overview
Create the foundational Zod schemas and TypeScript types for the competition system in the shared `packages/data` package. This includes branded ID types, core enums, and the domain status type.

## Dependencies
- Task 1 (Prisma schema) - for understanding the data model

## Files to Create/Modify
- `packages/data/src/model/competition.ts` (new file)
- `packages/data/src/index.ts` - export new types

## Acceptance Criteria
1. Branded types created for `CompetitionId` and `ParticipantId`
2. Enums defined for:
   - `CompetitionVisibility` (OPEN, INVITE_ONLY, SERVER_WIDE)
   - `ParticipantStatus` (INVITED, JOINED, LEFT)
   - `SnapshotType` (START, END)
   - `PermissionType` (CREATE_COMPETITION)
3. `QueueType` enum defined (SOLO, FLEX, RANKED_ANY, ARENA, ARAM, ALL)
4. `CompetitionStatus` type defined (DRAFT, ACTIVE, ENDED, CANCELLED)
5. `getCompetitionStatus()` function implemented with proper logic
6. All types exported from `packages/data/src/index.ts`
7. No `any` types used
8. All schemas have proper Zod validation

## Implementation Notes
- Use `.brand()` for ID types to prevent mixing different ID types
- Enums use `z.enum()` for runtime validation
- `getCompetitionStatus()` is a pure function with no side effects
- Status is calculated, not stored in DB

## Test Cases

### Unit Tests
File: `packages/data/src/model/competition.test.ts`

1. **Branded type safety**
   - Verify CompetitionId cannot be assigned to ParticipantId
   - Test that regular numbers fail branded type validation
   - Test that negative numbers fail validation

2. **Enum validation**
   - Test valid enum values pass
   - Test invalid enum values fail with clear error
   - Test all visibility types: OPEN, INVITE_ONLY, SERVER_WIDE

3. **Status calculation - CANCELLED**
   - Competition with `isCancelled: true` returns CANCELLED
   - Regardless of dates

4. **Status calculation - DRAFT**
   - Competition with future startDate returns DRAFT
   - Competition with seasonId but no dates returns DRAFT

5. **Status calculation - ACTIVE**
   - Competition with startDate in past, endDate in future returns ACTIVE

6. **Status calculation - ENDED**
   - Competition with endDate in past returns ENDED

7. **Status calculation - Error cases**
   - Competition with no dates and no seasonId throws error
   - Error message is descriptive

## Example Test Structure
```typescript
import { describe, expect, test } from 'bun:test';
import { CompetitionIdSchema, getCompetitionStatus } from './competition';

describe('CompetitionId branded type', () => {
  test('accepts positive integers', () => {
    const result = CompetitionIdSchema.safeParse(1);
    expect(result.success).toBe(true);
  });

  test('rejects negative integers', () => {
    const result = CompetitionIdSchema.safeParse(-1);
    expect(result.success).toBe(false);
  });

  test('rejects zero', () => {
    const result = CompetitionIdSchema.safeParse(0);
    expect(result.success).toBe(false);
  });
});

describe('getCompetitionStatus', () => {
  test('returns CANCELLED when isCancelled is true', () => {
    const competition = {
      isCancelled: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-01'),
      seasonId: null,
    };
    expect(getCompetitionStatus(competition)).toBe('CANCELLED');
  });
  
  // ... more tests
});
```

## Validation
- Run `bun run typecheck:all` - should pass
- Run `bun test packages/data/src/model/competition.test.ts`
- All tests should pass

