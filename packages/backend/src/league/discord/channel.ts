import { type Message, MessageCreateOptions, MessagePayload, DiscordAPIError } from "discord.js";
import { z } from "zod";
import client from "../../discord/client";
import { asTextChannel } from "../../discord/utils/channel";
import {
  checkSendMessagePermission,
  isPermissionError,
  formatPermissionErrorForLog,
  notifyServerOwnerAboutPermissionError,
} from "../../discord/utils/permissions";
import { discordPermissionErrorsTotal, discordRateLimitHitsTotal } from "../../metrics/index";
import { prisma } from "../../database/index";
import { recordPermissionError, recordSuccessfulSend } from "../../database/guild-permission-errors";
import type { DiscordChannelId, DiscordGuildId } from "@scout-for-lol/data";

/**
 * Custom error class for channel send failures
 */
export class ChannelSendError extends Error {
  constructor(
    message: string,
    public readonly channelId: string,
    public readonly isPermissionError: boolean,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "ChannelSendError";
  }
}

// Zod schema for validating ChannelSendError instances
const ChannelSendErrorSchema = z.instanceof(ChannelSendError);

/**
 * Send a message to a Discord channel with graceful error handling
 *
 * This function handles common failure cases:
 * - Channel not found or deleted
 * - Bot missing permissions (Send Messages, View Channel)
 * - Channel is not text-based
 * - Discord API errors
 *
 * When permission errors occur, the server owner will be notified via DM (if provided).
 *
 * @param options - Message content (string, MessagePayload, or MessageCreateOptions)
 * @param channelId - ID of the channel to send to
 * @param serverId - Optional Discord guild (server) ID for owner notification on permission errors
 * @returns Promise that resolves with the sent Message
 * @throws {ChannelSendError} If the message cannot be sent
 */
export async function send(
  options: string | MessagePayload | MessageCreateOptions,
  channelId: DiscordChannelId,
  serverId?: DiscordGuildId,
): Promise<Message> {
  try {
    // Fetch the channel
    const fetchedChannel = await client.channels.fetch(channelId);
    if (!fetchedChannel) {
      const error = new ChannelSendError("Channel not found or bot cannot access it", channelId, false);
      console.error(`[ChannelSend] ${error.message} - channel: ${channelId}`);
      throw error;
    }

    // Check if channel is text-based
    const channel = asTextChannel(fetchedChannel);
    if (!channel) {
      const error = new ChannelSendError("Channel is not text-based", channelId, false);
      console.error(`[ChannelSend] ${error.message} - channel: ${channelId}`);
      throw error;
    }

    // Log message info - only log string messages to avoid object stringification
    const stringResult = z.string().safeParse(options);
    if (stringResult.success) {
      console.log(`[ChannelSend] Sending message to ${channelId}: ${stringResult.data}`);
    } else {
      console.log(`[ChannelSend] Sending message to ${channelId}: [MessagePayload/MessageCreateOptions]`);
    }

    // Send the message
    const sentMessage = await channel.send(options);

    // Record successful send if serverId is provided
    if (serverId) {
      void recordSuccessfulSend(prisma, serverId, channelId).catch((dbError) => {
        console.error(`[ChannelSend] Failed to record successful send in DB:`, dbError);
      });
    }

    return sentMessage;
  } catch (error) {
    // If it's already a ChannelSendError, re-throw it
    if (ChannelSendErrorSchema.safeParse(error).success) {
      throw error;
    }

    // Check if it's a rate limit error (429)
    if (error instanceof DiscordAPIError && error.status === 429) {
      console.warn(`[ChannelSend] Rate limit hit for channel ${channelId} - discord.js will retry automatically`);

      // Track rate limit hit
      discordRateLimitHitsTotal.inc({ route: "channel_messages" });

      // Note: discord.js automatically handles rate limits by queuing
      // This error typically only occurs for global rate limits or bugs
      const rateLimitMessage = `Rate limit hit (429) - discord.js will retry automatically`;

      throw new ChannelSendError(rateLimitMessage, channelId, false, error);
    }

    // Check if it's a Discord permission error
    let isPermError = isPermissionError(error);
    let errorMessage = formatPermissionErrorForLog(channelId, error);
    let permissionReason: string | undefined;

    // If not a Discord API permission error, check permissions to provide better diagnostics
    if (!isPermError) {
      // Fetch channel to check permissions
      const fetchedChannel = await client.channels.fetch(channelId).catch(() => null);
      if (fetchedChannel) {
        const permissionCheck = await checkSendMessagePermission(fetchedChannel, client.user);
        if (!permissionCheck.hasPermission) {
          // It was actually a permission issue even though Discord didn't return a permission error
          isPermError = true;
          permissionReason = permissionCheck.reason;
          errorMessage = formatPermissionErrorForLog(channelId, error, permissionCheck.reason);
        }
      }
    }

    // Log appropriately based on error type
    if (isPermError) {
      console.warn(`[ChannelSend] ${errorMessage}`);

      // Track permission error in metrics (only if serverId not provided to avoid duplication)
      if (!serverId) {
        discordPermissionErrorsTotal.inc({
          guild_id: "unknown",
          error_type: "api_error",
        });
      }

      // Record permission error in database and notify owner if serverId is provided
      if (serverId) {
        void recordPermissionError(prisma, serverId, channelId, "api_error", permissionReason).catch((dbError) => {
          console.error(`[ChannelSend] Failed to record permission error in DB:`, dbError);
        });

        // Notify server owner (this will also track metrics)
        void notifyServerOwnerAboutPermissionError(client, serverId, channelId, permissionReason);
      }
    } else {
      console.error(`[ChannelSend] ${errorMessage}`);
    }

    // Wrap in ChannelSendError
    throw new ChannelSendError(errorMessage, channelId, isPermError, error);
  }
}
