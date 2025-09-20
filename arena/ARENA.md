# Arena Mode Support Implementation Plan

## Overview

This document outlines the implementation plan for adding Arena mode support to Scout for LoL. Arena is a 2v2v2v2v2v2v2v2 game mode with 16 players in 8 teams, featuring unique mechanics like augments and placement-based scoring.

## Current State Analysis

**Existing Infrastructure:**
- ✅ Arena queue type already exists (`queue ID 1700`)
- ✅ Basic arena recognition in `QueueTypeSchema`
- ❌ Team structure assumes 2 teams (red/blue) with 5 players each
- ❌ No support for augments system
- ❌ Win/loss outcomes don't support placement (1st-8th)
- ❌ Match processing hardcoded for traditional team structure

**Arena Match Characteristics (from API analysis):**
- 16 participants in 8 teams (`playerSubteamId: 1-8`)
- Each team has exactly 2 players
- `placement` field shows final team placement (1-8, where 1 = winner)
- Game mode: `"CHERRY"`, Map ID: `30`, Queue ID: `1700`
- Up to 6 augment slots per player (`playerAugment1-6`)
- Traditional `teamId` (100/200) still exists for internal grouping

## Data Model Design

### 1. Arena Champion Model (separate schema)

```typescript
// data/src/model/arena.ts - Arena-specific champion extends base Champion
export const ArenaChampionSchema = ChampionSchema.extend({
  augments: z.array(z.number()).max(6),
  arenaMetrics: ArenaMetricsSchema,
  teamSupport: TeamSupportMetricsSchema,
});

export const AugmentSlotSchema = z.strictObject({
  augmentId: z.number(),
  slot: z.number().int().min(1).max(6),
});
```

### 2. Arena Team Structure

```typescript
// data/src/model/arena.ts - Arena team types live alongside, not in TeamSchema
export const ArenaTeamIdSchema = z.number().int().min(1).max(8);

export const ArenaSubteamSchema = z.strictObject({
  subteamId: ArenaTeamIdSchema,
  players: z.array(ArenaChampionSchema).length(2),
  placement: z.number().int().min(1).max(8),
});

export function parseArenaTeam(subteamId: number) {
  return subteamId >= 1 && subteamId <= 8 ? subteamId : undefined;
}
```

### 3. Enhanced Match Model with Arena Support

```typescript
// data/src/model/arena.ts - Separate ArenaMatch schema with queueType literal
export const ArenaMatchPlayerSchema = z.strictObject({
  playerConfig: PlayerConfigEntrySchema,
  wins: z.number().nonnegative().optional(),
  losses: z.number().nonnegative().optional(),
  placement: z.number().int().min(1).max(8),
  champion: ArenaChampionSchema,
  team: ArenaTeamIdSchema,
  lane: LaneSchema.optional(),
  arenaTeammate: ArenaChampionSchema,
  rankBeforeMatch: RankSchema.optional(),
  rankAfterMatch: RankSchema.optional(),
});

export const ArenaMatchSchema = z.strictObject({
  durationInSeconds: z.number().nonnegative(),
  queueType: z.literal("arena"),
  players: z.array(ArenaMatchPlayerSchema),
  subteams: z.array(ArenaSubteamSchema).length(8),
});

// Consumers can narrow by match.queueType === 'arena' without changing base models
```

## Implementation Plan

### 🚀 Priority 1: Core Data Model Updates (Required for any arena support)

#### Task 1.1: Update Champion Model
- [x] Keep augments only in `ArenaChampionSchema` (no base model changes)
- [x] Create `AugmentSlotSchema` for augment metadata (implemented in `packages/data/src/model/arena.ts`)
- [x] Update `participantToChampion` to extract augments from API (implemented as `participantToArenaChampion` in `packages/backend/src/league/model/champion.ts`)
- [x] Add augment parsing utility functions (`extractAugments`, `extractArenaMetrics`, `extractTeamSupport` in backend)

