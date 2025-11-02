/**
 * Guild Create Event Handler
 *
 * Handles when the bot is added to a new server
 */

import { type Guild, ChannelType, type TextChannel } from "discord.js";
import { truncateDiscordMessage } from "../utils/message.js";
import { getErrorMessage } from "../../utils/errors.js";

/**
 * Find the best channel to send a welcome message to
 *
 * Priority:
 * 1. System channel (default channel for system messages)
 * 2. First text channel the bot can send messages to
 *
 * @param guild The guild that was joined
 * @returns TextChannel or null if no suitable channel found
 */
async function findWelcomeChannel(guild: Guild): Promise<TextChannel | null> {
  // Try system channel first
  if (guild.systemChannel) {
    const permissions = guild.systemChannel.permissionsFor(guild.members.me ?? guild.client.user);
    if (permissions?.has(["ViewChannel", "SendMessages"])) {
      return guild.systemChannel;
    }
  }

  // Find first text channel we can send to
  const channels = await guild.channels.fetch();
  for (const [, channel] of channels) {
    if (!channel) continue;
    if (channel.type !== ChannelType.GuildText) continue;

    const permissions = channel.permissionsFor(guild.members.me ?? guild.client.user);
    if (permissions?.has(["ViewChannel", "SendMessages"])) {
      // Type assertion is safe here: we checked channel.type === GuildText above
      // eslint-disable-next-line no-restricted-syntax -- Checked type above, safe assertion
      return channel as unknown as TextChannel;
    }
  }

  return null;
}

/**
 * Handle guildCreate event - send welcome message when bot joins a server
 */
export async function handleGuildCreate(guild: Guild): Promise<void> {
  console.log(`[Guild Create] Bot added to server: ${guild.name} (${guild.id})`);
  console.log(`[Guild Create] Server has ${guild.memberCount.toString()} members`);

  try {
    const channel = await findWelcomeChannel(guild);

    if (!channel) {
      console.warn(`[Guild Create] Could not find a channel to send welcome message in ${guild.name} (${guild.id})`);
      return;
    }

    const welcomeMessage = truncateDiscordMessage(`👋 **Thanks for adding Scout!**

Scout tracks your friends' League of Legends matches and delivers beautiful post-match reports right here in Discord.

**Quick Start:**
• Use \`/help\` to see all available commands
• Use \`/subscribe\` to start tracking players
• Visit **https://scout-for-lol.com/getting-started** for a step-by-step setup guide

**Full Documentation:** https://scout-for-lol.com/docs

Need help? Join our Discord support server or open a GitHub issue!`);

    await channel.send({ content: welcomeMessage });
    console.log(`[Guild Create] Welcome message sent to ${guild.name} in #${channel.name}`);
  } catch (error) {
    console.error(`[Guild Create] Failed to send welcome message to ${guild.name} (${guild.id}):`, getErrorMessage(error));
  }
}
