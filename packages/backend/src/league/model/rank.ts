import { parseDivision, Ranks, PlayerConfigEntry, Rank, TierSchema } from "@scout-for-lol/data";
import { api } from "../api/api";
import { SummonerLeagueDto } from "twisted/dist/models-dto/index.js";
import { filter, first, pipe } from "remeda";
import { mapRegionToEnum } from "./region";

const solo = "RANKED_SOLO_5x5";
const flex = "RANKED_FLEX_SR";
export type RankedQueueTypes = typeof solo | typeof flex;

export function getDto(dto: SummonerLeagueDto[], queue: RankedQueueTypes): SummonerLeagueDto | undefined {
  return pipe(
    dto,
    filter((entry: SummonerLeagueDto) => entry.queueType === queue),
    first(),
  );
}

export function getRank(dto: SummonerLeagueDto[], queue: RankedQueueTypes): Rank | undefined {
  const entry = getDto(dto, queue);
  if (entry == undefined) {
    return undefined;
  }

  const division = parseDivision(entry.rank);
  if (division == undefined) {
    return undefined;
  }

  return {
    division,
    tier: TierSchema.parse(entry.tier.toLowerCase()),
    lp: entry.leaguePoints,
    wins: entry.wins,
    losses: entry.losses,
  };
}

export async function getRanks(player: PlayerConfigEntry): Promise<Ranks> {
  const response = await api.League.byPUUID(
    player.league.leagueAccount.puuid,
    mapRegionToEnum(player.league.leagueAccount.region),
  );

  return {
    solo: getRank(response.response, solo),
    flex: getRank(response.response, flex),
  };
}
