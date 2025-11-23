/**
 * S3 integration for fetching match data (via Astro API endpoints)
 */
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { ArenaMatch, CompletedMatch, Champion } from "@scout-for-lol/data";
import { parseQueueType, parseLane, getLaneOpponent, parseTeam, invertTeam } from "@scout-for-lol/data";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import { getCachedDataAsync, setCachedData } from "./cache";
import { match } from "ts-pattern";
import { z } from "zod";
// Import match conversion utilities
// These would normally come from the report-ui package
// For now, we'll import what we can

/**
 * S3 configuration
 */
export type S3Config = {
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string; // For Cloudflare R2 or custom S3 endpoints
};

// Zod schema for S3 list response
const S3ObjectSchema = z.object({
  Key: z.string(),
  LastModified: z.string().optional(),
  ETag: z.string().optional(),
  Size: z.number().optional(),
  StorageClass: z.string().optional(),
});

const S3ListResponseSchema = z.object({
  contents: z.array(S3ObjectSchema).optional(),
  isTruncated: z.boolean().optional(),
  nextContinuationToken: z.string().optional(),
});

/**
 * Generate date prefixes for S3 listing between start and end dates
 */
function generateDatePrefixes(startDate: Date, endDate: Date): string[] {
  const prefixes: string[] = [];
  const current = new Date(startDate);

  current.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, "0");
    const day = String(current.getUTCDate()).padStart(2, "0");

    prefixes.push(`matches/${year.toString()}/${month}/${day}/`);

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return prefixes;
}

/**
 * List matches from S3 for the last 7 days (via API endpoint)
 * Results are cached: 10 minutes for today, 24 hours for older days
 */
export async function listMatchesFromS3(config: S3Config): Promise<{ key: string; lastModified?: Date }[]> {
  const allMatches: { key: string; lastModified?: Date }[] = [];

  // Fetch all 7 days (0 = today, 1 = yesterday, ..., 6 = 6 days ago)
  for (let daysBack = 0; daysBack < 7; daysBack++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);

    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);

    const prefixes = generateDatePrefixes(startDate, endDate);

    for (const prefix of prefixes) {
      try {
        // Cache key parameters (exclude credentials for security)
        const cacheParams = {
          bucketName: config.bucketName,
          region: config.region,
          endpoint: config.endpoint,
          prefix,
        };

        // Dynamic TTL: 10 minutes for today, 24 hours for older days
        const cacheTTL = daysBack === 0 ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;

        // Try to get from cache first
        const cached = await getCachedDataAsync<{ key: string; lastModified?: string }[]>("r2-list", cacheParams);

        let matches: { key: string; lastModified?: Date }[];

        if (cached) {
          // Convert cached string dates back to Date objects
          matches = cached.map((obj): { key: string; lastModified?: Date } => {
            if (obj.lastModified) {
              return { key: obj.key, lastModified: new Date(obj.lastModified) };
            }
            return { key: obj.key };
          });
        } else {
          // Fetch from API
          const response = await fetch("/api/r2/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bucketName: config.bucketName,
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
              region: config.region,
              endpoint: config.endpoint,
              prefix,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.error(`R2 list error response (${String(response.status)}):`, text);
            try {
              const errorData: unknown = JSON.parse(text);
              const ErrorSchema = z.object({ error: z.string().optional() });
              const errorResult = ErrorSchema.safeParse(errorData);
              const errorMessage = errorResult.success ? errorResult.data.error : undefined;
              throw new Error(errorMessage ?? "Failed to list objects");
            } catch {
              throw new Error(`Failed to list objects: ${text}`);
            }
          }

          const rawData: unknown = await response.json();
          const listResult = S3ListResponseSchema.safeParse(rawData);

          if (listResult.success && listResult.data.contents) {
            matches = listResult.data.contents
              .filter((obj) => obj.Key)
              .map((obj) => {
                const match: { key: string; lastModified?: Date } = {
                  key: obj.Key,
                };
                if (obj.LastModified) {
                  match.lastModified = new Date(obj.LastModified);
                }
                return match;
              });

            // Cache the result (store dates as ISO strings for serialization)
            const cacheableData = matches.map((m) => {
              if (m.lastModified) {
                return { key: m.key, lastModified: m.lastModified.toISOString() };
              }
              return { key: m.key };
            });
            await setCachedData("r2-list", cacheParams, cacheableData, cacheTTL);
          } else {
            matches = [];
          }
        }

        allMatches.push(...matches);
      } catch (error) {
        console.warn(`Could not list ${prefix}:`, error);
      }
    }
  }

  return allMatches;
}

/**
 * Fetch a match from S3 (via API endpoint)
 * Results are cached for 7 days (match data is immutable)
 */
