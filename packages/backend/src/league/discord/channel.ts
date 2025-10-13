import { type Message, MessageCreateOptions, MessagePayload, type TextChannel } from "discord.js";
import { z } from "zod";
import client from "../../discord/client";
import { asTextChannel } from "../../discord/utils/channel";

export async function send(
  options: string | MessagePayload | MessageCreateOptions,
  channelId: string,
): Promise<Message<true> | Message<false>> {
  // TODO: check if the channel is a text channel
  const fetchedChannel = await client.channels.fetch(channelId);
  if (!fetchedChannel) {
    throw new Error("invalid channel");
  }
  const channel = asTextChannel(fetchedChannel);
  if (!channel) {
    throw new Error("invalid channel");
  }

  // Log message info - only log string messages to avoid object stringification
  const stringResult = z.string().safeParse(options);
  if (stringResult.success) {
    console.log(`Sending message: ${stringResult.data}`);
  } else {
    console.log("Sending message: [MessagePayload/MessageCreateOptions]");
  }

  return channel.send(options);
}
