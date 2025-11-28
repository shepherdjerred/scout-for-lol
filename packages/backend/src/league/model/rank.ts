import type { Ranks, PlayerConfigEntry, Rank, RawSummonerLeague } from "@scout-for-lol/data";
import { parseDivision, TierSchema, RawSummonerLeagueSchema } from "@scout-for-lol/data";
import { api } from "@scout-for-lol/backend/league/api/api";
import { filter, first, pipe } from "remeda";
import { mapRegionToEnum } from "@scout-for-lol/backend/league/model/region";
import { z } from "zod";

const solo = "RANKED_SOLO_5x5";
const flex = "RANKED_FLEX_SR";
export type RankedQueueTypes = typeof solo | typeof flex;

function getRawEntry(entries: RawSummonerLeague[], queue: RankedQueueTypes): RawSummonerLeague | undefined {
  return pipe(
    entries,
    filter((entry: RawSummonerLeague) => entry.queueType === queue),
    first(),
  );
}

export function getRank(entries: RawSummonerLeague[], queue: RankedQueueTypes): Rank | undefined {
  const entry = getRawEntry(entries, queue);
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

  const parseResult = z.array(RawSummonerLeagueSchema).safeParse(response.response);
  if (!parseResult.success) {
    throw parseResult.error;
  }
  const validatedResponse = parseResult.data;

  return {
    solo: getRank(validatedResponse, solo),
    flex: getRank(validatedResponse, flex),
  };
}
