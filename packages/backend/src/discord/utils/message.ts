/**
 * Discord message utilities
 *
 * Helpers for safely handling Discord message interactions
 */

/**
 * Discord's message content limit
 * @see https://discord.com/developers/docs/resources/channel#create-message
 */
const DISCORD_MESSAGE_MAX_LENGTH = 2000;

/**
 * Safe buffer to leave room for markdown formatting and other content
 */
const SAFE_MESSAGE_BUFFER = 100;

/**
 * Truncate a message to fit within Discord's 2000 character limit
 *
 * Discord has a hard limit of 2000 characters for message content.
 * This function ensures messages don't exceed that limit by truncating
 * and adding an ellipsis.
 *
 * @param message The message to truncate
 * @param maxLength Maximum length (default: 1900 to leave buffer for formatting)
 * @returns Truncated message with ellipsis if needed
 *
 * @example
 * ```ts
 * await interaction.reply({
 *   content: truncateDiscordMessage(longErrorMessage),
 *   ephemeral: true,
 * });
 * ```
 */
export function truncateDiscordMessage(
  message: string,
  maxLength: number = DISCORD_MESSAGE_MAX_LENGTH - SAFE_MESSAGE_BUFFER,
): string {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength)}...`;
}

/**
 * Truncate text for embed field values (1024 character limit)
 *
 * Discord embed field values have a limit of 1024 characters.
 *
 * @param text The text to truncate
 * @returns Truncated text with ellipsis if needed
 */
export function truncateEmbedFieldValue(text: string): string {
  const MAX_FIELD_VALUE_LENGTH = 1024;
  const FIELD_BUFFER = 20;
  const maxLength = MAX_FIELD_VALUE_LENGTH - FIELD_BUFFER;

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

/**
 * Truncate text for embed descriptions (4096 character limit)
 *
 * Discord embed descriptions have a limit of 4096 characters.
 *
 * @param text The text to truncate
 * @returns Truncated text with ellipsis if needed
 */
export function truncateEmbedDescription(text: string): string {
  const MAX_DESCRIPTION_LENGTH = 4096;
  const DESCRIPTION_BUFFER = 20;
  const maxLength = MAX_DESCRIPTION_LENGTH - DESCRIPTION_BUFFER;

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}
