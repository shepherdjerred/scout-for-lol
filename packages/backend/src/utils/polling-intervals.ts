/**
 * Dynamic polling intervals for match history checking.
 * Adjusts check frequency based on when a player was last in a match.
 * This helps avoid rate limiting by checking active players more frequently.
 */

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Polling interval configuration based on player activity.
 * Key: days since player was last in a match
 * Value: check interval in minutes
 */
export const POLLING_INTERVALS = {
  DEFAULT: 1, // Check every minute for active players or new players
  ONE_DAY: 3, // Check every 3 minutes after 1 day without matches
  FIVE_DAYS: 5, // Check every 5 minutes after 5 days
  ONE_WEEK: 10, // Check every 10 minutes after 1 week
  TWO_WEEKS: 15, // Check every 15 minutes after 2 weeks
  ONE_MONTH: 30, // Check every 30 minutes after 1 month (MAX)
} as const;

/**
 * Activity thresholds in days
 */
export const ACTIVITY_THRESHOLDS = {
  ONE_DAY: 1,
  FIVE_DAYS: 5,
  ONE_WEEK: 7,
  TWO_WEEKS: 14,
  ONE_MONTH: 30,
} as const;

/**
 * Calculate the appropriate polling interval (in minutes) based on when
 * this player was last in a match.
 *
 * @param lastMatchTime - When the player was last in a match (game creation time)
 * @param currentTime - Current time (for testing purposes)
 * @returns Polling interval in minutes
 */
export function calculatePollingInterval(lastMatchTime: Date | null, currentTime: Date = new Date()): number {
  // If we've never seen them in a match, check frequently (default interval)
  if (lastMatchTime === null) {
    return POLLING_INTERVALS.DEFAULT;
  }

  const daysSinceLastMatch = (currentTime.getTime() - lastMatchTime.getTime()) / DAY_MS;

  // Return the appropriate interval based on how long since their last match
  if (daysSinceLastMatch < ACTIVITY_THRESHOLDS.ONE_DAY) {
    return POLLING_INTERVALS.DEFAULT;
  }
  if (daysSinceLastMatch < ACTIVITY_THRESHOLDS.FIVE_DAYS) {
    return POLLING_INTERVALS.ONE_DAY;
  }
  if (daysSinceLastMatch < ACTIVITY_THRESHOLDS.ONE_WEEK) {
    return POLLING_INTERVALS.FIVE_DAYS;
  }
  if (daysSinceLastMatch < ACTIVITY_THRESHOLDS.TWO_WEEKS) {
    return POLLING_INTERVALS.ONE_WEEK;
  }
  if (daysSinceLastMatch < ACTIVITY_THRESHOLDS.ONE_MONTH) {
    return POLLING_INTERVALS.TWO_WEEKS;
  }

  // Max interval after 1 month of inactivity
  return POLLING_INTERVALS.ONE_MONTH;
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
 * @param lastMatchTime - When the player was last in a match
 * @param currentTime - Current time (for testing purposes)
 * @returns True if the player should be checked this cycle
 */
export function shouldCheckPlayer(lastMatchTime: Date | null, currentTime: Date = new Date()): boolean {
  const interval = calculatePollingInterval(lastMatchTime, currentTime);

  // Default interval (every minute) - always check
  if (interval === POLLING_INTERVALS.DEFAULT) {
    return true;
  }

  // For longer intervals, only check when current minute aligns with the interval
  const currentMinute = currentTime.getMinutes();
  return currentMinute % interval === 0;
}
