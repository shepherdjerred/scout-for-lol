# Task 1: Prisma Schema - ✅ COMPLETE (v2 - Fixed)

## Summary

Successfully added four new models to the Prisma schema for the competition system with **corrected constraints**. All tables are created, relationships are established, and comprehensive integration tests verify the schema works correctly.

## Critical Fix Applied

### Issue Found and Resolved

**Original Problem**: Schema had `@@unique([serverId, ownerId])` constraint which would prevent users from EVER creating more than one competition on a server, even after previous ones ended.

**Fix Applied**:

- ✅ Removed unique constraint on `[serverId, ownerId]`
- ✅ Added composite index `[serverId, ownerId, isCancelled]` for efficient querying
- ✅ Documented that "one active competition per owner" will be enforced in application logic (Task 5)
- ✅ Added tests to verify users can create multiple competitions over time

## Completed Items

### ✅ Schema Changes

- Added `Competition` model with all required fields
- Added `CompetitionParticipant` model with foreign keys and cascade deletes
- Added `CompetitionSnapshot` model with foreign keys and cascade deletes
- Added `ServerPermission` model for flexible permission management
- Updated `Player` model with reverse relations to new models
- **Fixed**: Removed incorrect unique constraint on competition ownership
- **Added**: Performance index on `[serverId, ownerId, isCancelled]` for active competition queries

### ✅ Database Operations

- Prisma client generated successfully
- **Migration 1**: `20251012031357_add_competition_tables/migration.sql` - Initial tables
- **Migration 2**: `20251012031717_remove_owner_unique_constraint/migration.sql` - Fix constraint
- Both migrations applied successfully to development database
- All tables created with correct structure
- Indexes optimized for query patterns
- Foreign keys with CASCADE delete configured

### ✅ Tests Written

File: `packages/backend/src/database/competition.integration.test.ts`

**8 integration tests - ALL PASSING:**

1. ✅ Competition CRUD operations (create, read, update, delete)
2. ✅ **User can create multiple competitions over time** (NEW - verifies fix)
3. ✅ **User can have cancelled and active competitions simultaneously** (NEW - verifies fix)
4. ✅ Cascade delete behavior works (deleting competition cascades to participants and snapshots)
5. ✅ Foreign key constraints enforced (invalid playerId rejected)
6. ✅ ServerPermission CRUD operations
7. ✅ CompetitionParticipant unique constraint on `[competitionId, playerId]`
8. ✅ CompetitionSnapshot unique constraint on `[competitionId, playerId, snapshotType]`

### ✅ CI/CD Verification

- Dagger CI check passes: `dagger call check-backend` ✅
- All tests pass: `bun test` ✅
- Code formatted: `bun run format:write` ✅

## Files Modified/Created

### Modified

- `packages/backend/prisma/schema.prisma` - Added 4 new models, fixed constraints
- `packages/report/package.json` - Added missing workspace dependency (bug fix)

### Created

- `packages/backend/src/database/competition.integration.test.ts` - Integration tests (8 tests)
- `packages/backend/prisma/migrations/20251012031357_add_competition_tables/migration.sql` - Initial migration
- `packages/backend/prisma/migrations/20251012031717_remove_owner_unique_constraint/migration.sql` - Fix migration

## Schema Details

### Competition Model

- Core fields: id, serverId, ownerId, title, description, channelId
- Flags: isCancelled (boolean, default false)
- Enums (stored as strings): visibility, criteriaType
- JSON fields: criteriaConfig
- Timing: startDate, endDate (nullable), seasonId (nullable) - XOR enforced at app level
- Relations: participants (1:N), snapshots (1:N)
- **Indexes**:
  - `[serverId, isCancelled]` - Find active/inactive competitions
  - `[serverId, ownerId, isCancelled]` - Find owner's active competitions (for validation)
- **No unique constraint** - Users can create unlimited competitions over time

### CompetitionParticipant Model

- Links competitions to players
- Status tracking: INVITED, JOINED, LEFT
- Timestamps: joinedAt, leftAt (nullable)
- Relations: competition (with CASCADE delete), player
- Unique constraint: `[competitionId, playerId]`
- Index: `[competitionId, status]`

### CompetitionSnapshot Model

- Captures player state at boundaries (START/END)
- JSON field: snapshotData
- Relations: competition (with CASCADE delete), player
- Unique constraint: `[competitionId, playerId, snapshotType]`

### ServerPermission Model

