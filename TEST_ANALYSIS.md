# Competition Test Analysis: Identifying Unhelpful Tests

## Executive Summary

After reviewing all competition-related unit and integration tests, I've identified several categories of tests that are **not particularly helpful** because they:
1. Test framework/library behavior instead of application code
2. Test trivial operations that don't catch real bugs
3. Have minimal assertions that don't verify meaningful behavior
4. Test database constraints that are already enforced by Prisma/SQLite

## Test Files Analyzed

1. `packages/data/src/model/competition.test.ts` (1443 lines)
2. `packages/backend/src/discord/embeds/competition.test.ts` (679 lines)
3. `packages/backend/src/database/competition.integration.test.ts` (547 lines)
4. `packages/backend/src/league/competition/leaderboard.test.ts`
5. `packages/backend/src/league/competition/leaderboard.integration.test.ts`
6. `packages/backend/src/league/competition/processors/processors.test.ts` (739 lines)
7. `packages/backend/src/league/competition/processors/processors.integration.test.ts` (365 lines)
8. `packages/backend/src/league/competition/snapshots.integration.test.ts`
9. `packages/backend/src/discord/commands/competition/join.integration.test.ts`

---

## ❌ Category 1: Tests That Test Prisma/Database Behavior

### File: `packages/backend/src/database/competition.integration.test.ts`

**Problem**: Most tests in this file test that Prisma ORM works, not that our application logic works.

#### Test: "Competition CRUD operations" (lines 51-109)
```typescript
test("Competition CRUD operations", async () => {
  const competition = await prisma.competition.create({ ... });
  expect(competition.id).toBeGreaterThan(0);
  expect(competition.title).toBe("January Grind Challenge");

  const found = await prisma.competition.findUnique({ ... });
  expect(found).not.toBeNull();

  const updated = await prisma.competition.update({ ... });
  expect(updated.title).toBe("Updated Challenge");

  await prisma.competition.delete({ ... });
  const deleted = await prisma.competition.findUnique({ ... });
  expect(deleted).toBeNull();
});
```

**Why it's unhelpful**:
- Tests basic Prisma CRUD operations that are already tested by Prisma itself
- Doesn't test any business logic
- Just verifies that create/read/update/delete work (which they should by default)
- No meaningful assertions about application behavior

**What would be better**: Test actual competition creation logic through your application's API/service layer, which includes validation, authorization, side effects (like creating initial snapshots), etc.

---

#### Test: "User can create multiple competitions over time" (lines 111-175)
```typescript
test("User can create multiple competitions over time", async () => {
  const firstCompetition = await prisma.competition.create({ ... });
  const secondCompetition = await prisma.competition.create({ ... });

  expect(secondCompetition.id).not.toBe(firstCompetition.id);

  const competitions = await prisma.competition.findMany({ ... });
  expect(competitions.length).toBe(2);
});
```

**Why it's unhelpful**:
- Tests that auto-increment IDs work (which is a database feature)
- Tests that you can insert multiple rows (basic database functionality)
- Doesn't test any application-level constraint or business rule
- The comment says this tests "user can create multiple competitions" but it doesn't test if there are any rules about this

---

#### Test: "User can have cancelled and active competitions simultaneously" (lines 177-240)
**Why it's unhelpful**:
- Just tests that you can insert records with different boolean flags
- No actual application logic being tested

---

#### Test: "Cascade delete behavior" (lines 242-323)
```typescript
test("Cascade delete behavior", async () => {
  // Create competition, participant, snapshot
  await prisma.competition.delete({ ... });

  // Verify related records deleted
  expect(foundParticipant).toBeNull();
  expect(foundSnapshot).toBeNull();
});
```

**Why it's unhelpful**:
- Tests that database CASCADE constraints work
- This is SQLite/Prisma behavior, not your application code
- If this test fails, it means your schema is wrong, not your code

---

#### Test: "Foreign key constraints" (lines 325-372)
```typescript
test("Foreign key constraints", async () => {
  try {
    await prisma.competitionParticipant.create({
      playerId: 999999, // Invalid ID
    });
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
});
```

**Why it's unhelpful**:
- Tests that database foreign key constraints work
- This is database-level validation, not application code

---

#### Test: "ServerPermission CRUD operations" (lines 374-402)
**Why it's unhelpful**: Same as "Competition CRUD operations" - just tests Prisma works

---

#### Test: "CompetitionParticipant unique constraint" (lines 404-475)
**Why it's unhelpful**: Tests database unique constraints, not application logic

