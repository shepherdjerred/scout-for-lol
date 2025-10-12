# Task 16: Command - Competition View with Leaderboard

## Overview
Implement `/competition view` command to show detailed competition information and current leaderboard standings.

## Dependencies
- Task 2 (Core types)
- Task 6 (Competition queries)
- Task 7 (Participant management)
- Task 9 (Command structure)
- Task 19 (Leaderboard calculation) - for real-time rankings

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/view.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with option:
   - `competition-id` (required integer)
2. Display comprehensive information:
   - Title, description
   - Status, dates
   - Criteria type and configuration
   - Participant count / limit
   - Owner
   - Channel
3. Show current leaderboard:
   - Top 10 participants with ranks
   - User's rank if outside top 10
   - Scores/values based on criteria
4. Handle DRAFT status (no leaderboard yet)
5. Beautiful Discord embed formatting
6. Ephemeral response

## Example Command Usage

### Example 1: View ACTIVE competition with leaderboard
**Input:**
```
/competition view competition-id:42
```

**Output (Embed):**
```
🏆 January Grind Challenge
━━━━━━━━━━━━━━━━━━━━━
Who can play the most solo queue games this month?

Status: 🟢 Active (15 days remaining)
Participants: 12/50
Owner: @CompetitionHost
Channel: #competitions

📊 Current Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. PlayerOne - 47 games
🥈 2. ProGamer - 45 games
🥉 3. GrindMaster - 42 games
   4. TryHard99 - 38 games
   5. RankClimber - 35 games
   6. SoloCarry - 32 games
   7. MidLaner - 28 games
   8. JungleDiff - 25 games
   9. ADCMain - 22 games
   10. SupportKing - 20 games

Your Position
   11. YourUsername - 18 games

Most games played in Solo Queue • Updated Jan 23, 2025 at 3:45 PM
```

### Example 2: View DRAFT competition (not started)
**Input:**
```
/competition view competition-id:43
```

**Output (Embed):**
```
🏆 Yasuo Masters
━━━━━━━━━━━━━━━━━━━━━
Most wins with Yasuo

Status: 🔵 Draft (starts in 7 days)
Participants: 3/50
Owner: @YasuoMain
Channel: #yasuo-challenge

👥 Participants
━━━━━━━━━━━━━━━━━━━━━
• PlayerOne
• YasuoMaster
• WindWallGod

📊 Leaderboard
━━━━━━━━━━━━━━━━━━━━━
Leaderboard will be available when the competition starts on January 20th at 00:00 UTC.

Most wins with Yasuo • Competition ID: 43
```

### Example 3: View ENDED competition
**Input:**
```
/competition view competition-id:40
```

**Output (Embed):**
```
🏆 December Climbing Challenge
━━━━━━━━━━━━━━━━━━━━━
Reach the highest rank in flex queue

Status: 🔴 Ended (Completed Dec 31, 2024)
Participants: 25/50
Owner: @AdminUser

🎉 Final Standings
━━━━━━━━━━━━━━━━━━━━━
🥇 1. ClimbKing - Diamond I (85 LP)
🥈 2. RankPusher - Diamond II (67 LP)
🥉 3. FlexQueen - Diamond III (42 LP)
   4. TryHard - Platinum I (91 LP)
   5. Determined - Platinum I (76 LP)

(Showing top 5 of 25 participants)

Highest rank in Flex Queue • Competition ID: 40
```

### Example 4: View non-existent competition
**Input:**
```
/competition view competition-id:999
```

**Output (Error):**
```
❌ Competition not found

Competition #999 doesn't exist. Use `/competition list` to see all available competitions.
```

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/view.integration.test.ts`

1. **View DRAFT competition**
   - Execute view on DRAFT competition
   - Shows details but indicates leaderboard not available yet
   - Shows participant list instead
   - Embed color is Blue (0x5865F2)
   - Status field shows "🔵 Draft (starts in X days)"
   - Embed format matches expected DRAFT example exactly

2. **View ACTIVE competition**
   - Execute view on ACTIVE competition
   - Shows current leaderboard with rankings
   - Top 10 displayed
   - Scores shown for each participant
   - Embed color is Green (0x57F287)
   - Uses medal emojis (🥇🥈🥉) for top 3
   - Footer includes criteria description and timestamp
   - Embed format matches expected ACTIVE example exactly

3. **View ENDED competition**
   - Execute view on ENDED competition
   - Shows final leaderboard
   - Indicates competition has ended

4. **View CANCELLED competition**
   - Execute view on CANCELLED competition
   - Shows cancellation status
   - May show leaderboard snapshot if available

5. **View with user in top 10**
   - Viewing user is rank 5
   - Leaderboard shows ranks 1-10 including user

6. **View with user outside top 10**
   - Viewing user is rank 15
   - Shows top 10 + user's position separately

7. **View non-existent competition**
   - Invalid ID → error message
   - Clear explanation

8. **Different criteria types**
   - View MOST_GAMES_PLAYED → shows game counts
   - View HIGHEST_RANK → shows rank tiers
   - View MOST_WINS_CHAMPION → shows wins + champion name

## Example Implementation
```typescript
export async function executeCompetitionView(
  interaction: ChatInputCommandInteraction
) {
  const competitionId = interaction.options.getInteger('competition-id', true);

  const competition = await getCompetitionById(competitionId);

  if (!competition) {
    await interaction.reply({
      content: 'Competition not found',
      ephemeral: true,
    });
    return;
  }

  const status = getCompetitionStatus(competition);
  const participants = await getParticipants(competitionId, 'JOINED');

  const embed = new EmbedBuilder()
    .setTitle(competition.title)
    .setDescription(competition.description)
    .addFields(
      { name: 'Status', value: status, inline: true },
      { name: 'Participants', value: `${participants.length}/${competition.maxParticipants}`, inline: true },
      { name: 'Owner', value: `<@${competition.ownerId}>`, inline: true }
    );

  if (status === 'DRAFT') {
    embed.addFields({
      name: 'Leaderboard',
      value: 'Competition has not started yet',
    });
  } else {
    // Calculate leaderboard
    const leaderboard = await calculateLeaderboard(competition);

    embed.addFields({
      name: 'Leaderboard',
      value: leaderboard.slice(0, 10).map((entry, idx) =>
        `${idx + 1}. ${entry.playerName}: ${entry.score}`
      ).join('\n'),
    });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord
- Verify embed formatting
- Test all competition statuses
