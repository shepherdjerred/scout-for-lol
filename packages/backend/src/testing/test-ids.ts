/**
 * Test ID Utilities
 *
 * Centralized utilities for generating valid test IDs for Discord, League of Legends, etc.
 * All Discord IDs must be numeric strings (snowflake format) between 17-20 characters.
 */

import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  LeaguePuuidSchema,
  type DiscordAccountId,
  type DiscordChannelId,
  type DiscordGuildId,
  type LeaguePuuid,
} from "@scout-for-lol/data";

/**
 * Creates a valid Discord Guild ID (server ID)
 * Discord snowflake IDs are 17-20 numeric characters
 *
 * @param identifier - A unique identifier (will be converted to numbers)
 * @returns A valid DiscordGuildId
 *
 * @example
 * ```ts
 * const serverId = testGuildId("main-server");  // "300000000000000000"
 * const serverId2 = testGuildId("123");          // "312300000000000000"
 * ```
 */
export function testGuildId(identifier: string = "0"): DiscordGuildId {
  const base = identifier.replace(/\D/g, ""); // Remove non-digits
  const numericId = `3${base}`.padEnd(18, "0");
  return DiscordGuildIdSchema.parse(numericId);
}

/**
 * Creates a valid Discord Account ID (user ID)
 * Discord snowflake IDs are 17-18 numeric characters
 *
 * @param identifier - A unique identifier (will be converted to numbers)
 * @returns A valid DiscordAccountId
 *
 * @example
 * ```ts
 * const userId = testAccountId("owner");      // "200000000000000000"
 * const userId2 = testAccountId("456");        // "245600000000000000"
 * ```
 */
export function testAccountId(identifier: string = "0"): DiscordAccountId {
  const base = identifier.replace(/\D/g, ""); // Remove non-digits
  const numericId = `2${base}`.padEnd(18, "0");
  return DiscordAccountIdSchema.parse(numericId);
}

/**
 * Creates a valid Discord Channel ID
 * Discord snowflake IDs are 17-20 numeric characters
 *
 * @param identifier - A unique identifier (will be converted to numbers)
 * @returns A valid DiscordChannelId
 *
 * @example
 * ```ts
 * const channelId = testChannelId("general");  // "100000000000000000"
 * const channelId2 = testChannelId("789");      // "178900000000000000"
 * ```
 */
export function testChannelId(identifier: string = "0"): DiscordChannelId {
  const base = identifier.replace(/\D/g, ""); // Remove non-digits
  const numericId = `1${base}`.padEnd(18, "0");
  return DiscordChannelIdSchema.parse(numericId);
}

/**
 * Creates a valid League of Legends PUUID
 * PUUIDs are exactly 78 alphanumeric characters
 *
 * @param identifier - A unique identifier for this PUUID
 * @returns A valid LeaguePuuid
 *
 * @example
 * ```ts
 * const puuid = testPuuid("main-account");
 * const puuid2 = testPuuid("smurf");
 * ```
 */
export function testPuuid(identifier: string): LeaguePuuid {
  const base = `puuid-${identifier}`;
  return LeaguePuuidSchema.parse(base.padEnd(78, "0"));
}

/**
 * Creates a test date relative to now
 *
 * @param daysOffset - Number of days to offset from now (negative for past, positive for future)
 * @returns A Date object
 *
 * @example
 * ```ts
 * const yesterday = testDate(-1);
 * const tomorrow = testDate(1);
 * const nextWeek = testDate(7);
 * ```
 */
export function testDate(daysOffset: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

/**
 * Creates a test date at a specific time today
 *
 * @param hours - Hour of day (0-23)
 * @param minutes - Minutes (0-59)
 * @returns A Date object
 *
 * @example
 * ```ts
 * const noon = testDateAt(12, 0);
 * const endOfDay = testDateAt(23, 59);
 * ```
 */
export function testDateAt(hours: number, minutes: number = 0): Date {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Common test IDs for convenience
 */
export const TEST_IDS = {
  // Common servers
  SERVER_1: testGuildId("1000000001"),
  SERVER_2: testGuildId("2000000002"),
  SERVER_3: testGuildId("3000000003"),
  
  // Common users
  OWNER: testAccountId("owner"),
  USER_1: testAccountId("user1"),
  USER_2: testAccountId("user2"),
  USER_3: testAccountId("user3"),
  CREATOR: testAccountId("testcreator"),
  
  // Common channels
  CHANNEL_GENERAL: testChannelId("general"),
  CHANNEL_1: testChannelId("123"),
  CHANNEL_2: testChannelId("456"),
  CHANNEL_3: testChannelId("789"),
  
  // Common PUUIDs
  PUUID_MAIN: testPuuid("main"),
  PUUID_SMURF: testPuuid("smurf"),
  PUUID_1: testPuuid("1"),
  PUUID_2: testPuuid("2"),
} as const;

