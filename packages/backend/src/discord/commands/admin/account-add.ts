import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import {
  DiscordAccountIdSchema,
  DiscordGuildIdSchema,
  LeaguePuuidSchema,
  RegionSchema,
  RiotIdSchema,
} from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { riotApi } from "../../../league/api/api.js";
import { mapRegionToEnum } from "../../../league/model/region.js";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { getErrorMessage } from "../../../utils/errors.js";
import { backfillLastMatchTime } from "../../../league/api/backfill-match-history.js";

const ArgsSchema = z.object({
  riotId: RiotIdSchema,
  region: RegionSchema,
  playerAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executeAccountAdd(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`➕ Starting account addition for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      riotId: interaction.options.getString("riot-id"),
      region: interaction.options.getString("region"),
      playerAlias: interaction.options.getString("player-alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(
      `📋 Args: riotId=${args.riotId.game_name}#${args.riotId.tag_line}, region=${args.region}, playerAlias="${args.playerAlias}"`,
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

  const { riotId, region, playerAlias, guildId } = args;

  // Find the player
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: playerAlias,
      },
    },
    include: {
      accounts: true,
    },
  });

  if (!player) {
    console.log(`❌ Player not found: "${playerAlias}"`);
    await interaction.reply({
      content: `❌ **Player not found**\n\nNo player with alias "${playerAlias}" exists in this server.`,
      ephemeral: true,
    });
    return;
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
      content: `❌ **Error looking up Riot ID**\n\n${getErrorMessage(error)}`,
      ephemeral: true,
    });
    return;
  }

  // Check if this account already exists
  const existingAccount = await prisma.account.findUnique({
    where: {
      serverId_puuid: {
        serverId: guildId,
        puuid: puuid,
      },
    },
    include: {
      player: true,
    },
  });

  if (existingAccount) {
    console.log(`❌ Account already exists for player "${existingAccount.player.alias}"`);
    await interaction.reply({
      content: `❌ **Account already exists**\n\nThe account ${riotId.game_name}#${riotId.tag_line} is already registered to player "${existingAccount.player.alias}".\n\n${existingAccount.player.alias === playerAlias ? "This account is already on this player." : `If you want to move it to "${playerAlias}", use \`/admin account-transfer\` instead.`}`,
      ephemeral: true,
    });
    return;
  }

  console.log(`💾 Adding account ${riotId.game_name}#${riotId.tag_line} to player "${playerAlias}"`);

  try {
    const now = new Date();

    // Create the account
    await prisma.account.create({
      data: {
        alias: `${riotId.game_name}#${riotId.tag_line}`,
        puuid: LeaguePuuidSchema.parse(puuid),
        region: region,
        playerId: player.id,
        serverId: guildId,
        creatorDiscordId: DiscordAccountIdSchema.parse(userId),
        createdTime: now,
        updatedTime: now,
      },
    });

    // Backfill match history to initialize lastMatchTime
    // This prevents newly added players from being stuck on 1-minute polling interval
    const playerConfigEntry = {
      alias: playerAlias,
      league: {
        leagueAccount: {
          puuid: LeaguePuuidSchema.parse(puuid),
          region: region,
        },
      },
      discordAccount: {
        id: player.discordId ?? undefined,
      },
    };

    await backfillLastMatchTime(playerConfigEntry, LeaguePuuidSchema.parse(puuid));

    // Get updated player with all accounts
    const updatedPlayer = await prisma.player.findUnique({
      where: {
        id: player.id,
      },
      include: {
        accounts: true,
        subscriptions: true,
      },
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Account added successfully in ${executionTime.toString()}ms`);

    const accountsList =
      updatedPlayer?.accounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n") ?? "No accounts";
    const subscriptionsList =
      updatedPlayer && updatedPlayer.subscriptions.length > 0
        ? updatedPlayer.subscriptions.map((sub) => `<#${sub.channelId}>`).join(", ")
        : "No active subscriptions.";

    await interaction.reply({
      content: `✅ **Account added successfully**\n\nAdded ${riotId.game_name}#${riotId.tag_line} (${region}) to player "${playerAlias}"\n\n**All accounts (${updatedPlayer?.accounts.length.toString() ?? "0"}):**\n${accountsList}\n\n**Subscribed channels:** ${subscriptionsList}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during account addition:`, error);
    await interaction.reply({
      content: `❌ **Error adding account**\n\nFailed to add account: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
