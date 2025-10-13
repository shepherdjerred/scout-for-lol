import type { Channel } from "discord.js";

/**
 * Minimal interface for text channels that support sending messages
 */
export type SendableChannel = {
  send(content: string): Promise<unknown>;
};

/**
 * Check if a channel is text-based and return it with proper typing
 *
 * This is one of the rare cases where we use a type assertion, as Discord.js
 * channel types are complex and after checking isTextBased(), we know it has send()
 *
 * @param channel Channel to check
 * @returns SendableChannel if channel is text-based, undefined otherwise
 */
export function asTextChannel(channel: Channel): SendableChannel | undefined {
  if (!channel.isTextBased()) {
    return undefined;
  }

  return channel as unknown as SendableChannel;
}
