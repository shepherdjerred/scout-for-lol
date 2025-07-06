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
import { api, riotApi } from "../../league/api/api";
import { mapRegionToEnum } from "../../league/model/region";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { prisma } from "../../database/index";
import { fromError } from "zod-validation-error";

export const subscribeCommand = new SlashCommandBuilder()
  .setName("subscribe")
  .setDescription("Subscribe to updates for a League of Legends account")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to post messages to")
      .setRequired(true),
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
      .setDescription(
        "The Riot ID to subscribe to in the format of <name>#<tag>",
      )
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
  .addUserOption((option) =>
    option.setName("user").setDescription("The Discord user of the player"),
  )
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

export async function executeSubscribe(
  interaction: ChatInputCommandInteraction,
) {
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
  } catch (error) {
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { channel, region, riotId, user, alias, guildId } = args;

  let puuid: string;
  try {
    const regionGroup = regionToRegionGroup(mapRegionToEnum(region));
    const account = await riotApi.Account.getByRiotId(
      riotId.game_name,
      riotId.tag_line,
      regionGroup,
    );
    puuid = account.response.puuid;
  } catch (error) {
    await interaction.reply({
      content: `Error looking up Riot ID: ${error instanceof Error ? error.message : String(error)}`,
      ephemeral: true,
    });
    return;
  }

  let summonerId: string;
  try {
    const leagueAccount = await api.Summoner.getByPUUID(
      puuid,
      mapRegionToEnum(region),
    );
    summonerId = leagueAccount.response.id;
  } catch (error) {
    await interaction.reply({
      content: `Error looking up summoner ID: ${error instanceof Error ? error.message : String(error)}`,
      ephemeral: true,
    });
    return;
  }

  const now = new Date();

  try {
    // add a new account
    const account = await prisma.account.create({
      data: {
        alias: alias,
        summonerId: summonerId,
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
              discordId: user,
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
      await interaction.reply({
        content: "Error finding player for account",
        ephemeral: true,
      });
      return;
    }

    // create a new subscription
    await prisma.subscription.create({
      data: {
        channelId: channel,
        playerId: player.playerId.id,
        createdTime: now,
        updatedTime: now,
        creatorDiscordId: interaction.user.id,
        serverId: guildId,
      },
    });

    await interaction.reply({
      content: `Successfully subscribed to updates for ${riotId.game_name}#${riotId.tag_line}`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `Error creating database records: ${error instanceof Error ? error.message : String(error)}`,
      ephemeral: true,
    });
  }
}
