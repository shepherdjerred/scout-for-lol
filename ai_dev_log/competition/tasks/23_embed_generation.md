# Task 23: Embed Generation - Discord Formatting

## Overview

Implement functions to generate beautiful Discord embeds for leaderboards and competition information. This makes the bot output professional and easy to read.

## Dependencies

- Task 2 (Core types)
- Task 3 (Criteria types)
- Task 19 (Leaderboard calculation)

## Files to Create/Modify

- `packages/backend/src/discord/embeds/competition.ts` (new file)

## Acceptance Criteria

1. `generateLeaderboardEmbed()` function:
   - Input: Competition + RankedLeaderboardEntry[]
   - Output: EmbedBuilder
   - Shows top 10 + viewing user's position
   - Color-coded by status (green=ACTIVE, red=ENDED, etc.)
   - Includes competition details in footer
2. `generateCompetitionDetailsEmbed()` function:
   - Shows all competition metadata
   - Formatted dates
   - Criteria description in human-readable form
3. `formatCriteriaDescription()` helper:
   - Converts criteria object to readable text
   - Example: "Most games played in Solo Queue"
4. `formatScore()` helper:
   - Formats score based on criteria type
   - Games: "15 games"
   - Rank: "Diamond II"
   - Win rate: "75% (15-5)"

## Expected Embed Format Examples

These embeds are used in `/competition view` and daily updates. The actual Discord rendering will show these as rich embeds with colors, but here's the data structure:

### Example 1: Most Games Played - ACTIVE Competition

```
Title: 🏆 January Grind Challenge
Color: Green (#57F287)
Description: Who can play the most solo queue games this month?

Field: Status | Inline: Yes
🟢 Active (15 days remaining)

Field: Participants | Inline: Yes
12/50

Field: Owner | Inline: Yes
<@123456789>

Field: 📊 Current Standings | Inline: No
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

Footer: Most games played in Solo Queue • Updated Jan 23, 2025 at 3:45 PM
```

### Example 2: Highest Rank - With Change Indicators

```
Title: 🏆 Diamond Push Competition
Color: Green (#57F287)

Field: Status | Inline: Yes
🟢 Active (20 days remaining)

Field: Participants | Inline: Yes
8/50

Field: 📊 Current Standings | Inline: No
🥇 1. ClimbKing - Diamond I (85 LP)
🥈 2. RankPusher - Diamond II (67 LP)
🥉 3. FlexQueen - Diamond III (42 LP)
   4. TryHard - Platinum I (91 LP)
   5. Determined - Platinum I (76 LP)

Footer: Highest rank in Solo Queue • Updated Jan 23, 2025 at 3:45 PM
```

### Example 3: Most Wins Champion - With Win/Loss Records

```
Title: 🏆 Yasuo Masters
Color: Green (#57F287)
Description: Most wins with Yasuo

Field: 📊 Current Standings | Inline: No
🥇 1. WindWallGod - 12 wins (12-3, 80%)
🥈 2. YasuoMain - 10 wins (10-8, 56%)
🥉 3. MidLaner - 8 wins (8-4, 67%)
   4. FeedOrFeed - 7 wins (7-12, 37%)
   5. HasagiTime - 5 wins (5-2, 71%)

Footer: Most wins with Yasuo • Competition ID: 43
```

### Example 4: DRAFT Status - Participant List

```
Title: 🏆 February Flex Challenge
Color: Blue (#5865F2)
Description: Climb the flex queue ladder

Field: Status | Inline: Yes
🔵 Draft (starts in 7 days)

Field: Participants | Inline: Yes
3/50

Field: 👥 Participants | Inline: No
• PlayerOne
• YasuoMaster
• WindWallGod

Field: 📊 Leaderboard | Inline: No
Leaderboard will be available when the competition starts on February 1st at 00:00 UTC.

Footer: Highest rank in Flex Queue • Competition ID: 45
```

### Example 5: ENDED Status - Final Results

```
Title: 🏆 December Climbing Challenge
Color: Red (#ED4245)
Description: Reach the highest rank in flex queue

Field: Status | Inline: No
🔴 Ended (Completed Dec 31, 2024)

Field: 🎉 Final Standings | Inline: No
🥇 1. ClimbKing - Diamond I (85 LP)
🥈 2. RankPusher - Diamond II (67 LP)
🥉 3. FlexQueen - Diamond III (42 LP)
   4. TryHard - Platinum I (91 LP)
   5. Determined - Platinum I (76 LP)

(Showing top 5 of 25 participants)

Footer: Highest rank in Flex Queue • Competition ID: 40
```

### Color Codes by Status

```typescript
const STATUS_COLORS = {
  ACTIVE: 0x57f287, // Discord Green
  DRAFT: 0x5865f2, // Discord Blurple
  ENDED: 0xed4245, // Discord Red
  CANCELLED: 0x99aab5, // Discord Gray
};
```

