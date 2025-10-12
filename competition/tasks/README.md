# Competition Leaderboard System - Implementation Tasks

This directory contains a breakdown of the competition feature into 24 discrete, testable tasks. Each task is designed to be completed with test-driven development practices.

## Task Overview

### Phase 1: Foundation & Type System (Tasks 1-4)
Core data structures and type definitions that everything else builds on.

- **Task 1**: Prisma Schema - Database tables and relationships
- **Task 2**: Core Types - Branded types and basic enums
- **Task 3**: Criteria Types - Discriminated union for competition criteria
- **Task 4**: Snapshot Schemas - Factory pattern for state capture

### Phase 2: Database Layer (Tasks 5-8)
Business logic, validation, and data access patterns.

- **Task 5**: Competition Validation - Business rule enforcement
- **Task 6**: Competition Queries - CRUD operations with parsing
- **Task 7**: Participant Management - Join/leave/invite operations
- **Task 8**: Permission System - Authorization and rate limiting

### Phase 3: Commands - Creation & Management (Tasks 9-11)
Admin and owner commands for competition lifecycle.

- **Task 9**: `/competition create` - Main competition creation
- **Task 10**: `/competition cancel` - Cancel competitions
- **Task 11**: `/competition grant-permission` - Delegate permissions

### Phase 4: Commands - Participation (Tasks 12-14)
User commands for joining and leaving competitions.

- **Task 12**: `/competition join` - Opt into competitions
- **Task 13**: `/competition invite` - Owner invites participants
- **Task 14**: `/competition leave` - Opt out of competitions

### Phase 5: Commands - Viewing (Tasks 15-16)
Read-only commands for browsing and viewing competitions.

- **Task 15**: `/competition list` - Browse all competitions
- **Task 16**: `/competition view` - Detailed view with leaderboard

### Phase 6: Match Processing (Tasks 17-19)
Core logic for processing matches and calculating rankings.

- **Task 17**: S3 Match Query - Fetch matches by date range
- **Task 18**: Criteria Processors - Logic for each criteria type
- **Task 19**: Leaderboard Calculation - Orchestration and ranking

### Phase 7: Automation (Tasks 20-22)
Scheduled jobs for lifecycle management and updates.

- **Task 20**: Snapshot System - Capture player state
- **Task 21**: Cron: Lifecycle - Start/end competitions
- **Task 22**: Cron: Leaderboard - Daily updates

### Phase 8: Polish (Tasks 23-24)
UI formatting and edge case handling.

- **Task 23**: Embed Generation - Beautiful Discord formatting
- **Task 24**: Edge Cases - Robustness and error handling

## Execution Order

Tasks should generally be completed in numerical order, but some parallelization is possible:

**Can be done in parallel:**
- Tasks 1-4 (after task 1 completes, 2-4 can be parallel)
- Tasks 9-11 (all command implementations can be parallel after task 8)
- Tasks 12-14 (all command implementations can be parallel)
- Tasks 15-16 (can be parallel)
- Tasks 21-22 (can be parallel after task 20)

**Critical path:**
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → [Commands 9-16] → 17 → 18 → 19 → 20 → [Cron 21-22] → 23 → 24

## Testing Philosophy

Each task includes specific test cases following these principles:

1. **Unit tests first** - Write tests before implementation
2. **Integration tests** - Test database/API interactions
3. **Minimal but sufficient** - Cover main paths and edge cases
4. **Type safety** - Leverage TypeScript to catch errors at compile time
5. **No mocking when possible** - Use real database for integration tests

## File Structure

Each task file includes:
- **Overview** - What the task accomplishes
- **Dependencies** - Which tasks must complete first
- **Files to Create/Modify** - Exact file paths
- **Acceptance Criteria** - Definition of done
- **Implementation Notes** - Key design decisions
- **Test Cases** - Specific tests to write
- **Example Implementation** - Code snippets
- **Validation** - How to verify completion

## Progress Tracking

Mark tasks as complete by checking them off in the main plan:
`competition-leaderboard-system.plan.md`

## Getting Started

1. Read the main plan: `../competition-leaderboard-system.plan.md`
2. Start with Task 1 (Prisma Schema)
3. Write tests first (TDD approach)
4. Implement to make tests pass
5. Run type checking and linting
6. Move to next task

## Tools and Commands

```bash
# Run tests for specific file
bun test path/to/test.ts

# Type check all packages
bun run typecheck:all

# Lint all code
bun run lint:all

# Generate Prisma client
cd packages/backend && bun run db:generate

# Run database migrations
cd packages/backend && bun run db:migrate
```

## Questions or Issues?

- Review the main plan for high-level architecture
- Check task dependencies if something is unclear
- Look at existing codebase patterns (subscribe command, current cron jobs)
- Consult type-safety principles in the main plan

## Estimated Timeline

- **Phase 1-2**: 2-3 days (Foundation & database layer)
- **Phase 3-5**: 3-4 days (All commands)
- **Phase 6**: 2-3 days (Match processing)
- **Phase 7**: 2-3 days (Automation)
- **Phase 8**: 1-2 days (Polish)

**Total: ~10-15 days for complete implementation**

Times assume one developer working full-time with TDD practices.

