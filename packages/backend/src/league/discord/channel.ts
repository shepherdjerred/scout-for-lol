import { type Message, MessageCreateOptions, MessagePayload, type TextChannel } from "discord.js";
import { z } from "zod";
import client from "../../discord/client";

export async function send(
  options: string | MessagePayload | MessageCreateOptions,
  channelId: string,
): Promise<Message<true> | Message<false>> {
  // TODO: check if the channel is a text channel
  const fetchedChannel = await client.channels.fetch(channelId);
  if (!fetchedChannel) {
    throw new Error("invalid channel");
  }
  const channel = fetchedChannel as unknown as TextChannel;
  console.log(
    `Sending message: ${z.string().safeParse(options).success ? options : "[MessagePayload/MessageCreateOptions]"}`,
  );
  return channel.send(options);
}
