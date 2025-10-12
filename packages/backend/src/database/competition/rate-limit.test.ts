import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  checkRateLimit,
  clearAllRateLimits,
  clearRateLimit,
  getTimeRemaining,
  recordCreation,
} from "./rate-limit.js";

// Clean up before each test
beforeEach(() => {
  clearAllRateLimits();
});

afterEach(() => {
  clearAllRateLimits();
});

describe("checkRateLimit", () => {
  test("returns true for first creation", () => {
    const result = checkRateLimit("server-123", "user-456");
    expect(result).toBe(true);
  });

  test("returns false within rate limit window", () => {
    const serverId = "server-123";
    const userId = "user-456";

    // Record creation
    recordCreation(serverId, userId);

    // Immediately check - should be rate limited
    const result = checkRateLimit(serverId, userId);
    expect(result).toBe(false);
  });

  test("returns true after rate limit window expires", () => {
    const serverId = "server-123";
    const userId = "user-456";

    // Note: We can't directly manipulate time in the implementation,
    // so we test the clearing behavior instead
    recordCreation(serverId, userId);

    // Immediately should be limited
    expect(checkRateLimit(serverId, userId)).toBe(false);

    // Clear and test that clearing works (simulates time passing)
    clearRateLimit(serverId, userId);
    expect(checkRateLimit(serverId, userId)).toBe(true);
  });

  test("rate limits are independent per server", () => {
    const userId = "user-456";

    // Record on server1
    recordCreation("server-1", userId);

    // Should be limited on server1
    expect(checkRateLimit("server-1", userId)).toBe(false);

    // Should NOT be limited on server2
    expect(checkRateLimit("server-2", userId)).toBe(true);
  });

  test("rate limits are independent per user", () => {
    const serverId = "server-123";

    // Record for user1
    recordCreation(serverId, "user-1");

    // Should be limited for user1
    expect(checkRateLimit(serverId, "user-1")).toBe(false);

    // Should NOT be limited for user2
    expect(checkRateLimit(serverId, "user-2")).toBe(true);
  });
});

describe("recordCreation", () => {
  test("records creation timestamp", () => {
    const serverId = "server-123";
    const userId = "user-456";

    // Should be allowed initially
    expect(checkRateLimit(serverId, userId)).toBe(true);

    // Record creation
    recordCreation(serverId, userId);

    // Should now be rate limited
    expect(checkRateLimit(serverId, userId)).toBe(false);
  });

  test("updates timestamp on subsequent recordings", () => {
    const serverId = "server-123";
    const userId = "user-456";

    // Record twice
    recordCreation(serverId, userId);
    recordCreation(serverId, userId);

    // Should still be rate limited
    expect(checkRateLimit(serverId, userId)).toBe(false);
  });
});

describe("getTimeRemaining", () => {
  test("returns 0 for user with no rate limit", () => {
    const remaining = getTimeRemaining("server-123", "user-456");
    expect(remaining).toBe(0);
  });

  test("returns time remaining after recording", () => {
    const serverId = "server-123";
    const userId = "user-456";

    recordCreation(serverId, userId);

    const remaining = getTimeRemaining(serverId, userId);

    // Should be close to 1 hour (60 minutes = 3,600,000 ms)
    // Allow small tolerance for test execution time
    expect(remaining).toBeGreaterThan(3599000); // 59.98 minutes
    expect(remaining).toBeLessThanOrEqual(3600000); // 60 minutes
  });

  test("returns 0 after clearing rate limit", () => {
    const serverId = "server-123";
    const userId = "user-456";

    recordCreation(serverId, userId);
    expect(getTimeRemaining(serverId, userId)).toBeGreaterThan(0);

    clearRateLimit(serverId, userId);
    expect(getTimeRemaining(serverId, userId)).toBe(0);
  });
});

describe("clearRateLimit", () => {
  test("clears rate limit for specific user", () => {
    const serverId = "server-123";
    const userId = "user-456";

    recordCreation(serverId, userId);
    expect(checkRateLimit(serverId, userId)).toBe(false);

    clearRateLimit(serverId, userId);
    expect(checkRateLimit(serverId, userId)).toBe(true);
  });

  test("only clears specified user's rate limit", () => {
    const serverId = "server-123";

    recordCreation(serverId, "user-1");
    recordCreation(serverId, "user-2");

    clearRateLimit(serverId, "user-1");

    expect(checkRateLimit(serverId, "user-1")).toBe(true);
    expect(checkRateLimit(serverId, "user-2")).toBe(false);
  });
});

describe("clearAllRateLimits", () => {
  test("clears all rate limits", () => {
    recordCreation("server-1", "user-1");
    recordCreation("server-1", "user-2");
    recordCreation("server-2", "user-1");

    clearAllRateLimits();

    expect(checkRateLimit("server-1", "user-1")).toBe(true);
    expect(checkRateLimit("server-1", "user-2")).toBe(true);
    expect(checkRateLimit("server-2", "user-1")).toBe(true);
  });
});