---

#### Test: "CompetitionSnapshot unique constraint" (lines 477-546)
**Why it's unhelpful**: Tests database unique constraints, not application logic

---

## ❌ Category 2: Tests That Test Trivial String Formatting

### File: `packages/backend/src/discord/embeds/competition.test.ts`

Many tests in this file test trivial string formatting or field existence without testing meaningful behavior.

#### Test: "should include owner in fields" (lines 255-263)
```typescript
it("should include owner in fields", () => {
  const competition = createTestCompetition({ ownerId: "owner-123" });
  const embed = generateLeaderboardEmbed(competition, []);
  const embedData = embed.toJSON();

  const ownerField = embedData.fields?.find((f) => f.name === "Owner");
  expect(ownerField?.value).toBe("<@owner-123>");
});
```

**Why it's unhelpful**:
- Tests trivial string interpolation: `<@${ownerId}>`
- No complex logic being tested
- If this breaks, it's obvious from visual inspection

---

#### Test: "should include participant count in fields" (lines 240-253)
```typescript
it("should include participant count in fields", () => {
  const leaderboard = [/* 3 entries */];
  const embed = generateLeaderboardEmbed(competition, leaderboard);

  const participantField = embedData.fields?.find((f) => f.name === "Participants");
  expect(participantField?.value).toBe("3/50");
});
```

**Why it's unhelpful**:
- Tests that `${count}/${maxParticipants}` string template works
- Trivial string formatting

---

#### Test: "should show correct status colors for ACTIVE/DRAFT/ENDED/CANCELLED competition" (lines 161-227)
```typescript
it("should show correct status colors for ACTIVE competition", () => {
  const competition = createTestCompetition({ /* active dates */ });
  const embed = generateLeaderboardEmbed(competition, []);
  expect(embedData.color).toBe(Colors.Green);
});
```

**Why it's unhelpful**:
- Tests simple mapping: `status === "ACTIVE" ? Colors.Green : ...`
- No complex logic
- Very brittle - will break if you change the color scheme for UX reasons

**Better approach**: Test that the correct status is DETERMINED, not that it maps to a specific color.

---

#### Tests: formatCriteriaDescription tests (lines 422-512)
```typescript
it("should format MOST_GAMES_PLAYED criteria", () => {
  const criteria = { type: "MOST_GAMES_PLAYED", queue: "SOLO" };
  const result = formatCriteriaDescription(criteria);
  expect(result).toBe("Most games played in Solo Queue");
});
```

**Why they're unhelpful**:
- Test simple string templates
- No complex logic
- Changes to copy shouldn't break tests

---

## ✅ Category 3: Tests That ARE Helpful

For contrast, here are examples of GOOD tests that test actual application logic:

### File: `packages/backend/src/league/competition/processors/processors.test.ts`

#### Test: "should count games in SOLO queue only" (lines 310-340)
```typescript
it("should count games in SOLO queue only", () => {
  const matches = [
    createMatch(420, [...]), // SOLO
    createMatch(420, [...]), // SOLO
    createMatch(1700, [...]), // ARENA
  ];

  const result = processCriteria({ type: "MOST_GAMES_PLAYED", queue: "SOLO" }, matches, [playerA, playerB]);

  expect(playerAEntry?.score).toBe(2); // Only SOLO games counted
  expect(playerBEntry?.score).toBe(0);
});
```

**Why it's helpful**:
- Tests actual business logic (queue filtering)
- Tests edge cases (what happens with mixed queue types)
- Tests the processor's core responsibility

---

#### Test: "should calculate LP gained from start to end" (lines 465-492)
```typescript
it("should calculate LP gained from start to end", () => {
  const startSnapshots = new Map([
    [playerA.id, { soloRank: goldIV }],
    [playerB.id, { soloRank: platinumII }],
  ]);

  const endSnapshots = new Map([
    [playerA.id, { soloRank: diamondIV }],
    [playerB.id, { soloRank: platinumI }],
  ]);

  const result = processCriteria({ type: "MOST_RANK_CLIMB", queue: "SOLO" }, [], [playerA, playerB], {
    startSnapshots,
    endSnapshots,
  });

  const playerALPGain = rankToLeaguePoints(diamondIV) - rankToLeaguePoints(goldIV);
  expect(playerAEntry?.score).toBe(playerALPGain);
});
```

**Why it's helpful**:
- Tests complex calculation logic
- Tests with realistic rank data
- Verifies the core algorithm works correctly

