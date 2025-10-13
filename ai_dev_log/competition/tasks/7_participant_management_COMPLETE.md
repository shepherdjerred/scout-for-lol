# Task 7: Participant Management - ✅ COMPLETE

## Summary

Successfully implemented comprehensive participant management functions with full CRUD operations, status tracking, validation, and 29 integration tests. All business rules enforced including max participant limits, no-rejoin policy, and proper timestamp tracking.

## Completed Items

### ✅ Prisma Schema Update

**File**: `packages/backend/prisma/schema.prisma`

Updated `CompetitionParticipant` model:

- Added `invitedAt` field (nullable - null if joined directly)
- Made `joinedAt` nullable (null if only invited, not yet joined)
- `leftAt` already nullable (null if still participating)

**Migration created**: `20251012042957_add_participant_timestamps`

### ✅ Participant Management Functions

**File**: `packages/backend/src/database/competition/participants.ts`

**6 functions implemented:**

1. **`addParticipant()`** - Add participant with JOINED or INVITED status
   - Checks competition is active (not cancelled/ended)
   - Enforces max participant limit
   - Prevents duplicate participants
   - Blocks rejoining after leaving
   - Sets appropriate timestamps based on status

2. **`acceptInvitation()`** - Transition from INVITED to JOINED
   - Validates participant is in INVITED status
   - Sets joinedAt timestamp
   - Preserves invitedAt and invitedBy for audit trail

3. **`removeParticipant()`** - Soft delete (sets status to LEFT)
   - Validates participant exists and hasn't already left
   - Sets leftAt timestamp
   - Preserves joinedAt and invitedAt for history

4. **`getParticipants()`** - Query participants with filtering
   - Optional status filter (JOINED, INVITED, LEFT)
   - Optional player relation inclusion
   - Ordered by joinedAt ascending

5. **`getParticipantStatus()`** - Check participant status
   - Returns ParticipantStatus or null if not a participant
   - Simple status lookup for validation

6. **`canJoinCompetition()`** - Comprehensive join eligibility check
   - Returns `{ canJoin: boolean, reason?: string }`
   - Validates: competition exists, is active, under limit, not already participant
   - Provides clear reason for rejection

### ✅ Integration Tests

**File**: `packages/backend/src/database/competition/participants.integration.test.ts`

**29 comprehensive integration tests:**

**addParticipant - JOINED status (2 tests)**

1. Adds participant with JOINED status successfully
2. Sets joinedAt timestamp

**addParticipant - INVITED status (2 tests)** 3. Adds participant with INVITED status successfully 4. Can transition from INVITED to JOINED

**addParticipant - duplicate prevention (2 tests)** 5. Throws error when adding same participant twice 6. Throws error when player has already left (no rejoin)

**addParticipant - max participants (3 tests)** 7. Allows adding up to maxParticipants 8. Throws error when exceeding maxParticipants 9. LEFT participants don't count towards limit

**removeParticipant (4 tests)** 10. Changes status to LEFT and sets leftAt 11. Preserves joinedAt timestamp 12. Throws error for non-existent participant 13. Throws error when already left

**getParticipants - filtering (4 tests)** 14. Returns all participants by default 15. Filters by status=JOINED 16. Filters by status=INVITED 17. Returns empty array for empty competition

**getParticipantStatus (4 tests)** 18. Returns JOINED for joined participant 19. Returns INVITED for invited participant 20. Returns LEFT for participant who left 21. Returns null for non-participant

**canJoinCompetition validation (8 tests)** 22. Returns true for valid join scenario 23. Returns false for cancelled competition 24. Returns false for ended competition 25. Returns false when at participant limit 26. Returns false when already joined 27. Returns false when already invited 28. Returns false when previously left

**Participant with Player relation (1 test)** 29. Can include Player data when querying participants

### ✅ Business Rules Enforced

1. **Max Participant Limit**
   - Competition has configurable `maxParticipants` (default 50)
   - Only active participants (JOINED/INVITED) count towards limit
   - LEFT participants don't count

2. **No Rejoin Policy**
   - Once a participant leaves (status=LEFT), they cannot rejoin
   - Enforced at database query level
   - Clear error message provided

3. **Competition Activity Check**
   - Can only add participants to active competitions
   - Active = not cancelled AND not ended
   - Reuses `isCompetitionActive()` from validation module

4. **Timestamp Tracking**
   - `invitedAt` - set when status is INVITED
   - `joinedAt` - set when status is JOINED (or when accepting invitation)
   - `leftAt` - set when participant leaves
   - All timestamps preserved for audit trail

5. **Duplicate Prevention**
   - Unique constraint: `[competitionId, playerId]`
   - Prisma enforces at database level
   - Clear error messages for duplicates

### ✅ Type Safety

- All functions fully typed with Prisma types
- `ParticipantStatus` from `@scout-for-lol/data` package
- No `any` types
- Proper error handling with descriptive messages

## Test Results

```
✅ 108 tests pass across 4 files
  - validation.test.ts: 58 tests
  - competition.integration.test.ts: 8 tests (Task 1)
  - queries.integration.test.ts: 13 tests (Task 6)
  - participants.integration.test.ts: 29 tests (Task 7) ⭐ NEW
✅ 0 failures
✅ No lint errors
✅ No type errors
✅ Typecheck passed
```

## Files Created/Modified

### Created

- `packages/backend/src/database/competition/participants.ts` - 6 participant management functions
- `packages/backend/src/database/competition/participants.integration.test.ts` - 29 tests
- `packages/backend/prisma/migrations/20251012042957_add_participant_timestamps/migration.sql` - Schema update

### Modified

- `packages/backend/src/database/competition/index.ts` - Export participant functions
- `packages/backend/prisma/schema.prisma` - Add invitedAt field, make joinedAt nullable

## API Examples

```typescript
// Add a participant who joined directly
const participant = await addParticipant(prisma, competitionId, playerId, "JOINED");

// Invite a participant
const invited = await addParticipant(prisma, competitionId, playerId, "INVITED", "inviter-discord-id");

// Accept invitation
const joined = await acceptInvitation(prisma, competitionId, playerId);

// Remove participant (soft delete)
const left = await removeParticipant(prisma, competitionId, playerId);

// Get all joined participants
const active = await getParticipants(prisma, competitionId, "JOINED");

// Get participants with player data
const withPlayers = await getParticipants(prisma, competitionId, undefined, true);

// Check if player can join
const { canJoin, reason } = await canJoinCompetition(prisma, competitionId, playerId);

// Get participant status
const status = await getParticipantStatus(prisma, competitionId, playerId);
// Returns: "JOINED" | "INVITED" | "LEFT" | null
```

## Next Steps

Task 7 is complete! Ready for Task 8: Permission System.
