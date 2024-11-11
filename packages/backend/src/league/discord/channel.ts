import { MessageCreateOptions, MessagePayload } from "discord.js";
import configuration from "../../configuration.ts";
import client from "../../discord/client.ts";

export async function send(
  options: string | MessagePayload | MessageCreateOptions,
) {
  const channel = await client.channels.fetch(configuration.leagueChannelId);
  if (!channel?.isTextBased()) {
    throw new Error("invalid channel");
  }
  return channel.send(options);
}
