# Task 1: Prisma Schema - ✅ COMPLETE

## Summary

Successfully added four new models to the Prisma schema for the competition system. All tables are created, relationships are established, and comprehensive integration tests verify the schema works correctly.

## Completed Items

### ✅ Schema Changes

- Added `Competition` model with all required fields
- Added `CompetitionParticipant` model with foreign keys and cascade deletes
- Added `CompetitionSnapshot` model with foreign keys and cascade deletes
- Added `ServerPermission` model for flexible permission management
- Updated `Player` model with reverse relations to new models
- Fixed pre-existing bug: added missing `@scout-for-lol/data` dependency to `packages/report/package.json`

### ✅ Database Operations

- Prisma client generated successfully
- **Migration created**: `20251012031357_add_competition_tables/migration.sql`
- Migration applied successfully to development database
- All tables created with correct structure
- Indexes and unique constraints in place
- Foreign keys with CASCADE delete configured

### ✅ Tests Written

File: `packages/backend/src/database/competition.integration.test.ts`

**7 integration tests - ALL PASSING:**

1. ✅ Competition CRUD operations (create, read, update, delete)
2. ✅ Unique constraint on `[serverId, ownerId]` enforced
3. ✅ Cascade delete behavior works (deleting competition cascades to participants and snapshots)
4. ✅ Foreign key constraints enforced (invalid playerId rejected)
5. ✅ ServerPermission CRUD operations
6. ✅ CompetitionParticipant unique constraint on `[competitionId, playerId]`
7. ✅ CompetitionSnapshot unique constraint on `[competitionId, playerId, snapshotType]`

### ✅ CI/CD Verification

- Dagger CI check passes: `dagger call check-backend` ✅
- All tests pass: `bun test` ✅
- Code formatted: `bun run format:write` ✅

## Files Modified/Created

### Modified

- `packages/backend/prisma/schema.prisma` - Added 4 new models
- `packages/report/package.json` - Added missing workspace dependency (bug fix)

### Created

- `packages/backend/src/database/competition.integration.test.ts` - Integration tests
- `packages/backend/prisma/migrations/20251012031357_add_competition_tables/migration.sql` - Production migration file

## Schema Details

### Competition Model

- Core fields: id, serverId, ownerId, title, description, channelId
- Flags: isCancelled (boolean, default false)
- Enums (stored as strings): visibility, criteriaType
- JSON fields: criteriaConfig
- Timing: startDate, endDate (nullable), seasonId (nullable) - XOR enforced at app level
- Relations: participants (1:N), snapshots (1:N)
- Unique constraint: `[serverId, ownerId]`
- Index: `[serverId, isCancelled]`

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
✅ 7 pass
❌ 0 fail
✅ 23 expect() calls
⏱️  1407ms execution time
```

## Next Steps

Ready to proceed to **Task 2: Core Types** - Create branded types and Zod schemas in the data package.

## Migration File Details

The migration `20251012031357_add_competition_tables/migration.sql` includes:

**Tables Created:**

- `Competition` - 19 columns with defaults for `isCancelled` (false) and `maxParticipants` (50)
- `CompetitionParticipant` - 7 columns with foreign keys to Competition (CASCADE) and Player
- `CompetitionSnapshot` - 6 columns with foreign keys to Competition (CASCADE) and Player
- `ServerPermission` - 6 columns for permission management

**Indexes Created:**

- `Competition_serverId_isCancelled_idx` - Query optimization for active competitions
- `CompetitionParticipant_competitionId_status_idx` - Query optimization for participant filtering

**Unique Constraints:**

- `Competition_serverId_ownerId_key` - One active competition per owner per server
- `CompetitionParticipant_competitionId_playerId_key` - No duplicate participants
- `CompetitionSnapshot_competitionId_playerId_snapshotType_key` - One snapshot per type
- `ServerPermission_serverId_discordUserId_permission_key` - No duplicate permissions

**Foreign Keys:**

- Competition participants CASCADE delete when competition deleted
- Competition snapshots CASCADE delete when competition deleted
- Player relations use RESTRICT to prevent orphaned data

## Notes

- All unique constraints working as expected
- Cascade deletes properly configured and tested
- Foreign key constraints enforced
- Schema is production-ready with proper migration
- Migration file version controlled for production deployments
- Integration tests provide comprehensive coverage
