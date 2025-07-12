import { REST, Routes } from "discord.js";
import { subscribeCommand } from "./commands/subscribe";
import { unsubscribeCommand } from "./commands/unsubscribe";
import configuration from "../configuration";
import { listSubscriptionsCommand } from "./commands/listSubscriptions";
import { debugCommand } from "./commands/debug";

const commands = [
  subscribeCommand.toJSON(),
  unsubscribeCommand.toJSON(),
  listSubscriptionsCommand.toJSON(),
  debugCommand.toJSON(),
];

const rest = new REST().setToken(configuration.discordToken);

void (async () => {
  try {
    console.log(
      `Started refreshing ${commands.length.toString()} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(configuration.applicationId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded application (/) commands: ${JSON.stringify(data)}`
    );
  } catch (error) {
    console.error(error);
  }
})();