**Files to modify:**
- `packages/data/src/model/arena.ts`
- `packages/backend/src/league/model/champion.ts`

#### Task 1.2: Extend Team Model
- [x] Keep `TeamSchema` unchanged; use `ArenaTeamIdSchema`/`ArenaSubteamSchema` in `arena.ts`
- [x] Create `ArenaSubteamSchema` for 2-player teams (implemented in `packages/data/src/model/arena.ts`)
- [x] Use separate `parseArenaTeam` for `playerSubteamId` (no changes to `parseTeam`)
- [x] Add arena team utility functions (`isArenaTeam`, `parseArenaTeam` in `packages/data/src/model/arena.ts`)

**Files to modify:**
- `packages/data/src/model/arena.ts` (already implemented)

#### Task 1.3: Enhanced Match Model
- [x] Keep base `MatchOutcomeSchema` unchanged; use `ArenaPlacementSchema` in arena module
- [x] Use separate `ArenaMatchSchema` (no base discriminated union needed)
- [x] Keep arena-specific player fields only in `ArenaMatchPlayerSchema`
- [x] Use `queueType: "arena"` literal for narrowing (no custom type guard)

**Files to modify:**
- `packages/data/src/model/arena.ts` (already implemented)

**Estimated effort:** 2-3 days
**Risk:** Low (mostly type definitions)

### 🔧 Priority 2: Match Processing Logic (Core functionality)

#### Task 2.1: Arena Match Detection
- [x] Use `queueType: "arena"` for narrowing; no separate guard function
- [x] Queue type parsing already maps 1700 → `"arena"`
- [x] Add arena-specific validation logic

**Files to modify:**
- `packages/backend/src/league/model/match.ts`

#### Task 2.2: Arena Team Processing
- [x] Implement team grouping by `playerSubteamId` (backend `groupArenaTeams`)
- [x] Create `getArenaTeammate` function for teammate identification
- [x] Add `toArenaSubteams` builder from participants
- [x] Introduce one-time boundary validation (`validateArenaParticipants`) using Zod `.passthrough()`, then use static typing internally (no assertions/any)
- [x] Refactor helpers to use Remeda (`groupBy`, `entries`, `sortBy`, `map`)
- [x] Update match conversion logic for arena format (`toArenaMatch`)
- [x] Arena players: no ranks, no lanes; use placement (1..8)
- [x] Handle placement-based outcomes instead of win/loss

**Files to modify:**
- `packages/backend/src/league/model/match.ts` (implemented `validateArenaParticipants`, Remeda-based helpers; no assertions/any)
- `packages/backend/src/league/model/__tests__/arena.teams.test.ts` (added unit tests)
 - `packages/backend/src/league/model/__tests__/arena.match.integration.test.ts` (added integration test for subteams + players)
- `packages/report/src/match.ts`
- `packages/backend/src/league/tasks/postmatch/internal.ts`

#### Task 2.3: Outcome Processing
- [x] Add placement extraction utility (`getArenaPlacement`) and consistency check within subteams
- [x] Use placement for arena player outcome in `toArenaMatch`
- [x] Create placement formatting utilities
- [x] Update match object creation for arena-specific data (assemble `ArenaMatch`)

**Files to modify:**
- `packages/backend/src/league/model/match.ts` (added `getArenaPlacement`, `toArenaMatch`)
- `packages/backend/src/league/model/__tests__/arena.teams.test.ts` (added placement consistency test)
- `packages/backend/src/league/model/__tests__/arena.outcome.test.ts` (placement bounds tests)
- `packages/report/src/match.ts`

**Estimated effort:** 3-4 days
**Risk:** Medium (complex logic changes)

### 📊 Priority 3: Reporting & Display (User-facing features)

#### Task 3.1: Arena Match Reports
- [ ] Update match report generation for arena format
- [ ] Design arena-specific report layout (8 teams vs 2 teams)
- [ ] Add augment display to match reports
- [ ] Create placement-based performance metrics

**Files to modify:**
- `packages/report/src/components/*`
- Report generation templates

