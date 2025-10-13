# Task 1: Prisma Schema - Competition Tables

## Overview

Add four new models to the Prisma schema: `Competition`, `CompetitionParticipant`, `CompetitionSnapshot`, and `ServerPermission`. These models form the foundation of the competition system with proper relations, cascading deletes, and indexes.

## Dependencies

None - this is a foundational task

## Files to Create/Modify

- `packages/backend/prisma/schema.prisma` - Add new models
- `packages/backend/prisma/migrations/` - New migration file (generated)

## Acceptance Criteria

1. All four models are added to schema.prisma with correct field types
2. Foreign key relationships are properly defined with cascade behavior
3. Unique constraints are in place:
   - `Competition`: `[serverId, ownerId]` unique
   - `CompetitionParticipant`: `[competitionId, playerId]` unique
   - `CompetitionSnapshot`: `[competitionId, playerId, snapshotType]` unique
   - `ServerPermission`: `[serverId, discordUserId, permission]` unique
4. Indexes are created for query optimization:
   - `Competition`: indexed on `[serverId, isCancelled]`
   - `CompetitionParticipant`: indexed on `[competitionId, status]`
5. Relations to existing `Player` model work correctly
6. Migration runs successfully without errors
7. Prisma client generates with new types

## Implementation Notes

- Use `String` type for enums in Prisma (validated at app level with Zod)
- Set `onDelete: Cascade` for participant/snapshot relations
- Keep `maxParticipants` default at 50
- Both `startDate`/`endDate` and `seasonId` are nullable (XOR enforced in app)

## Test Cases

### Unit Tests

File: `packages/backend/src/database/competition.test.ts`

1. **Schema integrity test**
   - Verify Prisma client has all new models
   - Check that all expected fields exist on Competition model

### Integration Tests

File: `packages/backend/src/database/competition.integration.test.ts`

1. **Competition CRUD operations**
   - Create a competition with all required fields
   - Query competition by ID
   - Verify unique constraint on `[serverId, ownerId]`

2. **Cascade delete behavior**
   - Create competition with participants and snapshots
   - Delete competition
   - Verify participants and snapshots are also deleted

3. **Foreign key constraints**
   - Attempt to create CompetitionParticipant with invalid playerId
   - Verify it fails with FK constraint error

## Migration Command

```bash
cd packages/backend
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database (dev)
# OR for production:
bun run db:migrate   # Create migration file
```

## Validation

- Run `bun run typecheck` - should pass
- Run `bun run db:studio` - verify tables exist
- Check migration file for correctness
