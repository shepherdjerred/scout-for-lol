import type { ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import { truncateDiscordMessage } from "@scout-for-lol/backend/discord/utils/message.js";
import { getErrorMessage } from "@scout-for-lol/backend/utils/errors.js";

/**
 * Build an ephemeral error reply for competition commands
 */
function buildErrorReply(content: string): InteractionReplyOptions {
  return {
    content: truncateDiscordMessage(content),
    ephemeral: true,
  };
}

/**
 * Build an ephemeral success reply for competition commands
 */
function buildSuccessReply(content: string): InteractionReplyOptions {
  return {
    content: truncateDiscordMessage(content),
    ephemeral: true,
  };
}

/**
 * Reply with an error message (ephemeral)
 */
export async function replyWithError(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
  await interaction.reply(buildErrorReply(content));
}

/**
 * Reply with a success message (ephemeral)
 */
export async function replyWithSuccess(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
  await interaction.reply(buildSuccessReply(content));
}

/**
 * Reply with an error from an exception (ephemeral)
 */
export async function replyWithErrorFromException(
  interaction: ChatInputCommandInteraction,
  error: unknown,
  context: string,
): Promise<void> {
  await interaction.reply(buildErrorReply(`Error ${context}: ${getErrorMessage(error)}`));
}
