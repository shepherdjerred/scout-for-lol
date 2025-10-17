import { type ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../../database/index.js";
import { fromError } from "zod-validation-error";
import { getAccountLimit, getSubscriptionLimit } from "../../../configuration/subscription-limits.js";

const ArgsSchema = z.object({
  alias: z.string().min(1).max(100),
  guildId: DiscordGuildIdSchema,
});

export async function executePlayerInfo(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const userId = interaction.user.id;
  const username = interaction.user.username;

  console.log(`ℹ️  Starting player info lookup for user ${username} (${userId})`);

  let args: z.infer<typeof ArgsSchema>;

  try {
    args = ArgsSchema.parse({
      alias: interaction.options.getString("alias"),
      guildId: interaction.guildId,
    });

    console.log(`✅ Command arguments validated successfully`);
    console.log(`📋 Args: alias="${args.alias}"`);
  } catch (error) {
    console.error(`❌ Invalid command arguments from ${username}:`, error);
    const validationError = fromError(error);
    await interaction.reply({
      content: validationError.toString(),
      ephemeral: true,
    });
    return;
  }

  const { alias, guildId } = args;

  // Fetch player with all related data
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
          competition: true,
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

  console.log(`✅ Player found: ${player.alias} (ID: ${player.id.toString()})`);

  // Get rate limiting info for the server
  const accountLimit = getAccountLimit(guildId);
  const subscriptionLimit = getSubscriptionLimit(guildId);

  // Count total accounts and subscriptions in server for rate limit context
  const totalServerAccounts = await prisma.account.count({
    where: { serverId: guildId },
  });

  const totalServerPlayers = await prisma.player.count({
    where: {
      serverId: guildId,
      subscriptions: {
        some: {},
      },
    },
  });

  // Build the response
  const sections: string[] = [];

  // Player Info Section
  sections.push(`# 👤 Player Info: ${player.alias}`);
  sections.push(`**ID:** ${player.id.toString()}`);
  sections.push(`**Discord ID:** ${player.discordId ?? "Not set"}`);
  sections.push(`**Server ID:** ${player.serverId}`);

  // Accounts Section
  sections.push(`\n## 🎮 Accounts (${player.accounts.length.toString()})`);
  if (player.accounts.length > 0) {
    for (const account of player.accounts) {
      const lastSeen = account.lastSeenInGame
        ? `Last seen: <t:${Math.floor(account.lastSeenInGame.getTime() / 1000).toString()}:R>`
        : "Never seen in game";
      sections.push(`• **${account.alias}** (${account.region.toUpperCase()})`);
      sections.push(`  - PUUID: \`${account.puuid}\``);
      sections.push(`  - ${lastSeen}`);
      sections.push(`  - ID: ${account.id.toString()}`);
    }
  } else {
    sections.push("*No accounts linked*");
  }

  // Rate Limiting Info Section
  sections.push(`\n## ⏱️ Server Rate Limits`);
  sections.push(
    `**Account Limit:** ${accountLimit !== null ? `${totalServerAccounts.toString()}/${accountLimit.toString()}` : `${totalServerAccounts.toString()} (unlimited)`}`,
  );
  sections.push(
    `**Subscription Limit:** ${subscriptionLimit !== null ? `${totalServerPlayers.toString()}/${subscriptionLimit.toString()} players` : `${totalServerPlayers.toString()} players (unlimited)`}`,
  );

  // Subscriptions Section
  sections.push(`\n## 🔔 Subscriptions (${player.subscriptions.length.toString()})`);
  if (player.subscriptions.length > 0) {
    for (const sub of player.subscriptions) {
      sections.push(
        `• <#${sub.channelId}> - Created <t:${Math.floor(sub.createdTime.getTime() / 1000).toString()}:R> (ID: ${sub.id.toString()})`,
      );
    }
  } else {
    sections.push("*No active subscriptions*");
  }

  // Competitions Section
  const activeCompetitions = player.competitionParticipants.filter(
    (p) => !p.competition.isCancelled && p.status === "JOINED",
  );
  const invitedCompetitions = player.competitionParticipants.filter(
    (p) => !p.competition.isCancelled && p.status === "INVITED",
  );

  sections.push(`\n## 🏆 Competitions`);
  if (activeCompetitions.length > 0) {
    sections.push(`**Active (${activeCompetitions.length.toString()}):**`);
    for (const participant of activeCompetitions) {
      const comp = participant.competition;
      const joinedAt = participant.joinedAt
        ? `<t:${Math.floor(participant.joinedAt.getTime() / 1000).toString()}:R>`
        : "Unknown";
      sections.push(`• **${comp.title}** (ID: ${comp.id.toString()})`);
      sections.push(`  - Joined: ${joinedAt}`);
      sections.push(`  - Channel: <#${comp.channelId}>`);
    }
  }

  if (invitedCompetitions.length > 0) {
    sections.push(`**Invited (${invitedCompetitions.length.toString()}):**`);
    for (const participant of invitedCompetitions) {
      const comp = participant.competition;
      const invitedAt = participant.invitedAt
        ? `<t:${Math.floor(participant.invitedAt.getTime() / 1000).toString()}:R>`
        : "Unknown";
      sections.push(`• **${comp.title}** (ID: ${comp.id.toString()})`);
      sections.push(`  - Invited: ${invitedAt}`);
    }
  }

  if (activeCompetitions.length === 0 && invitedCompetitions.length === 0) {
    sections.push("*No active or pending competitions*");
  }

  // Debug Info Section
  sections.push(`\n## 🐛 Debug Info`);
  sections.push(`**Created:** <t:${Math.floor(player.createdTime.getTime() / 1000).toString()}:F>`);
  sections.push(`**Updated:** <t:${Math.floor(player.updatedTime.getTime() / 1000).toString()}:F>`);
  sections.push(`**Creator Discord ID:** ${player.creatorDiscordId}`);

  const executionTime = Date.now() - startTime;
  console.log(`✅ Player info retrieved successfully in ${executionTime.toString()}ms`);

  const content = sections.join("\n");

  // Discord has a 2000 character limit for message content
  if (content.length > 2000) {
    // Split into multiple messages if needed
    const chunks: string[] = [];
    let currentChunk = "";

    for (const section of sections) {
      if (currentChunk.length + section.length + 1 > 1900) {
        chunks.push(currentChunk);
        currentChunk = section;
      } else {
        currentChunk += (currentChunk ? "\n" : "") + section;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    const firstChunk = chunks[0];
    if (firstChunk === undefined) {
      await interaction.reply({
        content: "❌ Error: No content to display",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: firstChunk,
      ephemeral: true,
    });

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk !== undefined) {
        await interaction.followUp({
          content: chunk,
          ephemeral: true,
        });
      }
    }
  } else {
    await interaction.reply({
      content,
      ephemeral: true,
    });
  }
}