export async function fetchMatchFromS3(config: S3Config, key: string): Promise<MatchV5DTOs.MatchDto | null> {
  try {
    // Cache key parameters (exclude credentials for security)
    const cacheParams = {
      bucketName: config.bucketName,
      region: config.region,
      endpoint: config.endpoint,
      key,
    };

    // Try to get from cache first (7 days TTL - match data is immutable)
    const cached = await getCachedDataAsync<MatchV5DTOs.MatchDto>("r2-get", cacheParams);

    if (cached) {
      return cached;
    }

    // Cache miss - fetch from API
    console.log(`[HTTP] Fetching match: ${key}`);
    const response = await fetch("/api/r2/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucketName: config.bucketName,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
        endpoint: config.endpoint,
        key,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      const ErrorSchema = z.object({ error: z.string().optional() });
      const errorResult = ErrorSchema.safeParse(errorData);
      const errorMessage = errorResult.success ? errorResult.data.error : undefined;
      throw new Error(errorMessage ?? "Failed to get object");
    }

    const rawData: unknown = await response.json();
    // Note: MatchV5DTOs.MatchDto is a complex external type from twisted library
    // We trust the API response format matches the expected MatchDto structure
    const matchDto = rawData as unknown as MatchV5DTOs.MatchDto;

    // Cache the result for 7 days (match data is immutable)
    await setCachedData("r2-get", cacheParams, matchDto, 7 * 24 * 60 * 60 * 1000);

    return matchDto;
  } catch (error) {
    console.error(`Failed to fetch match ${key}:`, error);
    return null;
  }
}

/**
 * Get match outcome from participant data
 * Mirrors backend implementation from packages/backend/src/league/model/match.ts
 */
function getOutcome(participant: MatchV5DTOs.ParticipantDto): "Victory" | "Defeat" | "Surrender" {
  return match(participant)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with({ win: true }, () => "Victory")
    .with({ gameEndedInSurrender: true }, () => "Surrender")
    .with({ win: false }, () => "Defeat")
    .exhaustive();
}

/**
 * Convert a Riot API match to our internal format
 * This is a simplified conversion for dev tool purposes - we use example match structure
 * but populate it with real player data including Riot IDs
 * @param matchDto - The Riot API match DTO
 * @param selectedPlayerName - The Riot ID (GameName#Tagline) of the player to prioritize as first player
 */
export function convertMatchDtoToInternalFormat(
  matchDto: MatchV5DTOs.MatchDto,
  selectedPlayerName?: string,
): CompletedMatch | ArenaMatch {
  const queueType = parseQueueType(matchDto.info.queueId);

  // Get base example match structure
  let baseMatch: CompletedMatch | ArenaMatch;
  if (queueType === "arena") {
    baseMatch = getExampleMatch("arena");
  } else if (queueType === "aram") {
    baseMatch = getExampleMatch("aram");
  } else if (queueType === "solo" || queueType === "flex") {
    baseMatch = getExampleMatch("ranked");
  } else {
    baseMatch = getExampleMatch("unranked");
  }

  // Reorder participants so selected player is first
  let reorderedParticipants = [...matchDto.info.participants];
  if (selectedPlayerName) {
    const selectedIndex = reorderedParticipants.findIndex((p) => {
      const riotId = p.riotIdGameName && p.riotIdTagline ? `${p.riotIdGameName}#${p.riotIdTagline}` : "Unknown";
      return riotId === selectedPlayerName;
    });

    if (selectedIndex !== -1 && selectedIndex !== 0) {
      // Move selected player to first position
      const selectedPlayer = reorderedParticipants[selectedIndex];
      if (selectedPlayer) {
        reorderedParticipants = [selectedPlayer, ...reorderedParticipants.filter((_, i) => i !== selectedIndex)];
      }
    }
  }

  // Helper function to convert participant to champion (like backend does)
  const participantToChampion = (p: MatchV5DTOs.ParticipantDto): Champion => {
    const riotIdGameName = p.riotIdGameName && p.riotIdTagline ? p.riotIdGameName : "Unknown";

    return {
      riotIdGameName,
      championName: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      level: p.champLevel,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
      lane: parseLane(p.teamPosition),
      spells: [p.summoner1Id, p.summoner2Id],
      gold: p.goldEarned,
      runes: [],
      creepScore: p.totalMinionsKilled + p.neutralMinionsKilled,
      visionScore: p.visionScore,
      damage: p.totalDamageDealtToChampions,
    };
  };

  // Build team rosters first (needed for lane opponent calculation)
  const teams = {
    blue: matchDto.info.participants.filter((p) => p.teamId === 100).map(participantToChampion),
    red: matchDto.info.participants.filter((p) => p.teamId === 200).map(participantToChampion),
  };

  // Update players with real data from the match
  const updatedPlayers = baseMatch.players.map((player, index) => {
    const participant = reorderedParticipants[index];
    if (participant) {
      // Build Riot ID (GameName#Tagline)
      const riotId =
        participant.riotIdGameName && participant.riotIdTagline
          ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
          : player.playerConfig.alias;

      // For arena matches, player doesn't have a lane field or lane opponent
      if (queueType === "arena") {
        const arenaPlayer = {
          ...player,
          playerConfig: {
            ...player.playerConfig,
            alias: riotId,
          },
          champion: {
            ...player.champion,
            championName: participant.championName,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
          },
        };
        return arenaPlayer as unknown as typeof player;
      }

      // For regular matches, convert participant to full champion and calculate lane opponent
      const champion = participantToChampion(participant);
      const team = parseTeam(participant.teamId);
      const enemyTeam = team ? invertTeam(team) : undefined;
      const laneOpponent = enemyTeam ? getLaneOpponent(champion, teams[enemyTeam]) : undefined;
      const outcome = getOutcome(participant);

      // For regular matches, include lane, lane opponent, outcome, and team
      const completedPlayer = {
        ...player,
        playerConfig: {
          ...player.playerConfig,
          alias: riotId,
        },
        champion,
        lane: champion.lane,
        laneOpponent,
        outcome,
        team,
      };
      return completedPlayer as unknown as typeof player;
    }
    return player;
  });

  // Update match with real data
  const updatedMatch = {
    ...baseMatch,
    players: updatedPlayers,
    durationInSeconds: matchDto.info.gameDuration,
  };

  // Update team rosters for non-arena matches (use teams we already built)
  if (queueType !== "arena") {
    const completedMatch: CompletedMatch = {
      ...updatedMatch,
      teams,
    } as unknown as CompletedMatch;
    return completedMatch;
  }

  return updatedMatch as unknown as ArenaMatch;
}

