import { type Client, MessageFlags, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { DiscordAccountIdSchema } from "@scout-for-lol/data";
import { getFlag } from "@scout-for-lol/backend/configuration/flags.js";
import { match } from "ts-pattern";

import { executeHelp } from "@scout-for-lol/backend/discord/commands/help";
import { executeCompetitionCreate } from "@scout-for-lol/backend/discord/commands/competition/create.js";
import { executeCompetitionEdit } from "@scout-for-lol/backend/discord/commands/competition/edit.js";
import { executeCompetitionCancel } from "@scout-for-lol/backend/discord/commands/competition/cancel.js";
import { executeGrantPermission } from "@scout-for-lol/backend/discord/commands/competition/grant-permission.js";
import { executeCompetitionJoin } from "@scout-for-lol/backend/discord/commands/competition/join.js";
import { executeCompetitionInvite } from "@scout-for-lol/backend/discord/commands/competition/invite.js";
import { executeCompetitionLeave } from "@scout-for-lol/backend/discord/commands/competition/leave.js";
import { executeCompetitionView } from "@scout-for-lol/backend/discord/commands/competition/view.js";
import { executeCompetitionList } from "@scout-for-lol/backend/discord/commands/competition/list.js";

import {
  executeDebugDatabase,
  executeDebugPolling,
  executeDebugServerInfo,
} from "@scout-for-lol/backend/discord/commands/debug.js";
import { discordCommandsTotal, discordCommandDuration } from "@scout-for-lol/backend/metrics/index.js";
import { searchChampions } from "@scout-for-lol/backend/utils/champion.js";
import { executeAccountAdd } from "@scout-for-lol/backend/discord/commands/admin/account-add";
import { executeAccountDelete } from "@scout-for-lol/backend/discord/commands/admin/account-delete";
import { executeAccountTransfer } from "@scout-for-lol/backend/discord/commands/admin/account-transfer";
import { executePlayerDelete } from "@scout-for-lol/backend/discord/commands/admin/player-delete";
import { executePlayerEdit } from "@scout-for-lol/backend/discord/commands/admin/player-edit";
import { executePlayerLinkDiscord } from "@scout-for-lol/backend/discord/commands/admin/player-link-discord";
import { executePlayerMerge } from "@scout-for-lol/backend/discord/commands/admin/player-merge";
import { executePlayerUnlinkDiscord } from "@scout-for-lol/backend/discord/commands/admin/player-unlink-discord";
import { executePlayerView } from "@scout-for-lol/backend/discord/commands/admin/player-view";
import { executeDebugForceLeaderboardUpdate } from "@scout-for-lol/backend/discord/commands/debug/force-leaderboard-update";
import { executeDebugForceSnapshot } from "@scout-for-lol/backend/discord/commands/debug/force-snapshot";
import { executeDebugManageParticipant } from "@scout-for-lol/backend/discord/commands/debug/manage-participant";
import { executeSubscriptionAdd } from "@scout-for-lol/backend/discord/commands/subscription/add";
import { executeSubscriptionDelete } from "@scout-for-lol/backend/discord/commands/subscription/delete";
import { executeSubscriptionList } from "@scout-for-lol/backend/discord/commands/subscription/list";

export function handleCommands(client: Client) {
  console.log("⚡ Setting up Discord command handlers");

  // Handle autocomplete interactions
  client.on("interactionCreate", (interaction) => {
    void (async () => {
      if (interaction.isAutocomplete()) {
        const commandName = interaction.commandName;
        const focusedOption = interaction.options.getFocused(true);

        // Handle champion autocomplete for competition create command
        if (commandName === "competition" && focusedOption.name === "champion") {
          const query = focusedOption.value;
          const results = searchChampions(query);

          await interaction.respond(
            results.map((champion) => ({
              name: champion.name,
              value: champion.id.toString(), // Store ID as string value
            })),
          );
          return;
        }

        // No autocomplete for this option
        await interaction.respond([]);
        return;
      }
    })();
  });

  // Handle command interactions
  client.on("interactionCreate", (interaction) => {
    void (async () => {
      if (!interaction.isChatInputCommand()) {
        return;
      }

      const startTime = Date.now();
      const commandName = interaction.commandName;
      const userId = DiscordAccountIdSchema.parse(interaction.user.id);
      const username = interaction.user.username;
      const guildId = interaction.guildId;
      const channelId = interaction.channelId;

      console.log(
        `📥 Command received: ${commandName} from ${username} (${userId}) in guild ${guildId ?? "DM"} channel ${channelId}`,
      );

      // Log command options if any
      if (interaction.options.data.length > 0) {
        console.log(
          `📝 Command options:`,
          interaction.options.data.map((opt) => `${opt.name}: ${String(opt.value)}`).join(", "),
        );
      }

      try {
        if (commandName === "subscription") {
          const subcommandName = interaction.options.getSubcommand();
          console.log(`🔔 Executing subscription ${subcommandName} command`);

          await match(subcommandName)
            .with("add", () => executeSubscriptionAdd(interaction))
            .with("delete", () => executeSubscriptionDelete(interaction))
            .with("list", () => executeSubscriptionList(interaction))
            .otherwise(() => {
              console.warn(`⚠️  Unknown subscription subcommand: ${subcommandName}`);
              return interaction.reply({
                content: "Unknown subscription subcommand",
                ephemeral: true,
              });
            });
        } else if (commandName === "competition") {
          const subcommandName = interaction.options.getSubcommand();
          console.log(`🏆 Executing competition ${subcommandName} command`);

          await match(subcommandName)
            .with("create", async () => executeCompetitionCreate(interaction))
            .with("edit", async () => executeCompetitionEdit(interaction))
            .with("cancel", async () => executeCompetitionCancel(interaction))
            .with("grant-permission", async () => executeGrantPermission(interaction))
            .with("join", async () => executeCompetitionJoin(interaction))
            .with("invite", async () => executeCompetitionInvite(interaction))
            .with("leave", async () => executeCompetitionLeave(interaction))
            .with("view", async () => executeCompetitionView(interaction))
            .with("list", async () => executeCompetitionList(interaction))
            .otherwise(async () => {
              console.warn(`⚠️  Unknown competition subcommand: ${subcommandName}`);
              await interaction.reply({
                content: "Unknown competition subcommand",
                ephemeral: true,
              });
            });
        } else if (commandName === "admin") {
          // Check if user has Administrator permissions (applies to all admin subcommands)
          const member = interaction.member;
          const hasAdminPermission =
            member &&
            "permissions" in member &&
            member.permissions instanceof PermissionsBitField &&
            member.permissions.has(PermissionFlagsBits.Administrator);

          if (!hasAdminPermission) {
            console.warn(`⚠️  Unauthorized admin command access attempt by ${username} (${userId})`);
            await interaction.reply({
              content: "❌ Admin commands require Administrator permissions in this server.",
              ephemeral: true,
            });
            return;
          }

          const subcommandName = interaction.options.getSubcommand();
          console.log(`🔧 Executing admin ${subcommandName} command (authorized: ${username})`);

          await match(subcommandName)
            .with("player-edit", () => executePlayerEdit(interaction))
            .with("account-delete", () => executeAccountDelete(interaction))
            .with("account-add", () => executeAccountAdd(interaction))
            .with("account-transfer", () => executeAccountTransfer(interaction))
            .with("player-merge", () => executePlayerMerge(interaction))
            .with("player-delete", () => executePlayerDelete(interaction))
            .with("player-link-discord", () => executePlayerLinkDiscord(interaction))
            .with("player-unlink-discord", () => executePlayerUnlinkDiscord(interaction))
            .with("player-view", () => executePlayerView(interaction))
            .otherwise(() => {
              console.warn(`⚠️  Unknown admin subcommand: ${subcommandName}`);
              return interaction.reply({
                content: "Unknown admin subcommand",
                ephemeral: true,
              });
            });
        } else if (commandName === "debug") {
          // Check if user has debug access (applies to all debug subcommands)
          if (!getFlag("debug", { user: userId })) {
            console.warn(`⚠️  Unauthorized debug command access attempt by ${username} (${userId})`);
            await interaction.reply({
              content: "❌ Debug commands are only available to authorized users.",
              ephemeral: true,
            });
            return;
          }

          const subcommandName = interaction.options.getSubcommand();
          console.log(`🐛 Executing debug ${subcommandName} command (authorized: ${username})`);

          await match(subcommandName)
            .with("database", async () => executeDebugDatabase(interaction))
            .with("polling", async () => executeDebugPolling(interaction))
            .with("server-info", async () => executeDebugServerInfo(interaction))
            .with("force-snapshot", async () => executeDebugForceSnapshot(interaction))
            .with("force-leaderboard-update", async () => executeDebugForceLeaderboardUpdate(interaction))
            .with("manage-participant", async () => executeDebugManageParticipant(interaction))
            .otherwise(async () => {
              console.warn(`⚠️  Unknown debug subcommand: ${subcommandName}`);
              await interaction.reply({
                content: "Unknown debug subcommand",
                ephemeral: true,
              });
            });
        } else if (commandName === "help") {
          console.log("❓ Executing help command");
          await executeHelp(interaction);
        } else {
          console.warn(`⚠️  Unknown command received: ${commandName}`);
          await interaction.reply("Unknown command");
        }

        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.log(`✅ Command ${commandName} completed successfully in ${executionTime.toString()}ms`);

        // Record successful command metrics
        discordCommandsTotal.inc({ command: commandName, status: "success" });
        discordCommandDuration.observe({ command: commandName }, executionTimeSeconds);
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const executionTimeSeconds = executionTime / 1000;
        console.error(`❌ Command ${commandName} failed after ${executionTime.toString()}ms:`, error);

        // Record failed command metrics
        discordCommandsTotal.inc({ command: commandName, status: "error" });
        discordCommandDuration.observe({ command: commandName }, executionTimeSeconds);
        console.error(
          `❌ Error details - User: ${username} (${userId}), Guild: ${String(guildId)}, Channel: ${channelId}`,
        );

        const errorMessage =
          "❌ **There was an error while executing this command!**\n\n" +
          "If this issue persists, please report it:\n" +
          "• Open an issue on GitHub: https://github.com/shepherdjerred/scout-for-lol/issues\n" +
          "• Join our Discord server for support: https://discord.gg/qmRewyHXFE";

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true,
          });
        }
      }
    })();
  });

  console.log("✅ Discord command handlers configured");
}
