# Task 8: Permission System - Authorization and Rate Limiting

## Overview
Implement permission checking system for competition creation. This includes admin bypass, ServerPermission grants, and rate limiting to prevent abuse.

## Dependencies
- Task 1 (Prisma schema)
- Task 2 (Core types)

## Files to Create/Modify
- `packages/backend/src/database/competition/permissions.ts` (new file)
- `packages/backend/src/database/competition/rate-limit.ts` (new file)
- `packages/backend/src/database/competition/index.ts` - export permission functions

## Acceptance Criteria
1. Permission functions implemented:
   - `canCreateCompetition()` - check if user has permission
   - `grantPermission()` - grant CREATE_COMPETITION permission
   - `revokePermission()` - remove permission grant
   - `hasPermission()` - check if user has specific permission
2. Admin bypass: Discord ADMINISTRATOR permission always returns true
3. Rate limiting:
   - `checkRateLimit()` - verify user hasn't created competition recently
   - In-memory store for rate limit tracking
   - 1 competition per user per hour
4. Proper Discord.js integration for permission checks
5. All functions properly typed

## Implementation Notes
- Use Discord.js `PermissionFlagsBits.Administrator` for admin check
- Rate limit uses Map<userId, timestamp> in memory (acceptable for single instance)
- For multi-instance deployment, consider Redis (future enhancement)
- Rate limit key: `${serverId}:${userId}`

## Test Cases

### Unit Tests
File: `packages/backend/src/database/competition/rate-limit.test.ts`

1. **Rate limit - first creation**
   - Check rate limit for new user → returns true
   - After creation, timestamp recorded

2. **Rate limit - within window**
   - Create competition at T=0
   - Check at T=30min → returns false
   - Check at T=59min → returns false

3. **Rate limit - after window**
   - Create competition at T=0
   - Check at T=61min → returns true
   - Can create new competition

4. **Rate limit - different servers**
   - Same user, different servers → independent rate limits

### Integration Tests
File: `packages/backend/src/database/competition/permissions.integration.test.ts`

5. **hasPermission - ServerPermission**
   - User with granted permission → returns true
   - User without permission → returns false
   - Permission on different server → returns false

6. **grantPermission**
   - Grant CREATE_COMPETITION → creates ServerPermission
   - Records who granted (grantedBy)
   - Records timestamp (grantedAt)
   - Duplicate grant → idempotent (no error)

7. **revokePermission**
   - Revoke existing permission → deletes record
   - Revoke non-existent permission → no error

8. **canCreateCompetition - admin bypass**
   - Mock Discord member with Administrator → returns true
   - Regardless of ServerPermission records

9. **canCreateCompetition - granted permission**
   - Non-admin with ServerPermission → returns true
   - Non-admin without ServerPermission → returns false

10. **canCreateCompetition - rate limit integration**
    - User passes permission check
    - But rate limited → returns false with reason

## Example Implementation
```typescript
// Rate limiting
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(serverId: string, userId: string): boolean {
  const key = `${serverId}:${userId}`;
  const lastCreation = rateLimitStore.get(key);
  
  if (!lastCreation) return true;
  
  const now = Date.now();
  const elapsed = now - lastCreation;
  
  return elapsed >= RATE_LIMIT_WINDOW_MS;
}

export function recordCreation(serverId: string, userId: string): void {
  const key = `${serverId}:${userId}`;
  rateLimitStore.set(key, Date.now());
}

// Permission checking
export async function canCreateCompetition(
  serverId: string,
  userId: string,
  memberPermissions: Readonly<PermissionsBitField>
): Promise<{ allowed: boolean; reason?: string }> {
  // Admin bypass
  if (memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return { allowed: true };
  }
  
  // Check ServerPermission
  const hasPermission = await hasPermissionInDB(serverId, userId, 'CREATE_COMPETITION');
  if (!hasPermission) {
    return { allowed: false, reason: 'Missing CREATE_COMPETITION permission' };
  }
  
  // Check rate limit
  if (!checkRateLimit(serverId, userId)) {
    return { allowed: false, reason: 'Rate limited: can create 1 competition per hour' };
  }
  
  return { allowed: true };
}
```

## Validation
- Run `bun run typecheck:all`
- Run `bun test packages/backend/src/database/competition/`
- Mock Discord.js types appropriately in tests

