import configuration from "../configuration";
import { Client, GatewayIntentBits } from "discord.js";
import { handleCommands } from "./commands/index";
import {
  discordConnectionStatus,
  discordGuildsGauge,
  discordUsersGauge,
  discordLatency,
} from "../metrics/index.js";

console.log("🔌 Initializing Discord client");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Add event listeners for connection status
client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
  discordConnectionStatus.set(0);
});

client.on("warn", (warning) => {
  console.warn("⚠️  Discord client warning:", warning);
});

client.on("debug", (info) => {
  // Only log debug info in dev environment to avoid spam
  if (configuration.environment === "dev") {
    console.debug("🔍 Discord debug:", info);
  }
});

client.on("disconnect", () => {
  console.log("🔌 Discord client disconnected");
  discordConnectionStatus.set(0);
});

client.on("reconnecting", () => {
  console.log("🔄 Discord client reconnecting");
  discordConnectionStatus.set(0);
});

console.log("🔑 Logging into Discord");
try {
  await client.login(configuration.discordToken);
  console.log("✅ Successfully logged into Discord");
} catch (error) {
  console.error("❌ Failed to login to Discord:", error);
  throw error;
}

client.on("ready", (client) => {
  console.log(`✅ Discord bot ready! Logged in as ${client.user.tag}`);
  console.log(`🏢 Bot is in ${client.guilds.cache.size.toString()} guilds`);
  console.log(`👥 Bot can see ${client.users.cache.size.toString()} users`);

  // Update connection status metric
  discordConnectionStatus.set(1);

  // Update guild and user count metrics
  discordGuildsGauge.set(client.guilds.cache.size);
  discordUsersGauge.set(client.users.cache.size);

  // Update metrics periodically
  setInterval(() => {
    discordGuildsGauge.set(client.guilds.cache.size);
    discordUsersGauge.set(client.users.cache.size);
    discordLatency.set(client.ws.ping);
  }, 30_000); // Update every 30 seconds

  handleCommands(client);
  console.log("⚡ Discord command handler initialized");
});

export default client;
