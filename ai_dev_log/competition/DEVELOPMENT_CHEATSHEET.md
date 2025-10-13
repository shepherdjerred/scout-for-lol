# Development Cheatsheet - Scout for LoL

## Quick Start

Every shell session, run this to set up your environment:

```bash
# Set PATH for Bun and Dagger
export PATH="/root/.local/share/mise/shims:/home/linuxbrew/.linuxbrew/bin:$PATH"

# Set Dagger runner host (required for Dagger commands!)
export _EXPERIMENTAL_DAGGER_RUNNER_HOST="kube-pod://$(kubectl get pod --selector=name=dagger-dagger-helm-engine --namespace=dagger --output=jsonpath='{.items[0].metadata.name}')?namespace=dagger"

# Navigate to project
cd /workspaces/scout-for-lol

# Verify everything works
dagger call check  # Should pass ✅
```

## Quick Reference

### Environment Setup

- **Bun location**: `/root/.local/share/mise/shims/bun` (via Mise)
- **Dagger location**: `/home/linuxbrew/.linuxbrew/bin/dagger` (via linuxbrew)
- **kubectl location**: `/home/linuxbrew/.linuxbrew/bin/kubectl` (via linuxbrew)
- **Dagger engine**: Runs in Kubernetes pod (no Docker needed!)

### Project Structure

```
packages/
  backend/      - Discord bot service (Prisma, Discord.js)
  data/         - Shared types and utilities (Zod schemas)
  report/       - Report generation (React, Satori)
  frontend/     - Web frontend (Astro)
.dagger/        - CI/CD pipeline definitions (TypeScript)
```

### Key Commands

#### Root-level (run from /workspaces/scout-for-lol)

```bash
# Install dependencies
bun run install:all

# Type checking (WILL HAVE ERRORS - see Known Issues)
bun run typecheck:all

# Linting (WILL HAVE ERRORS - see Known Issues)
bun run lint:all

# Format code
bun run format:all
bun run format:write  # auto-fix

# Run tests
bun run test:all

# Generate code (Prisma client, etc.)
bun run generate

# Clean node_modules
bun run clean
```

#### Backend-specific (cd packages/backend)

```bash
# Development with hot reload
bun run dev

# Build for production
bun run build

# Database operations
bun run db:generate    # Generate Prisma client
bun run db:push        # Push schema to database
bun run db:migrate     # Run migrations
bun run db:studio      # Open Prisma Studio GUI

# Run tests
bun test

# Lint/Format
bun run lint
bun run format
bun run typecheck
```

#### Data package (cd packages/data)

```bash
bun test
bun run lint
bun run format
bun run typecheck
```

### Dagger CI/CD

**Dagger IS available** - uses Kubernetes pod as runner (no Docker needed!)

```bash
# Set the Dagger runner host (required!)
export _EXPERIMENTAL_DAGGER_RUNNER_HOST="kube-pod://$(kubectl get pod --selector=name=dagger-dagger-helm-engine --namespace=dagger --output=jsonpath='{.items[0].metadata.name}')?namespace=dagger"

# OR use the simpler form (pod name may change):
export _EXPERIMENTAL_DAGGER_RUNNER_HOST="kube-pod://dagger-dagger-helm-engine-rsxrk?namespace=dagger"

# Now Dagger commands work:
dagger functions                           # List all available functions
dagger call check                          # Run all checks (✅ PASSES!)
dagger call check-backend                  # Check backend only
dagger call check-data                     # Check data only
dagger call check-report                   # Check report only
dagger call build --version="..." --git-sha="..."
dagger call generate-prisma                # Generate Prisma client
```

**Tip**: The Dagger checks are what CI uses - they WILL pass! Local `bun run` commands at root may fail due to workspace cross-package issues.

### Database Operations

**Prisma schema location**: `packages/backend/prisma/schema.prisma`

```bash
cd packages/backend

# After modifying schema.prisma:
bun run db:generate    # Generate TypeScript client
bun run db:push        # Push changes to dev database (no migration file)

# For production migrations:
bun run db:migrate     # Creates migration file + applies it

# Browse database:
bun run db:studio      # Opens Prisma Studio on http://localhost:5555
```

### Testing Strategy

**Unit tests**: `*.test.ts` files next to source
**Integration tests**: `*.integration.test.ts` files

```bash
# Run all tests
bun test

# Run specific test file
bun test path/to/file.test.ts

# Run tests with filter
bun test --filter='@scout-for-lol/data'

# Run tests in watch mode
bun test --watch
```

### Environment Variables

