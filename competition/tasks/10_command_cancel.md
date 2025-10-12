# Task 10: Command - Competition Cancel

## Overview
Implement `/competition cancel` command allowing owners or admins to cancel a competition. This sets the `isCancelled` flag and prevents further modifications.

## Dependencies
- Task 6 (Competition queries)
- Task 9 (Command structure)

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/cancel.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with single option:
   - `competition-id` (required integer)
2. Permission check: only owner or server admin can cancel
3. Competition validation: must exist and not already cancelled
4. Database update: set `isCancelled = true`, update `updatedTime`
5. Success confirmation message
6. Notification posted to competition channel
7. Ephemeral error messages

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/cancel.integration.test.ts`

1. **Owner cancels their competition**
   - Owner executes cancel → succeeds
   - Competition isCancelled set to true
   - Success message sent

2. **Admin cancels any competition**
   - Admin (not owner) executes cancel → succeeds
   - Works regardless of owner

3. **Non-owner, non-admin tries to cancel**
   - Regular user executes cancel → fails
   - Error message explains permission denied

4. **Cancel non-existent competition**
   - Invalid competition ID → fails
   - Error message explains not found

5. **Cancel already cancelled competition**
   - Execute cancel on cancelled competition → idempotent
   - Success message (no error)

6. **Channel notification**
   - Cancel competition → notification posted to competition channel
   - Notification mentions competition was cancelled

## Example Implementation
```typescript
export async function executeCompetitionCancel(
  interaction: ChatInputCommandInteraction
) {
  const competitionId = interaction.options.getInteger('competition-id', true);
  const userId = interaction.user.id;
  
  const competition = await getCompetitionById(competitionId);
  
  if (!competition) {
    await interaction.reply({
      content: 'Competition not found',
      ephemeral: true,
    });
    return;
  }
  
  // Check permissions
  const member = interaction.member;
  const isOwner = competition.ownerId === userId;
  const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
  
  if (!isOwner && !isAdmin) {
    await interaction.reply({
      content: 'Only the competition owner or server administrators can cancel competitions',
      ephemeral: true,
    });
    return;
  }
  
  await cancelCompetition(competitionId);
  
  await interaction.reply({
    content: `Competition "${competition.title}" has been cancelled`,
    ephemeral: true,
  });
  
  // Post to channel
  const channel = await interaction.client.channels.fetch(competition.channelId);
  if (channel?.isTextBased()) {
    await channel.send(`🚫 Competition **${competition.title}** has been cancelled by <@${userId}>`);
  }
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord
- Run integration tests

