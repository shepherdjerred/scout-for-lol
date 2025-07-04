import { getChampionName } from "twisted/dist/constants/champions.js";
import { CurrentGameInfoDTO } from "twisted/dist/models-dto/index.js";
import { findParticipant } from "../../api/index";
import { PlayerConfigEntry } from "@scout-for-lol/data";
import { QueueType } from "@scout-for-lol/data";
import { map } from "remeda";

export function createDiscordMessage(
  players: PlayerConfigEntry[],
  game: CurrentGameInfoDTO,
  queueType: QueueType | undefined,
): string {
  const participants = players.map((player) => {
    const participant = findParticipant(player, game.participants);
    if (participant === undefined) {
      throw new Error(
        `unable to find participants: ${JSON.stringify(
          participants,
        )}, ${JSON.stringify(game)}`,
      );
    }
    return { player, participant };
  });

  const messages = map(participants, (participant) => {
    // this is to handle failures that occur when new champions are added
    let championName: string;
    try {
      championName = getChampionName(participant.participant.championId);
    } catch (error) {
      console.error(error);
      championName = participant.participant.championId.toString();
    }
    return `${participant.player.alias} (${championName
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())})`;
  });

  let messageString = messages.join(", ");
  if (messages.length > 1) {
    const lastCommaIndex = messageString.lastIndexOf(",");
    messageString = `${messageString.substring(
      0,
      lastCommaIndex,
    )}, and${messageString.substring(lastCommaIndex + 1)}`;
  }

  return `${messageString} started a ${
    queueType || game.gameQueueConfigId
  } game`;
}