#### Task 3.2: Discord Integration
- [ ] Update Discord embed format for arena matches
- [ ] Create arena-specific match summary format
- [ ] Add placement display in notifications
- [ ] Handle augment information in reports

**Files to modify:**
- `packages/backend/src/league/tasks/postmatch/internal.ts`
- Discord embed generation code

**Estimated effort:** 2-3 days
**Risk:** Low (mostly display logic)

### 🔍 Priority 4: Testing & Validation (Quality assurance)

#### Task 4.1: Unit Tests
- [x] Write tests for arena data model validation
- [x] Test augment parsing from API data
- [x] Test team grouping logic (8 teams of 2) and teammate lookup
- [x] Test placement outcome processing

#### Task 4.2: Integration Tests
- [x] Test full arena match processing pipeline (real JSON → `toArenaMatch` → `ArenaMatchSchema`)
- [x] Validate arena subteams and players extraction (integration test)
- [ ] Validate arena match reports generation
- [ ] Test Discord notification for arena matches
- [ ] Verify backward compatibility with traditional matches

#### Task 4.3: Real Data Testing
- [ ] Process provided arena match files
- [ ] Validate against live arena matches
- [ ] Performance testing with arena data volume

**Estimated effort:** 2 days
**Risk:** Low (testing infrastructure exists)

### 🚀 Priority 5: Advanced Features (Future enhancements)

#### Task 5.1: Arena-Specific Analytics
- [ ] Arena placement tracking over time
- [ ] Augment usage statistics
- [ ] Teammate synergy analysis
- [ ] Arena-specific performance metrics

#### Task 5.2: Enhanced Augment Support
- [ ] Augment metadata and descriptions
- [ ] Augment effectiveness tracking
- [ ] Popular augment combinations
- [ ] Augment tier lists

**Estimated effort:** 3-5 days
**Risk:** Low (optional features)

## Risk Assessment

### High Risk Items
- **Match processing logic changes**: Core system modifications require careful testing
- **Backward compatibility**: Must ensure traditional matches continue working

### Medium Risk Items
- **Data model migrations**: Type system changes may require data migration
- **Report generation**: Complex display logic for 8 teams vs 2 teams

### Low Risk Items
- **Augment parsing**: Straightforward field extraction
- **Type definitions**: Mostly additive changes

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Arena matches are correctly identified and processed
- [ ] Player placement (1st-8th) is tracked and displayed
- [ ] Basic augment information is captured
- [ ] Arena matches generate reports without errors
- [ ] Traditional matches continue working unchanged

### Full Feature Set
- [ ] Complete augment display with metadata
- [ ] Arena-specific performance analytics
- [ ] Enhanced Discord notifications for arena
- [ ] Teammate relationship tracking
- [ ] Arena match statistics and trends

## Migration Strategy

### Phase 1: Prepare (Days 1-2)
- Update type definitions
- Add discriminated unions
- Create utility functions

### Phase 2: Implement (Days 3-6)
- Core match processing logic
- Arena team handling
- Outcome processing

### Phase 3: Display (Days 7-9)
- Report generation updates
- Discord integration
- User-facing features

### Phase 4: Test & Deploy (Days 10-12)
- Comprehensive testing
- Real data validation
- Production deployment

## Technical Debt Considerations

### Clean-up Opportunities
- Consolidate match processing logic between backend and report packages
- Standardize team parsing across different contexts
- Improve type safety in match conversion functions

### Future Refactoring
- Consider extracting arena-specific logic into dedicated modules
- Evaluate performance implications of larger team arrays
- Plan for potential new game modes with similar structure

---

## Next Steps

1. **Review and approval** of this implementation plan
2. **Priority 1 tasks** - Begin with data model updates
3. **Create feature branch** for arena support development
4. **Set up testing environment** with provided arena match data
5. **Begin implementation** following the task priority order

**Total estimated effort:** 10-15 days
**Recommended team size:** 1-2 developers
**Target completion:** 2-3 weeks
