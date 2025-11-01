/**
 * Dynamic polling intervals for match history checking.
 * Adjusts check frequency based on when a player was last in a match.
 * This helps avoid rate limiting by checking active players more frequently.
 *
 * Scaling: 1 minute (played within 1 hour) -> 60 minutes (inactive for 30+ days)
 */

import { differenceInMinutes, differenceInHours } from "date-fns";

/**
 * Polling interval configuration based on player activity.
 * Intervals scale from 1 minute (very active) to 60 minutes (very inactive)
 */
export const POLLING_INTERVALS = {
  MIN: 1, // Check every minute for active players (played within last hour)
  HOUR_6: 5, // Check every 5 minutes after 6 hours without matches
  HOUR_12: 10, // Check every 10 minutes after 12 hours
  DAY_1: 15, // Check every 15 minutes after 1 day
  DAY_3: 20, // Check every 20 minutes after 3 days
  DAY_7: 30, // Check every 30 minutes after 7 days
  DAY_14: 45, // Check every 45 minutes after 14 days
  MAX: 60, // Check every 60 minutes after 30 days (MAX)
} as const;

/**
 * Activity thresholds
 */
export const ACTIVITY_THRESHOLDS = {
  HOUR_1: 1, // hours
  HOUR_6: 6,
  HOUR_12: 12,
  DAY_1: 24, // hours
  DAY_3: 72,
  DAY_7: 168,
  DAY_14: 336,
  DAY_30: 720,
} as const;

/**
 * Calculate the appropriate polling interval (in minutes) based on when
 * this player was last in a match.
 *
 * Scaling strategy:
 * - Within 1 hour: 1 minute
 * - 6 hours: 5 minutes
 * - 12 hours: 10 minutes
 * - 1 day: 15 minutes
 * - 3 days: 20 minutes
 * - 7 days: 30 minutes
 * - 14 days: 45 minutes
 * - 30+ days: 60 minutes (max)
 *
 * @param lastMatchTime - When the player was last in a match (game creation time)
 * @param currentTime - Current time (for testing purposes)
 * @returns Polling interval in minutes
 */
export function calculatePollingInterval(lastMatchTime: Date | undefined, currentTime: Date = new Date()): number {
  // If we've never seen them in a match, check frequently (min interval)
  if (lastMatchTime === undefined) {
    return POLLING_INTERVALS.MIN;
  }

  const hoursSinceLastMatch = differenceInHours(currentTime, lastMatchTime);

  // Return the appropriate interval based on how long since their last match
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.HOUR_1) {
    return POLLING_INTERVALS.MIN;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.HOUR_6) {
    return POLLING_INTERVALS.HOUR_6;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.HOUR_12) {
    return POLLING_INTERVALS.HOUR_12;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.DAY_1) {
    return POLLING_INTERVALS.DAY_1;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.DAY_3) {
    return POLLING_INTERVALS.DAY_3;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.DAY_7) {
    return POLLING_INTERVALS.DAY_7;
  }
  if (hoursSinceLastMatch < ACTIVITY_THRESHOLDS.DAY_14) {
    return POLLING_INTERVALS.DAY_14;
  }

  // Max interval after 30 days of inactivity
  return POLLING_INTERVALS.MAX;
}

/**
 * Determine the time we should use to calculate when to next check a player.
 *
 * Strategy:
 * - If we've never checked before, check now
 * - If we've never seen a match, use when we last checked
 * - If we have seen a match, use the LATER of (lastMatchTime, lastCheckedAt)
 *   This ensures we respect the polling interval based on both activity AND last check
 *
 * @param lastMatchTime - When the player was last in a match
 * @param lastCheckedAt - When we last checked for matches
 * @returns The time to use for polling interval calculations
 */
export function getPollingReferenceTime(
  lastMatchTime: Date | undefined,
  lastCheckedAt: Date | undefined,
): Date | undefined {
  // Never checked before - should check now
  if (lastCheckedAt === undefined) {
    return undefined;
  }

  // Never seen a match - use last checked time
  if (lastMatchTime === undefined) {
    return lastCheckedAt;
  }

  // Use whichever is more recent
  // This ensures we don't spam the API for inactive players
  return lastMatchTime > lastCheckedAt ? lastMatchTime : lastCheckedAt;
}

/**
 * Determine if a player should be checked this cycle based on their polling interval.
 *
 * Strategy:
 * - Calculates polling interval based on player activity (time since last match)
 * - Uses the later of (lastMatchTime, lastCheckedAt) to determine when to next check
 * - For min interval (active players), checks every minute
 * - For longer intervals, checks when enough time has elapsed since last check
 *
 * @param lastMatchTime - When the player was last in a match
 * @param lastCheckedAt - When we last checked for matches
 * @param currentTime - Current time (for testing purposes)
 * @returns True if the player should be checked this cycle
 */
export function shouldCheckPlayer(
  lastMatchTime: Date | undefined,
  lastCheckedAt: Date | undefined,
  currentTime: Date = new Date(),
): boolean {
  // Determine what time to use as reference for polling
  const referenceTime = getPollingReferenceTime(lastMatchTime, lastCheckedAt);

  // Never checked before - should check now
  if (referenceTime === undefined) {
    return true;
  }

  // Calculate interval based on player activity
  const interval = calculatePollingInterval(lastMatchTime, currentTime);

  // Min interval (every minute) - always check
  if (interval === POLLING_INTERVALS.MIN) {
    return true;
  }

  // For longer intervals, check if enough time has elapsed since reference time
  const minutesSinceReference = differenceInMinutes(currentTime, referenceTime);
  return minutesSinceReference >= interval;
}
