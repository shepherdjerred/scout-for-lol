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

### 1. Enhanced Champion Model with Augments

```typescript
// data/src/model/champion.ts - Add augments support
export type Champion = z.infer<typeof ChampionSchema>;
export const ChampionSchema = z.strictObject({
  // ... existing fields ...

  // Arena-specific fields
  augments: z.array(z.number()).max(6).optional(), // playerAugment1-6
});

export type AugmentSlot = z.infer<typeof AugmentSlotSchema>;
export const AugmentSlotSchema = z.strictObject({
  augmentId: z.number(),
  slot: z.number().int().min(1).max(6),
});
```

### 2. Arena Team Structure

```typescript
// data/src/model/team.ts - Support both traditional and arena teams
export type Team = z.infer<typeof TeamSchema>;
export const TeamSchema = z.union([
  z.enum(["red", "blue"]), // Traditional 5v5 teams
  z.number().int().min(1).max(8), // Arena subteam IDs (1-8)
]);

export type ArenaSubteam = z.infer<typeof ArenaSubteamSchema>;
export const ArenaSubteamSchema = z.strictObject({
  subteamId: z.number().int().min(1).max(8), // playerSubteamId
  players: z.array(ChampionSchema).length(2), // Exactly 2 players
  placement: z.number().int().min(1).max(8), // Final placement (1st-8th)
});
```

### 3. Enhanced Match Model with Arena Support

```typescript
// data/src/model/match.ts - Discriminated union for match types
export type MatchOutcome = z.infer<typeof MatchOutcomeSchema>;
export const MatchOutcomeSchema = z.union([
  z.enum(["Victory", "Defeat", "Surrender"]), // Traditional outcomes
  z.number().int().min(1).max(8), // Arena placement (1st-8th)
]);

export type CompletedMatch = z.infer<typeof CompletedMatchSchema>;
export const CompletedMatchSchema = z.strictObject({
  // ... existing fields ...

  players: z.array(
    z.strictObject({
      // ... existing fields ...
      outcome: MatchOutcomeSchema,
      team: TeamSchema,

      // Arena-specific fields (optional for traditional)
      arenaTeammate: ChampionSchema.optional(),
    }),
  ),

  // Discriminated union for team structures
  teams: z.discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("traditional"),
      red: RosterSchema, // 5 players
      blue: RosterSchema, // 5 players
    }),
    z.strictObject({
      type: z.literal("arena"),
      subteams: z.array(ArenaSubteamSchema).length(8), // 8 teams of 2
    }),
  ]),
});
```

## Implementation Plan

### 🚀 Priority 1: Core Data Model Updates (Required for any arena support)

#### Task 1.1: Update Champion Model
- [ ] Add `augments` field to `ChampionSchema`
- [ ] Create `AugmentSlotSchema` for augment metadata
- [ ] Update `participantToChampion` to extract augments from API
- [ ] Add augment parsing utility functions

**Files to modify:**
- `packages/data/src/model/champion.ts`
- `packages/backend/src/league/model/champion.ts`
- `packages/report/src/match.ts`

#### Task 1.2: Extend Team Model
- [ ] Update `TeamSchema` to support union of traditional and arena teams
- [ ] Create `ArenaSubteamSchema` for 2-player teams
- [ ] Update `parseTeam` function to handle `playerSubteamId`
- [ ] Add arena team utility functions

**Files to modify:**
- `packages/data/src/model/team.ts`

#### Task 1.3: Enhanced Match Model
- [ ] Update `MatchOutcomeSchema` to support placement numbers
- [ ] Add discriminated union for traditional vs arena team structures
- [ ] Add arena-specific player fields (`arenaTeammate`)
- [ ] Create type guards for match type discrimination

**Files to modify:**
- `packages/data/src/model/match.ts`

**Estimated effort:** 2-3 days
**Risk:** Low (mostly type definitions)

### 🔧 Priority 2: Match Processing Logic (Core functionality)

#### Task 2.1: Arena Match Detection
- [ ] Create `isArenaMatch` utility function
- [ ] Update queue type parsing for proper arena detection
- [ ] Add arena-specific validation logic

**Files to modify:**
- `packages/data/src/model/state.ts`
- `packages/backend/src/league/model/match.ts`

#### Task 2.2: Arena Team Processing
- [ ] Implement `getArenaTeams` function to group by `playerSubteamId`
- [ ] Create `getArenaTeammate` function for teammate identification
- [ ] Update match conversion logic for arena format
- [ ] Handle placement-based outcomes instead of win/loss

**Files to modify:**
- `packages/backend/src/league/model/match.ts`
- `packages/report/src/match.ts`
- `packages/backend/src/league/tasks/postmatch/internal.ts`

#### Task 2.3: Outcome Processing
- [ ] Update `getOutcome` to return placement for arena matches
- [ ] Create placement formatting utilities
- [ ] Update match object creation for arena-specific data

**Files to modify:**
- `packages/backend/src/league/model/match.ts`
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
- [ ] Write tests for arena data model validation
- [ ] Test augment parsing from API data
- [ ] Test team grouping logic (8 teams of 2)
- [ ] Test placement outcome processing

#### Task 4.2: Integration Tests
- [ ] Test full arena match processing pipeline
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
