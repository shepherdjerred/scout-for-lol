import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  LeaguePuuidSchema,
  RegionSchema,
  RiotIdSchema,
} from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";
import { backfillLastMatchTime } from "@scout-for-lol/backend/league/api/backfill-match-history.js";
import { sendWelcomeMatch } from "@scout-for-lol/backend/discord/commands/subscription/welcome-match.js";
import {
  checkSubscriptionLimit,
  checkAccountLimit,
  resolveRiotIdToPuuid,
} from "@scout-for-lol/backend/discord/commands/subscription/add-helpers.js";

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

    // Backfill match history to initialize lastMatchTime
    // This prevents newly added players from being stuck on 1-minute polling interval
    const playerConfigEntry = {
      alias: alias,
      league: {
        leagueAccount: {
          puuid: LeaguePuuidSchema.parse(puuid),
          region: region,
        },
      },
      discordAccount: {
        id: user ?? undefined,
      },
    };

    await backfillLastMatchTime(playerConfigEntry, LeaguePuuidSchema.parse(puuid));

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

    // Check if this is the first subscription for the server
    const existingSubscriptionCount = await prisma.subscription.count({
      where: {
        serverId: guildId,
      },
    });
    const isFirstSubscription = existingSubscriptionCount === 0;

    if (isFirstSubscription) {
      console.log(`🎉 This is the first subscription for server ${guildId}`);
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

    // If this is the first subscription for the server, send a welcome match asynchronously
    if (isFirstSubscription) {
      console.log(`🎁 Triggering welcome match for ${riotId.game_name}#${riotId.tag_line}`);

      const playerConfigEntry = {
        alias: alias,
        league: {
          leagueAccount: {
            puuid: LeaguePuuidSchema.parse(puuid),
            region: region,
          },
        },
        discordAccount: {
          id: user ?? undefined,
        },
      };

      // Fire off async task to send welcome match
      void sendWelcomeMatch(interaction, playerConfigEntry).catch((error) => {
        console.error(`❌ Error sending welcome match:`, error);
        // Don't throw - this is a background task
      });
    }
  } catch (error) {
    console.error(`❌ Database error during subscription:`, error);
    await interaction.reply({
      content: `Error creating database records: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
