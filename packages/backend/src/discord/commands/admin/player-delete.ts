import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordAccountIdSchema, DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  alias: z.string().min(1).max(100),
  confirm: z.boolean(),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerDelete(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🗑️  Starting player deletion for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      alias: interaction.options.getString("alias"),
      confirm: interaction.options.getBoolean("confirm"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: alias="${args.alias}", confirm=${args.confirm.toString()}`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { alias, confirm, guildId } = args;

  // Check confirmation
  if (!confirm) {
    console.log(`❌ Deletion not confirmed`);
    await interaction.reply({
      content: `❌ **Deletion not confirmed**\n\nTo delete a player, you must set the \`confirm\` parameter to \`true\`.\n\n⚠️ **WARNING:** This action cannot be undone!`,
      ephemeral: true,
    });
    return;
  }

  // Find the player
  const player = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: alias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
      competitionParticipants: {
        include: {
          competition: {
            select: {
              title: true,
              isCancelled: true,
            },
          },
        },
      },
    },
  });

  if (!player) {
    console.log(`❌ Player not found: "${alias}"`);
    await interaction.reply({
      content: `❌ **Player not found**\n\nNo player with alias "${alias}" exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  // Check for active competition participations
  const activeCompetitions = player.competitionParticipants.filter(
    (cp) => !cp.competition.isCancelled && cp.status === "JOINED",
  );

  if (activeCompetitions.length > 0) {
    const competitionTitles = activeCompetitions.map((cp) => `• ${cp.competition.title}`).join("\n");
    console.log(
      `⚠️  Player "${alias}" is participating in ${activeCompetitions.length.toString()} active competition(s)`,
    );
    await interaction.reply({
      content: `⚠️ **Player is in active competitions**\n\nPlayer "${alias}" is currently participating in ${activeCompetitions.length.toString()} active competition(s):\n\n${competitionTitles}\n\nDeleting this player will affect competition results. Consider using \`/competition leave\` first, or proceed with caution.`,
      ephemeral: true,
    });
    // We'll still allow deletion but warn the user
  }

  console.log(
    `💾 Deleting player "${alias}" (${player.accounts.length.toString()} accounts, ${player.subscriptions.length.toString()} subscriptions, ${player.competitionParticipants.length.toString()} competition participations)`,
  );

  try {
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1. Delete all subscriptions
      await tx.subscription.deleteMany({
        where: {
          playerId: player.id,
        },
      });

      console.log(`✅ Deleted ${player.subscriptions.length.toString()} subscriptions`);

      // 2. Delete all accounts
      await tx.account.deleteMany({
        where: {
          playerId: player.id,
        },
      });

      console.log(`✅ Deleted ${player.accounts.length.toString()} accounts`);

      // 3. Delete all competition participants
      await tx.competitionParticipant.deleteMany({
        where: {
          playerId: player.id,
        },
      });

      console.log(`✅ Deleted ${player.competitionParticipants.length.toString()} competition participations`);

      // 4. Delete all competition snapshots
      await tx.competitionSnapshot.deleteMany({
        where: {
          playerId: player.id,
        },
      });

      console.log(`✅ Deleted competition snapshots`);

      // 5. Delete the player
      await tx.player.delete({
        where: {
          id: player.id,
        },
      });

      console.log(`✅ Deleted player "${alias}"`);
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Player deletion completed successfully in ${executionTime.toString()}ms`);

    await interaction.reply({
      content: `✅ **Player deleted successfully**\n\nDeleted player "${alias}"\n\n**Removed:**\n• ${player.accounts.length.toString()} account(s)\n• ${player.subscriptions.length.toString()} subscription(s)\n• ${player.competitionParticipants.length.toString()} competition participation(s)\n\n⚠️ This action cannot be undone.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during player deletion:`, error);
    await interaction.reply({
      content: `❌ **Error deleting player**\n\nFailed to delete player: ${getErrorMessage(error)}\n\nNo changes were made.`,
      ephemeral: true,
    });
  }
}
