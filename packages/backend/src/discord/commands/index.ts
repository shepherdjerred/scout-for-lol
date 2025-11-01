import { type Client, MessageFlags } from "discord.js";
import { executeSubscribe } from "./subscribe";
import { executeUnsubscribe } from "./unsubscribe";
import { executeListSubscriptions } from "./list-subscriptions";
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
  executePlayerEditAlias,
  executeAccountRemove,
  executeAccountAdd,
  executePlayerMerge,
  executePlayerDelete,
  executeAccountTransfer,
  executePlayerLinkDiscord,
  executePlayerUnlinkDiscord,
  executePlayerInfo,
} from "./admin/index.js";
import { executeDebugState, executeDebugDatabase, executeDebugPolling } from "./debug.js";
import { executeServerInfo } from "./server-info.js";
import { discordCommandsTotal, discordCommandDuration } from "../../metrics/index.js";
import { searchChampions } from "../../utils/champion.js";

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
        if (commandName === "subscribe") {
          console.log("🔔 Executing subscribe command");
          await executeSubscribe(interaction);
        } else if (commandName === "unsubscribe") {
          console.log("🔕 Executing unsubscribe command");
          await executeUnsubscribe(interaction);
        } else if (commandName === "listsubscriptions") {
          console.log("📋 Executing list subscriptions command");
          await executeListSubscriptions(interaction);
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
          const subcommandName = interaction.options.getSubcommand();
          console.log(`🔧 Executing admin ${subcommandName} command`);

          if (subcommandName === "player-edit-alias") {
            await executePlayerEditAlias(interaction);
          } else if (subcommandName === "account-remove") {
            await executeAccountRemove(interaction);
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
          } else if (subcommandName === "player-info") {
            await executePlayerInfo(interaction);
          } else {
            console.warn(`⚠️  Unknown admin subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown admin subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (commandName === "debug") {
          const subcommandName = interaction.options.getSubcommand();
          console.log(`🐛 Executing debug ${subcommandName} command`);

          if (subcommandName === "state") {
            await executeDebugState(interaction);
          } else if (subcommandName === "database") {
            await executeDebugDatabase(interaction);
          } else if (subcommandName === "polling") {
            await executeDebugPolling(interaction);
          } else {
            console.warn(`⚠️  Unknown debug subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown debug subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (commandName === "server-info") {
          console.log("📊 Executing server-info command");
          await executeServerInfo(interaction);
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

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    })();
  });

  console.log("✅ Discord command handlers configured");
}
