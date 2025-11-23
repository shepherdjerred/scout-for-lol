import type { Client } from "discord.js";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import { getAbandonedGuilds, markGuildAsNotified } from "@scout-for-lol/backend/database/guild-permission-errors.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import {
  abandonedGuildsDetectedTotal,
  guildsLeftTotal,
  abandonmentNotificationsTotal,
  guildDataCleanupTotal,
} from "@scout-for-lol/backend/metrics/index.js";
import type { DiscordGuildId } from "@scout-for-lol/data";

/**
 * Check for abandoned guilds and handle cleanup
 *
 * A guild is considered abandoned if:
 * - Permission errors have been occurring for 7+ consecutive days
 * - No successful message sends during that period
 * - Owner hasn't been notified yet
 *
 * Actions taken:
 * 1. Send DM to server owner explaining the situation
 * 2. Leave the guild
 * 3. Clean up database records for that guild
 */
export async function checkAbandonedGuilds(client: Client): Promise<void> {
  console.log("[AbandonedGuilds] Checking for abandoned guilds...");

  try {
    // Get guilds with 7+ days of consecutive permission errors
    const abandonedGuilds = await getAbandonedGuilds(prisma, 7);

    if (abandonedGuilds.length === 0) {
      console.log("[AbandonedGuilds] No abandoned guilds found");
      return;
    }

    console.log(`[AbandonedGuilds] Found ${abandonedGuilds.length.toString()} potentially abandoned guild(s)`);

    // Record metric for detected abandoned guilds
    abandonedGuildsDetectedTotal.inc(abandonedGuilds.length);

    for (const guildInfo of abandonedGuilds) {
      try {
        await handleAbandonedGuild(client, guildInfo);
      } catch (error) {
        console.error(
          `[AbandonedGuilds] Error handling abandoned guild ${guildInfo.serverId}:`,
          getErrorMessage(error),
        );
        // Continue with other guilds even if one fails
      }
    }

    console.log("[AbandonedGuilds] Abandoned guild check complete");
  } catch (error) {
    console.error("[AbandonedGuilds] Error during abandoned guild check:", getErrorMessage(error));
    throw error;
  }
}

/**
 * Handle a single abandoned guild
 */
async function handleAbandonedGuild(
  client: Client,
  guildInfo: { serverId: DiscordGuildId; firstOccurrence: Date; lastOccurrence: Date; errorCount: number },
): Promise<void> {
  const { serverId, firstOccurrence, errorCount } = guildInfo;

  console.log(
    `[AbandonedGuilds] Processing guild ${serverId} (errors since ${firstOccurrence.toISOString()}, count: ${errorCount.toString()})`,
  );

  // Fetch the guild
  let guild;
  try {
    guild = await client.guilds.fetch(serverId);
  } catch (_error) {
    console.warn(`[AbandonedGuilds] Could not fetch guild ${serverId} - may have already been removed`);
    // Mark as notified so we don't keep trying
    await markGuildAsNotified(prisma, serverId);
    return;
  }

  // Try to notify the server owner
  await notifyOwnerOfAbandonment(guild, firstOccurrence, errorCount);

  // Leave the guild
  try {
    await guild.leave();
    console.log(`[AbandonedGuilds] ✅ Left guild ${guild.name} (${serverId})`);

    // Record metric for leaving guild
    guildsLeftTotal.inc({ reason: "abandoned" });
  } catch (error) {
    console.error(`[AbandonedGuilds] Failed to leave guild ${serverId}:`, getErrorMessage(error));

    // Record failed leave attempt
    guildsLeftTotal.inc({ reason: "failed" });

    // Still mark as notified even if we couldn't leave
  }

  // Mark as notified to prevent repeated attempts
  await markGuildAsNotified(prisma, serverId);

  // Clean up database records for this guild
  await cleanupGuildData(serverId);

  console.log(`[AbandonedGuilds] ✅ Completed processing for guild ${guild.name} (${serverId})`);
}

