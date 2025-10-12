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
  RegionSchema,
  RiotIdSchema,
  toReadableRegion,
} from "@scout-for-lol/data";
import { riotApi } from "../../league/api/api";
import { mapRegionToEnum } from "../../league/model/region";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { prisma } from "../../database/index";
import { fromError } from "zod-validation-error";

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
  const userId = interaction.user.id;
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
      content: `Error looking up Riot ID: ${z.instanceof(Error).safeParse(error).success ? (error as unknown as Error).message : String(error)}`,
      ephemeral: true,
    });
    return;
  }

  const now = new Date();
  console.log(`💾 Starting database operations for subscription`);

  try {
    const dbStartTime = Date.now();

    // add a new account
    console.log(`📝 Creating account record for ${alias}`);
    const account = await prisma.account.create({
      data: {
        alias: alias,
        puuid: puuid,
        region: region,
        serverId: guildId,
        creatorDiscordId: interaction.user.id,
        playerId: {
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
              creatorDiscordId: interaction.user.id,
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
    const player = await prisma.account.findUnique({
      where: {
        id: account.id,
      },
      include: {
        playerId: true,
      },
    });

    if (!player) {
      console.error(`❌ Failed to find player for account ID: ${account.id.toString()}`);
      await interaction.reply({
        content: "Error finding player for account",
        ephemeral: true,
      });
      return;
    }

    console.log(`📝 Found player record: ${player.playerId.alias} (ID: ${player.playerId.id.toString()})`);

    // create a new subscription
    console.log(`📝 Creating subscription for channel ${channel}`);
    const subscription = await prisma.subscription.create({
      data: {
        channelId: channel,
        playerId: player.playerId.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: interaction.user.id,
        serverId: guildId,
      },
    });

    const dbTime = Date.now() - dbStartTime;
    console.log(`✅ Subscription created with ID: ${subscription.id.toString()} (${dbTime.toString()}ms)`);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Subscription completed successfully in ${totalTime.toString()}ms`);

    await interaction.reply({
      content: `Successfully subscribed to updates for ${riotId.game_name}#${riotId.tag_line}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during subscription:`, error);
    await interaction.reply({
      content: `Error creating database records: ${z.instanceof(Error).safeParse(error).success ? (error as unknown as Error).message : String(error)}`,
      ephemeral: true,
    });
  }
}
