# Task 14: Command - Competition Leave ✅ COMPLETED

## Summary

Successfully implemented the `/competition leave` command that allows users to opt out of competitions with proper validation and soft-delete behavior.

## Files Created

1. **`packages/backend/src/discord/commands/competition/leave.ts`**
   - Main command handler for leaving competitions
   - Validates competition exists, user is participant, and handles all edge cases
   - Sets status to LEFT and records leftAt timestamp
   - Preserves historical data (joinedAt, invitedAt)

2. **`packages/backend/src/discord/commands/competition/leave.integration.test.ts`**
   - Comprehensive integration test suite with 12 tests
   - All tests passing ✅
   - Covers all acceptance criteria and edge cases

## Files Modified

1. **`packages/backend/src/discord/commands/competition/index.ts`**
   - Added `leave` subcommand definition
   - Exported `executeCompetitionLeave` function
   - Integrated with existing command structure

2. **`packages/backend/src/discord/commands/index.ts`**
   - Added import for `executeCompetitionLeave`
   - Added routing logic for "leave" subcommand
   - Integrated into main command handler

## Features Implemented

### Command Structure

- **Subcommand**: `/competition leave`
- **Options**:
  - `competition-id` (required integer) - ID of the competition to leave

### Validation & Business Rules

✅ Competition exists check
✅ User is a participant check (JOINED or INVITED status)
✅ Cannot leave if not a participant
✅ Cannot leave if already left (idempotent error)
✅ Cannot rejoin after leaving (enforced by existing `addParticipant` logic)
✅ Can leave ended competitions
✅ Can leave cancelled competitions
✅ Preserves historical timestamps (joinedAt, invitedAt, leftAt)

### Success Behavior

- Updates participant status to LEFT
- Sets leftAt timestamp
- Reduces active participant count (opens spots for others)
- Displays clear success message with competition title
- Shows warning about inability to rejoin

### Error Messages

- **Not a participant**: Clear message directing to `/competition list`
- **Competition not found**: Specific error with competition ID
- **No linked account**: Helpful message directing to `/subscribe`
- **Server only**: Prevents DM usage

## Test Coverage

### Integration Tests (12 tests, all passing ✅)

1. ✅ User can leave a competition they joined
2. ✅ User can leave a competition they were invited to (decline invitation)
3. ✅ User cannot leave a competition they are not part of
4. ✅ User cannot leave a competition they already left
5. ✅ User cannot rejoin a competition after leaving
6. ✅ User can leave a completed/ended competition
7. ✅ User can leave a cancelled competition
8. ✅ Leaving competition preserves joinedAt and invitedAt timestamps
9. ✅ Multiple users can leave the same competition independently
10. ✅ Leaving competition reduces active participant count
11. ✅ Cannot leave a competition that doesn't exist
12. ✅ After user leaves, another user can take their spot (if at max)

### Test Results

```
✅ 12 pass
❌ 0 fail
📊 33 expect() calls
⏱️  2.43s execution time
```

## Quality Checks

### Code Quality

✅ TypeScript strict mode - all types correct
✅ No linter errors
✅ Prettier formatting passed
✅ No `any` types used
✅ Proper error handling with getErrorMessage()
✅ Comprehensive logging for debugging

### CI/CD

✅ Dagger backend check passed
✅ Command automatically registered with Discord (via rest.ts)
✅ Follows existing code patterns and conventions

## Command Registration

The leave command is automatically registered with Discord because:

1. It's defined as a subcommand of `competitionCommand` in `index.ts`
2. `competitionCommand` is exported and imported in `rest.ts`
3. When the bot starts, all subcommands are registered via Discord API

## Usage Examples

### Success Case

```
User: /competition leave competition-id:42

Bot:
✅ You've left the competition

You're no longer participating in **January Grind Challenge**.

Note: You cannot rejoin a competition after leaving.
```

### Error Cases

**Not a Participant:**

```
❌ Not a participant

You're not in this competition. Use `/competition list` to see competitions you can join.
```

**Competition Not Found:**

```
❌ Competition not found

Competition with ID 99 does not exist.
```

**No Linked Account:**

```
❌ No League account linked

You need to link your League of Legends account first. Use:
`/subscribe region:NA1 riot-id:YourName#NA1 alias:YourName channel:#updates`
```

## Database Impact

### Soft Delete Behavior

- Status: `JOINED` or `INVITED` → `LEFT`
- `leftAt`: NULL → Current timestamp
- `joinedAt`: Preserved (if existed)
- `invitedAt`: Preserved (if existed)
- `invitedBy`: Preserved (if existed)

### Active Participant Count

- Leaving reduces count of participants with status != LEFT
- Opens spots for new participants to join
- Cannot rejoin once left (business rule enforced)

## Code Patterns Used

1. **Step-by-step validation** - Clear numbered sections with comments
2. **Ephemeral messages** - All responses are private to user
3. **Proper error handling** - Try-catch with getErrorMessage()
4. **Database abstraction** - Uses database layer functions (removeParticipant, getParticipantStatus)
5. **Comprehensive logging** - Console logs for debugging and monitoring
6. **Type safety** - Proper TypeScript types throughout

## Dependencies on Other Tasks

This task successfully used:

- ✅ Task 6: Competition queries (`getCompetitionById`)
- ✅ Task 7: Participant management (`removeParticipant`, `getParticipantStatus`)
- ✅ Task 9: Command structure (competition subcommands)
- ✅ Task 12: Join command patterns (similar structure and validation)

## Next Steps

The leave command is production-ready. Consider these follow-ups:

1. Task 15: List command (users need to see competitions they can leave)
2. Task 16: View command (see current competition details before leaving)
3. Add metrics tracking for leave events
4. Consider adding a confirmation prompt for leaving active competitions

## Acceptance Criteria Status

✅ Subcommand with competition-id option
✅ Validates competition exists
✅ Validates user is a participant (JOINED or INVITED)
✅ Updates participant status to LEFT
✅ Sets leftAt timestamp
✅ Success message confirms leave
✅ Cannot rejoin after leaving (enforced by addParticipant)
✅ All integration tests passing
✅ No linter errors
✅ Dagger CI checks pass

## Completion Date

October 13, 2025

## Notes

- The `removeParticipant` function in participants.ts handles the soft delete logic
- Historical data preservation is important for analytics and historical records
- Leaving an ended/cancelled competition is allowed (historical cleanup)
- The command is idempotent-ish: trying to leave twice gives a clear error message
- Active participant count is key for max participant enforcement
