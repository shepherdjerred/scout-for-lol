import { match as matchPattern } from "ts-pattern";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import type {
  ChatCompletionCreateParams,
  CuratedMatchData,
  Personality,
  PlayerMetadata,
} from "@scout-for-lol/data/review/generator.js";

/**
 * Extract match data from a match object
 * Handles both arena and regular matches
 */
export function extractMatchData(match: CompletedMatch | ArenaMatch): {
  matchData: Record<string, string>;
  lane: string | undefined;
} {
  return matchPattern(match)
    .with({ queueType: "arena" }, (arenaMatch: ArenaMatch) => {
      const player = arenaMatch.players[0];
      if (!player) {
        throw new Error("No player data found");
      }

      const placement = player.placement;
      const kills = player.champion.kills;
      const deaths = player.champion.deaths;
      const assists = player.champion.assists;

      return {
        lane: undefined,
        matchData: {
          playerName: player.playerConfig.alias,
          champion: player.champion.championName,
          lane: "arena",
          outcome: `${placement.toString()}${getOrdinalSuffix(placement)} place`,
          kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
          queueType: arenaMatch.queueType,
          teammate: player.teammate.championName,
        },
      };
    })
    .otherwise((regularMatch: CompletedMatch) => {
      const player = regularMatch.players[0];
      if (!player) {
        throw new Error("No player data found");
      }

      const kills = player.champion.kills;
      const deaths = player.champion.deaths;
      const assists = player.champion.assists;

      const data: Record<string, string> = {
        playerName: player.playerConfig.alias,
        champion: player.champion.championName,
        lane: player.lane ?? "unknown",
        outcome: player.outcome,
        kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
        queueType: regularMatch.queueType ?? "unknown",
      };

      // Add lane opponent if available
      if (player.laneOpponent) {
        data["laneOpponent"] = player.laneOpponent.championName;
      }

      return {
        lane: player.lane,
        matchData: data,
      };
    });
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function buildPromptVariables(params: {
  matchData: Record<string, string>;
  personality: Personality;
  playerMetadata: PlayerMetadata;
  laneContext: string;
  match: CompletedMatch | ArenaMatch;
  curatedData?: CuratedMatchData;
}): {
  reviewerName: string;
  reviewerPersonality: string;
  reviewerFavoriteChampions: string;
  reviewerFavoriteLanes: string;
  playerName: string;
  playerPersonality: string;
  playerFavoriteChampions: string;
  playerFavoriteLanes: string;
  playerChampion: string;
  playerLane: string;
  opponentChampion: string;
  laneDescription: string;
  matchReport: string;
} {
  const { matchData, personality, playerMetadata, laneContext, match, curatedData } = params;
  const playerName = matchData["playerName"];
  if (!playerName) {
    throw new Error("No player name found");
  }

  const reviewerName = personality.metadata.name;
  const reviewerPersonality = personality.metadata.description;
  const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
  const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

  const playerPersonality = playerMetadata.description;
  const playerFavoriteChampions = JSON.stringify(playerMetadata.favoriteChampions);
  const playerFavoriteLanes = JSON.stringify(playerMetadata.favoriteLanes);

  const playerChampion = matchData["champion"] ?? "unknown champion";
  const playerLane = matchData["lane"] ?? "unknown lane";
  const opponentChampion = matchData["laneOpponent"] ?? "an unknown opponent";
  const laneDescription = laneContext;
  const matchReport = curatedData
    ? JSON.stringify(
        {
          processedMatch: match,
          detailedStats: curatedData,
        },
        null,
        2,
      )
    : JSON.stringify(match, null, 2);

  return {
    reviewerName,
    reviewerPersonality,
    reviewerFavoriteChampions,
    reviewerFavoriteLanes,
    playerName,
    playerPersonality,
    playerFavoriteChampions,
    playerFavoriteLanes,
    playerChampion,
    playerLane,
    opponentChampion,
    laneDescription,
    matchReport,
  };
}

export function createCompletionParams(params: {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens: number;
  temperature?: number;
  topP?: number;
}): ChatCompletionCreateParams {
  const { systemPrompt, userPrompt, model, maxTokens, temperature, topP } = params;
  const completionParams: ChatCompletionCreateParams = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: maxTokens,
  };

  if (temperature !== undefined) {
    completionParams.temperature = temperature;
  }
  if (topP !== undefined) {
    completionParams.top_p = topP;
  }

  return completionParams;
}
