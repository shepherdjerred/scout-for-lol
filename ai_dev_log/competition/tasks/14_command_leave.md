# Task 14: Command - Competition Leave

## Overview

Implement `/competition leave` command for users to opt out of competitions. This is a soft delete that sets status to LEFT.

## Dependencies

- Task 6 (Competition queries)
- Task 7 (Participant management)
- Task 9 (Command structure)

## Files to Create/Modify

- `packages/backend/src/discord/commands/competition/leave.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria

1. Subcommand with option:
   - `competition-id` (required integer)
2. Validation:
   - Competition exists
   - User is a participant (JOINED or INVITED status)
3. Update participant status to LEFT
4. Set leftAt timestamp
5. Success message confirms leave
6. Cannot rejoin after leaving (business rule)

## Example Command Usage

### Example 1: Leave competition (success)

**Input:**

```
/competition leave competition-id:42
```

**Output (Success):**

```
✅ You've left the competition

You're no longer participating in **January Grind Challenge**.

Note: You cannot rejoin a competition after leaving.
```

### Example 2: Leave when not a participant

**Input:**

```
/competition leave competition-id:42
```

**Output (Error):**

```
❌ Not a participant

You're not in this competition. Use `/competition list` to see competitions you can join.
```

### Example 3: Leave after already leaving

**Input:**

```
/competition leave competition-id:42
```

**Output (Error):**

```
❌ Not a participant

You're not in this competition. Use `/competition list` to see competitions you can join.
```

## Test Cases

### Integration Tests

File: `packages/backend/src/discord/commands/competition/leave.integration.test.ts`

1. **Leave joined competition**
   - User is JOINED
   - User executes leave → succeeds
   - Status updated to LEFT
   - leftAt timestamp set
   - joinedAt preserved

2. **Leave invited competition**
   - User is INVITED (hasn't joined yet)
   - User executes leave → succeeds
   - Status updated to LEFT
   - Can decline invitation this way

3. **Leave non-participant competition**
   - User not participant
   - User tries to leave → fails
   - Error explains not a participant

4. **Leave already left competition**
   - User status already LEFT
   - User tries to leave again → idempotent or error
   - Clear message either way

5. **Cannot rejoin after leaving**
   - User leaves competition
   - User tries to join again → fails
   - Error explains cannot rejoin

6. **Leave completed competition**
   - Competition status ENDED
   - User tries to leave → succeeds (allowed, even if ended)
   - Historical record maintained

## Example Implementation

```typescript
export async function executeCompetitionLeave(interaction: ChatInputCommandInteraction) {
  const competitionId = interaction.options.getInteger("competition-id", true);
  const userId = interaction.user.id;
  const serverId = interaction.guildId!;

  const competition = await getCompetitionById(competitionId);

  if (!competition) {
    await interaction.reply({
      content: "Competition not found",
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
      content: "Player account not found",
      ephemeral: true,
    });
    return;
  }

  // Check participation
  const participant = await prisma.competitionParticipant.findUnique({
    where: {
      competitionId_playerId: { competitionId, playerId: player.id },
    },
  });

  if (!participant || participant.status === "LEFT") {
    await interaction.reply({
      content: "You are not a participant in this competition",
      ephemeral: true,
    });
    return;
  }

  await removeParticipant(competitionId, player.id);

  await interaction.reply({
    content: `You've left the competition: **${competition.title}**`,
    ephemeral: true,
  });
}
```

## Validation

- Run `bun run typecheck:all`
- Test in Discord
- Verify leave → rejoin fails