Backend requires these env vars (see `packages/backend/src/configuration.ts`):

- `VERSION` - App version
- `GIT_SHA` - Git commit SHA
- `DISCORD_TOKEN` - Discord bot token
- `APPLICATION_ID` - Discord application ID
- `RIOT_API_TOKEN` - Riot Games API token
- `DATABASE_URL` - SQLite database path
- `PORT` - Server port (default: 3000)
- `S3_BUCKET_NAME` - Optional S3 bucket for match storage
- `SENTRY_DSN` - Optional Sentry error tracking
- `ENVIRONMENT` - dev/beta/prod (default: dev)

**For testing/development**: Set `NODE_ENV=test` to use placeholder values - no real tokens needed!

```bash
# Run tests without real credentials
NODE_ENV=test bun test

# Run backend in test mode
NODE_ENV=test bun run dev
```

### Known Issues & Quirks

#### Root-level bun commands vs Dagger CI

**IMPORTANT**: Running `bun run typecheck:all` or `bun run lint:all` at the root may show errors due to workspace cross-package dependency issues. These are NOT real issues.

**The source of truth is Dagger CI**:

```bash
# This is what CI actually runs - and it PASSES ✅
export _EXPERIMENTAL_DAGGER_RUNNER_HOST="kube-pod://dagger-dagger-helm-engine-rsxrk?namespace=dagger"
dagger call check  # ✅ ALL CHECKS PASS
```

**Strategy**:

- Use `dagger call check` to verify code before pushing
- Or check individual packages: `cd packages/backend && bun run typecheck`
- Ignore errors from root-level `bun run *:all` commands

### Code Standards (from project rules)

1. **NO `any` types** - Always use proper typing
2. **Avoid type casting** - Use type guards and validation
3. **Zod for validation** - All unknown input must be validated
4. **Functional approach** - Use `remeda` for data transformations
5. **Exhaustive matching** - Use `ts-pattern` with `.exhaustive()`
6. **Proper error handling** - Use `zod-validation-error` for messages

### Useful File Locations

- **Prisma schema**: `packages/backend/prisma/schema.prisma`
- **Prisma generated client**: `packages/backend/generated/prisma/client/`
- **Discord commands**: `packages/backend/src/discord/commands/`
- **Cron jobs**: `packages/backend/src/league/cron.ts`
- **Data models**: `packages/data/src/model/`
- **S3 storage**: `packages/backend/src/storage/`

### Development Workflow

1. **Make schema changes**: Edit `packages/backend/prisma/schema.prisma`
2. **Generate Prisma client**: `cd packages/backend && bun run db:generate`
3. **Create types in data package**: `packages/data/src/model/`
4. **Implement business logic**: `packages/backend/src/`
5. **Write tests**: Co-locate `*.test.ts` files
6. **Run tests**: `bun test`
7. **Check types**: `bun run typecheck`
8. **Format code**: `bun run format:write`

### Tips for Competition Feature

- Store competition models in `packages/backend/prisma/schema.prisma`
- Create Zod schemas in `packages/data/src/model/competition.ts`
- Discord commands go in `packages/backend/src/discord/commands/competition/`
- Database queries go in `packages/backend/src/database/competition/`
- Cron jobs go in `packages/backend/src/league/tasks/competition/`
- Match processing goes in `packages/backend/src/league/competition/`

### Common Commands I'll Use

```bash
# Set up environment in each shell session (CRITICAL!)
export PATH="/root/.local/share/mise/shims:/home/linuxbrew/.linuxbrew/bin:$PATH"
export _EXPERIMENTAL_DAGGER_RUNNER_HOST="kube-pod://$(kubectl get pod --selector=name=dagger-dagger-helm-engine --namespace=dagger --output=jsonpath='{.items[0].metadata.name}')?namespace=dagger"
cd /workspaces/scout-for-lol

# Verify everything works
dagger call check

# After schema changes
cd packages/backend && bun run db:generate && cd ../..

# Quick type check for new code (per-package)
cd packages/backend && bun run typecheck

# Run specific tests (use NODE_ENV=test for placeholders)
NODE_ENV=test bun test packages/backend/src/database/competition/*.test.ts

# Run all tests via CI (recommended)
dagger call check

# Format before committing
bun run format:write
```

### Git Workflow

**IMPORTANT**: Never `git push` without explicit user approval (per user rules).

```bash
# Check status
git status

# Stage changes
git add <files>

# Commit (only when user explicitly requests)
git commit -m "message"

# DO NOT run git push without asking user first!
```
