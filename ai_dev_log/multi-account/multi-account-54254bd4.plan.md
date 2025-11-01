<!-- 54254bd4-b60d-4cdc-84cd-3be60f71c604 8396c31c-a5e3-4499-8ab1-dcf10bfb308f -->
# Multi-Account Competition Selection with Best-of-Multi-Entry

## Overview

Enable players to select which League account(s) to use when joining a competition. Competitions can operate in two modes:

- **Single-entry mode** (default): Each player joins with one account
- **Multi-entry mode**: Each player can join with multiple accounts, appearing once on the leaderboard ranked by their BEST performance across all accounts

Account selection is stored in the database and used for match processing, snapshots, and leaderboards.

## Database Changes

### 1. Update Prisma Schema

**File:** `packages/backend/prisma/schema.prisma`

Add `allowMultipleEntries` to Competition and `accountId` to CompetitionParticipant:

```prisma
model Competition {
  // ... existing fields
  allowMultipleEntries Boolean @default(false)  // NEW: Allow players to join with multiple accounts
  // ... rest of fields
}

model CompetitionParticipant {
  id            Int      @id @default(autoincrement())
  competitionId Int
  playerId      Int
  accountId     Int      // NEW: Which account this participant entry uses
  status        String   // INVITED, JOINED, LEFT
  // ... rest of fields
  
  account       Account  @relation(fields: [accountId], references: [id])
  // ... rest of relations
  
  @@unique([competitionId, accountId])  // Prevents same account joining twice
  @@index([competitionId, playerId, status])  // For querying all accounts per player
}

model Account {
  // ... existing fields
  competitionParticipants CompetitionParticipant[]  // NEW reverse relation
}
```

**Key design:**

- Player can have multiple participant entries (one per account)
- Unique constraint on `[competitionId, accountId]` prevents account duplication
- Single-entry mode enforced in application logic: check player has only one JOINED entry
- Multi-entry mode: player can have multiple JOINED entries, each with different account

### 2. Update Snapshot Schema

**File:** `packages/backend/prisma/schema.prisma`

Change CompetitionSnapshot to reference participantId instead of playerId:

```prisma
model CompetitionSnapshot {
  id              Int      @id @default(autoincrement())
  competitionId   Int
  participantId   Int      // CHANGED: References CompetitionParticipant (entry), not Player
  snapshotType    String   // START, END
  snapshotData    String   // JSON
  snapshotTime    DateTime
  
  participant     CompetitionParticipant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  
  @@unique([participantId, snapshotType])  // CHANGED: One snapshot per participant entry
}
```

**Rationale:** Each account needs its own snapshot since we track performance per-account, then aggregate for leaderboard.

### 3. Generate Prisma Migration

Run `bun run db:migrate` to create migration.

**Data migration strategy:**

- Set `allowMultipleEntries = false` for existing competitions
- Set `accountId` to first account of player for existing participants
- Update existing snapshots to reference participantId (match by competitionId + playerId)

## Data Model Updates

### 4. Add Multi-Entry Field to Schemas

**File:** `packages/data/src/model/competition.ts`

Update `parseCompetition` and related schemas to include `allowMultipleEntries` field.

## Create Command Updates

### 5. Add Multi-Entry Option to Create Command

**File:** `packages/backend/src/discord/commands/competition/create.ts`

Add optional boolean parameter `allow-multiple-entries` (default: false).

- Store in database when creating competition
- Show in confirmation message

## Core Logic Changes

### 6. Update Join Command

**File:** `packages/backend/src/discord/commands/competition/join.ts`

Update join logic:

