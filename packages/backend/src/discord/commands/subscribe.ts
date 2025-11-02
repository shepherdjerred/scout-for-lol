import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { z } from "zod";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  LeaguePuuidSchema,
  RegionSchema,
  RiotIdSchema,
  toReadableRegion,
} from "@scout-for-lol/data";
import { riotApi } from "../../league/api/api";
import { mapRegionToEnum } from "../../league/model/region";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { prisma } from "../../database/index";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../utils/errors.js";
import {
  getSubscriptionLimit,
  getAccountLimit,
  hasUnlimitedSubscriptions,
} from "../../configuration/subscription-limits.js";

export const subscribeCommand = new SlashCommandBuilder()
  .setName("subscribe")
  .setDescription("Subscribe to updates for a League of Legends account")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("The channel to post messages to").setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("region")
      .setDescription("The region of the League of Legends account")
      .addChoices(
        RegionSchema.options.map((region) => {
          return { name: toReadableRegion(region), value: region };
        }),
      )
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("riot-id")
      .setDescription("The Riot ID to subscribe to in the format of <name>#<tag>")
      .setRequired(true),
  )
  // TODO: differentiate between player and account alias
  .addStringOption((option) =>
    option
      .setName("alias")
      .setDescription("An alias for the player")
      // TODO: make this optional
      .setRequired(true),
  )
  .addUserOption((option) => option.setName("user").setDescription("The Discord user of the player"))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild);

export const ArgsSchema = z.object({
  channel: DiscordChannelIdSchema,
  region: RegionSchema,
  riotId: RiotIdSchema,
  user: DiscordAccountIdSchema.optional(),
  alias: z.string(),
  guildId: DiscordGuildIdSchema,
});

