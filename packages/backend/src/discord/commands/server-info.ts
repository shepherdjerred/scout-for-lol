import { type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { DiscordGuildIdSchema } from "@scout-for-lol/data";
import { prisma } from "../../database/index.js";
import configuration from "../../configuration.js";

export const serverInfoCommand = new SlashCommandBuilder()
  .setName("server-info")
  .setDescription("View detailed server information (players, accounts, subscriptions, competitions)");

export async function executeServerInfo(interaction: ChatInputCommandInteraction) {
  console.log("📊 Executing server-info command");

  // Defer reply since this might take a moment to gather all data
  await interaction.deferReply({ ephemeral: true });

  try {
    const serverId = interaction.guildId ? DiscordGuildIdSchema.parse(interaction.guildId) : null;

    if (!serverId) {
      await interaction.editReply({
        content: "❌ This command can only be used in a server (guild).",
      });
      return;
    }

    console.log(`📊 Fetching server info for guild: ${serverId}`);

    // Fetch all data in parallel for better performance
    const [players, accounts, subscriptions, competitions, activeCompetitions, permissions] = await Promise.all([
      prisma.player.findMany({
        where: { serverId },
        include: { accounts: true },
      }),
      prisma.account.findMany({
        where: { serverId },
        include: { player: true },
      }),
      prisma.subscription.findMany({
        where: { serverId },
        include: { player: true },
      }),
      prisma.competition.findMany({
        where: { serverId },
        include: {
          participants: true,
          snapshots: true,
        },
      }),
      prisma.competition.findMany({
        where: { serverId, isCancelled: false },
        include: {
          participants: {
            where: { status: "JOINED" },
          },
        },
      }),
      prisma.serverPermission.findMany({
        where: { serverId },
      }),
    ]);

    console.log(
      `📊 Data fetched - Players: ${players.length.toString()}, Accounts: ${accounts.length.toString()}, Subscriptions: ${subscriptions.length.toString()}, Competitions: ${competitions.length.toString()}`,
    );

    // Note: Active game tracking removed (Spectator API deprecated)
    const activeGames = 0; // No longer tracking active games

    // Count subscriptions by channel
    const channelMap: Record<string, number> = {};
    for (const sub of subscriptions) {
      const count = channelMap[sub.channelId] ?? 0;
      channelMap[sub.channelId] = count + 1;
    }

    // Build embeds (Discord has a limit, so we'll create multiple embeds)
    const embeds: EmbedBuilder[] = [];

    // Overview Embed
    const overviewEmbed = new EmbedBuilder()
      .setTitle("📊 Server Overview")
      .setColor(0x5865f2) // Discord Blurple
      .addFields(
        { name: "👥 Total Players", value: players.length.toString(), inline: true },
        { name: "🎮 Total Accounts", value: accounts.length.toString(), inline: true },
        { name: "🔔 Subscriptions", value: subscriptions.length.toString(), inline: true },
        { name: "📺 Subscribed Channels", value: Object.keys(channelMap).length.toString(), inline: true },
        { name: "🏆 Total Competitions", value: competitions.length.toString(), inline: true },
        { name: "✅ Active Competitions", value: activeCompetitions.length.toString(), inline: true },
        { name: "🔑 Permissions Granted", value: permissions.length.toString(), inline: true },
      )
      .setTimestamp();

    embeds.push(overviewEmbed);

    // Players Embed (limited to first 10 for readability)
    if (players.length > 0) {
      const playersEmbed = new EmbedBuilder().setTitle("👥 Players").setColor(0x57f287); // Green

      const playersList = players.slice(0, 10).map((player) => {
        const accountCount = player.accounts.length;
        const discordMention = player.discordId ? `<@${player.discordId}>` : "No Discord";
        return `**${player.alias}** - ${accountCount.toString()} account${accountCount !== 1 ? "s" : ""} - ${discordMention}`;
      });

      if (playersList.length > 0) {
        playersEmbed.setDescription(playersList.join("\n"));
      }

      if (players.length > 10) {
        playersEmbed.setFooter({ text: `Showing 10 of ${players.length.toString()} players` });
      }

      embeds.push(playersEmbed);
    }

    // Accounts Embed (limited to first 10)
    if (accounts.length > 0) {
      const accountsEmbed = new EmbedBuilder().setTitle("🎮 Accounts").setColor(0xfee75c); // Yellow

      const accountsList = accounts.slice(0, 10).map((account) => {
        const region = account.region.toUpperCase();
        return `**${account.alias}** (${region}) - ${account.player.alias}`;
      });

      if (accountsList.length > 0) {
        accountsEmbed.setDescription(accountsList.join("\n\n"));
      }

      if (accounts.length > 10) {
        accountsEmbed.setFooter({ text: `Showing 10 of ${accounts.length.toString()} accounts` });
      }

      embeds.push(accountsEmbed);
    }

    // Subscriptions Embed (by channel)
    if (subscriptions.length > 0) {
      const subscriptionsEmbed = new EmbedBuilder().setTitle("🔔 Subscriptions").setColor(0xeb459e); // Pink

      const channelsList = Object.entries(channelMap)
        .slice(0, 10)
        .map(([channelId, count]) => `<#${channelId}>: ${count.toString()} subscription${count !== 1 ? "s" : ""}`)
        .join("\n");
      subscriptionsEmbed.setDescription(channelsList);

      embeds.push(subscriptionsEmbed);
    }

    // Active Competitions Embed
    if (activeCompetitions.length > 0) {
      const competitionsEmbed = new EmbedBuilder().setTitle("🏆 Active Competitions").setColor(0xed4245); // Red

      const competitionsList = activeCompetitions.slice(0, 5).map((comp) => {
        const participantCount = comp.participants.length;
        const owner = `<@${comp.ownerId}>`;
        const channel = `<#${comp.channelId}>`;
        const startDate = comp.startDate ? `<t:${Math.floor(comp.startDate.getTime() / 1000).toString()}:d>` : "N/A";
        const endDate = comp.endDate ? `<t:${Math.floor(comp.endDate.getTime() / 1000).toString()}:d>` : "N/A";

        return (
          `**${comp.title}**\n` +
          `Owner: ${owner} | Channel: ${channel}\n` +
          `Participants: ${participantCount.toString()}/${comp.maxParticipants.toString()}\n` +
          `Period: ${startDate} - ${endDate}\n` +
          `Type: ${comp.criteriaType} | Visibility: ${comp.visibility}`
        );
      });

      if (competitionsList.length > 0) {
        competitionsEmbed.setDescription(competitionsList.join("\n\n"));
      }

      if (activeCompetitions.length > 5) {
        competitionsEmbed.setFooter({
          text: `Showing 5 of ${activeCompetitions.length.toString()} active competitions`,
        });
      }

      embeds.push(competitionsEmbed);
    }

    // Debug Info Embed
    const debugEmbed = new EmbedBuilder()
      .setTitle("🐛 Debug Info")
      .setColor(0x9b59b6) // Purple
      .addFields(
        { name: "Bot Version", value: configuration.version, inline: true },
        { name: "Environment", value: configuration.environment, inline: true },
        { name: "Git SHA", value: configuration.gitSha.substring(0, 8), inline: true },
        { name: "Games in Progress", value: activeGames.toString(), inline: true },
        { name: "Database", value: configuration.databaseUrl.includes("file:") ? "SQLite" : "External", inline: true },
        { name: "S3 Bucket", value: configuration.s3BucketName ?? "Not configured", inline: true },
      );

    embeds.push(debugEmbed);

    console.log(`✅ Server info compiled successfully with ${embeds.length.toString()} embeds`);

    await interaction.editReply({
      embeds,
    });
  } catch (error) {
    console.error("❌ Error executing server-info command:", error);
    await interaction.editReply({
      content: `❌ Error fetching server information: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
