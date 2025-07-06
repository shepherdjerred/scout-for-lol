import configuration from "../configuration";
import { Client, GatewayIntentBits } from "discord.js";
import { handleCommands } from "./commands/index";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

console.log("Logging into Discord");
await client.login(configuration.discordToken);
console.log("Logged into Discord");

client.on("ready", () => {
  handleCommands(client);
  console.log("Ready to handle Discord commands");
});

export default client;
