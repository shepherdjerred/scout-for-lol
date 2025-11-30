# Task 9: Command - Competition Create

## Overview

Implement the `/competition create` Discord slash command. This is the primary entry point for users to create new competitions with full validation and permission checking.

## Dependencies

- Task 2 (Core types)
- Task 3 (Criteria types)
- Task 5 (Validation)
- Task 6 (Competition queries)
- Task 8 (Permission system)

## Files to Create/Modify

- `packages/backend/src/discord/commands/competition/create.ts` (new file)
- `packages/backend/src/discord/commands/competition/index.ts` (new file)
- `packages/backend/src/discord/commands/index.ts` - register new command

## Acceptance Criteria

1. Slash command defined with all options:
   - `title` (required string, max 100 chars)
   - `description` (required string, max 500 chars)
   - `criteria-type` (required choice from all 6 types)
   - `channel` (required channel)
   - `visibility` (required choice: OPEN/INVITE_ONLY/SERVER_WIDE)
   - `start-date` (optional string, ISO format)
   - `end-date` (optional string, ISO format)
   - `season` (optional string)
   - Plus criteria-specific options (queue, champion-id, min-games)
2. Command validates all inputs through Zod schemas
3. Permission check enforced (admin or granted)
4. Rate limit check enforced
5. Business validation called (dates, limits)
6. Competition created in database
7. User-friendly error messages with zod-validation-error
8. Success response with competition ID
9. Command registered in Discord

## Implementation Notes

- Use conditional options based on criteria type (Discord limitations: show all, validate later)
- Parse ISO date strings with `new Date()` and validate
- Store criteria as JSON string in DB
- Set default visibility to OPEN
- Set default maxParticipants to 50

## Test Cases

### Unit Tests

File: `packages/backend/src/discord/commands/competition/create.test.ts`

1. **Input validation - title**
   - Valid title → passes
   - Empty title → fails
   - Title > 100 chars → fails

2. **Input validation - dates**
   - Valid ISO date string → parses correctly
   - Invalid date format → fails with clear error
   - Start after end → fails validation

3. **Input validation - criteria**
   - MOST_GAMES_PLAYED with queue → valid
   - MOST_GAMES_PLAYED without queue → fails
   - MOST_WINS_CHAMPION with championId → valid
   - MOST_WINS_CHAMPION without championId → fails

### Integration Tests

File: `packages/backend/src/discord/commands/competition/create.integration.test.ts`

4. **Command execution - success**
   - Admin creates competition with fixed dates → succeeds
   - Competition saved to database
   - Response includes competition ID and join instructions
   - Response ephemeral
   - Response matches expected format exactly

5. **Command execution - permission denied**
   - Non-admin without grant tries to create → fails
   - Error message explains permission required

6. **Command execution - rate limited**
   - User creates competition
   - Same user tries again immediately → fails
   - Error message explains 1 hour limit

7. **Command execution - validation errors**
   - User exceeds active competition limit → fails
   - User already has active competition → fails
   - Server has 5 active competitions → fails

8. **Command execution - criteria types**
   - Create with each criteria type → all succeed
   - Verify criteria stored and parsed correctly

## Example Implementation

```typescript
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.ts";
import { z } from "zod";

export const competitionCreateCommand = new SlashCommandBuilder()
  .setName("competition")
  .setDescription("Competition management")
  .addSubcommand(
    (subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new competition")
        .addStringOption((option) =>
          option.setName("title").setDescription("Competition title").setRequired(true).setMaxLength(100),
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("Competition description").setRequired(true).setMaxLength(500),
        )
        .addStringOption((option) =>
          option
            .setName("criteria-type")
            .setDescription("What to rank participants on")
            .setRequired(true)
            .addChoices(
              { name: "Most Games Played", value: "MOST_GAMES_PLAYED" },
              { name: "Highest Rank", value: "HIGHEST_RANK" },
              { name: "Most Rank Climb", value: "MOST_RANK_CLIMB" },
              { name: "Most Wins (Player)", value: "MOST_WINS_PLAYER" },
              { name: "Most Wins (Champion)", value: "MOST_WINS_CHAMPION" },
              { name: "Highest Win Rate", value: "HIGHEST_WIN_RATE" },
            ),
        )
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Channel for leaderboard updates").setRequired(true),
        ),
    // ... more options
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function executeCompetitionCreate(interaction: ChatInputCommandInteraction) {
  // Permission check, validation, creation logic
}
```

## Validation

- Run `bun run typecheck:all`
- Test command in Discord (manual testing)
- Run `bun test packages/backend/src/discord/commands/competition/`
- Verify command appears in Discord with autocomplete