### Medal Emojis

```typescript
const MEDAL_EMOJIS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
  other: "  ", // Two spaces for alignment
};
```

## Test Cases

### Unit Tests

File: `packages/backend/src/discord/embeds/competition.test.ts`

1. **Leaderboard embed structure**
   - Generate embed with sample data
   - Verify title includes competition name
   - Verify description contains rankings
   - Verify footer includes last updated time

2. **Leaderboard embed - top 10**
   - 15 participants
   - Embed shows top 10
   - Includes "..." indicator for more

3. **Leaderboard embed - user outside top 10**
   - User is rank 15
   - Embed shows top 10 + user's position separately
   - Clear visual separation

4. **Leaderboard embed - ties**
   - Two users tied for rank 2
   - Both shown with same rank number
   - Next rank is 4 (not 3)

5. **Format criteria - MOST_GAMES_PLAYED**
   - Criteria: { type: 'MOST_GAMES_PLAYED', queue: 'SOLO' }
   - Output: "Most games played in Solo Queue"

6. **Format criteria - MOST_WINS_CHAMPION**
   - Criteria: { type: 'MOST_WINS_CHAMPION', championId: 157 }
   - Output: "Most wins with Yasuo"
   - Champion name lookup

7. **Format score - games**
   - Score: 15
   - Criteria: MOST_GAMES_PLAYED
   - Output: "15 games"

8. **Format score - rank**
   - Score: { tier: 'DIAMOND', division: 'II', lp: 67 }
   - Output: "Diamond II (67 LP)"

9. **Format score - win rate**
   - Metadata: { wins: 15, games: 20 }
   - Output: "75.0% (15-5)"

10. **Embed color by status**
    - ACTIVE → Green
    - ENDED → Red
    - DRAFT → Blue
    - CANCELLED → Gray

## Example Implementation

```typescript
import { EmbedBuilder, Colors } from "discord.js";
import { match } from "ts-pattern";

export function generateLeaderboardEmbed(
  competition: CompetitionWithCriteria,
  leaderboard: RankedLeaderboardEntry[],
  viewingUserId?: string,
): EmbedBuilder {
  const status = getCompetitionStatus(competition);
  const color = getStatusColor(status);

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${competition.title}`)
    .setDescription(competition.description)
    .setColor(color);

  // Top 10
  const top10 = leaderboard.slice(0, 10);

  const leaderboardText = top10
    .map((entry) => {
      const medal = getMedalEmoji(entry.rank);
      const score = formatScore(entry.score, competition.criteria, entry.metadata);
      return `${medal} **${entry.rank}.** ${entry.playerName} - ${score}`;
    })
    .join("\n");

  embed.addFields({
    name: "Current Standings",
    value: leaderboardText || "No participants yet",
  });

  // User's position if outside top 10
  if (viewingUserId) {
    const userEntry = leaderboard.find((e) => e.playerId.toString() === viewingUserId);
    if (userEntry && userEntry.rank > 10) {
      const score = formatScore(userEntry.score, competition.criteria, userEntry.metadata);
      embed.addFields({
        name: "Your Position",
        value: `**${userEntry.rank}.** ${userEntry.playerName} - ${score}`,
      });
    }
  }

  // Footer
  embed.setFooter({
    text: `${formatCriteriaDescription(competition.criteria)} • Updated ${new Date().toLocaleString()}`,
  });

  return embed;
}

export function formatCriteriaDescription(criteria: CompetitionCriteria): string {
  return match(criteria)
    .with({ type: "MOST_GAMES_PLAYED" }, (c) => `Most games played in ${formatQueue(c.queue)}`)
    .with({ type: "HIGHEST_RANK" }, (c) => `Highest rank in ${formatQueue(c.queue)}`)
    .with({ type: "MOST_RANK_CLIMB" }, (c) => `Most rank climb in ${formatQueue(c.queue)}`)
    .with({ type: "MOST_WINS_PLAYER" }, (c) => `Most wins in ${formatQueue(c.queue)}`)
    .with({ type: "MOST_WINS_CHAMPION" }, (c) => `Most wins with ${getChampionName(c.championId)}`)
    .with({ type: "HIGHEST_WIN_RATE" }, (c) => `Highest win rate in ${formatQueue(c.queue)} (min ${c.minGames} games)`)
    .exhaustive();
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "  ";
}

function getStatusColor(status: CompetitionStatus): number {
  return match(status)
    .with("ACTIVE", () => Colors.Green)
    .with("DRAFT", () => Colors.Blue)
    .with("ENDED", () => Colors.Red)
    .with("CANCELLED", () => Colors.Grey)
    .exhaustive();
}
```

## Validation

- Run `bun run typecheck:all`
- Run unit tests
- Visual inspection in Discord
- Test with various criteria types
- Verify emoji display correctly
