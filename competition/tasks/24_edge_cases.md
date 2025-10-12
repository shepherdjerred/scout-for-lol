# Task 24: Edge Cases and Error Handling

## Overview
Handle edge cases and failure scenarios that aren't covered in the main implementation tasks. This ensures robustness and good user experience even when things go wrong.

## Dependencies
- All previous tasks (comprehensive testing)

## Files to Modify
- Various files to add error handling
- `packages/backend/src/league/competition/edge-cases.ts` (new file for utilities)

## Acceptance Criteria
1. **Channel deleted**:
   - Detect deleted channels before posting
   - Log warning, notify owner via DM
   - Competitions with deleted channels marked (optional flag)
2. **Participant leaves server**:
   - Keep participant in competition
   - Mark as "inactive" in leaderboard display
   - Display with strikethrough or indicator
3. **Owner leaves server**:
   - Transfer ownership to oldest admin participant
   - If no admin, transfer to oldest participant
   - Log ownership transfer
4. **S3 unavailable**:
   - Catch S3 errors gracefully
   - Show "leaderboard temporarily unavailable" message
   - Retry on next run
5. **Riot API failures**:
   - Cache last known ranks/data
   - Display stale data with timestamp
   - Retry with exponential backoff
6. **Zero participants at start**:
   - Auto-cancel with notification
   - Clear message to owner
7. **All participants leave**:
   - Mark competition as inactive
   - Stop daily updates
   - Can be manually cancelled
8. **Database connection loss**:
   - Graceful degradation
   - Queue operations for retry
   - Don't crash bot
9. **Invalid criteria configuration**:
   - Catch at creation time
   - Clear validation error messages
   - Prevent invalid competitions

## Test Cases

### Integration Tests
File: `packages/backend/src/league/competition/edge-cases.integration.test.ts`

1. **Channel deleted during competition**
   - Create competition
   - Delete channel
   - Daily update runs
   - Logs warning, skips posting
   - Owner receives DM notification

2. **Participant leaves server**
   - User joins competition
   - User leaves Discord server
   - Leaderboard calculated
   - User shows with "inactive" indicator
   - Doesn't crash

3. **Owner leaves server**
   - Owner creates competition
   - Owner leaves server
   - Ownership transferred to participant
   - Competition continues normally

4. **S3 temporarily unavailable**
   - Mock S3 to throw errors
   - Try to calculate leaderboard
   - Returns cached/default data
   - Logs error
   - Doesn't crash

5. **Riot API rate limited**
   - Mock API to return 429
   - Try to fetch rank data
   - Backs off exponentially
   - Eventually succeeds or fails gracefully

6. **Competition starts with zero participants**
   - Create competition
   - No one joins
   - Start time reached
   - Auto-cancelled
   - Owner notified

7. **All participants leave**
   - 3 users join competition
   - All 3 leave
   - Daily update checks
   - Shows "no active participants"
   - Suggests cancellation

8. **Invalid champion ID**
   - Create MOST_WINS_CHAMPION with championId=9999999
   - Validation catches error
   - Clear error message
   - Creation fails

9. **Concurrent join attempts**
   - Competition at maxParticipants - 1
   - Two users try to join simultaneously
   - One succeeds, one fails
   - No duplicate participants

10. **Season-based competition (future enhancement placeholder)**
    - Season not yet resolved
    - Status remains DRAFT
    - Can't calculate leaderboard

## Example Implementation
```typescript
// Channel validation
export async function validateChannelExists(
  client: Client,
  channelId: string
): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);
    return channel !== null && channel.isTextBased();
  } catch (error) {
    return false;
  }
}

// Ownership transfer
export async function transferOwnershipIfNeeded(
  competition: Competition
): Promise<void> {
  const guild = await client.guilds.fetch(competition.serverId);

  try {
    await guild.members.fetch(competition.ownerId);
    // Owner still in server, no transfer needed
    return;
  } catch (error) {
    // Owner left server, transfer ownership
    console.log(`[EdgeCases] Owner ${competition.ownerId} left server, transferring ownership`);

    const participants = await getParticipants(competition.id, 'JOINED');

    if (participants.length === 0) {
      // No participants, cancel competition
      await cancelCompetition(competition.id);
      return;
    }

    // Find admin participant or oldest participant
    const newOwner = findNewOwner(participants, guild);

    await prisma.competition.update({
      where: { id: competition.id },
      data: { ownerId: newOwner.discordId },
    });

    // Notify new owner
    const user = await client.users.fetch(newOwner.discordId);
    await user.send(
      `You've been made the owner of competition **${competition.title}** ` +
      `because the previous owner left the server.`
    );
  }
}

// S3 error handling
export async function queryMatchesSafely(
  startDate: Date,
  endDate: Date,
  puuids: string[]
): Promise<MatchDto[]> {
  try {
    return await queryMatchesByDateRange(startDate, endDate, puuids);
  } catch (error) {
    console.error('[EdgeCases] S3 query failed:', error);
    // Return empty array, will show as no data
    return [];
  }
}

// Participant activity check
export function markInactiveParticipants(
  leaderboard: RankedLeaderboardEntry[],
  guild: Guild
): RankedLeaderboardEntry[] {
  return leaderboard.map(entry => ({
    ...entry,
    isActive: guild.members.cache.has(entry.playerId.toString()),
  }));
}
```

## Validation
- Run `bun run typecheck:all`
- Run all integration tests
- Manual testing of edge cases
- Load testing with failures injected
- Verify graceful degradation
- Check logs for warnings/errors

## Documentation
Add troubleshooting section to README:
- What happens when channel deleted
- How ownership transfer works
- What to do if leaderboard unavailable
- Rate limit handling
