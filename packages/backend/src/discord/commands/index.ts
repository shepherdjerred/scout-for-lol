import { type Client, MessageFlags, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { DiscordAccountIdSchema } from "@scout-for-lol/data";
import { executeSubscriptionAdd, executeSubscriptionDelete, executeSubscriptionList } from "./subscription/index.js";
import { executeHelp } from "./help";
import {
  executeCompetitionCreate,
  executeCompetitionEdit,
  executeCompetitionCancel,
  executeGrantPermission,
  executeCompetitionJoin,
  executeCompetitionInvite,
  executeCompetitionLeave,
  executeCompetitionView,
  executeCompetitionList,
} from "./competition/index.js";
import {
  executePlayerEdit,
  executeAccountDelete,
  executeAccountAdd,
  executePlayerMerge,
  executePlayerDelete,
  executeAccountTransfer,
  executePlayerLinkDiscord,
  executePlayerUnlinkDiscord,
  executePlayerView,
} from "./admin/index.js";
import { executeDebugDatabase, executeDebugPolling, executeDebugServerInfo } from "./debug.js";
import { discordCommandsTotal, discordCommandDuration } from "../../metrics/index.js";
import { searchChampions } from "../../utils/champion.js";
import configuration from "../../configuration.js";

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

          if (subcommandName === "add") {
            await executeSubscriptionAdd(interaction);
          } else if (subcommandName === "delete") {
            await executeSubscriptionDelete(interaction);
          } else if (subcommandName === "list") {
            await executeSubscriptionList(interaction);
          } else {
            console.warn(`⚠️  Unknown subscription subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown subscription subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (commandName === "competition") {
          const subcommandName = interaction.options.getSubcommand();
          console.log(`🏆 Executing competition ${subcommandName} command`);

          if (subcommandName === "create") {
            await executeCompetitionCreate(interaction);
          } else if (subcommandName === "edit") {
            await executeCompetitionEdit(interaction);
          } else if (subcommandName === "cancel") {
            await executeCompetitionCancel(interaction);
          } else if (subcommandName === "grant-permission") {
            await executeGrantPermission(interaction);
          } else if (subcommandName === "join") {
            await executeCompetitionJoin(interaction);
          } else if (subcommandName === "invite") {
            await executeCompetitionInvite(interaction);
          } else if (subcommandName === "leave") {
            await executeCompetitionLeave(interaction);
          } else if (subcommandName === "view") {
            await executeCompetitionView(interaction);
          } else if (subcommandName === "list") {
            await executeCompetitionList(interaction);
          } else {
            console.warn(`⚠️  Unknown competition subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown competition subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
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
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const subcommandName = interaction.options.getSubcommand();
          console.log(`🔧 Executing admin ${subcommandName} command (authorized: ${username})`);

          if (subcommandName === "player-edit") {
            await executePlayerEdit(interaction);
          } else if (subcommandName === "account-delete") {
            await executeAccountDelete(interaction);
          } else if (subcommandName === "account-add") {
            await executeAccountAdd(interaction);
          } else if (subcommandName === "account-transfer") {
            await executeAccountTransfer(interaction);
          } else if (subcommandName === "player-merge") {
            await executePlayerMerge(interaction);
          } else if (subcommandName === "player-delete") {
            await executePlayerDelete(interaction);
          } else if (subcommandName === "player-link-discord") {
            await executePlayerLinkDiscord(interaction);
          } else if (subcommandName === "player-unlink-discord") {
            await executePlayerUnlinkDiscord(interaction);
          } else if (subcommandName === "player-view") {
            await executePlayerView(interaction);
          } else {
            console.warn(`⚠️  Unknown admin subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown admin subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (commandName === "debug") {
          // Check if user is the bot owner (applies to all debug subcommands)
          if (userId !== configuration.ownerDiscordId) {
            console.warn(`⚠️  Unauthorized debug command access attempt by ${username} (${userId})`);
            await interaction.reply({
              content: "❌ Debug commands are only available to the bot owner.",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const subcommandName = interaction.options.getSubcommand();
          console.log(`🐛 Executing debug ${subcommandName} command (authorized: ${username})`);

          if (subcommandName === "database") {
            await executeDebugDatabase(interaction);
          } else if (subcommandName === "polling") {
            await executeDebugPolling(interaction);
          } else if (subcommandName === "server-info") {
            await executeDebugServerInfo(interaction);
          } else {
            console.warn(`⚠️  Unknown debug subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown debug subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
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
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    })();
  });

  console.log("✅ Discord command handlers configured");
}
