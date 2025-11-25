import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema, RegionSchema, RiotIdSchema } from "@scout-for-lol/data";
import { prisma } from "@scout-for-lol/backend/database/index.js";
import {
  validateCommandArgs,
  executeWithTiming,
} from "@scout-for-lol/backend/discord/commands/admin/utils/validation.js";
import { resolvePuuidFromRiotId } from "@scout-for-lol/backend/discord/commands/admin/utils/riot-api.js";
import {
  buildRiotApiError,
  buildDatabaseError,
  buildSuccessResponse,
} from "@scout-for-lol/backend/discord/commands/admin/utils/responses.js";

const ArgsSchema = z.object({
  riotId: RiotIdSchema,
  region: RegionSchema,
  guildId: DiscordGuildIdSchema,
});

export async function executeAccountDelete(interaction: ChatInputCommandInteraction) {
  const validation = await validateCommandArgs(
    interaction,
    ArgsSchema,
    (i) => ({
      riotId: i.options.getString("riot-id"),
      region: i.options.getString("region"),
      guildId: i.guildId,
    }),
    "account-delete",
  );

  if (!validation.success) {
    return;
  }

  const { data: args, username } = validation;
  const { riotId, region, guildId } = args;

  await executeWithTiming("account-delete", username, async () => {
    // Resolve Riot ID to PUUID
    const puuidResult = await resolvePuuidFromRiotId(riotId, region);
    if (!puuidResult.success) {
      await interaction.reply(buildRiotApiError(`${riotId.game_name}#${riotId.tag_line}`, puuidResult.error));
      return;
    }

    const { puuid } = puuidResult;

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

    console.log(`💾 Deleting account ${riotId.game_name}#${riotId.tag_line} from player "${player.alias}"`);

    try {
      // Delete the account
      await prisma.account.delete({
        where: {
          id: account.id,
        },
      });

      const remainingAccounts = player.accounts.filter((acc) => acc.id !== account.id);
      const accountsList = remainingAccounts.map((acc) => `• ${acc.alias} (${acc.region})`).join("\n");

      await interaction.reply(
        buildSuccessResponse(
          `✅ **Account deleted successfully**\n\nDeleted ${riotId.game_name}#${riotId.tag_line} from player "${player.alias}"`,
          `**Remaining accounts (${remainingAccountsCount.toString()}):**\n${accountsList}`,
        ),
      );
    } catch (error) {
      console.error(`❌ Database error during account deletion:`, error);
      await interaction.reply(buildDatabaseError("delete account", error));
    }
  });
}
