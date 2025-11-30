# Task 22: Cron Job - Daily Leaderboard Updates

## Overview

Implement daily cron job to post updated leaderboards for all active competitions. This keeps participants engaged with daily progress updates.

## Dependencies

- Task 19 (Leaderboard calculation)
- Task 23 (Embed generation)

## Files to Create/Modify

- `packages/backend/src/league/tasks/competition/daily-update.ts` (new file)
- `packages/backend/src/league/cron.ts` - add new cron job

## Acceptance Criteria

1. Cron job runs daily at midnight UTC
2. Finds all ACTIVE competitions
3. For each competition:
   - Calculate current leaderboard
   - Generate formatted embed
   - Post to competition channel
4. Handles errors per-competition (don't fail all if one fails)
5. Respects rate limits for Discord posting
6. Logs all updates
7. Updates metrics

## Expected Daily Leaderboard Post Format

The bot posts messages like this to the competition channel every day at midnight UTC:

### Example 1: Active competition - Mid-competition update

```
📊 **Daily Leaderboard Update** - January Grind Challenge

🏆 January Grind Challenge
━━━━━━━━━━━━━━━━━━━━━
Who can play the most solo queue games this month?

⏰ Day 8 of 16 • 🟢 Active

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. PlayerOne - 47 games (+5 today)
🥈 2. ProGamer - 45 games (+3 today)
🥉 3. GrindMaster - 42 games (+7 today)
   4. TryHard99 - 38 games (+2 today)
   5. RankClimber - 35 games (+4 today)
   6. SoloCarry - 32 games (+1 today)
   7. MidLaner - 28 games (+0 today)
   8. JungleDiff - 25 games (+6 today)
   9. ADCMain - 22 games (+2 today)
   10. SupportKing - 20 games (+1 today)

(Showing top 10 of 12 participants)

Most games played in Solo Queue • Updated Jan 23, 2025 at 00:00 UTC

💡 Use `/competition view competition-id:42` to see full standings
```

### Example 2: Active competition - HIGHEST_RANK criteria

```
📊 **Daily Leaderboard Update** - Diamond Push Competition

🏆 Diamond Push Competition
━━━━━━━━━━━━━━━━━━━━━

⏰ Day 12 of 30 • 🟢 Active

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. ClimbKing - Diamond I (85 LP) ⬆️ 2 divisions
🥈 2. RankPusher - Diamond II (67 LP) ⬆️ 1 division
🥉 3. FlexQueen - Diamond III (42 LP) ➡️ same
   4. TryHard - Platinum I (91 LP) ⬆️ 3 divisions
   5. Determined - Platinum I (76 LP) ⬆️ 1 division
   6. StuckInPlat - Platinum II (15 LP) ➡️ same
   7. Grinding - Platinum III (88 LP) ⬆️ 1 division
   8. AlmostThere - Platinum IV (52 LP) ➡️ same

Highest rank in Solo Queue • Updated Jan 23, 2025 at 00:00 UTC

💡 Use `/competition view competition-id:45` to see full standings
```

### Example 3: Active competition - MOST_WINS_CHAMPION criteria

```
📊 **Daily Leaderboard Update** - Yasuo Masters

🏆 Yasuo Masters
━━━━━━━━━━━━━━━━━━━━━
Most wins with Yasuo

⏰ Day 5 of 30 • 🟢 Active

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. WindWallGod - 12 wins (12-3, 80%) 🔥
🥈 2. YasuoMain - 10 wins (10-8, 56%)
🥉 3. MidLaner - 8 wins (8-4, 67%)
   4. FeedOrFeed - 7 wins (7-12, 37%)
   5. HasagiTime - 5 wins (5-2, 71%)

Most wins with Yasuo • Updated Jan 23, 2025 at 00:00 UTC

💡 Use `/competition view competition-id:43` to see full standings
```

### Example 4: Competition ending soon

```
📊 **Daily Leaderboard Update** - January Grind Challenge

⏰ 🚨 **FINAL DAY!** Competition ends in 24 hours!

🏆 January Grind Challenge
━━━━━━━━━━━━━━━━━━━━━

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. PlayerOne - 87 games
🥈 2. ProGamer - 85 games (2 games behind!)
🥉 3. GrindMaster - 82 games (5 games behind!)
   4. TryHard99 - 78 games
   5. RankClimber - 75 games

The competition ends tomorrow at 23:59 UTC. Get your final games in!

Most games played in Solo Queue • Updated Jan 30, 2025 at 00:00 UTC
```

### Example 5: No participants active

```
📊 **Daily Leaderboard Update** - Test Competition

🏆 Test Competition
━━━━━━━━━━━━━━━━━━━━━

⏰ Day 3 of 14 • 🟢 Active

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
No participants have played any games yet. Join with `/competition join competition-id:50`!

Updated Jan 23, 2025 at 00:00 UTC
```

## Test Cases

### Integration Tests

File: `packages/backend/src/league/tasks/competition/daily-update.integration.test.ts`

1. **Post update for active competition**
   - Create ACTIVE competition
   - Run daily update job
   - Leaderboard calculated
   - Embed posted to channel
   - Message contains current standings
   - Message format matches expected format exactly
   - Includes day count and status indicators

2. **Multiple active competitions**
   - 3 active competitions on different servers
   - Run daily update job
   - All 3 get leaderboard updates
   - Each posted to correct channel
   - Each message includes "📊 **Daily Leaderboard Update**" header
   - Each includes day count (e.g., "Day 8 of 16")

3. **Skip non-active competitions**
   - DRAFT, ENDED, CANCELLED competitions exist
   - Run daily update job
   - Only ACTIVE competitions processed
   - Others skipped

4. **Handle channel deletion**
   - Competition channel deleted
   - Run daily update job
   - Logs error
   - Doesn't crash
   - Continues to other competitions

5. **Handle zero participants**
   - Active competition with no participants
   - Run daily update job
   - Posts message indicating no participants
   - Or skips update

6. **Rate limit handling**
   - 50 active competitions
   - Run daily update job
   - Respects Discord rate limits
   - All eventually posted (may take time)

7. **No active competitions**
   - No ACTIVE competitions exist
   - Run daily update job
   - Completes quickly
   - Logs "no competitions to update"

8. **Message format verification**
   - Post includes all required sections
   - Uses correct emojis (🥇🥈🥉)
   - Includes status indicator (🟢 Active)
   - Shows day count correctly
   - Footer includes update timestamp
   - Message format matches expected examples exactly

## Example Implementation

```typescript
import { CronJob } from "cron";
import { EmbedBuilder } from "discord.ts";

export async function runDailyLeaderboardUpdate() {
  console.log("[DailyLeaderboard] Running daily leaderboard update");

  const activeCompetitions = await getActiveCompetitions();

  console.log(`[DailyLeaderboard] Found ${activeCompetitions.length} active competitions`);

  for (const competition of activeCompetitions) {
    try {
      console.log(`[DailyLeaderboard] Updating competition ${competition.id}: ${competition.title}`);

      const leaderboard = await calculateLeaderboard(competition);
      const embed = generateLeaderboardEmbed(competition, leaderboard);

      // Post to channel
      const channel = await client.channels.fetch(competition.channelId);

      if (!channel?.isTextBased()) {
        console.warn(`[DailyLeaderboard] Channel ${competition.channelId} not found or not text-based`);
        continue;
      }

      await channel.send({
        content: `📊 **Daily Leaderboard Update** - ${competition.title}`,
        embeds: [embed],
      });

      console.log(`[DailyLeaderboard] ✅ Updated competition ${competition.id}`);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[DailyLeaderboard] ❌ Error updating competition ${competition.id}:`, error);
    }
  }

  console.log("[DailyLeaderboard] Daily update complete");
}

// Add to cron.ts
export function startCronJobs() {
  // ... existing cron jobs

  console.log("📅 Setting up daily leaderboard update job (midnight UTC)");
  new CronJob(
    "0 0 0 * * *", // Daily at 00:00:00
    logErrors(runDailyLeaderboardUpdate),
    undefined,
    true,
    "UTC", // Explicitly UTC for consistency
  );
}
```

## Validation

- Run `bun run typecheck:all`
- Run integration tests
- Test manually with near-time cron (every minute for testing)
- Verify Discord messages posted correctly
- Check rate limit handling
