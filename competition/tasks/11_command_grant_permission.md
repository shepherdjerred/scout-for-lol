# Task 11: Command - Grant Permission

## Overview
Implement `/competition grant-permission` command for admins to delegate competition creation rights to other users.

## Dependencies
- Task 8 (Permission system)
- Task 9 (Command structure)

## Files to Create/Modify
- `packages/backend/src/discord/commands/competition/grant-permission.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` - add subcommand

## Acceptance Criteria
1. Subcommand with options:
   - `user` (required Discord user)
   - `permission` (optional choice, defaults to CREATE_COMPETITION)
2. Only server admins can execute
3. Creates ServerPermission record
4. Idempotent (granting twice doesn't error)
5. Success message confirms grant
6. Optional: DM user to notify them

## Test Cases

### Integration Tests
File: `packages/backend/src/discord/commands/competition/grant-permission.integration.test.ts`

1. **Admin grants permission**
   - Admin executes command → succeeds
   - ServerPermission created with correct fields
   - grantedBy set to admin's Discord ID
   - Success message sent

2. **Non-admin tries to grant**
   - Regular user executes command → fails
   - Error message explains admin required

3. **Grant to already granted user**
   - Grant permission twice → succeeds both times (idempotent)
   - Only one ServerPermission record exists

4. **Grant to self**
   - Admin grants to themselves → succeeds
   - No special handling needed

5. **Grant on different servers**
   - User A on Server 1 gets permission
   - User A on Server 2 doesn't have permission
   - Permissions are server-specific

## Example Implementation
```typescript
export const grantPermissionSubcommand = new SlashCommandSubcommandBuilder()
  .setName('grant-permission')
  .setDescription('Grant competition creation permission to a user')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('User to grant permission to')
      .setRequired(true)
  );

export async function executeGrantPermission(
  interaction: ChatInputCommandInteraction
) {
  // Check admin
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: 'Only administrators can grant permissions',
      ephemeral: true,
    });
    return;
  }
  
  const targetUser = interaction.options.getUser('user', true);
  const serverId = interaction.guildId!;
  
  await grantPermission(
    serverId,
    targetUser.id,
    'CREATE_COMPETITION',
    interaction.user.id
  );
  
  await interaction.reply({
    content: `Granted CREATE_COMPETITION permission to ${targetUser.username}`,
    ephemeral: true,
  });
}
```

## Validation
- Run `bun run typecheck:all`
- Test in Discord
- Verify permission works (user can create competition)

