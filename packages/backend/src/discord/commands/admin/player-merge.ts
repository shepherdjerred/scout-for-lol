import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import {
  DiscordAccountIdSchema,
  DiscordChannelIdSchema,
  DiscordGuildIdSchema,
  PlayerIdSchema,
} from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getErrorMessage } from "../../../utils/errors.js";

const ArgsSchema = z.object({
  sourceAlias: z.string().min(1).max(100),
  targetAlias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerMerge(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = DiscordAccountIdSchema.parse(interaction.user.id);
  const username = interaction.user.username;

  console.log(`🔀 Starting player merge for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      sourceAlias: interaction.options.getString("source-alias"),
      targetAlias: interaction.options.getString("target-alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: sourceAlias="${args.sourceAlias}", targetAlias="${args.targetAlias}"`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { sourceAlias, targetAlias, guildId } = args;

  // Check if trying to merge with self
  if (sourceAlias === targetAlias) {
    console.log(`❌ Cannot merge player with itself`);
    await interaction.reply({
      content: `❌ **Invalid merge**\n\nCannot merge a player with itself.`,
      ephemeral: true,
    });
    return;
  }

  // Find source player
  const sourcePlayer = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: sourceAlias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
      competitionParticipants: true,
    },
  });

  if (!sourcePlayer) {
    console.log(`❌ Source player not found: "${sourceAlias}"`);
    await interaction.reply({
      content: `❌ **Source player not found**\n\nNo player with alias "${sourceAlias}" exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  // Find target player
  const targetPlayer = await prisma.player.findUnique({
    where: {
      serverId_alias: {
        serverId: guildId,
        alias: targetAlias,
      },
    },
    include: {
      accounts: true,
      subscriptions: true,
      competitionParticipants: true,
    },
  });

  if (!targetPlayer) {
    console.log(`❌ Target player not found: "${targetAlias}"`);
    await interaction.reply({
      content: `❌ **Target player not found**\n\nNo player with alias "${targetAlias}" exists in this server.`,
      ephemeral: true,
    });
    return;
  }

  console.log(
    `💾 Merging player "${sourceAlias}" (${sourcePlayer.accounts.length.toString()} accounts, ${sourcePlayer.subscriptions.length.toString()} subscriptions) into "${targetAlias}" (${targetPlayer.accounts.length.toString()} accounts, ${targetPlayer.subscriptions.length.toString()} subscriptions)`,
  );

  try {
    const now = new Date();

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1. Move all accounts from source to target
      await tx.account.updateMany({
        where: {
          playerId: sourcePlayer.id,
        },
        data: {
          playerId: targetPlayer.id,
          updatedTime: now,
        },
      });

      console.log(`✅ Moved ${sourcePlayer.accounts.length.toString()} accounts to target player`);

      // 2. Handle subscriptions - keep target's subscriptions, delete source's duplicates
      // Get all unique channel IDs from both players
      const sourceChannelIds = new Set(sourcePlayer.subscriptions.map((sub) => sub.channelId));
      const targetChannelIds = new Set(targetPlayer.subscriptions.map((sub) => sub.channelId));

      // Delete source subscriptions (including duplicates)
      await tx.subscription.deleteMany({
        where: {
          playerId: sourcePlayer.id,
        },
      });

      console.log(`✅ Removed ${sourcePlayer.subscriptions.length.toString()} subscriptions from source player`);

      // Create new subscriptions for channels that were only in source
      const uniqueSourceChannels = Array.from(sourceChannelIds).filter((channelId) => !targetChannelIds.has(channelId));

      if (uniqueSourceChannels.length > 0) {
        await tx.subscription.createMany({
          data: uniqueSourceChannels.map((channelId) => ({
            playerId: targetPlayer.id,
            channelId: channelId,
            serverId: guildId,
            creatorDiscordId: userId,
            createdTime: now,
            updatedTime: now,
          })),
        });

        console.log(`✅ Added ${uniqueSourceChannels.length.toString()} new subscriptions to target player`);
      }

      // 3. Handle competition participants
      // For each competition, if both players are participants, keep target's and delete source's
      const sourceCompetitionIds = new Set(sourcePlayer.competitionParticipants.map((cp) => cp.competitionId));
      const targetCompetitionIds = new Set(targetPlayer.competitionParticipants.map((cp) => cp.competitionId));

      // Delete all source competition participants
      await tx.competitionParticipant.deleteMany({
        where: {
          playerId: sourcePlayer.id,
        },
      });

      console.log(
        `✅ Removed ${sourcePlayer.competitionParticipants.length.toString()} competition participants from source player`,
      );

      // Create new participants for competitions that were only in source
      const uniqueSourceCompetitions = Array.from(sourceCompetitionIds).filter(
        (competitionId) => !targetCompetitionIds.has(competitionId),
      );

      if (uniqueSourceCompetitions.length > 0) {
        // Get the original participation data to preserve status and timestamps
        const sourceParticipations = sourcePlayer.competitionParticipants.filter((cp) =>
          uniqueSourceCompetitions.includes(cp.competitionId),
        );

        await tx.competitionParticipant.createMany({
          data: sourceParticipations.map((cp) => ({
            competitionId: cp.competitionId,
            playerId: targetPlayer.id,
            status: cp.status,
            invitedBy: cp.invitedBy,
            invitedAt: cp.invitedAt,
            joinedAt: cp.joinedAt,
            leftAt: cp.leftAt,
          })),
        });

        console.log(
          `✅ Added ${uniqueSourceCompetitions.length.toString()} competition participations to target player`,
        );
      }

      // 4. Handle competition snapshots - move all to target player
      await tx.competitionSnapshot.updateMany({
        where: {
          playerId: sourcePlayer.id,
        },
        data: {
          playerId: targetPlayer.id,
        },
      });

      console.log(`✅ Moved competition snapshots to target player`);

      // 5. Delete the source player
      await tx.player.delete({
        where: {
          id: sourcePlayer.id,
        },
      });

      console.log(`✅ Deleted source player "${sourceAlias}"`);

      // 6. Update target player's metadata
      await tx.player.update({
        where: {
          id: targetPlayer.id,
        },
        data: {
          updatedTime: now,
        },
      });
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Player merge completed successfully in ${executionTime.toString()}ms`);

    const totalAccounts = sourcePlayer.accounts.length + targetPlayer.accounts.length;
    const totalSubscriptions =
      targetPlayer.subscriptions.length +
      sourcePlayer.subscriptions.filter(
        (sourceSub) => !targetPlayer.subscriptions.some((targetSub) => targetSub.channelId === sourceSub.channelId),
      ).length;

    await interaction.reply({
      content: `✅ **Players merged successfully**\n\nMerged "${sourceAlias}" into "${targetAlias}"\n\n**Result:**\n• Total accounts: ${totalAccounts.toString()}\n• Total subscriptions: ${totalSubscriptions.toString()}\n• Source player "${sourceAlias}" has been deleted`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❌ Database error during player merge:`, error);
    await interaction.reply({
      content: `❌ **Error merging players**\n\nFailed to merge players: ${getErrorMessage(error)}\n\nNo changes were made.`,
      ephemeral: true,
    });
  }
}
