import { getChampionName } from "twisted/dist/constants/champions.js";
import { CurrentGameInfoDTO } from "twisted/dist/models-dto/index.js";
import { findParticipant } from "../../api/index";
import {
  PlayerConfigEntry,
  queueTypeToDisplayString,
} from "@scout-for-lol/data";
import { QueueType } from "@scout-for-lol/data";
import { map } from "remeda";

export function createDiscordMessage(
  players: PlayerConfigEntry[],
  game: CurrentGameInfoDTO,
  queueType: QueueType | undefined,
): string {
  console.log(
    `📝 Creating Discord message for ${players.length.toString()} players`,
  );
  console.log(
    `🎮 Game details: ID=${game.gameId.toString()}, Mode=${game.gameMode}, Type=${game.gameType}`,
  );
  console.log(
    `⏰ Game start time: ${new Date(game.gameStartTime).toISOString()}`,
  );

  console.log(`👥 Processing participants for each player`);
  const participants = players.map((player, index) => {
    console.log(
      `🔍 Processing participant ${(index + 1).toString()}/${players.length.toString()}: ${player.alias}`,
    );

    const participant = findParticipant(player, game.participants);
    if (participant === undefined) {
      console.error(`❌ Unable to find participant for ${player.alias}`);
      console.error(
        `❌ Available participants:`,
        game.participants.map((p) => ({
          riotId: p.riotId,
          puuid: p.puuid,
        })),
      );
      throw new Error(
        `unable to find participants: ${JSON.stringify(
          participants,
        )}, ${JSON.stringify(game)}`,
      );
    }

    console.log(
      `✅ Found participant for ${player.alias}: ${participant.riotId} (Champion ID: ${participant.championId.toString()})`,
    );
    return { player, participant };
  });

  console.log(`🏆 Processing champion names for message formatting`);
  const messages = map(participants, (participant, index) => {
    console.log(
      `🏆 Processing champion name ${(index + 1).toString()}/${participants.length.toString()} for ${participant.player.alias}`,
    );

    // this is to handle failures that occur when new champions are added
    let championName: string;
    try {
      championName = getChampionName(participant.participant.championId);
      console.log(
        `✅ Champion name resolved: ${championName} for ${participant.player.alias}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to get champion name for ID ${participant.participant.championId.toString()}:`,
        error,
      );
      championName = participant.participant.championId.toString();
      console.log(
        `⚠️  Using champion ID as fallback: ${championName} for ${participant.player.alias}`,
      );
    }

    const formattedChampionName = championName
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const message = `${participant.player.alias} (${formattedChampionName})`;
    console.log(`📝 Generated player message: "${message}"`);
    return message;
  });

  console.log(`📝 Combining ${messages.length.toString()} player messages`);
  let messageString = messages.join(", ");

  if (messages.length > 1) {
    console.log(`🔄 Formatting message for multiple players`);
    const lastCommaIndex = messageString.lastIndexOf(",");
    messageString = `${messageString.substring(
      0,
      lastCommaIndex,
    )}, and${messageString.substring(lastCommaIndex + 1)}`;
    console.log(`📝 Formatted multi-player message: "${messageString}"`);
  }

  const queueTypeDisplay = queueType
    ? queueTypeToDisplayString(queueType)
    : game.gameQueueConfigId.toString();
  const article = /^[aeiouAEIOU]/.test(queueTypeDisplay) ? "an" : "a";
  const finalMessage = `${messageString} started ${article} ${queueTypeDisplay} game`;

  console.log(`✅ Final Discord message created: "${finalMessage}"`);
  return finalMessage;
}
