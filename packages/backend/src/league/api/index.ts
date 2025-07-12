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
  player: PlayerConfigEntry,
): Promise<undefined | CurrentGameInfoDTO> {
  try {
    const response = await api.SpectatorV5.activeGame(
      player.league.leagueAccount.puuid,
      Constants.Regions[player.league.leagueAccount.region],
    );
    if (response instanceof SpectatorNotAvailableDTO) {
      return undefined;
    } else {
      return response.response;
    }
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status == 404) {
        // not in game
        return undefined;
      }
    }
    throw e;
  }
}

export function findParticipant(
  player: PlayerConfigEntry,
  participants: CurrentGameParticipantDTO[],
): CurrentGameParticipantDTO | undefined {
  return pipe(
    participants,
    filter(
      (participant) =>
        participant.puuid === player.league.leagueAccount.puuid,
    ),
    find(() => true),
  );
}
