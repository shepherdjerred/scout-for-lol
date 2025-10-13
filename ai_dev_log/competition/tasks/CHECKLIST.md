# Competition Implementation Checklist

Track your progress through the implementation tasks.

## Phase 1: Foundation & Type System

- [ ] **Task 1**: Prisma Schema
  - [ ] Models created
  - [ ] Migration runs
  - [ ] Tests pass

- [ ] **Task 2**: Core Types
  - [ ] Branded types implemented
  - [ ] Enums defined
  - [ ] Status calculation works
  - [ ] Tests pass

- [ ] **Task 3**: Criteria Types
  - [ ] All 6 criteria schemas defined
  - [ ] Discriminated union works
  - [ ] Type narrowing verified
  - [ ] Tests pass

- [ ] **Task 4**: Snapshot Schemas
  - [ ] 3 snapshot schemas defined
  - [ ] Factory pattern implemented
  - [ ] Exhaustive matching works
  - [ ] Tests pass

## Phase 2: Database Layer

- [ ] **Task 5**: Competition Validation
  - [ ] XOR validation works
  - [ ] Date validation works
  - [ ] Limit checks work
  - [ ] Tests pass

- [ ] **Task 6**: Competition Queries
  - [ ] parseCompetition() works
  - [ ] CRUD operations work
  - [ ] Domain types returned
  - [ ] Tests pass

- [ ] **Task 7**: Participant Management
  - [ ] Add/remove participants
  - [ ] Status transitions work
  - [ ] Limits enforced
  - [ ] Tests pass

- [ ] **Task 8**: Permission System
  - [ ] Permission checks work
  - [ ] Admin bypass works
  - [ ] Rate limiting works
  - [ ] Tests pass

## Phase 3: Commands - Creation & Management

- [ ] **Task 9**: `/competition create`
  - [ ] Command registered
  - [ ] All validations work
  - [ ] Competition created
  - [ ] Tests pass

- [ ] **Task 10**: `/competition cancel`
  - [ ] Command registered
  - [ ] Permission check works
  - [ ] Cancellation works
  - [ ] Tests pass

- [ ] **Task 11**: `/competition grant-permission`
  - [ ] Command registered
  - [ ] Admin-only enforced
  - [ ] Permission granted
  - [ ] Tests pass

## Phase 4: Commands - Participation

- [ ] **Task 12**: `/competition join`
  - [ ] Command registered
  - [ ] Eligibility checks work
  - [ ] Join succeeds
  - [ ] Tests pass

- [ ] **Task 13**: `/competition invite`
  - [ ] Command registered
  - [ ] Owner-only enforced
  - [ ] Invitation sent
  - [ ] Tests pass

- [x] **Task 14**: `/competition leave`
  - [x] Command registered
  - [x] Leave succeeds
  - [x] Can't rejoin
  - [x] Tests pass

## Phase 5: Commands - Viewing

- [ ] **Task 15**: `/competition list`
  - [ ] Command registered
  - [ ] Filtering works
  - [ ] Formatting good
  - [ ] Tests pass

- [ ] **Task 16**: `/competition view`
  - [ ] Command registered
  - [ ] Leaderboard shown
  - [ ] Details displayed
  - [ ] Tests pass

## Phase 6: Match Processing

- [ ] **Task 17**: S3 Match Query
  - [ ] Date range works
  - [ ] Participant filtering works
  - [ ] Error handling works
  - [ ] Tests pass

- [ ] **Task 18**: Criteria Processors
  - [ ] All 6 processors implemented
  - [ ] Dispatcher works
  - [ ] Exhaustive matching
  - [ ] Tests pass

- [ ] **Task 19**: Leaderboard Calculation
  - [ ] calculateLeaderboard() works
  - [ ] Ranking correct
  - [ ] Ties handled
  - [ ] Tests pass

## Phase 7: Automation

- [ ] **Task 20**: Snapshot System
  - [ ] Snapshot creation works
  - [ ] Correct schemas used
  - [ ] Bulk creation works
  - [ ] Tests pass

- [ ] **Task 21**: Cron: Lifecycle
  - [ ] Cron job registered
  - [ ] Starts competitions
  - [ ] Ends competitions
  - [ ] Tests pass

- [ ] **Task 22**: Cron: Leaderboard
  - [ ] Cron job registered
  - [ ] Daily updates work
  - [ ] Rate limiting respected
  - [ ] Tests pass

## Phase 8: Polish

- [ ] **Task 23**: Embed Generation
  - [ ] Leaderboard embeds beautiful
  - [ ] Formatting works
  - [ ] Colors correct
  - [ ] Tests pass

- [ ] **Task 24**: Edge Cases
  - [ ] Channel deletion handled
  - [ ] Participant leaving handled
  - [ ] Owner leaving handled
  - [ ] S3 errors handled
  - [ ] API errors handled
  - [ ] Tests pass

## Final Integration

- [ ] All tests pass (`bun run test:all`)
- [ ] Type checking passes (`bun run typecheck:all`)
- [ ] Linting passes (`bun run lint:all`)
- [ ] Manual testing in Discord completed
- [ ] Documentation updated
- [ ] Ready for deployment

## Notes

Use this space to track blockers, questions, or decisions:

```
[Date] [Task] [Note]
```