---

### File: `packages/data/src/model/competition.test.ts`

#### Test: "getCompetitionStatus" tests (lines 197-362)
```typescript
test("returns ACTIVE when startDate is in past and endDate is in future", () => {
  const competition = {
    isCancelled: false,
    startDate: new Date(now.getTime() - 86400000),
    endDate: new Date(now.getTime() + 86400000),
    seasonId: null,
  };
  expect(getCompetitionStatus(competition)).toBe("ACTIVE");
});
```

**Why it's helpful**:
- Tests actual business logic function
- Tests date-based state transitions
- Tests edge cases (exactly at start/end)
- This logic is critical for determining competition state

---

## 📊 Summary: What to Remove or Rewrite

### High Priority for Removal

1. **`packages/backend/src/database/competition.integration.test.ts`**
   - Remove: Lines 51-109 (Competition CRUD operations)
   - Remove: Lines 111-175 (Multiple competitions - unless there's a business rule)
   - Remove: Lines 177-240 (Cancelled and active simultaneously - unless there's a business rule)
   - Remove: Lines 242-323 (Cascade delete behavior)
   - Remove: Lines 325-372 (Foreign key constraints)
   - Remove: Lines 374-402 (ServerPermission CRUD)
   - Remove: Lines 404-475 (Unique constraint tests)
   - Remove: Lines 477-546 (Snapshot unique constraint)

   **Verdict**: This file can be deleted almost entirely. Keep only tests that verify application-level business rules.

### Medium Priority for Removal/Rewrite

2. **`packages/backend/src/discord/embeds/competition.test.ts`**
   - Remove: Lines 255-263 (Owner field test)
   - Remove: Lines 240-253 (Participant count test)
   - Rewrite: Lines 161-227 (Status color tests → test status determination instead)
   - Remove: Lines 422-512 (Format description tests - test the logic that USES the description instead)
   - Remove: Lines 518-678 (formatScore tests for simple cases)

   **Verdict**: Keep structural tests (like "leaderboard has correct number of entries for ties"), remove trivial formatting tests.

---

## 💡 Recommendations

### What Makes a Good Test

1. **Tests Business Logic**: Tests your application's rules and algorithms
2. **Tests Edge Cases**: What happens with empty data, ties, boundary conditions
3. **Tests Integration Points**: How components work together
4. **Tests Behavior, Not Implementation**: Tests what the code does, not how it does it

### What Makes a Bad Test

1. **Tests Framework/Library Behavior**: Testing that Prisma can insert rows
2. **Tests Trivial Operations**: Testing string templates, simple getters
3. **Tests Database Constraints**: Testing foreign keys, unique constraints
4. **Tests Brittle Details**: Testing exact color codes, exact string formatting

### Better Alternatives

Instead of testing Prisma CRUD directly, test your service layer:
```typescript
// BAD: Testing Prisma
test("can create competition", async () => {
  const competition = await prisma.competition.create({ ... });
  expect(competition.id).toBeDefined();
});

// GOOD: Testing business logic
test("creating competition sends notification to channel", async () => {
  const competition = await competitionService.create({ ... });
  expect(mockDiscord.sendMessage).toHaveBeenCalledWith(
    competition.channelId,
    expect.stringContaining(competition.title)
  );
});

// GOOD: Testing business rules
test("cannot create competition with end date before start date", async () => {
  await expect(
    competitionService.create({
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-01-01"), // Before start!
    })
  ).rejects.toThrow("End date must be after start date");
});
```

---

## 📝 Action Items

1. **Delete**: `packages/backend/src/database/competition.integration.test.ts` (or reduce to ~50 lines with actual business rules)
2. **Refactor**: `packages/backend/src/discord/embeds/competition.test.ts` - remove trivial formatting tests
3. **Keep**: All processor tests - these test real algorithms
4. **Keep**: `packages/data/src/model/competition.test.ts` - tests validation and business logic
5. **Add**: More tests for service layer business rules and integration points

---

## Test Coverage That's Actually Missing

While reviewing, I noticed you're NOT testing:
1. **Permission checks**: Can user X actually create a competition?
2. **State transitions**: What happens when competition starts? Ends?
3. **Participant limits**: Edge cases around maxParticipants
4. **Concurrent operations**: What if two users join at the same time when there's 1 spot left?
5. **Error recovery**: What if Riot API fails during snapshot creation?

These would be MUCH more valuable than testing that Prisma can insert rows!
