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

export async function getCurrentGame(player: PlayerConfigEntry): Promise<undefined | CurrentGameInfoDTO> {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;
  const playerRegion = player.league.leagueAccount.region;

  console.log(`🎮 Fetching current game for player: ${playerAlias} (${playerPuuid}) in region ${playerRegion}`);

  try {
    const startTime = Date.now();

    const response = await api.SpectatorV5.activeGame(playerPuuid, Constants.Regions[playerRegion]);

    const apiTime = Date.now() - startTime;

    if (z.instanceof(SpectatorNotAvailableDTO).safeParse(response).success) {
      console.log(`❌ Spectator API unavailable for ${playerAlias} (${apiTime.toString()}ms)`);
      return undefined;
    }

    // Validate the response has the expected structure
    const GameInfoSchema = z.object({
      gameId: z.number(),
      gameMode: z.string(),
      gameType: z.string(),
    });

    const ResponseSchema = z.object({ response: GameInfoSchema });
    const validatedResponse = ResponseSchema.parse(response);

    console.log(`✅ Successfully fetched current game for ${playerAlias} (${apiTime.toString()}ms)`);
    console.log(
      `📊 Game info: Match ID ${validatedResponse.response.gameId.toString()}, Mode: ${validatedResponse.response.gameMode}, Type: ${validatedResponse.response.gameType}`,
    );
    // TODO
    return validatedResponse.response as unknown as CurrentGameInfoDTO;
  } catch (e) {
    console.error(`❌ Error fetching current game for ${playerAlias}. Likely indicates they are not currently in a game`);

    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        console.log(`ℹ️  Player ${playerAlias} is not currently in a game (404)`);
        return undefined;
      }
      console.error(`❌ HTTP Error ${result.data.status.toString()} for ${playerAlias}`);
    }
    throw e;
  }
}

export function findParticipant(
  player: PlayerConfigEntry,
  participants: CurrentGameParticipantDTO[],
): CurrentGameParticipantDTO | undefined {
  const playerAlias = player.alias;
  const playerPuuid = player.league.leagueAccount.puuid;

  console.log(
    `🔍 Looking for participant ${playerAlias} (${playerPuuid}) in ${participants.length.toString()} participants`,
  );

  const participant = pipe(
    participants,
    filter((participant) => participant.puuid === playerPuuid),
    find(() => true),
  );

  if (participant) {
    console.log(
      `✅ Found participant ${playerAlias}: ${participant.riotId} (Champion: ${participant.championId.toString()})`,
    );
  } else {
    console.log(`❌ Participant ${playerAlias} not found in game`);
  }

  return participant;
}
