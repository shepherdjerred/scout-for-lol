# Task 15: Command - Competition List

## Overview
Implement `/competition list` command to display all competitions on the server with filtering options.

## Dependencies
- Task 2 (Core types)
- Task 6 (Competition queries)
- Task 9 (Command structure)

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/list.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with optional filters:
   - `filter` (choice: all, active, my-competitions, ended)
   - `visibility` (choice: OPEN, INVITE_ONLY, SERVER_WIDE)
2. Returns formatted list with:
   - Competition ID
   - Title
   - Status (DRAFT, ACTIVE, ENDED, CANCELLED)
   - Participant count / max
   - Start and end dates
3. Pagination for long lists (use embeds)
4. Shows up to 25 competitions per page
5. Empty state message if no competitions
6. Sorted by status (ACTIVE first) then createdTime desc

## Example Command Usage

### Example 1: List all competitions
**Input:**
```
/competition list
```

**Output (Embed):**
```
📋 Competitions on MyServer
━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━
**#42** January Grind Challenge
Most games played in Solo Queue
Participants: 12/50 • Ends in 15 days

**#45** Diamond Push Competition
Highest rank in Solo Queue
Participants: 8/50 • Ends in 20 days

🔵 DRAFT
━━━━━━━━━━━━━━━━━━━━━━━━━
**#46** February Flex Challenge
Highest rank in Flex Queue
Participants: 3/50 • Starts in 7 days

🔴 ENDED (Recent)
━━━━━━━━━━━━━━━━━━━━━━━━━
**#40** December Climbing Challenge
Highest rank in Flex Queue
Completed Dec 31, 2024

Use `/competition view competition-id:42` for details
```

### Example 2: List with filter (active only)
**Input:**
```
/competition list filter:active
```

**Output (Embed):**
```
📋 Active Competitions on MyServer
━━━━━━━━━━━━━━━━━━━━━━━━━

**#42** January Grind Challenge
Most games played in Solo Queue
Participants: 12/50 • Ends in 15 days

**#45** Diamond Push Competition
Highest rank in Solo Queue
Participants: 8/50 • Ends in 20 days

Use `/competition join competition-id:42` to participate
```

### Example 3: List my competitions
**Input:**
```
/competition list filter:my-competitions
```

**Output (Embed):**
```
📋 Your Competitions
━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Competing In
━━━━━━━━━━━━━━━━━━━━━━━━━
**#42** January Grind Challenge
Your position: 11th place (18 games)

**#45** Diamond Push Competition
Your position: 3rd place (Diamond III)

👑 Owned By You
━━━━━━━━━━━━━━━━━━━━━━━━━
**#46** February Flex Challenge
Status: Draft • 3 participants
```

### Example 4: No competitions found
**Input:**
```
/competition list filter:active
```

**Output (Message):**
```
📋 No active competitions

There are no active competitions right now.

Create one with `/competition create` or check all competitions with `/competition list`.
```

### Example 5: Empty server
**Input:**
```
/competition list
```

**Output (Message):**
```
📋 No competitions yet

This server doesn't have any competitions yet. Be the first to create one!

Use `/competition create` to get started.
```

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/list.integration.test.ts`

1. **List all competitions**
   - Server has 5 competitions
   - Execute list → shows all 5
   - Sorted correctly

2. **Filter: active only**
   - Server has ACTIVE, DRAFT, ENDED, CANCELLED
   - Filter=active → shows only ACTIVE and DRAFT
   - Excludes ENDED and CANCELLED

3. **Filter: my competitions**
   - User owns 2 competitions
   - User participates in 3 others
   - Filter=my-competitions → shows all 5

4. **Filter: ended**
   - Server has ended competitions
   - Filter=ended → shows only ENDED

5. **Filter by visibility**
   - Server has OPEN and INVITE_ONLY competitions
   - Filter visibility=OPEN → shows only OPEN

6. **Empty server**
   - No competitions on server
   - Execute list → friendly message "No competitions yet"

7. **Pagination**
   - Server has 30 competitions
   - Shows first 25 with indicator for more
   - (Full pagination implementation optional for MVP)

## Example Implementation
```typescript
export async function executeCompetitionList(
  interaction: ChatInputCommandInteraction
) {
  const filter = interaction.options.getString('filter') ?? 'all';
  const serverId = interaction.guildId!;
  const userId = interaction.user.id;

  let competitions = await getCompetitionsByServer(serverId);

  // Apply filters
  if (filter === 'active') {
    competitions = competitions.filter(c => {
      const status = getCompetitionStatus(c);
      return status === 'ACTIVE' || status === 'DRAFT';
    });
  } else if (filter === 'my-competitions') {
    competitions = competitions.filter(c => {
      // Owner or participant
      return c.ownerId === userId || /* check participation */;
    });
  } else if (filter === 'ended') {
    competitions = competitions.filter(c => getCompetitionStatus(c) === 'ENDED');
  }

  if (competitions.length === 0) {
    await interaction.reply({
      content: 'No competitions found',
      ephemeral: true,
    });
    return;
  }

  // Format as embed
  const embed = new EmbedBuilder()
    .setTitle(`Competitions on ${interaction.guild?.name}`)
    .setDescription(
      competitions.slice(0, 25).map(c =>
        `**#${c.id}** ${c.title} [${getCompetitionStatus(c)}]\n` +
        `Participants: ${c.participants.length}/${c.maxParticipants}`
      ).join('\n\n')
    );

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord with various filters
- Verify embed formatting