- Add `account` parameter (string choice from player's accounts)
- Auto-select if player has only one account
- Require explicit selection if player has multiple accounts

**Validation:**

- Validate player has at least one account
- Check account not already used in this competition
- **Single-entry mode:** Check player doesn't already have a JOINED entry
- **Multi-entry mode:** Allow multiple JOINED entries for same player (different accounts)

Pass `accountId` to `addParticipant` function.

### 7. Update Participant Database Functions

**File:** `packages/backend/src/database/competition/participants.ts`

Update `addParticipant()`:

- Accept required `accountId` parameter
- Validate account exists and belongs to player
- Check account not already used (unique constraint handles this, but validate)
- **Single-entry mode:** Check player doesn't have existing JOINED entry
- **Multi-entry mode:** Allow multiple entries, just different accounts
- Store `accountId` in database

Update `acceptInvitation()`:

- Accept required `accountId` parameter
- Same validation as addParticipant
- Update status to JOINED and set accountId

Update `canJoinCompetition()`:

- Accept `accountId` parameter
- Return info about whether player can join with this specific account

### 8. Create Account Management Commands

**File:** `packages/backend/src/discord/commands/competition/account.ts` (new)

**Command 1: `/competition account-change <competition-id> <old-account> <new-account>`**

- Change account for existing entry before competition starts
- Only works in DRAFT status
- Validate new account not already used
- Update `accountId` in participant record

**Command 2: `/competition account-add <competition-id> <account>`** (multi-entry only)

- Add another account to competition
- Only works if `allowMultipleEntries = true`
- Only works before competition starts
- Validate account not already used
- Creates new participant entry for same player

**Command 3: `/competition account-remove <competition-id> <account>`** (multi-entry only)

- Remove one of your accounts from competition
- Only works before competition starts
- Cannot remove if it's your last account
- Sets status to LEFT for that entry

### 9. Update Command Registration

**File:** `packages/backend/src/discord/commands/competition/index.ts`

Add subcommands: `account-change`, `account-add`, `account-remove`

## Match Processing Changes

### 10. Update Leaderboard Entry Type

**File:** `packages/backend/src/league/competition/processors/types.ts`

Add `accountAlias` and `accountAliases` to `LeaderboardEntry`:

```typescript
export type LeaderboardEntry = {
  playerId: PlayerId;
  playerName: string;
  accountAlias: string;        // NEW: Primary account (best performing)
  accountAliases?: string[];   // NEW: All accounts used (for multi-entry)
  score: number | Rank;
  metadata?: Record<string, unknown>;
};
```

### 11. Update Leaderboard Calculation

**File:** `packages/backend/src/league/competition/leaderboard.ts`

Major changes to `calculateLeaderboard()`:

**Fetch participants:**

```typescript
const participants = await prisma.competitionParticipant.findMany({
  where: { competitionId, status: "JOINED" },
  include: {
    player: true,
    account: true,
  },
});
```

**Process matches per account:**

- Each participant entry (player + account combo) processes independently
- Generate per-account scores using existing processors

**Aggregate by player:**

```typescript
// Group entries by playerId
const entriesByPlayer = groupBy(participants, p => p.playerId);

// For each player, calculate best score across all their accounts
const aggregatedEntries = Object.entries(entriesByPlayer).map(([playerId, entries]) => {
  // Process each account's performance
  const accountScores = entries.map(entry => {
    const matches = filterMatchesForAccount(entry.account.puuid);
    const score = processForCriteria(matches, entry.account);
    return { accountAlias: entry.account.alias, score };
  });
  
  // Pick best score
  const best = selectBestScore(accountScores, criteria);
  
  return {
    playerId,
    playerName: entries[0].player.alias,
    accountAlias: best.accountAlias,  // Which account achieved best score
    accountAliases: accountScores.map(a => a.accountAlias),  // All accounts used
    score: best.score,
  };
});
```

**Helper functions needed:**

- `selectBestScore()` - picks best based on criteria type (highest for rank/wins, most for games, etc.)
- Update to handle both single and multi-entry modes

### 12. Update Match Processors

**File:** `packages/backend/src/league/competition/processors/index.ts`

Processors now need to:

1. Process each account independently (unchanged)
2. Support aggregation layer that picks best score

**Approach:** Keep processors working per-account, add aggregation in leaderboard calculation.

**Files to update:**

- `processors/most-games-played.ts` - best = most games among accounts
- `processors/highest-rank.ts` - best = highest rank among accounts
- `processors/most-rank-climb.ts` - best = most climb among accounts
- `processors/most-wins-player.ts` - best = most wins among accounts
- `processors/most-wins-champion.ts` - best = most champion wins among accounts
- `processors/highest-win-rate.ts` - best = highest win rate among accounts (with min games met)

### 13. Create Score Comparison Utilities

**File:** `packages/backend/src/league/competition/processors/scoring.ts` (new)

Create functions to compare scores based on criteria:

```typescript
export function selectBestScore(
  scores: { accountAlias: string; score: number | Rank; metadata?: Record<string, unknown> }[],
  criteria: CompetitionCriteria
): { accountAlias: string; score: number | Rank; metadata?: Record<string, unknown> }
```

Handle each criteria type:

- MOST_GAMES_PLAYED: highest number
- HIGHEST_RANK: best rank (compare tier + division + LP)
- MOST_RANK_CLIMB: highest LP gain
- MOST_WINS_PLAYER: highest wins
- MOST_WINS_CHAMPION: highest champion wins
- HIGHEST_WIN_RATE: highest win rate (must meet min games)

## Snapshot Changes

### 14. Update Snapshot Creation

**File:** `packages/backend/src/league/competition/snapshots.ts`

Update to work per-participant-entry:

`createSnapshot()`:

- Parameter: `participantId` instead of `playerId`
- Fetch participant with account
- Create snapshot for that specific account

`createSnapshotsForAllParticipants()`:

- Iterate all participant entries (not unique players)
- In multi-entry mode: creates multiple snapshots per player (one per account)

### 15. Update Snapshot Retrieval

**File:** `packages/backend/src/league/competition/snapshots.ts`

`getSnapshot()`:

- Accept `participantId` instead of `playerId`
- Fetch snapshot for specific participant entry

Add new function `getSnapshotsForPlayer()`:

- Accept `competitionId` and `playerId`
- Return all snapshots for all player's accounts in competition
- Used in aggregation logic

## Display Changes

### 16. Update Cached Leaderboard Schema

**File:** `packages/data/src/model/competition.ts`

Add account fields to `CachedLeaderboardEntrySchema`:

```typescript
export const CachedLeaderboardEntrySchema = z.object({
  playerId: PlayerIdSchema,
  playerName: z.string(),
  accountAlias: z.string(),              // Primary/best account
  accountAliases: z.array(z.string()).optional(),  // All accounts (multi-entry)
  score: z.union([z.number(), RankSchema]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  rank: z.number().int().positive(),
});
```

### 17. Update Leaderboard Display

**File:** `packages/backend/src/discord/embeds/competition.ts`

Update `generateLeaderboardEmbed()`:

**Single-entry mode:**

```
1. Alice (NA Main) - 150 games
2. Bob (EUW Main) - 142 games
```

**Multi-entry mode:**

```
1. Alice (NA Main, EUW Alt) - 150 games
2. Bob (EUW Main) - 142 games
```

Show all accounts used, but player appears once.

Optionally indicate which account achieved the score with emphasis.

### 18. Update View Command

**File:** `packages/backend/src/discord/commands/competition/view.ts`

Update `addParticipantList()` for DRAFT status:

**Single-entry:**

```
• @Alice (NA Main)
• @Bob (EUW Main)
```

**Multi-entry:**

```
• @Alice (NA Main, EUW Alt)
• @Bob (EUW Main)
```

Show all accounts player has joined with.

Add field for multi-entry mode:

```
Multi-Entry: Enabled (players ranked by best account)
```

### 19. Update List Command

**File:** `packages/backend/src/discord/commands/competition/list.ts`

Add badge/indicator for multi-entry competitions.

### 20. Update Competition Reports

**File:** `packages/report/src/components/LeaderboardReport.tsx`

Show player with account info, handle multi-account display.

## Invite Flow

### 21. Update Invite Command

**File:** `packages/backend/src/discord/commands/competition/invite.ts`

Invitations are per-player, not per-account:

- Check if player already invited
- Create invitation without accountId (null or placeholder)
- Player chooses account(s) when accepting via join command

**Multi-entry mode:**

- Player can accept invitation multiple times with different accounts
- Or accept once and add more accounts later with `/competition account-add`

## Participant Limits

### 22. Participant Counting Logic

**Important decision:** What counts toward `maxParticipants`?

**Option A:** Count entries (player-account pairs)

- Max 50 entries means 50 slots total
- One player using 3 accounts = 3 slots

**Option B:** Count unique players

- Max 50 players means 50 unique players
- Each player can add multiple accounts without consuming more slots

**Recommendation:** Option A (count entries) - simpler database queries, prevents one player from using too many slots.

Update participant limit checks to count entries (existing behavior, no change).

## Testing

### 23. Update Integration Tests

Update existing tests:

- `join.integration.test.ts` - account selection, multi-entry validation
- `participants.test.ts` - account requirement, constraints
- `leaderboard.integration.test.ts` - aggregation logic, best-of-accounts
- `snapshots.integration.test.ts` - per-entry snapshots
- All processor tests - verify scoring works per-account

### 24. Add New Tests

**File:** `account.integration.test.ts` (new)

- Test account change, add, remove commands
- Test validation and timing restrictions

**File:** `multi-entry-aggregation.integration.test.ts` (new)

- Test player with 2 accounts where account A performs better → A shown as primary
- Test player with 3 accounts → all shown in display
- Test mixed competition (some players single account, some multi)
- Test each criteria type's "best" selection logic

## Edge Cases

### 25. Handle Edge Cases

**Invitations in multi-entry mode:**

- Should invitation be per-player or allow multiple invitations per player?
- Recommend: single invitation per player, they choose how many accounts to use

**Account removal:**

- If player removes their best-performing account mid-competition, does score change?
- Recommend: can only remove accounts before competition starts

**Empty accounts:**

- Player joins with 3 accounts but only plays on 1
- Other 2 have score of 0
- Leaderboard shows the one that played

## Documentation

### 26. Update Help Text

Update command descriptions:

- Explain single vs multi-entry mode
- Explain aggregation (ranked by best account)
- Show examples of account management

## Implementation Order

1. Update Prisma schema (Competition, CompetitionParticipant, CompetitionSnapshot)
2. Generate and run migrations with data migration
3. Update Zod schemas and type definitions
4. Update participant database functions (validation for single/multi-entry)
5. Update create command to support multi-entry option
6. Update join command with account selection and multi-entry handling
7. Create account management commands (change, add, remove)
8. Update leaderboard entry types (add account fields)
9. Create score comparison utilities for aggregation
10. Update leaderboard calculation with aggregation logic
11. Update processors as needed for aggregation support
12. Update snapshot creation to use participantId
13. Update all display/embeds for account info and multi-entry
14. Update reports
15. Update all integration tests
16. Create new multi-entry aggregation tests
17. Handle data migration

### To-dos

- [ ] Update Prisma: add allowMultipleEntries to Competition, accountId to CompetitionParticipant, change CompetitionSnapshot to participantId-based, update constraints
- [ ] Generate migrations with data migration strategy for existing competitions and snapshots
- [ ] Update Zod schemas for multi-entry support and account fields
- [ ] Update participant functions with accountId parameter and single/multi-entry validation logic
- [ ] Add allow-multiple-entries parameter to create command
- [ ] Add account selection with auto-select and multi-entry mode handling
- [ ] Create account-change, account-add, account-remove commands
- [ ] Add accountAlias and accountAliases to LeaderboardEntry and CachedLeaderboardEntry
- [ ] Create score comparison utilities to select best score across accounts per criteria type
- [ ] Implement leaderboard calculation with per-account processing and player-level aggregation
- [ ] Update snapshot creation and retrieval to work per-participant-entry (participantId-based)
- [ ] Update embeds, views, and reports to show account info and handle multi-entry display
- [ ] Update all integration tests and create multi-entry aggregation test suite