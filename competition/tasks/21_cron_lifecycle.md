# Task 21: Cron Job - Competition Lifecycle Management

## Overview
Implement hourly cron job to manage competition state transitions. This handles starting competitions (DRAFT → ACTIVE) and ending competitions (ACTIVE → ENDED).

## Dependencies
- Task 6 (Competition queries)
- Task 20 (Snapshot system)

## Files to Create/Modify
- `packages/backend/src/league/tasks/competition/lifecycle.ts` (new file)
- `packages/backend/src/league/cron.ts` - add new cron job

## Acceptance Criteria
1. Cron job runs every hour
2. Handles competition starts:
   - Find DRAFT competitions where startDate <= now
   - Create START snapshots for all participants
   - Post "competition started" message to channel
3. Handles competition ends:
   - Find ACTIVE competitions where endDate <= now
   - Create END snapshots for all participants
   - Post final leaderboard to channel
4. Handles errors gracefully (one competition failure doesn't break others)
5. Logs all state transitions
6. Updates metrics for monitoring

## Test Cases

### Unit Tests
File: `packages/backend/src/league/tasks/competition/lifecycle.test.ts`

1. **Find competitions to start**
   - Current time: 2025-01-15 12:00
   - Competition A: starts 2025-01-15 11:00 (should start)
   - Competition B: starts 2025-01-15 13:00 (too early)
   - Competition C: cancelled (skip)
   - Returns only A

2. **Find competitions to end**
   - Current time: 2025-01-15 12:00
   - Competition A: ends 2025-01-15 11:00 (should end)
   - Competition B: ends 2025-01-15 13:00 (not yet)
   - Competition C: already ended (skip)
   - Returns only A

### Integration Tests
File: `packages/backend/src/league/tasks/competition/lifecycle.integration.test.ts`

3. **Start competition**
   - Create DRAFT competition with startDate in past
   - Run lifecycle job
   - START snapshots created for all participants
   - Channel notification sent
   - Status is now ACTIVE

4. **End competition**
   - Create ACTIVE competition with endDate in past
   - Run lifecycle job
   - END snapshots created for all participants
   - Final leaderboard posted to channel
   - Status is now ENDED

5. **Multiple competitions simultaneously**
   - 3 competitions need to start
   - 2 competitions need to end
   - Run lifecycle job
   - All 5 processed correctly
   - Separate notifications for each

6. **Handle snapshot creation failure**
   - Competition should start
   - Snapshot creation fails for one participant
   - Logs error but continues
   - Other participants get snapshots

7. **Handle channel deletion**
   - Competition's channel was deleted
   - Try to post start notification → fails gracefully
   - Log warning
   - Competition still transitions

8. **No competitions to process**
   - No competitions need transitions
   - Run lifecycle job
   - Completes quickly
   - Logs "no competitions to process"

## Example Implementation
```typescript
import { CronJob } from 'cron';

export async function runLifecycleCheck() {
  console.log('[CompetitionLifecycle] Running lifecycle check');
  
  const now = new Date();
  
  // Handle starts
  await handleCompetitionStarts(now);
  
  // Handle ends
  await handleCompetitionEnds(now);
  
  console.log('[CompetitionLifecycle] Lifecycle check complete');
}

async function handleCompetitionStarts(now: Date) {
  const competitionsToStart = await prisma.competition.findMany({
    where: {
      isCancelled: false,
      startDate: { lte: now },
      // Don't have START snapshots yet (indicates not started)
      snapshots: {
        none: {
          snapshotType: 'START',
        },
      },
    },
  });
  
  for (const competition of competitionsToStart) {
    try {
      console.log(`[CompetitionLifecycle] Starting competition ${competition.id}: ${competition.title}`);
      
      const parsed = parseCompetition(competition);
      
      // Create START snapshots
      await createSnapshotsForAllParticipants(
        competition.id,
        'START',
        parsed.criteria
      );
      
      // Post to channel
      await postCompetitionStarted(competition);
      
      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id} started successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error starting competition ${competition.id}:`, error);
    }
  }
}

async function handleCompetitionEnds(now: Date) {
  const competitionsToEnd = await prisma.competition.findMany({
    where: {
      isCancelled: false,
      endDate: { lte: now },
      // Have START snapshots (indicates started)
      snapshots: {
        some: {
          snapshotType: 'START',
        },
      },
      // Don't have END snapshots yet
      snapshots: {
        none: {
          snapshotType: 'END',
        },
      },
    },
  });
  
  for (const competition of competitionsToEnd) {
    try {
      console.log(`[CompetitionLifecycle] Ending competition ${competition.id}: ${competition.title}`);
      
      const parsed = parseCompetition(competition);
      
      // Create END snapshots
      await createSnapshotsForAllParticipants(
        competition.id,
        'END',
        parsed.criteria
      );
      
      // Calculate and post final leaderboard
      const leaderboard = await calculateLeaderboard(parsed);
      await postFinalLeaderboard(competition, leaderboard);
      
      console.log(`[CompetitionLifecycle] ✅ Competition ${competition.id} ended successfully`);
    } catch (error) {
      console.error(`[CompetitionLifecycle] ❌ Error ending competition ${competition.id}:`, error);
    }
  }
}

// Add to cron.ts
export function startCronJobs() {
  // ... existing cron jobs
  
  console.log('📅 Setting up competition lifecycle job (every hour)');
  new CronJob(
    '0 0 * * * *', // Every hour at :00
    logErrors(runLifecycleCheck),
    undefined,
    true,
    'America/Los_Angeles'
  );
}
```

## Validation
- Run `bun run typecheck:all`
- Run integration tests
- Test manually by creating competition with near-future dates
- Verify cron job executes hourly