- Flexible permission system
- Fields: serverId, discordUserId, permission, grantedBy, grantedAt
- Unique constraint: `[serverId, discordUserId, permission]`

## Test Results

```
✅ 8 pass
❌ 0 fail
✅ 30 expect() calls
⏱️  1397ms execution time
```

## Migration File Details

### Migration 1: `20251012031357_add_competition_tables`

**Tables Created:**

- `Competition` - 19 columns with defaults for `isCancelled` (false) and `maxParticipants` (50)
- `CompetitionParticipant` - 7 columns with foreign keys to Competition (CASCADE) and Player
- `CompetitionSnapshot` - 6 columns with foreign keys to Competition (CASCADE) and Player
- `ServerPermission` - 6 columns for permission management

**Indexes Created:**

- `Competition_serverId_isCancelled_idx` - Query optimization for active competitions
- `CompetitionParticipant_competitionId_status_idx` - Query optimization for participant filtering

**Unique Constraints:**

- ~~`Competition_serverId_ownerId_key`~~ - **REMOVED IN MIGRATION 2**
- `CompetitionParticipant_competitionId_playerId_key` - No duplicate participants
- `CompetitionSnapshot_competitionId_playerId_snapshotType_key` - One snapshot per type
- `ServerPermission_serverId_discordUserId_permission_key` - No duplicate permissions

### Migration 2: `20251012031717_remove_owner_unique_constraint`

**Changes:**

- Dropped `Competition_serverId_ownerId_key` unique index
- Created `Competition_serverId_ownerId_isCancelled_idx` composite index

**Rationale:**

- Allows users to create multiple competitions over time (e.g., January, February, March)
- The business rule "one ACTIVE competition per owner" will be enforced in application validation layer
- New composite index enables efficient queries for owner's active competitions

## Design Decisions Documented

### ✅ Status Field Strategy

**Decision**: Status is **calculated** from current state, not stored

Calculated logic:

- `isCancelled = true` → Status: CANCELLED
- `startDate > now` → Status: DRAFT
- `startDate <= now < endDate` → Status: ACTIVE
- `endDate <= now` → Status: ENDED

**Rationale**:

- Eliminates synchronization bugs (status always reflects reality)
- Simpler schema (one boolean vs enum + sync logic)
- Automatic transitions based on time
- Can still efficiently query with `isCancelled` boolean + date comparisons

### ✅ Owner Identity

**Decision**: Competition `ownerId` is Discord user ID (String), not linked to Player table

**Rationale**:

- Allows anyone to create competitions (don't need to be a player)
- Clear separation: owners manage, players compete
- Owners can create competitions even if they don't subscribe to updates
- If owner wants to participate, they can join like any other player

### ✅ One Active Competition Enforcement

**Decision**: Enforced in **application logic** (Task 5: Validation), not database constraint

**Why**:

- Database constraint would prevent creating new competitions after old ones end
- Application logic can check for DRAFT or ACTIVE competitions only
- Provides better error messages to users
- More flexible (can change rule without migration)

**Implementation** (for Task 5):

```typescript
// Query for owner's active competitions (not cancelled, dates include now)
const activeCompetitions = await prisma.competition.findMany({
  where: {
    serverId,
    ownerId,
    isCancelled: false,
    OR: [
      { startDate: { lte: now }, endDate: { gte: now } }, // Currently active
      { startDate: { gte: now } }, // Future/draft
    ],
  },
});

if (activeCompetitions.length > 0) {
  throw new Error("You already have an active competition");
}
```

## Verification Tests Added

### Test: "User can create multiple competitions over time"

Verifies:

- Create ENDED competition (dates in past)
- Create ACTIVE competition (dates include present) → **SUCCESS**
- Both competitions coexist in database
- Query returns both competitions for same owner

### Test: "User can have cancelled and active competitions simultaneously"

Verifies:

- Create competition with `isCancelled = true`
- Create competition with `isCancelled = false` → **SUCCESS**
- Query with `isCancelled: false` filter returns only active one

## Notes

- All constraints working as expected
- Cascade deletes properly configured and tested
- Foreign key constraints enforced
- Schema is production-ready with proper migrations
- Migration files version controlled for production deployments
- Integration tests provide comprehensive coverage including edge cases
- Design decisions documented for future reference

## Next Steps

Ready to proceed to **Task 2: Core Types** - Create branded types and Zod schemas in the data package.

The schema is now correctly designed to support the competition feature requirements while maintaining flexibility for users to create multiple competitions over time.
