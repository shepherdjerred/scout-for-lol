import { type Client, MessageFlags } from "discord.js";
import { executeSubscribe } from "./subscribe";
import { executeUnsubscribe } from "./unsubscribe";
import { executeListSubscriptions } from "./list-subscriptions";
import { executeCompetitionCreate, executeCompetitionCancel } from "./competition/index.js";
import { getState } from "../../league/model/state";
import { discordCommandsTotal, discordCommandDuration } from "../../metrics/index.js";

export function handleCommands(client: Client) {
  console.log("⚡ Setting up Discord command handlers");

  client.on("interactionCreate", (interaction) => {
    void (async () => {
      if (!interaction.isChatInputCommand()) {
        return;
      }

      const startTime = Date.now();
      const commandName = interaction.commandName;
      const userId = interaction.user.id;
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
          } else if (subcommandName === "cancel") {
            await executeCompetitionCancel(interaction);
          } else {
            console.warn(`⚠️  Unknown competition subcommand: ${subcommandName}`);
            await interaction.reply({
              content: "Unknown competition subcommand",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (commandName === "debug") {
          console.log("🐛 Executing debug command");
          const state = getState();
          const debugInfo = {
            gamesInProgress: state.gamesStarted.length,
            games: state.gamesStarted.map((game) => ({
              matchId: game.matchId,
              players: game.players.length,
              added: game.added.toISOString(),
              queue: game.queue,
            })),
          };
          console.log("📊 Debug info:", debugInfo);
          await interaction.reply({
            content: `\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``,
            flags: MessageFlags.Ephemeral,
          });
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
