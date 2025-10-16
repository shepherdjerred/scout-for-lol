import type { Channel, PermissionsBitField, Client } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { z } from "zod";
import { getErrorMessage } from "../../utils/errors";
import { discordPermissionErrorsTotal, discordOwnerNotificationsTotal } from "../../metrics/index";

/**
 * Schema for Discord API errors
 */
const DiscordAPIErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});

/**
 * Check if an error is a Discord permission error
 */
export function isPermissionError(error: unknown): boolean {
  const result = DiscordAPIErrorSchema.safeParse(error);
  if (!result.success) {
    return false;
  }

  // Discord API error code 50013 = Missing Permissions
  // Discord API error code 50001 = Missing Access (can't see channel)
  return result.data.code === 50013 || result.data.code === 50001;
}

/**
 * Schema for guild-based channels with permission checking
 * We use z.function() without parameters/returns as older Zod versions don't support it
 */
const GuildChannelSchema = z.object({
  permissionsFor: z.function(),
});

/**
 * Check if the bot has permission to send messages in a channel
 *
 * @param channel - The channel to check permissions for
 * @param botId - The bot's user ID
 * @returns Object with hasPermission flag and optional error message
 */
export function checkSendMessagePermission(
  channel: Channel,
  botId: string,
): { hasPermission: boolean; reason?: string } {
  // DM channels don't need permission checks
  if (channel.isDMBased()) {
    return { hasPermission: true };
  }

  // Validate channel has permission checking methods
  const guildChannelResult = GuildChannelSchema.safeParse(channel);
  if (!guildChannelResult.success) {
    return {
      hasPermission: false,
      reason: "Cannot check permissions for this channel type",
    };
  }

  try {
    // Call permissionsFor - we know it exists from schema validation
    // Type assertion needed: Zod schema confirms permissionsFor exists, but TypeScript can't track this
    const permissions =
      // eslint-disable-next-line no-restricted-syntax -- Method existence validated by Zod schema check above
      (guildChannelResult.data.permissionsFor as unknown as (id: string) => PermissionsBitField | null)(botId);

    if (!permissions) {
      return {
        hasPermission: false,
        reason: "Cannot access channel - bot may not be in the server or channel may be deleted",
      };
    }

    // Check for SendMessages permission
    const canSend = permissions.has(PermissionFlagsBits.SendMessages);
    if (!canSend) {
      return {
        hasPermission: false,
        reason: "Bot does not have 'Send Messages' permission in this channel",
      };
    }

    // Check for ViewChannel permission
    const canView = permissions.has(PermissionFlagsBits.ViewChannel);
    if (!canView) {
      return {
        hasPermission: false,
        reason: "Bot cannot view this channel",
      };
    }

    return { hasPermission: true };
  } catch (error) {
    return {
      hasPermission: false,
      reason: `Error checking permissions: ${String(error)}`,
    };
  }
}

/**
 * Get a user-friendly error message for permission failures
 */
export function getPermissionErrorMessage(channelId: string, reason?: string): string {
  const baseMessage = `Unable to send message to channel <#${channelId}>`;

  if (reason) {
    return `${baseMessage}: ${reason}`;
  }

  return `${baseMessage}. The bot may be missing the 'Send Messages' or 'View Channel' permission.`;
}

/**
 * Format error message for logging
 */
export function formatPermissionErrorForLog(channelId: string, error: unknown, reason?: string): string {
  const permissionCheck = reason ? ` (${reason})` : "";
  const errorDetail = isPermissionError(error) ? " [Discord Permission Error]" : ` - ${String(error)}`;
  return `Failed to send message to channel ${channelId}${permissionCheck}${errorDetail}`;
}

/**
 * Notify server owner about a permission error via DM
 *
 * This function attempts to DM the server owner when the bot lacks permissions
 * to post in a channel. It handles failures gracefully and never throws.
 * Also tracks metrics for monitoring permission issues.
 *
 * @param client - Discord client instance
 * @param serverId - The Discord guild (server) ID
 * @param channelId - The channel where the permission error occurred
 * @param reason - Optional detailed reason for the permission error
 */
export async function notifyServerOwnerAboutPermissionError(
  client: Client,
  serverId: string,
  channelId: string,
  reason?: string,
): Promise<void> {
  // Track permission error occurrence
  discordPermissionErrorsTotal.inc({
    guild_id: serverId,
    error_type: reason ? "explicit" : "generic",
  });

  try {
    // Fetch the guild
    const guild = await client.guilds.fetch(serverId);

    // Fetch the guild owner
    const owner = await guild.fetchOwner();

    // Construct the DM message
    const reasonText = reason ? `\n\n**Reason:** ${reason}` : "";
    const message = `⚠️ **Bot Permission Issue**

Hello! I'm having trouble posting messages in your server **${guild.name}**.

**Channel:** <#${channelId}>
**Issue:** Missing permissions to send messages${reasonText}

**To fix this:**
1. Go to Server Settings → Roles
2. Find my role or check channel permissions
3. Ensure I have these permissions:
   • View Channel
   • Send Messages

Need help? Check Discord's permission guide or contact your bot administrator.`;

    // Try to send DM
    await owner.send(message);
    console.log(
      `[PermissionNotify] ✅ Notified server owner ${owner.user.tag} about permission error in guild ${serverId}`,
    );
    discordOwnerNotificationsTotal.inc({
      guild_id: serverId,
      status: "success",
    });
  } catch (error) {
    // DM failures are expected (user may have DMs disabled) - don't escalate
    const errorMsg = getErrorMessage(error);
    if (errorMsg.includes("Cannot send messages to this user")) {
      console.log(
        `[PermissionNotify] Server owner for guild ${serverId} has DMs disabled - cannot notify about permission error`,
      );
      discordOwnerNotificationsTotal.inc({
        guild_id: serverId,
        status: "dm_disabled",
      });
    } else {
      console.warn(`[PermissionNotify] Failed to notify server owner for guild ${serverId}: ${errorMsg}`);
      discordOwnerNotificationsTotal.inc({
        guild_id: serverId,
        status: "dm_failed",
      });
    }
  }
}
