/**
 * Direct Message (DM) Utilities
 *
 * Helper functions for sending DMs to Discord users
 */

import { type Client, DiscordAPIError } from "discord.js";
import { type DiscordAccountId } from "@scout-for-lol/data";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";

/**
 * Send a DM to a Discord user
 *
 * @param client - Discord client instance
 * @param userId - Discord user ID
 * @param message - Message content to send
 * @returns true if message was sent successfully, false otherwise
 */
export async function sendDM(client: Client, userId: DiscordAccountId, message: string): Promise<boolean> {
  try {
    const user = await client.users.fetch(userId);
    await user.send(message);
    console.log(`[DM] Successfully sent DM to user ${userId}`);
    return true;
  } catch (error) {
    // Check for specific Discord API error codes
    if (error instanceof DiscordAPIError && error.code === 50007) {
      // 50007 = Cannot send messages to this user
      console.log(`[DM] User ${userId} has DMs disabled or has blocked the bot`);
    } else {
      const errorMsg = getErrorMessage(error);
      console.error(`[DM] Failed to send DM to user ${userId}:`, errorMsg);
    }

    return false;
  }
}
