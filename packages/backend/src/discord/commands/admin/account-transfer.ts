import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema, RegionSchema, RiotIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { riotApi } from "../../../league/api/api.js";
import { mapRegionToEnum } from "../../../league/model/region.js";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  riotId: RiotIdSchema,
  region: RegionSchema,
  toPlayerAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executeAccountTransfer(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🔄 Starting account transfer for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      riotId: interaction.options.getString("riot-id"),
      region: interaction.options.getString("region"),
      toPlayerAlias: interaction.options.getString("to-player-alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(
      `📋 Args: riotId=${args.riotId.game_name}#${args.riotId.tag_line}, region=${args.region}, toPlayer="${args.toPlayerAlias}"`,
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

  const { riotId, region, toPlayerAlias, guildId } = args;

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

  // Find the account
  const account = await prisma.account.findUnique({
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
        },
      },
    },
  });

  if (!account) {
    console.log(`❌ Account not found: ${riotId.game_name}#${riotId.tag_line}`);
    await interaction.reply({
      content: `❌ **Account not found**\n\nNo account with Riot ID ${riotId.game_name}#${riotId.tag_line} exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  // Find the target player
  const targetPlayer = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: toPlayerAlias,
      },
    },
    include: {
      accounts: true,
    },
  });

  if (!targetPlayer) {
    console.log(`❌ Target player not found: "${toPlayerAlias}"`);
    await interaction.reply({
      content: `❌ **Target player not found**\n\nNo player with alias "${toPlayerAlias}" exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  const sourcePlayer = account.player;

  // Check if transferring to the same player
  if (sourcePlayer.id === targetPlayer.id) {
    console.log(`❌ Cannot transfer account to the same player`);
    await interaction.reply({
      content: `❌ **Invalid transfer**\n\nThe account is already owned by player "${toPlayerAlias}".`,
      ephemeral: true,
    });
    return;
  }

  // Check if this is the last account for the source player
  if (sourcePlayer.accounts.length === 1) {
    console.log(`⚠️  Cannot transfer last account from player "${sourcePlayer.alias}" - player would have no accounts`);
    await interaction.reply({
      content: `❌ **Cannot transfer last account**\n\nPlayer "${sourcePlayer.alias}" only has one account. Transferring it would leave the player with no accounts.\n\nIf you want to merge these players, use \`/admin player-merge\` instead.`,
      ephemeral: true,
    });
    return;
  }

  console.log(
    `💾 Transferring account ${riotId.game_name}#${riotId.tag_line} from "${sourcePlayer.alias}" to "${targetPlayer.alias}"`,
  );

  try {
    const now = new Date();

    // Update the account to point to the new player
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        playerId: targetPlayer.id,
        updatedTime: now,
      },
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Account transferred successfully in ${executionTime.toString()}ms`);

    const sourceRemainingAccounts = sourcePlayer.accounts.filter((acc) => acc.id !== account.id);
    const targetNewAccounts = [...targetPlayer.accounts, account];

    await interaction.reply({
      content: `✅ **Account transferred successfully**\n\nTransferred ${riotId.game_name}#${riotId.tag_line} from "${sourcePlayer.alias}" to "${targetPlayer.alias}"\n\n**"${sourcePlayer.alias}" now has ${sourceRemainingAccounts.length.toString()} account(s)**\n**"${targetPlayer.alias}" now has ${targetNewAccounts.length.toString()} account(s)**`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during account transfer:`, error);
    await interaction.reply({
      content: `❌ **Error transferring account**\n\nFailed to transfer account: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
