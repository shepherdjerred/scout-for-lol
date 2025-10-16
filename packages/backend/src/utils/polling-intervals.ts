/**
 * Dynamic polling intervals for player activity monitoring.
 * Adjusts check frequency based on when we last saw a player in a game.
 */

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Polling interval configuration based on player inactivity.
 * Key: days since last seen in game
 * Value: check interval in minutes
 */
export const POLLING_INTERVALS = {
  DEFAULT: 1, // Check every minute for active or new players
  ONE_DAY: 3, // Check every 3 minutes after 1 day inactive
  FIVE_DAYS: 5, // Check every 5 minutes after 5 days inactive
  ONE_WEEK: 7, // Check every 7 minutes after 1 week inactive
  ONE_MONTH: 10, // Check every 10 minutes after 1 month inactive
  THREE_MONTHS: 15, // Check every 15 minutes after 3 months inactive (MAX)
} as const;

/**
 * Activity thresholds in days
 */
export const ACTIVITY_THRESHOLDS = {
  ONE_DAY: 1,
  FIVE_DAYS: 5,
  ONE_WEEK: 7,
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
} as const;

/**
 * Calculate the appropriate polling interval (in minutes) based on when
 * we last saw a player in an active game.
 *
 * @param lastSeenInGame - When we last detected the player in a game, or null if never seen
 * @param currentTime - Current time (for testing purposes)
 * @returns Polling interval in minutes
 */
export function calculatePollingInterval(lastSeenInGame: Date | null, currentTime: Date = new Date()): number {
  // If we've never seen them in a game, check frequently (default interval)
  if (lastSeenInGame === null) {
    return POLLING_INTERVALS.DEFAULT;
  }

  const daysSinceLastSeen = (currentTime.getTime() - lastSeenInGame.getTime()) / DAY_MS;

  // Return the appropriate interval based on inactivity period
  if (daysSinceLastSeen < ACTIVITY_THRESHOLDS.ONE_DAY) {
    return POLLING_INTERVALS.DEFAULT;
  }
  if (daysSinceLastSeen < ACTIVITY_THRESHOLDS.FIVE_DAYS) {
    return POLLING_INTERVALS.ONE_DAY;
  }
  if (daysSinceLastSeen < ACTIVITY_THRESHOLDS.ONE_WEEK) {
    return POLLING_INTERVALS.FIVE_DAYS;
  }
  if (daysSinceLastSeen < ACTIVITY_THRESHOLDS.ONE_MONTH) {
    return POLLING_INTERVALS.ONE_WEEK;
  }
  if (daysSinceLastSeen < ACTIVITY_THRESHOLDS.THREE_MONTHS) {
    return POLLING_INTERVALS.ONE_MONTH;
  }

  // Max interval after 3 months of inactivity
  return POLLING_INTERVALS.THREE_MONTHS;
}

/**
 * Determine if a player should be checked this cycle based on their polling interval.
 *
 * Uses the current minute (0-59) and the polling interval to determine if this is
 * the right time to check this player.
 *
 * For example, if a player has a 5-minute interval, they'll be checked at minutes
 * 0, 5, 10, 15, etc. If current minute is 7, they won't be checked.
 *
 * @param lastSeenInGame - When we last detected the player in a game
 * @param currentTime - Current time (for testing purposes)
 * @returns True if the player should be checked this cycle
 */
export function shouldCheckPlayer(lastSeenInGame: Date | null, currentTime: Date = new Date()): boolean {
  const interval = calculatePollingInterval(lastSeenInGame, currentTime);

  // Default interval (every minute) - always check
  if (interval === POLLING_INTERVALS.DEFAULT) {
    return true;
  }

  // For longer intervals, only check when current minute aligns with the interval
  const currentMinute = currentTime.getMinutes();
  return currentMinute % interval === 0;
}
