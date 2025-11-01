import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { CompetitionIdSchema, DiscordAccountIdSchema, DiscordChannelIdSchema, DiscordGuildIdSchema, RegionSchema, RiotIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { riotApi } from "../../../league/api/api.js";
import { mapRegionToEnum } from "../../../league/model/region.js";
import { regionToRegionGroupForAccountAPI } from "twisted/dist/constants/regions.js";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  riotId: RiotIdSchema,
  region: RegionSchema,
  guildId: DiscordGuildIdSchema,
});

export async function executeAccountRemove(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🗑️  Starting account removal for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      riotId: interaction.options.getString("riot-id"),
      region: interaction.options.getString("region"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: riotId=${args.riotId.game_name}#${args.riotId.tag_line}, region=${args.region}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { riotId, region, guildId } = args;

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
          subscriptions: true,
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

  const player = account.player;
  const remainingAccountsCount = player.accounts.length - 1;

  // Check if this is the last account for the player
  if (remainingAccountsCount === 0) {
    console.log(`⚠️  Cannot remove last account for player "${player.alias}" - player would have no accounts`);
    await interaction.reply({
      content: `❌ **Cannot remove last account**\n\nPlayer "${player.alias}" only has one account. Removing it would leave the player with no accounts.\n\nIf you want to delete the entire player, use \`/admin player-delete\` instead.`,
      ephemeral: true,
    });
    return;
  }

  console.log(`💾 Removing account ${riotId.game_name}#${riotId.tag_line} from player "${player.alias}"`);

  try {
    // Delete the account
    await prisma.account.delete({
      where: {
        id: account.id,
      },
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Account removed successfully in ${executionTime.toString()}ms`);

    const remainingAccounts = player.accounts.filter((acc) => acc.id !== account.id);
    const accountsList = remainingAccounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");

    await interaction.reply({
      content: `✅ **Account removed successfully**\n\nRemoved ${riotId.game_name}#${riotId.tag_line} from player "${player.alias}"\n\n**Remaining accounts (${remainingAccountsCount.toString()}):**\n${accountsList}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during account removal:`, error);
    await interaction.reply({
      content: `❌ **Error removing account**\n\nFailed to remove account: ${getErrorMessage(error)}`,
      ephemeral: true,
    });
  }
}
