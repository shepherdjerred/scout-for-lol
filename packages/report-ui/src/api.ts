import { z } from "zod";

const RIOT_API_BASE = "https://americas.api.riotgames.com";

// Zod schemas for validation
const DataSchema = z.record(z.unknown());

// Riot API types (for reference - not fully enforced)
type RiotMatchResponse = {
  metadata: {
    data_version: string;
    match_id: string;
    participants: string[];
  };
  info: {
    game_duration: number;
    game_mode: string;
    match_creation: number;
    match_id: string;
    platform_id: string;
    queue_id: number;
    participants: {
      assists: number;
      championName: string;
      deaths: number;
      gold: number;
      kills: number;
      item0: number;
      item1: number;
      item2: number;
      item3: number;
      item4: number;
      item5: number;
      item6: number;
      lane: string;
      level: number;
      puuid: string;
      role: string;
      summoner1Id: number;
      summoner2Id: number;
      teamId: number;
      totalDamageDealtToChampions: number;
      totalMinionsKilled: number;
      visionScore: number;
      win: boolean;
    }[];
  };
};

export async function fetchMatchFromRiot(
  matchId: string,
  _region: string,
  apiToken: string,
): Promise<{ match: null; error?: string }> {
  try {
    const response = await fetch(`${RIOT_API_BASE}/lol/match/v5/matches/${matchId}`, {
      headers: {
        "X-Riot-Token": apiToken,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { match: null, error: "Match not found" };
      }
      if (response.status === 429) {
        return { match: null, error: "Rate limited by Riot API" };
      }
      const statusCode = String(response.status);
      return {
        match: null,
        error: `Riot API error: ${statusCode}`,
      };
    }

    const data = (await response.json()) as unknown;
    const dataValidated = DataSchema.safeParse(data);
    if (!dataValidated.success) {
      return { match: null, error: "Invalid API response" };
    }
    const match = parseRiotMatch(dataValidated.data as unknown as RiotMatchResponse);
    return { match };
  } catch (err) {
    const ErrorOrStringSchema = z.union([z.instanceof(Error), z.string()]);
    const errorZod = ErrorOrStringSchema.safeParse(err);
    let errorMessage = "Unknown error";
    if (errorZod.success) {
      const errorData = errorZod.data;
      if (errorData instanceof Error) {
        errorMessage = errorData.message;
      } else {
        errorMessage = errorData;
      }
    }
    return { match: null, error: errorMessage };
  }
}

function parseRiotMatch(riotMatch: RiotMatchResponse): null {
  // This is a simplified parser - you'll need to map Riot's data structure
  // to your CompletedMatch format properly
  // For now, returning null to indicate this needs implementation
  console.log("Match data:", riotMatch);
  return null;
}
