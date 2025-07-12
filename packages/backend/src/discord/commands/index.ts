import { type Client, MessageFlags } from "discord.js";
import { executeSubscribe } from "./subscribe";
import { executeUnsubscribe } from "./unsubscribe";
import { executeListSubscriptions } from "./listSubscriptions";
import { getState } from "../../league/model/state";

export function handleCommands(client: Client) {
  client.on("interactionCreate", (interaction) => {
    void (async () => {
      if (!interaction.isChatInputCommand()) {
        return;
      }
      console.log(interaction);

      try {
        if (interaction.commandName === "subscribe") {
          await executeSubscribe(interaction);
        } else if (interaction.commandName === "unsubscribe") {
          await executeUnsubscribe(interaction);
        } else if (interaction.commandName === "listsubscriptions") {
          await executeListSubscriptions(interaction);
        } else if (interaction.commandName === "debug") {
          const state = getState();
          const debugInfo = {
            gamesInProgress: state.gamesStarted.length,
            games: state.gamesStarted.map(game => ({
              matchId: game.matchId,
              players: game.players.length,
              added: game.added.toISOString(),
              queue: game.queue
            }))
          };
          await interaction.reply({
            content: `\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply("Unknown command");
        }
      } catch (error) {
        console.error(error);
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
}
