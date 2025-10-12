import { REST, Routes } from "discord.js";
import { subscribeCommand } from "./commands/subscribe";
import { unsubscribeCommand } from "./commands/unsubscribe";
import configuration from "../configuration";
import { listSubscriptionsCommand } from "./commands/listSubscriptions";
import { debugCommand } from "./commands/debug";
import { competitionCommand } from "./commands/competition/index.js";

console.log("🔄 Preparing Discord slash commands for registration");

const commands = [
  subscribeCommand.toJSON(),
  unsubscribeCommand.toJSON(),
  listSubscriptionsCommand.toJSON(),
  debugCommand.toJSON(),
  competitionCommand.toJSON(),
];

console.log("📋 Commands to register:");
commands.forEach((command, index) => {
  console.log(
    `  ${(index + 1).toString()}. ${command.name}: ${command.description}`,
  );
});

console.log("🔑 Initializing Discord REST client");
const rest = new REST().setToken(configuration.discordToken);

void (async () => {
  try {
    console.log(
      `🚀 Starting registration of ${commands.length.toString()} application (/) commands`,
    );
    console.log(`🎯 Target application ID: ${configuration.applicationId}`);

    const startTime = Date.now();
    const data = await rest.put(
      Routes.applicationCommands(configuration.applicationId),
      { body: commands },
    );
    const registrationTime = Date.now() - startTime;

    console.log(
      `✅ Successfully registered ${commands.length.toString()} application (/) commands in ${registrationTime.toString()}ms`,
    );

    // Log details about registered commands
    if (Array.isArray(data)) {
      console.log("📝 Registered commands details:");
      data.forEach((command: { name: string; id: string }, index: number) => {
        console.log(
          `  ${(index + 1).toString()}. ${command.name} (ID: ${command.id})`,
        );
      });
    }

    console.log("🎉 Discord command registration completed successfully");
  } catch (error) {
    console.error("❌ Failed to register Discord commands:", error);

    // Log additional error context
    if (error instanceof Error) {
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      if (error.stack) {
        console.error("❌ Error stack:", error.stack);
      }
    }

    // Check for specific Discord API errors
    if (typeof error === "object" && error !== null && "status" in error) {
      const discordError = error as {
        status: unknown;
        rawError?: unknown;
        body?: unknown;
      };
      console.error("❌ HTTP Status:", discordError.status);
      console.error(
        "❌ Response body:",
        discordError.rawError ?? discordError.body,
      );
    }

    process.exit(1);
  }
})();