export async function executeSubscribe(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🔔 Starting subscription process for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      channel: interaction.options.getChannel("channel")?.id,
      region: interaction.options.getString("region"),
      riotId: interaction.options.getString("riot-id"),
      user: interaction.options.getUser("user")?.id,
      alias: interaction.options.getString("alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(
      `📋 Args: channel=${args.channel}, region=${args.region}, riotId=${args.riotId.game_name}#${args.riotId.tag_line}, alias=${args.alias}`,
    );
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
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
  if (!existingPlayer) {
    const subscriptionLimit = getSubscriptionLimit(guildId);

    if (subscriptionLimit !== null) {
      console.log(`🔍 Checking subscription limit for server ${guildId}: ${subscriptionLimit.toString()} players`);

      // Count unique players with subscriptions in this server
      const subscribedPlayerCount = await prisma.player.count({
        where: {
          serverId: guildId,
          subscriptions: {
            some: {},
          },
        },
      });

      console.log(`📊 Current subscribed players: ${subscribedPlayerCount.toString()}/${subscriptionLimit.toString()}`);

      if (subscribedPlayerCount >= subscriptionLimit) {
        const hasUnlimited = hasUnlimitedSubscriptions(guildId);
        console.log(
          `❌ Subscription limit reached for server ${guildId} (${subscribedPlayerCount.toString()}/${subscriptionLimit.toString()}, unlimited: ${hasUnlimited.toString()})`,
        );

        await interaction.reply({
          content: `❌ **Subscription limit reached**\n\nThis server can subscribe to a maximum of ${subscriptionLimit.toString()} players. You currently have ${subscribedPlayerCount.toString()} subscribed players.\n\nTo subscribe to a new player, please unsubscribe from an existing player first using \`/unsubscribe\`.`,
          ephemeral: true,
        });
        return;
      }
    } else {
      console.log(`♾️ Server ${guildId} has unlimited subscriptions`);
    }
  } else {
    console.log(
      `📌 Adding account to existing player "${alias}" (ID: ${existingPlayer.id.toString()}) - no limit check needed`,
    );
  }

  // Check account limit (always check, even for existing players)
  const accountLimit = getAccountLimit(guildId);

  if (accountLimit !== null) {
    console.log(`🔍 Checking account limit for server ${guildId}: ${accountLimit.toString()} accounts`);

    // Count all accounts in this server
    const accountCount = await prisma.account.count({
      where: {
        serverId: guildId,
      },
    });

    console.log(`📊 Current accounts: ${accountCount.toString()}/${accountLimit.toString()}`);

    if (accountCount >= accountLimit) {
      console.log(
        `❌ Account limit reached for server ${guildId} (${accountCount.toString()}/${accountLimit.toString()})`,
      );

      await interaction.reply({
        content: `❌ **Account limit reached**\n\nThis server can have a maximum of ${accountLimit.toString()} accounts. You currently have ${accountCount.toString()} accounts.\n\nTo add a new account, please remove an existing account first.`,
        ephemeral: true,
      });
      return;
    }
  } else {
    console.log(`♾️ Server ${guildId} has unlimited accounts`);
  }

  console.log(`🔍 Looking up Riot ID: ${riotId.game_name}#${riotId.tag_line} in region ${region}`);

  let puuid: string;
  try {
    const apiStartTime = Date.now();
    const regionGroup = regionToRegionGroupForAccountAPI(mapRegionToEnum(region));

    console.log(`🌐 Using region group: ${regionGroup}`);

    const account = await riotApi.Account.getByRiotId(riotId.game_name, riotId.tag_line, regionGroup);

    const apiTime = Date.now() - apiStartTime;
    puuid = account.response.puuid;

    console.log(`✅ Successfully resolved Riot ID to PUUID: ${puuid} (${apiTime.toString()}ms)`);
  } catch (error) {
    console.error(`❌ Failed to resolve Riot ID ${riotId.game_name}#${riotId.tag_line}:`, error);
    await interaction.reply({
      content: `Error looking up Riot ID: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
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

  try {
    const dbStartTime = Date.now();

    const isAddingToExistingPlayer = existingPlayer !== null;

    // add a new account
    console.log(`📝 Creating account record for ${alias}`);
    const account = await prisma.account.create({
      data: {
        alias: alias,
        puuid: LeaguePuuidSchema.parse(puuid),
        region: region,
        serverId: guildId,
        creatorDiscordId: DiscordAccountIdSchema.parse(interaction.user.id),
        player: {
          connectOrCreate: {
            where: {
              serverId_alias: {
                serverId: guildId,
                alias: alias,
              },
            },
            create: {
              alias: alias,
              discordId: user ?? null,
              createdTime: now,
              updatedTime: now,
              creatorDiscordId: DiscordAccountIdSchema.parse(interaction.user.id),
              serverId: guildId,
            },
          },
        },
        createdTime: now,
        updatedTime: now,
      },
    });

    console.log(`✅ Account created with ID: ${account.id.toString()}`);

    // get the player for the account
    const playerAccount = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
      include: {
        player: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!playerAccount) {
      console.error(`❌ Failed to find player for account ID: ${account.id.toString()}`);
      await interaction.reply({
        content: "Error finding player for account",
        ephemeral: true,
      });
      return;
    }

    console.log(`📝 Found player record: ${playerAccount.player.alias} (ID: ${playerAccount.player.id.toString()})`);

    // Check if subscription already exists for this player in this channel
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        serverId_playerId_channelId: {
          serverId: guildId,
          playerId: playerAccount.player.id,
          channelId: channel,
        },
      },
    });

    if (existingSubscription) {
      console.log(`⚠️  Subscription already exists for player ${playerAccount.player.alias} in channel ${channel}`);

      // If we just added an account to an existing player, show success message
      if (isAddingToExistingPlayer) {
        const accountCount = playerAccount.player.accounts.length;
        const accountList = playerAccount.player.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");

        await interaction.reply({
          content: `✅ **Account added successfully**\n\nAdded **${riotId.game_name}#${riotId.tag_line}** to player "${playerAccount.player.alias}".\n\nThis player is already subscribed in <#${channel}> and now has ${accountCount.toString()} account${accountCount === 1 ? "" : "s"}:\n${accountList}\n\nMatch updates for all accounts will continue to be posted there.`,
          ephemeral: true,
        });
      } else {
        // This shouldn't happen in normal flow, but handle it just in case
        await interaction.reply({
          content: `ℹ️ **Already subscribed**\n\nPlayer "${playerAccount.player.alias}" is already subscribed in <#${channel}>.\n\nMatch updates will continue to be posted there.`,
          ephemeral: true,
        });
      }
      return;
    }

    // create a new subscription
    console.log(`📝 Creating subscription for channel ${channel}`);
    const subscription = await prisma.subscription.create({
      data: {
        channelId: channel,
        playerId: playerAccount.player.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: DiscordAccountIdSchema.parse(interaction.user.id),
        serverId: guildId,
      },
    });

    const dbTime = Date.now() - dbStartTime;
    console.log(`✅ Subscription created with ID: ${subscription.id.toString()} (${dbTime.toString()}ms)`);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Subscription completed successfully in ${totalTime.toString()}ms`);

    // Build response message based on whether we added to existing player
    let responseMessage = `Successfully subscribed to updates for ${riotId.game_name}#${riotId.tag_line}`;

    if (isAddingToExistingPlayer) {
      const accountCount = playerAccount.player.accounts.length;
      const accountList = playerAccount.player.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");
      responseMessage += `\n\n✨ **Added to existing player "${alias}"**`;
      responseMessage += `\nThis player now has ${accountCount.toString()} account${accountCount === 1 ? "" : "s"}:\n${accountList}`;
    } else {
      responseMessage += `\n\n✅ Created new player profile for "${alias}"`;
    }

    await interaction.reply({
      content: responseMessage,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during subscription:`, error);
    await interaction.reply({
      content: `Error creating database records: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
