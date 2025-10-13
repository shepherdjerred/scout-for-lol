# Task 7: Participant Management - CRUD Operations

## Overview

Implement database functions for managing competition participants. This includes adding participants (joining/inviting), removing participants (leaving), and querying participant status.

## Dependencies

- Task 1 (Prisma schema)
- Task 2 (Core types)
- Task 6 (Competition queries)

## Files to Create/Modify

- `packages/backend/src/database/competition/participants.ts` (new file)
- `packages/backend/src/database/competition/index.ts` - export participant functions

## Acceptance Criteria

1. Participant functions implemented:
   - `addParticipant()` - add with JOINED or INVITED status
   - `removeParticipant()` - update status to LEFT
   - `getParticipants()` - get all participants for competition
   - `getParticipantStatus()` - check if user is participant and status
   - `canJoinCompetition()` - validate join eligibility
2. All functions handle timestamps correctly (joinedAt, invitedAt, leftAt)
3. Duplicate participant prevention (unique constraint)
4. Max participant limit enforced
5. Proper error messages for validation failures

## Implementation Notes

- Use `upsert` pattern for idempotent operations
- Track who invited (invitedBy field) for audit trail
- LEFT status doesn't delete record (soft delete)
- Can't re-join after leaving (business rule)

## Test Cases

### Integration Tests

File: `packages/backend/src/database/competition/participants.integration.test.ts`

1. **addParticipant - JOINED status**
   - Add participant with JOINED → succeeds
   - Sets joinedAt timestamp
   - invitedAt and invitedBy are null
   - leftAt is null

2. **addParticipant - INVITED status**
   - Add participant with INVITED → succeeds
   - Sets invitedAt timestamp and invitedBy
   - joinedAt is null
   - Can transition from INVITED to JOINED

3. **addParticipant - duplicate prevention**
   - Add same participant twice → second fails with unique constraint error
   - Error message indicates duplicate

4. **addParticipant - max participants**
   - Competition with maxParticipants=3
   - Add 3 participants → succeeds
   - Add 4th participant → throws error
   - Error message indicates limit reached

5. **removeParticipant**
   - Remove existing participant → status changes to LEFT
   - Sets leftAt timestamp
   - joinedAt preserved
   - Remove non-existent participant → throws error

6. **getParticipants - filtering**
   - Get all participants → includes JOINED, INVITED, LEFT
   - Filter by status=JOINED → only joined
   - Filter by status=INVITED → only invited
   - Empty competition → returns empty array

7. **getParticipantStatus**
   - Check participant who joined → returns JOINED
   - Check participant who was invited → returns INVITED
   - Check participant who left → returns LEFT
   - Check non-participant → returns null

8. **canJoinCompetition validation**
   - Active competition, under limit, not participant → returns true
   - Cancelled competition → returns false
   - Ended competition → returns false
   - At participant limit → returns false
   - Already joined → returns false
   - Previously left → returns false

9. **Participant with Player relation**
   - Add participant → can include Player data
   - Query participants with player info → includes alias, discordId

## Example Implementation

```typescript
export async function addParticipant(
  competitionId: number,
  playerId: number,
  status: ParticipantStatus,
  invitedBy?: string,
): Promise<CompetitionParticipant> {
  const now = new Date();

  // Check participant limit
  const count = await prisma.competitionParticipant.count({
    where: { competitionId, status: { not: "LEFT" } },
  });

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new Error("Competition not found");
  }

  if (count >= competition.maxParticipants) {
    throw new Error("Competition has reached maximum participants");
  }

  return await prisma.competitionParticipant.create({
    data: {
      competitionId,
      playerId,
      status,
      invitedBy,
      invitedAt: status === "INVITED" ? now : null,
      joinedAt: status === "JOINED" ? now : null,
    },
  });
}
```

## Validation

- Run `bun run typecheck` in backend
- Run `bun test packages/backend/src/database/competition/participants.integration.test.ts`
- All tests pass
