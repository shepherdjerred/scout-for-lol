import {
  CurrentGameInfoDTO,
  CurrentGameParticipantDTO,
  SpectatorNotAvailableDTO,
} from "twisted/dist/models-dto/index.js";
import { z } from "zod";
import { PlayerConfigEntry } from "@scout-for-lol/data";
import { api } from "./api.js";
import { Constants } from "twisted";
import { filter, find, pipe } from "remeda";

export async function getCurrentGame(
  player: PlayerConfigEntry
): Promise<undefined | CurrentGameInfoDTO> {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;
  const playerRegion = player.league.leagueAccount.region;

  console.log(
    `🎮 Fetching current game for player: ${playerAlias} (${playerPuuid}) in region ${playerRegion}`
  );

  try {
    const startTime = Date.now();

    const response = await api.SpectatorV5.activeGame(
      playerPuuid,
      Constants.Regions[playerRegion]
    );

    const apiTime = Date.now() - startTime;

    if (response instanceof SpectatorNotAvailableDTO) {
      console.log(
        `❌ Spectator API unavailable for ${playerAlias} (${apiTime.toString()}ms)`
      );
      return undefined;
    } else {
      console.log(
        `✅ Successfully fetched current game for ${playerAlias} (${apiTime.toString()}ms)`
      );
      console.log(
        `📊 Game info: Match ID ${response.response.gameId.toString()}, Mode: ${response.response.gameMode}, Type: ${response.response.gameType}`
      );
      return response.response;
    }
  } catch (e) {
    console.error(`❌ Error fetching current game for ${playerAlias}:`, e);

    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(
          `ℹ️  Player ${playerAlias} is not currently in a game (404)`
        );
        return undefined;
      }
      console.error(
        `❌ HTTP Error ${result.data.status.toString()} for ${playerAlias}`
      );
    }
    throw e;
  }
}

export function findParticipant(
  player: PlayerConfigEntry,
  participants: CurrentGameParticipantDTO[]
): CurrentGameParticipantDTO | undefined {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;

  console.log(
    `🔍 Looking for participant ${playerAlias} (${playerPuuid}) in ${participants.length.toString()} participants`
  );

  const participant = pipe(
    participants,
    filter((participant) => participant.puuid === playerPuuid),
    find(() => true)
  );

  if (participant) {
    console.log(
      `✅ Found participant ${playerAlias}: ${participant.summonerName} (Champion: ${participant.championId.toString()})`
    );
  } else {
    console.log(`❌ Participant ${playerAlias} not found in game`);
  }

  return participant;
}
