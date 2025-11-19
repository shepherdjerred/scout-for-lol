# Feature Flags and Limits System

## Overview

Create a centralized, type-safe system for managing integer limits and boolean flags with hierarchical overrides. Replace existing ad-hoc limit checks with a unified API.

## Design Principles

1. **Type-safe**: Use string literal types for flag/limit names with compile-time checking
2. **Hierarchical overrides**: Most-specific match wins (e.g., server+user > server > default)
3. **Extensible attributes**: Support server, user, player, and custom attribute dimensions
4. **Code-based storage**: All configs defined in TypeScript (no external service)
5. **Explicit defaults**: Every limit returns a number (use large values like 999999 for "unlimited")

## Core System

### 1. Create type-safe registry system (`packages/backend/src/configuration/flags.ts`)

- Define registries for limits and flags using TypeScript const assertions
- Use branded types for attribute IDs (server, user, player)
- Create matcher functions for hierarchical override resolution
- Export type-safe getter functions: `getLimit()` and `getFlag()`

### 2. Define schemas using Zod

- Validate limit names at runtime
- Validate attribute combinations
- Ensure type safety at boundaries

### 3. Registry structure

```typescript
// Limit definitions with type inference
const LIMIT_REGISTRY = {
  player_subscriptions: { default: 75, overrides: [...] },
  accounts: { default: 50, overrides: [...] },
  competitions_per_owner: { default: 1, overrides: [...] },
  competitions_per_server: { default: 2, overrides: [...] },
  ai_review_daily: { default: 10, overrides: [...] },
} as const;

// Flag definitions
const FLAG_REGISTRY = {
  ai_reviews_enabled: { default: false, overrides: [...] },
  unlimited_subscriptions: { default: false, overrides: [...] },
} as const;
```

### 4. Override matching algorithm

- Match attributes from most to least specific
- First match wins: (server+user+custom) > (server+user) > (server) > (user) > (custom) > default
- Use efficient Map-based lookups

## Migration Plan

### Phase 1: Build core system

1. Create `packages/backend/src/configuration/flags.ts` with registries
2. Implement `getLimit()` and `getFlag()` functions
3. Add comprehensive tests for matching logic

### Phase 2: Migrate existing limits

1. Move subscription limits from `subscription-limits.ts`
   - `DEFAULT_PLAYER_SUBSCRIPTION_LIMIT` → `player_subscriptions` limit
   - `DEFAULT_ACCOUNT_LIMIT` → `accounts` limit
   - `UNLIMITED_SUBSCRIPTION_SERVERS` → `unlimited_subscriptions` flag per server

2. Move competition limits from `database/competition/validation.ts`
   - `MAX_ACTIVE_COMPETITIONS_PER_OWNER` → `competitions_per_owner` limit
   - `MAX_ACTIVE_COMPETITIONS_PER_SERVER` → `competitions_per_server` limit
   - Bot owner bypass → override with `null` (unlimited)

3. Update all call sites to use new API

### Phase 3: Add AI review flag

1. Define `ai_reviews_enabled` flag in registry
2. Add `ai_review_daily` limit (10 per day default)
3. Update `packages/backend/src/league/review/generator.ts` to check flag
4. Enable for select servers via override

## Files to Create

- `packages/backend/src/configuration/flags.ts` - Core system
- `packages/backend/src/configuration/flags.test.ts` - Comprehensive tests

## Files to Modify

- `packages/backend/src/configuration/subscription-limits.ts` - Mark deprecated, keep exports for compatibility during migration
- `packages/backend/src/discord/commands/subscription/add.ts` - Use `getLimit("player_subscriptions")` and `getLimit("accounts")`
- `packages/backend/src/database/competition/validation.ts` - Use `getLimit("competitions_per_owner")` and `getLimit("competitions_per_server")`
- `packages/backend/src/league/review/generator.ts` - Check `getFlag("ai_reviews_enabled")` before generating AI reviews
- `packages/backend/src/discord/commands/admin/player-view.ts` - Update limit display

## Type Safety Examples

```typescript
// Usage with full type safety
const limit = getLimit("player_subscriptions", {
  server: serverId,
}); // Returns: number | null

const canUseAI = getFlag("ai_reviews_enabled", {
  server: serverId,
  user: userId,
}); // Returns: boolean

// Invalid names fail at compile time
getLimit("invalid_name", { server: id }); // ❌ Type error

// Invalid attributes fail at compile time
getLimit("player_subscriptions", { invalid: id }); // ❌ Type error
```

## Testing Strategy

1. Unit tests for matching algorithm (all override combinations)
2. Unit tests for each migrated limit/flag
3. Integration tests for command flows
4. Verify bot owner bypass still works
5. Verify unlimited server behavior preserved

## Success Criteria

- ✅ All existing limits/flags migrated without behavior change
- ✅ Type errors on invalid limit/flag names
- ✅ Type errors on invalid attribute names
- ✅ AI review flag functional for generator.ts
- ✅ All tests pass (existing + new)
- ✅ No breaking changes to existing APIs
