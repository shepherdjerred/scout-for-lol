# Task 20: Snapshot System - State Capture

## Overview
Implement snapshot creation and retrieval system to capture player state at competition boundaries (start/end). This is essential for criteria like rank climb.

## Dependencies
- Task 4 (Snapshot schemas)
- Task 18 (Criteria processors - to know what data to capture)

## Files to Create/Modify
- `packages/backend/src/league/competition/snapshots.ts` (new file)

## Acceptance Criteria
1. `createSnapshot()` function implemented:
   - Input: competitionId, playerId, snapshotType, criteria
   - Fetches current player state from Riot API
   - Validates with appropriate schema
   - Stores as JSON in CompetitionSnapshot
2. `getSnapshot()` function to retrieve snapshots
3. Snapshot data varies by criteria type:
   - Rank criteria → captures current rank
   - Games played → captures current game counts
   - Wins → captures current win counts
4. Handles API failures gracefully
5. Idempotent (re-creating snapshot updates existing)
6. Bulk snapshot creation for all participants

## Test Cases

### Unit Tests
File: `packages/backend/src/league/competition/snapshots.test.ts`

1. **Snapshot data structure - rank criteria**
   - Criteria is HIGHEST_RANK
   - Mock API returns rank data
   - Snapshot validates against RankSnapshotDataSchema
   - Stored correctly as JSON

2. **Snapshot data structure - games criteria**
   - Criteria is MOST_GAMES_PLAYED
   - Mock API returns match history
   - Snapshot validates against GamesPlayedSnapshotDataSchema
   - Game counts accurate

### Integration Tests
File: `packages/backend/src/league/competition/snapshots.integration.test.ts`

3. **Create START snapshot**
   - Competition begins
   - Create START snapshot for participant
   - Snapshot stored in database
   - snapshotType = START

4. **Create END snapshot**
   - Competition ends
   - Create END snapshot for participant
   - Both START and END snapshots exist
   - Can retrieve both

5. **Idempotent snapshot creation**
   - Create START snapshot twice
   - Second call updates existing
   - Only one snapshot record exists

6. **Bulk snapshot creation**
   - Competition with 10 participants
   - Create snapshots for all at once
   - All 10 snapshots created
   - Efficient (minimal API calls)

7. **Handle API failure**
   - Riot API unavailable
   - Snapshot creation logs error
   - Doesn't crash entire process
   - Can retry later

8. **Retrieve non-existent snapshot**
   - Query snapshot that doesn't exist
   - Returns null (not error)

9. **Different criteria types**
   - Create snapshots for each criteria type
   - Correct schema used for each
   - Data structure matches criteria needs

## Example Implementation
```typescript
import { match } from 'ts-pattern';

export async function createSnapshot(
  competitionId: number,
  playerId: number,
  snapshotType: SnapshotType,
  criteria: CompetitionCriteria
): Promise<void> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { accounts: true },
  });
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  // Get snapshot data based on criteria
  const snapshotData = await fetchSnapshotData(player, criteria);
  
  // Validate with appropriate schema
  const schema = getSnapshotSchemaForCriteria(criteria);
  const validated = schema.parse(snapshotData);
  
  // Store in database (upsert for idempotency)
  await prisma.competitionSnapshot.upsert({
    where: {
      competitionId_playerId_snapshotType: {
        competitionId,
        playerId,
        snapshotType,
      },
    },
    update: {
      snapshotData: JSON.stringify(validated),
      snapshotTime: new Date(),
    },
    create: {
      competitionId,
      playerId,
      snapshotType,
      snapshotData: JSON.stringify(validated),
      snapshotTime: new Date(),
    },
  });
}

async function fetchSnapshotData(
  player: PlayerWithAccounts,
  criteria: CompetitionCriteria
): Promise<unknown> {
  return match(criteria)
    .with({ type: 'HIGHEST_RANK' }, () => fetchRankData(player))
    .with({ type: 'MOST_RANK_CLIMB' }, () => fetchRankData(player))
    .with({ type: 'MOST_GAMES_PLAYED' }, () => fetchGamesPlayedData(player))
    .with({ type: 'MOST_WINS_PLAYER' }, () => fetchWinsData(player))
    .with({ type: 'MOST_WINS_CHAMPION' }, (c) => fetchWinsData(player, c.championId))
    .with({ type: 'HIGHEST_WIN_RATE' }, () => fetchWinsData(player))
    .exhaustive();
}

export async function createSnapshotsForAllParticipants(
  competitionId: number,
  snapshotType: SnapshotType,
  criteria: CompetitionCriteria
): Promise<void> {
  const participants = await getParticipants(competitionId, 'JOINED');
  
  await Promise.all(
    participants.map(p =>
      createSnapshot(competitionId, p.playerId, snapshotType, criteria)
    )
  );
}
```

## Validation
- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/league/competition/snapshots.test.ts`
- Test with real Riot API
- Verify idempotency

