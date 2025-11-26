import { REST, Routes } from "discord.js";
import { z } from "zod";
import * as Sentry from "@sentry/node";
import configuration from "@scout-for-lol/backend/configuration";
import { debugCommand } from "@scout-for-lol/backend/discord/commands/debug";
import { competitionCommand } from "@scout-for-lol/backend/discord/commands/competition/index.js";
import { adminCommand } from "@scout-for-lol/backend/discord/commands/admin/index.js";
import { subscriptionCommand } from "@scout-for-lol/backend/discord/commands/subscription/index.js";
import { helpCommand } from "@scout-for-lol/backend/discord/commands/help.js";

console.log("🔄 Preparing Discord slash commands for registration");

const commands = [
  subscriptionCommand.toJSON(),
  debugCommand.toJSON(),
  competitionCommand.toJSON(),
  adminCommand.toJSON(),
  helpCommand.toJSON(),
];

console.log("📋 Commands to register:");
commands.forEach((command, index) => {
  console.log(`  ${(index + 1).toString()}. ${command.name}: ${command.description}`);
});

console.log("🔑 Initializing Discord REST client");
const rest = new REST().setToken(configuration.discordToken);

void (async () => {
  try {
    console.log(`🚀 Starting registration of ${commands.length.toString()} application (/) commands`);
    console.log(`🎯 Target application ID: ${configuration.applicationId}`);

    const startTime = Date.now();
    const data = await rest.put(Routes.applicationCommands(configuration.applicationId), { body: commands });
    const registrationTime = Date.now() - startTime;

    console.log(
      `✅ Successfully registered ${commands.length.toString()} application (/) commands in ${registrationTime.toString()}ms`,
    );

    // Log details about registered commands
    const CommandSchema = z.object({ name: z.string(), id: z.string() });
    const commandsResult = z.array(CommandSchema).safeParse(data);
    if (commandsResult.success) {
      console.log("📝 Registered commands details:");
      commandsResult.data.forEach((command, index) => {
        console.log(`  ${(index + 1).toString()}. ${command.name} (ID: ${command.id})`);
      });
    }

    console.log("🎉 Discord command registration completed successfully");
  } catch (error) {
    console.error("❌ Failed to register Discord commands:", error);
    Sentry.captureException(error, {
      tags: { source: "discord-command-registration" },
    });

    // Log additional error context
    const ErrorDetailsSchema = z.object({ name: z.string(), message: z.string(), stack: z.string().optional() });
    const errorResult = ErrorDetailsSchema.safeParse(error);
    if (errorResult.success) {
      console.error("❌ Error name:", errorResult.data.name);
      console.error("❌ Error message:", errorResult.data.message);
      if (errorResult.data.stack) {
        console.error("❌ Error stack:", errorResult.data.stack);
      }
    }

    // Check for specific Discord API errors
    const objectResult = z.object({ status: z.unknown() }).catchall(z.unknown()).safeParse(error);
    if (objectResult.success) {
      const discordError = objectResult.data;
      console.error("❌ HTTP Status:", discordError.status);
      console.error("❌ Response body:", discordError["rawError"] ?? discordError["body"]);
    }

    process.exit(1);
  }
})();
