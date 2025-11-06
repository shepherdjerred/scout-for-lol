/**
 * Discord Rate Limit Tracking Utility
 *
 * Parses Discord API rate limit headers and updates Prometheus metrics
 * to provide visibility into rate limit consumption
 */

import { discordRateLimitRemaining, discordRateLimitResetTimestamp } from "../../metrics/index.js";

/**
 * Discord rate limit headers structure
 */
export type RateLimitHeaders = {
  limit: number; // Total number of requests allowed
  remaining: number; // Number of requests remaining
  reset: number; // Unix timestamp (seconds) when the limit resets
  resetAfter: number; // Seconds until the limit resets
  bucket: string; // Rate limit bucket identifier
  scope: string; // Scope of the rate limit (user, global, shared)
}

/**
 * Parse Discord rate limit headers from a response
 *
 * Discord uses the following headers:
 * - X-RateLimit-Limit: Maximum number of requests
 * - X-RateLimit-Remaining: Remaining requests
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - X-RateLimit-Reset-After: Seconds until reset
 * - X-RateLimit-Bucket: Bucket identifier
 * - X-RateLimit-Scope: Scope (user, global, shared)
 *
 * @param headers - Response headers (can be from fetch Response or discord.js)
 * @returns Parsed rate limit information, or null if headers not present
 */
export function parseRateLimitHeaders(
  headers: Headers | Map<string, string> | Record<string, string>,
): RateLimitHeaders | null {
  // Helper to get header value regardless of header structure
  const getHeader = (key: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(key);
    } else if (headers instanceof Map) {
      return headers.get(key) ?? null;
    } else {
      return headers[key] ?? null;
    }
  };

  const limit = getHeader("x-ratelimit-limit");
  const remaining = getHeader("x-ratelimit-remaining");
  const reset = getHeader("x-ratelimit-reset");
  const resetAfter = getHeader("x-ratelimit-reset-after");
  const bucket = getHeader("x-ratelimit-bucket");
  const scope = getHeader("x-ratelimit-scope");

  // If we don't have the basic headers, return null
  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: Number.parseInt(limit, 10),
    remaining: Number.parseInt(remaining, 10),
    reset: Number.parseFloat(reset),
    resetAfter: resetAfter ? Number.parseFloat(resetAfter) : 0,
    bucket: bucket ?? "unknown",
    scope: scope ?? "unknown",
  };
}

/**
 * Update Prometheus metrics with rate limit information
 *
 * @param rateLimits - Parsed rate limit headers
 * @param route - Route identifier (e.g., "channel_messages", "guild_members")
 */
export function updateRateLimitMetrics(rateLimits: RateLimitHeaders, route: string): void {
  discordRateLimitRemaining.set({ route }, rateLimits.remaining);
  discordRateLimitResetTimestamp.set({ route }, rateLimits.reset);

  // Log warning if we're getting close to the limit
  if (rateLimits.remaining < 10) {
    const resetDate = new Date(rateLimits.reset * 1000);
    console.warn(
      `[RateLimit] Low remaining requests for route "${route}": ${rateLimits.remaining.toString()}/${rateLimits.limit.toString()} (resets at ${resetDate.toISOString()})`,
    );
  }
}

/**
 * Track rate limit information from any Discord API interaction
 *
 * This is a convenience function that combines parsing and updating metrics
 *
 * @param headers - Response headers
 * @param route - Route identifier
 */
export function trackRateLimits(headers: Headers | Map<string, string> | Record<string, string>, route: string): void {
  const rateLimits = parseRateLimitHeaders(headers);
  if (rateLimits) {
    updateRateLimitMetrics(rateLimits, route);
  }
}
