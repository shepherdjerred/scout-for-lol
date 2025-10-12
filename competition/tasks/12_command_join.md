# Task 12: Command - Competition Join

## Overview
Implement `/competition join` command for users to opt into competitions. This is the primary participation mechanism.

## Dependencies
- Task 6 (Competition queries)
- Task 7 (Participant management)
- Task 9 (Command structure)

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/join.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with option:
   - `competition-id` (required integer)
2. Validation checks:
   - Competition exists
   - Competition is OPEN or user is INVITED
   - Competition is DRAFT or ACTIVE (not ENDED or CANCELLED)
   - User has linked Player account
   - Under participant limit
   - User not already joined
3. If status was INVITED, transition to JOINED
4. If new participant, create with JOINED status
5. Success message confirms join
6. Optional: Post to competition channel

## Example Command Usage

### Example 1: Join OPEN competition (success)
**Input:**
```
/competition join competition-id:42
```

**Output (Success):**
```
✅ You've joined the competition!

**January Grind Challenge**
Type: Most games played in Solo Queue
Participants: 8/50
Status: Starting in 2 days

Good luck! The leaderboard will be posted daily in #competitions.
```

### Example 2: Join when already joined
**Input:**
```
/competition join competition-id:42
```

**Output (Error):**
```
❌ Already participating

You're already in this competition! Check your current standing with:
`/competition view competition-id:42`
```

### Example 3: Join INVITE_ONLY without invitation
**Input:**
```
/competition join competition-id:43
```

**Output (Error):**
```
❌ Invitation required

This is an invite-only competition. Ask the competition owner (<@123456789>) to invite you with:
`/competition invite competition-id:43 user:@YourName`
```

### Example 4: Join without linked account
**Input:**
```
/competition join competition-id:42
```

**Output (Error):**
```
❌ No League account linked

You need to link your League of Legends account first. Use:
`/subscribe region:NA1 riot-id:YourName#NA1 alias:YourName channel:#updates`
```

### Example 5: Join when at participant limit
**Input:**
```
/competition join competition-id:42
```

**Output (Error):**
```
❌ Competition full

This competition has reached its maximum of 50 participants. The competition is full!
```

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/join.integration.test.ts`

1. **Join OPEN competition**
   - User executes join on OPEN competition → succeeds
   - Participant created with JOINED status
   - joinedAt timestamp set
   - Response message includes competition name and participant count
   - Response matches expected format: "✅ You've joined the competition!"

2. **Join INVITE_ONLY when invited**
   - User is INVITED to competition
   - User executes join → succeeds
   - Status transitions from INVITED to JOINED
   - joinedAt set, invitedAt preserved

3. **Join INVITE_ONLY without invitation**
   - User not invited
   - User tries to join INVITE_ONLY → fails
   - Error message starts with "❌ Invitation required"
   - Error explains how to get invited (mentions owner)

4. **Join when at participant limit**
   - Competition has maxParticipants=2
   - 2 users already joined
   - 3rd user tries to join → fails
   - Error explains limit reached

5. **Join already joined competition**
   - User already JOINED
   - User tries to join again → fails
   - Error explains already participant

6. **Join after leaving**
   - User joined then left (status=LEFT)
   - User tries to rejoin → fails
   - Error explains cannot rejoin after leaving

7. **Join CANCELLED competition**
   - Competition is cancelled
   - User tries to join → fails
   - Error explains competition cancelled

8. **Join without Player account**
   - Discord user has no linked Player
   - User tries to join → fails
   - Error message starts with "❌ No League account linked"
   - Error includes `/subscribe` command example
   - Message format matches expected output exactly

9. **SERVER_WIDE competition**
   - SERVER_WIDE visibility
   - Any server member can join → succeeds

## Example Implementation
```typescript
export async function executeCompetitionJoin(
  interaction: ChatInputCommandInteraction
) {
  const competitionId = interaction.options.getInteger('competition-id', true);
  const userId = interaction.user.id;
  const serverId = interaction.guildId!;

  const competition = await getCompetitionById(competitionId);

  if (!competition) {
    await interaction.reply({
      content: 'Competition not found',
      ephemeral: true,
    });
    return;
  }

  // Get user's Player
  const player = await prisma.player.findUnique({
    where: {
      serverId_discordId: { serverId, discordId: userId },
    },
  });

  if (!player) {
    await interaction.reply({
      content: 'You need to subscribe to a League account first using /subscribe',
      ephemeral: true,
    });
    return;
  }

  // Validate eligibility
  const eligibility = await canJoinCompetition(competitionId, player.id);

  if (!eligibility.allowed) {
    await interaction.reply({
      content: eligibility.reason,
      ephemeral: true,
    });
    return;
  }

  await addParticipant(competitionId, player.id, 'JOINED');

  await interaction.reply({
    content: `You've joined the competition: **${competition.title}**`,
    ephemeral: true,
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord with various scenarios
- All integration tests pass
