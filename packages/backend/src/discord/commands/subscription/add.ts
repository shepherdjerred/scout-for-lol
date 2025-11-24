import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  RegionSchema,
  RiotIdSchema,
} from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index";
import { fromError } from "zod-validation-error";
import {
  checkSubscriptionLimit,
  checkAccountLimit,
  resolveRiotIdToPuuid,
} from "@scout-for-lol/backend/discord/commands/subscription/add-helpers.js";
import {
  buildSubscriptionResponse,
  createSubscriptionRecords,
  handleWelcomeMatch,
  validateSubscriptionArgs,
} from "@scout-for-lol/backend/discord/commands/subscription/add-helpers-internal.js";

export const ArgsSchema = z.object({
  channel: DiscordChannelIdSchema,
  region: RegionSchema,
  riotId: RiotIdSchema,
  user: DiscordAccountIdSchema.optional(),
  alias: z.string(),
  guildId: DiscordGuildIdSchema,
});

export async function executeSubscriptionAdd(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🔔 Starting subscription process for user ${username} (${userId})`);

  const args = validateSubscriptionArgs(interaction, ArgsSchema);
  if (!args) {
    const validationError = fromError(new Error("Invalid command arguments"));
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { channel, region, riotId, user, alias, guildId } = args;

  // Check if player already exists with this alias
  const existingPlayer = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: alias,
      },
    },
  });

  // Check subscription limit (only if creating a new player)
  const subscriptionLimitPassed = await checkSubscriptionLimit(interaction, guildId, existingPlayer);
  if (!subscriptionLimitPassed) {
    return;
  }

  // Check account limit (always check, even for existing players)
  const accountLimitPassed = await checkAccountLimit(interaction, guildId);
  if (!accountLimitPassed) {
    return;
  }

  // Resolve Riot ID to PUUID
  const puuid = await resolveRiotIdToPuuid(interaction, riotId, region);
  if (!puuid) {
    return;
  }

  // Check if this exact account already exists
  const existingAccount = await prisma.account.findUnique({
    where: {
      serverId_puuid: {
        serverId: guildId,
        puuid: puuid,
      },
    },
    include: {
      player: {
        include: {
          subscriptions: true,
        },
      },
    },
  });

  if (existingAccount) {
    console.log(
      `⚠️  Account already exists: ${riotId.game_name}#${riotId.tag_line} (PUUID: ${puuid}) for player "${existingAccount.player.alias}"`,
    );

    const subscriptions = existingAccount.player.subscriptions;
    const channelList = subscriptions.map((sub) => `<#${sub.channelId}>`).join(", ");

    await interaction.reply({
      content: `ℹ️ **Account already subscribed**\n\nThe account **${riotId.game_name}#${riotId.tag_line}** is already subscribed as player "${existingAccount.player.alias}".\n\n${subscriptions.length > 0 ? `Currently posting to: ${channelList}` : "No active subscriptions."}`,
      ephemeral: true,
    });
    return;
  }

  const now = new Date();
  console.log(`💾 Starting database operations for subscription`);

  const result = await createSubscriptionRecords({
    args,
    existingPlayer,
    puuid,
    userId,
    now,
  });

  if (!result.success) {
    if (
      result.error === "SUBSCRIPTION_EXISTS" &&
      result.playerAccount &&
      result.isAddingToExistingPlayer !== undefined
    ) {
      // Handle existing subscription case
      const playerAccount = await prisma.account.findUnique({
        where: {
          serverId_puuid: {
            serverId: guildId,
            puuid: puuid,
          },
        },
        include: {
          player: {
            include: {
              accounts: true,
              subscriptions: true,
            },
          },
        },
      });

      if (playerAccount) {
        if (result.isAddingToExistingPlayer) {
          const accountCount = playerAccount.player.accounts.length;
          const accountList = playerAccount.player.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");

          await interaction.reply({
            content: `✅ **Account added successfully**\n\nAdded **${riotId.game_name}#${riotId.tag_line}** to player "${playerAccount.player.alias}".\n\nThis player is already subscribed in <#${channel}> and now has ${accountCount.toString()} account${accountCount === 1 ? "" : "s"}:\n${accountList}\n\nMatch updates for all accounts will continue to be posted there.`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `ℹ️ **Already subscribed**\n\nPlayer "${playerAccount.player.alias}" is already subscribed in <#${channel}>.\n\nMatch updates will continue to be posted there.`,
            ephemeral: true,
          });
        }
      }
    } else {
      await interaction.reply({
        content: `Error creating database records: ${result.error}`,
        ephemeral: true,
      });
    }
    return;
  }

  const totalTime = Date.now() - startTime;
  console.log(`🎉 Subscription completed successfully in ${totalTime.toString()}ms`);

  const responseMessage = buildSubscriptionResponse({
    riotId,
    alias,
    isAddingToExistingPlayer: result.isAddingToExistingPlayer,
    playerAccount: result.playerAccount,
  });

  await interaction.reply({
    content: responseMessage,
    ephemeral: true,
  });

  handleWelcomeMatch({
    interaction,
    isFirstSubscription: result.isFirstSubscription,
    riotId,
    alias,
    puuid,
    region,
    user,
  });
}
