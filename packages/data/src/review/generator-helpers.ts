import { match as matchPattern } from "ts-pattern";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data/model/index.js";
import type {
  ChatCompletionCreateParams,
  CuratedMatchData,
  Personality,
  PlayerMetadata,
} from "@scout-for-lol/data/review/generator.js";
import { selectRandomBehavior } from "@scout-for-lol/data/review/prompts.js";

/**
 * Extract match data from a match object
 * Handles both arena and regular matches
 * @param match - The completed match data
 * @param playerIndex - Optional index of the player to extract data for (defaults to 0)
 */
export function extractMatchData(
  match: CompletedMatch | ArenaMatch,
  playerIndex = 0,
): {
  matchData: Record<string, string>;
  lane: string | undefined;
} {
  return matchPattern(match)
    .with({ queueType: "arena" }, (arenaMatch: ArenaMatch) => {
      const player = arenaMatch.players[playerIndex] ?? arenaMatch.players[0];
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
      const player = regularMatch.players[playerIndex] ?? regularMatch.players[0];
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

/**
 * Build context about other tracked players (friends) in the match
 * @param match - The completed match data
 * @param playerIndex - Index of the player being reviewed (to exclude from friends list)
 * @returns A formatted string describing friends in the match, or empty string if none
 */
export function buildFriendsContext(match: CompletedMatch | ArenaMatch, playerIndex: number): string {
  const allPlayers = match.players;
  const totalTrackedPlayers = allPlayers.length;
  const friends = allPlayers.filter((_, index) => index !== playerIndex);
  const queueType = match.queueType;

  // Handle special flex queue cases
  if (queueType === "flex") {
    return buildFlexQueueContext(friends, totalTrackedPlayers);
  }

  // Handle solo/duo queue case
  if (queueType === "solo" && totalTrackedPlayers === 2 && friends.length === 1) {
    const duoPartner = friends[0];
    if (duoPartner) {
      const alias = duoPartner.playerConfig.alias;
      const champion = duoPartner.champion.championName;
      const lane = "lane" in duoPartner && duoPartner.lane ? ` in ${duoPartner.lane}` : "";
      return `This is a duo queue game. Their duo partner is ${alias} (playing ${champion}${lane}).`;
    }
  }

  if (friends.length === 0) {
    return "";
  }

  const friendDescriptions = friends.map((friend) => {
    const alias = friend.playerConfig.alias;
    const champion = friend.champion.championName;

    if (match.queueType === "arena") {
      return `${alias} (playing ${champion})`;
    }

    // For regular matches, include lane if available
    const lane = "lane" in friend && friend.lane ? ` in ${friend.lane}` : "";
    return `${alias} (playing ${champion}${lane})`;
  });

  if (friends.length === 1 && friendDescriptions[0]) {
    return `Their friend ${friendDescriptions[0]} was also in this match.`;
  }

  const lastFriend = friendDescriptions.pop();
  if (!lastFriend) {
    return "";
  }
  return `Their friends ${friendDescriptions.join(", ")} and ${lastFriend} were also in this match.`;
}

/**
 * Build context for flex queue matches with special messaging based on party size
 */
function buildFlexQueueContext(
  friends: { playerConfig: { alias: string }; champion: { championName: string }; lane?: string | undefined }[],
  totalTrackedPlayers: number,
): string {
  const friendDescriptions = friends.map((friend) => {
    const alias = friend.playerConfig.alias;
    const champion = friend.champion.championName;
    const lane = "lane" in friend && friend.lane ? ` in ${friend.lane}` : "";
    return `${alias} (playing ${champion}${lane})`;
  });

  // Solo queuing for flex (unusual behavior)
  if (totalTrackedPlayers === 1) {
    return "This player queued for flex queue alone, which is unusual. Most people queue flex with friends.";
  }

  // Full premade team (5 players)
  if (totalTrackedPlayers === 5) {
    const lastFriend = friendDescriptions.pop();
    if (!lastFriend) {
      return "";
    }
    if (friendDescriptions.length === 0) {
      return `This is a full 5-player premade team. Their teammate is ${lastFriend}.`;
    }
    return `This is a full 5-player premade team. Their teammates are ${friendDescriptions.join(", ")} and ${lastFriend}.`;
  }

  // 4 friends (likely 4-stack with 1 random)
  if (totalTrackedPlayers === 4) {
    const lastFriend = friendDescriptions.pop();
    if (!lastFriend) {
      return "";
    }
    if (friendDescriptions.length === 0) {
      return `This is a 4-player premade group with one random matchmade player. Their teammates are ${lastFriend}.`;
    }
    return `This is a 4-player premade group with one random matchmade player. Their teammates are ${friendDescriptions.join(", ")} and ${lastFriend}.`;
  }

  // Other flex cases (2-3 players)
  if (friends.length === 0) {
    return "";
  }

  if (friends.length === 1 && friendDescriptions[0]) {
    return `Their friend ${friendDescriptions[0]} was also in this flex queue match.`;
  }

  const lastFriend = friendDescriptions.pop();
  if (!lastFriend) {
    return "";
  }
  return `Their friends ${friendDescriptions.join(", ")} and ${lastFriend} were also in this flex queue match.`;
}

export function buildPromptVariables(params: {
  matchData: Record<string, string>;
  personality: Personality;
  playerMetadata: PlayerMetadata;
  laneContext: string;
  match: CompletedMatch | ArenaMatch;
  curatedData?: CuratedMatchData;
  playerIndex?: number;
  matchAnalysis?: string;
  timelineSummary?: string;
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
  friendsContext: string;
  randomBehavior: string;
  matchAnalysis: string;
  timelineSummary: string;
} {
  const {
    matchData,
    personality,
    playerMetadata,
    laneContext,
    match,
    curatedData,
    playerIndex = 0,
    matchAnalysis,
    timelineSummary,
  } = params;
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

  // Minify JSON to save tokens
  const matchReport = curatedData
    ? JSON.stringify({
        processedMatch: match,
        detailedStats: curatedData,
      })
    : JSON.stringify(match);

  const friendsContext = buildFriendsContext(match, playerIndex);

  // Select a random behavior based on personality weights
  const selectedBehavior = selectRandomBehavior(personality.metadata.randomBehaviors);
  const randomBehavior = selectedBehavior ?? "";
  const matchAnalysisText =
    matchAnalysis && matchAnalysis.trim().length > 0
      ? matchAnalysis.trim()
      : "No AI match analysis was generated for this match.";
  const timelineSummaryText =
    timelineSummary && timelineSummary.trim().length > 0
      ? timelineSummary.trim()
      : curatedData?.timelineSummary && curatedData.timelineSummary.trim().length > 0
        ? curatedData.timelineSummary.trim()
        : "No timeline summary available for this match.";

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
    friendsContext,
    randomBehavior,
    matchAnalysis: matchAnalysisText,
    timelineSummary: timelineSummaryText,
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