/**
 * Notify server owner that bot is leaving due to persistent permission errors
 */
async function notifyOwnerOfAbandonment(
  guild: { id: string; name: string; fetchOwner: () => Promise<{ send: (message: string) => Promise<unknown> }> },
  firstErrorDate: Date,
  errorCount: number,
): Promise<void> {
  try {
    const owner = await guild.fetchOwner();

    const daysSinceFirstError = Math.floor((Date.now() - firstErrorDate.getTime()) / (1000 * 60 * 60 * 24));

    const message = `👋 **Scout for LoL - Server Departure Notice**

Hello! I'm writing to let you know that I'll be leaving your server **${guild.name}**.

**Why am I leaving?**
I've been experiencing permission errors for the past ${daysSinceFirstError.toString()} days and haven't been able to send messages in your server. I've recorded ${errorCount.toString()} failed attempts.

This usually means:
• My role was removed or permissions were revoked
• The channels I post to were deleted or made inaccessible
• The server is no longer actively using the bot

**What happens now?**
• I'll automatically leave the server to clean up unused resources
• All data associated with your server will be preserved for 30 days
• You can re-invite me at any time if you want to use the bot again

**Want to keep using the bot?**
If this was a mistake and you want to keep using Scout for LoL:
1. Re-invite the bot to your server
2. Make sure I have these permissions:
   • View Channels
   • Send Messages
   • Embed Links (for match reports)
3. Set up your subscriptions again with \`/subscription add\`

Thank you for using Scout for LoL! Feel free to reach out if you have any questions.

*This is an automated message. Replies to this DM won't be monitored.*`;

    await owner.send(message);
    console.log(`[AbandonedGuilds] ✅ Notified owner of guild ${guild.id} about departure`);

    // Record successful notification
    abandonmentNotificationsTotal.inc({ status: "success" });
  } catch (error) {
    // DM failures are expected (user may have DMs disabled)
    const errorMsg = getErrorMessage(error);
    if (errorMsg.includes("Cannot send messages to this user")) {
      console.log(`[AbandonedGuilds] Owner of guild ${guild.id} has DMs disabled - cannot notify`);
      abandonmentNotificationsTotal.inc({ status: "dm_disabled" });
    } else {
      console.warn(`[AbandonedGuilds] Failed to notify owner of guild ${guild.id}:`, errorMsg);
      abandonmentNotificationsTotal.inc({ status: "failed" });
    }
    // Don't throw - we should still leave the guild even if we can't notify
  }
}

/**
 * Clean up database records for an abandoned guild
 * Note: This preserves data for potential re-invite, but marks it for future cleanup
 */
async function cleanupGuildData(serverId: DiscordGuildId): Promise<void> {
  console.log(`[AbandonedGuilds] Cleaning up data for guild ${serverId}`);

  try {
    // Delete subscriptions (bot can't post to them anyway)
    const deletedSubs = await prisma.subscription.deleteMany({
      where: { serverId },
    });
    console.log(`[AbandonedGuilds] Deleted ${deletedSubs.count.toString()} subscriptions`);
    guildDataCleanupTotal.inc({ data_type: "subscriptions", status: "success" });

    // Delete server permissions
    const deletedPerms = await prisma.serverPermission.deleteMany({
      where: { serverId },
    });
    console.log(`[AbandonedGuilds] Deleted ${deletedPerms.count.toString()} server permissions`);
    guildDataCleanupTotal.inc({ data_type: "permissions", status: "success" });

    // Note: We keep Player, Account, Competition, and related data
    // Users can re-invite the bot and their data will still be there
    // These will be cleaned up by the existing pruning jobs after 30 days if unused

    console.log(`[AbandonedGuilds] ✅ Cleanup complete for guild ${serverId}`);
  } catch (error) {
    console.error(`[AbandonedGuilds] Error during cleanup for guild ${serverId}:`, getErrorMessage(error));
    guildDataCleanupTotal.inc({ data_type: "all", status: "failed" });
    // Don't throw - we've already left the guild
  }
}
