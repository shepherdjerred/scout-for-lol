/**
 * Subscription limits configuration
 *
 * Defines per-server limits for player subscriptions
 */

/**
 * Default maximum number of players that can be subscribed to in a server
 */
export const DEFAULT_PLAYER_SUBSCRIPTION_LIMIT = 10;

/**
 * Default maximum number of accounts that can exist in a server
 */
export const DEFAULT_ACCOUNT_LIMIT = 10;

/**
 * Map of server IDs that can bypass the subscription limit
 *
 * These servers can subscribe to unlimited players.
 * Add Discord server IDs here to grant unlimited subscriptions.
 */
export const UNLIMITED_SUBSCRIPTION_SERVERS = new Set<string>(["1337623164146155593"]);

/**
 * Check if a server has unlimited subscriptions
 */
export function hasUnlimitedSubscriptions(serverId: string): boolean {
  return UNLIMITED_SUBSCRIPTION_SERVERS.has(serverId);
}

/**
 * Get the subscription limit for a server
 */
export function getSubscriptionLimit(serverId: string): number | null {
  if (hasUnlimitedSubscriptions(serverId)) {
    return null; // null means unlimited
  }
  return DEFAULT_PLAYER_SUBSCRIPTION_LIMIT;
}

/**
 * Get the account limit for a server
 */
export function getAccountLimit(serverId: string): number | null {
  if (hasUnlimitedSubscriptions(serverId)) {
    return null; // null means unlimited
  }
  return DEFAULT_ACCOUNT_LIMIT;
}
