import type { Ranks, PlayerConfigEntry, Rank, SummonerLeagueDto } from "@scout-for-lol/data";
import { parseDivision, TierSchema, SummonerLeagueDtoSchema } from "@scout-for-lol/data";
import { api } from "@scout-for-lol/backend/league/api/api";
import { filter, first, pipe } from "remeda";
import { mapRegionToEnum } from "@scout-for-lol/backend/league/model/region";
import { z } from "zod";

const solo = "RANKED_SOLO_5x5";
const flex = "RANKED_FLEX_SR";
export type RankedQueueTypes = typeof solo | typeof flex;

function getDto(dto: SummonerLeagueDto[], queue: RankedQueueTypes): SummonerLeagueDto | undefined {
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
  console.log(`[debug][getRanks] Fetching ranks for ${player.alias}`);
  const response = await api.League.byPUUID(
    player.league.leagueAccount.puuid,
    mapRegionToEnum(player.league.leagueAccount.region),
  );

  console.log(
    `[debug][getRanks] Got response with ${Array.isArray(response.response) ? String(response.response.length) : "non-array"} entries`,
  );

  // Log the raw response structure to debug what fields Riot is sending
  if (Array.isArray(response.response) && response.response.length > 0) {
    const firstEntry = response.response[0];
    if (firstEntry) {
      console.log(`[debug][getRanks] First entry keys:`, Object.keys(firstEntry));
      console.log(`[debug][getRanks] First entry sample:`, JSON.stringify(firstEntry, null, 2));
    }
  }

  // Validate the response with Zod schema
  console.log(`[debug][getRanks] Parsing response with SummonerLeagueDtoSchema...`);
  const parseResult = z.array(SummonerLeagueDtoSchema).safeParse(response.response);
  if (!parseResult.success) {
    console.error(`[debug][getRanks] ❌ Schema validation failed:`, parseResult.error.message);
    console.error(`[debug][getRanks] ❌ Full error:`, JSON.stringify(parseResult.error, null, 2));
    throw parseResult.error;
  }
  console.log(`[debug][getRanks] ✅ Schema validation passed`);
  const validatedResponse = parseResult.data;

  return {
    solo: getRank(validatedResponse, solo),
    flex: getRank(validatedResponse, flex),
  };
}
