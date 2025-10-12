# Task 13: Command - Competition Invite

## Overview
Implement `/competition invite` command for competition owners to invite specific users to their competitions.

## Dependencies
- Task 6 (Competition queries)
- Task 7 (Participant management)
- Task 9 (Command structure)

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/invite.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with options:
   - `competition-id` (required integer)
   - `user` (required Discord user)
2. Permission: only competition owner can invite
3. Validation:
   - Competition exists and not cancelled/ended
   - Target user has linked Player account
   - Target user not already participant
   - Under participant limit
4. Creates participant with INVITED status
5. Sends DM to invited user
6. Success message to inviter

## Example Command Usage

### Example 1: Invite user (success)
**Input:**
```
/competition invite competition-id:43 user:@ProPlayer
```

**Output (Success to Inviter):**
```
✅ Invitation sent

Invited @ProPlayer to **Yasuo Masters**.
They can join with `/competition join competition-id:43`
```

**Output (DM to Invited User):**
```
📩 Competition Invitation

You've been invited to compete in **Yasuo Masters**!

Type: Most wins with Yasuo
Duration: Jan 20 - Feb 20, 2025
Owner: @CompetitionHost

To join, use:
`/competition join competition-id:43`
```

### Example 2: Non-owner tries to invite
**Input:**
```
/competition invite competition-id:43 user:@SomeUser
```

**Output (Error):**
```
❌ Permission denied

Only the competition owner can invite participants. The owner of this competition is <@123456789>.
```

### Example 3: Invite user without League account
**Input:**
```
/competition invite competition-id:43 user:@NewPlayer
```

**Output (Error):**
```
❌ Cannot invite user

@NewPlayer doesn't have a linked League of Legends account. They need to use `/subscribe` first.
```

### Example 4: DM delivery fails (privacy settings)
**Input:**
```
/competition invite competition-id:43 user:@ProPlayer
```

**Output (Success):**
```
✅ Invitation sent

Invited @ProPlayer to **Yasuo Masters**.
⚠️ Note: Could not send DM (user may have DMs disabled). Please notify them manually.
```

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/invite.integration.test.ts`

1. **Owner invites user**
   - Owner executes invite → succeeds
   - Participant created with INVITED status
   - invitedAt and invitedBy set correctly

2. **Non-owner tries to invite**
   - Non-owner executes invite → fails
   - Error explains only owner can invite

3. **Invite to OPEN competition**
   - OPEN competition
   - Owner invites user → succeeds
   - Works for any visibility type

4. **Invite already joined user**
   - User already JOINED
   - Owner tries to invite → fails
   - Error explains already participant

5. **Invite already invited user**
   - User already INVITED
   - Owner tries to invite again → idempotent (no error)
   - No duplicate records

6. **Invite user without Player account**
   - Target user has no linked account
   - Owner tries to invite → fails
   - Error explains target needs account

7. **Invite when at limit**
   - Competition at maxParticipants
   - Owner tries to invite → fails
   - Error explains limit reached

8. **DM notification**
   - Owner invites user → DM sent to user
   - DM includes competition details and join instructions
   - If DM fails (privacy settings), log warning but don't fail command

## Example Implementation
```typescript
export async function executeCompetitionInvite(
  interaction: ChatInputCommandInteraction
) {
  const competitionId = interaction.options.getInteger('competition-id', true);
  const targetUser = interaction.options.getUser('user', true);
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

  // Check ownership
  if (competition.ownerId !== userId) {
    await interaction.reply({
      content: 'Only the competition owner can invite participants',
      ephemeral: true,
    });
    return;
  }

  // Get target user's Player
  const player = await prisma.player.findUnique({
    where: {
      serverId_discordId: { serverId, discordId: targetUser.id },
    },
  });

  if (!player) {
    await interaction.reply({
      content: `${targetUser.username} doesn't have a linked League account`,
      ephemeral: true,
    });
    return;
  }

  await addParticipant(competitionId, player.id, 'INVITED', userId);

  // Send DM
  try {
    await targetUser.send(
      `You've been invited to compete in **${competition.title}**!\n` +
      `Use \`/competition join competition-id:${competitionId}\` to participate.`
    );
  } catch (error) {
    console.warn(`Failed to DM user ${targetUser.id}:`, error);
  }

  await interaction.reply({
    content: `Invited ${targetUser.username} to ${competition.title}`,
    ephemeral: true,
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord
- Verify DM received (or graceful failure)