/**
 * Match metadata for display
 */
export type MatchMetadata = {
  key: string;
  queueType: string;
  playerName: string;
  champion: string;
  lane: string;
  outcome: string;
  kda: string;
  timestamp: Date;
};

/**
 * Extract metadata for all participants from a Riot API match DTO
 */
export function extractMatchMetadataFromDto(matchDto: MatchV5DTOs.MatchDto, key: string): MatchMetadata[] {
  const queueType = parseQueueType(matchDto.info.queueId);
  const timestamp = new Date(matchDto.info.gameEndTimestamp);

  return matchDto.info.participants.map((participant) => {
    // Build Riot ID (GameName#Tagline)
    const riotId =
      participant.riotIdGameName && participant.riotIdTagline
        ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
        : "Unknown";

    // Determine outcome
    let outcome: string;
    if (queueType === "arena") {
      const placement = participant.placement ?? 1;
      outcome = `${String(placement)}${getOrdinalSuffix(placement)} place`;
    } else {
      outcome = participant.win ? "Victory" : "Defeat";
    }

    // Parse lane
    const lane = parseLane(participant.teamPosition);

    const laneStr = lane ?? "unknown";
    return {
      key,
      queueType: queueType ?? "unknown",
      playerName: riotId,
      champion: participant.championName,
      lane: laneStr,
      outcome,
      kda: `${String(participant.kills)}/${String(participant.deaths)}/${String(participant.assists)}`,
      timestamp,
    };
  });
}

/**
 * Extract metadata from a match
 */
export function extractMatchMetadata(match: CompletedMatch | ArenaMatch, key: string): MatchMetadata {
  const player = match.players[0];
  if (!player) {
    throw new Error("No player data in match");
  }

  if (match.queueType === "arena") {
    const arenaPlayer = player as unknown as ArenaMatch["players"][0];
    return {
      key,
      queueType: "arena",
      playerName: player.playerConfig.alias,
      champion: player.champion.championName,
      lane: "N/A", // Arena doesn't have lanes
      outcome: `${String(arenaPlayer.placement)}${getOrdinalSuffix(arenaPlayer.placement)} place`,
      kda: `${String(player.champion.kills)}/${String(player.champion.deaths)}/${String(player.champion.assists)}`,
      timestamp: new Date(),
    };
  } else {
    const completedMatchPlayer = player as unknown as CompletedMatch["players"][0];
    return {
      key,
      queueType: match.queueType ?? "unknown",
      playerName: completedMatchPlayer.playerConfig.alias,
      champion: completedMatchPlayer.champion.championName,
      lane: completedMatchPlayer.champion.lane ?? "unknown",
      outcome: completedMatchPlayer.outcome,
      kda: `${String(completedMatchPlayer.champion.kills)}/${String(completedMatchPlayer.champion.deaths)}/${String(completedMatchPlayer.champion.assists)}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Helper function to get ordinal suffix
 */
function getOrdinalSuffix(num: number): string {
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
