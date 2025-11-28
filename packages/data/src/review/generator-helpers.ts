import { match as matchPattern } from "ts-pattern";
import { z } from "zod";
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
  const friends = allPlayers.filter((_, index) => index !== playerIndex);

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
 * Log debug information about match players before serialization
 */
function logMatchPlayersBeforeSerialization(match: CompletedMatch): void {
  console.log(`[debug][buildPromptVariables] Match has ${match.players.length.toString()} player(s)`);
  for (let i = 0; i < match.players.length; i++) {
    const playerObj = match.players[i];
    if (playerObj) {
      console.log(
        `[debug][buildPromptVariables] Match.players[${i.toString()}] keys before JSON.stringify:`,
        Object.keys(playerObj),
      );
      if ("puuid" in playerObj) {
        console.error(
          `[debug][buildPromptVariables] ⚠️  ERROR: Match.players[${i.toString()}] has puuid field before JSON.stringify!`,
          playerObj,
        );
      }
    }
  }
}

/**
 * Zod schema for player object (record with string keys)
 */
const PlayerRecordSchema = z.record(z.string(), z.unknown());

/**
 * Zod schema for parsed JSON structure that may contain players array
 */
const ParsedJsonWithPlayersSchema = z.union([
  z.object({
    players: z.array(PlayerRecordSchema),
  }),
  z.object({
    processedMatch: z.object({
      players: z.array(PlayerRecordSchema),
    }),
  }),
  z.object({
    players: z.array(PlayerRecordSchema),
    processedMatch: z.object({
      players: z.array(PlayerRecordSchema),
    }),
  }),
  z.record(z.string(), z.unknown()), // Fallback for any other structure
]);

/**
 * Check if parsed JSON has unexpected puuid fields in players array
 */
function checkParsedPlayersForPuuid(parsed: unknown): void {
  const result = ParsedJsonWithPlayersSchema.safeParse(parsed);
  if (!result.success) {
    return;
  }

  const data = result.data;
  const PlayersArraySchema = z.array(PlayerRecordSchema);
  type PlayersArray = z.infer<typeof PlayersArraySchema>;
  let players: PlayersArray | undefined = undefined;

  // Check top-level players
  if ("players" in data && Array.isArray(data.players)) {
    const playersResult = PlayersArraySchema.safeParse(data.players);
    if (playersResult.success) {
      players = playersResult.data;
    }
  }
  // Check processedMatch.players
  else if ("processedMatch" in data && typeof data.processedMatch === "object" && data.processedMatch !== null) {
    const processedMatchResult = z
      .object({
        players: PlayersArraySchema,
      })
      .safeParse(data.processedMatch);
    if (processedMatchResult.success) {
      players = processedMatchResult.data.players;
    }
  }

  if (!players) {
    return;
  }

  for (let i = 0; i < players.length; i++) {
    const playerObj = players[i];
    if (playerObj && "puuid" in playerObj) {
      console.error(
        `[debug][buildPromptVariables] ⚠️  ERROR: Parsed JSON has puuid in players[${i.toString()}]!`,
        playerObj,
      );
    }
  }
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
  d20Roll: string;
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

  // Log match structure before serialization
  console.log(`[debug][buildPromptVariables] About to serialize match to JSON`);
  if (match.queueType !== "arena") {
    logMatchPlayersBeforeSerialization(match);
  }

  // Minify JSON to save tokens
  const matchReport = curatedData
    ? JSON.stringify({
        processedMatch: match,
        detailedStats: curatedData,
      })
    : JSON.stringify(match);

  // Check if JSON.stringify added any unexpected fields (it shouldn't, but let's verify)
  if (match.queueType !== "arena") {
    try {
      const parsed: unknown = JSON.parse(matchReport);
      checkParsedPlayersForPuuid(parsed);
    } catch (_e) {
      // Ignore parse errors, just checking structure
    }
  }

  const friendsContext = buildFriendsContext(match, playerIndex);

  // Generate random D20 roll (1-20)
  const d20Roll = (Math.floor(Math.random() * 20) + 1).toString();
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
    d20Roll,
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
