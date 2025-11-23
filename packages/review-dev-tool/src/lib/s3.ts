/**
 * S3 integration for fetching match data (via Astro API endpoints)
 */
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";
import { parseQueueType } from "@scout-for-lol/data";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import { getCachedData, setCachedData } from "./cache";
// Import match conversion utilities
// These would normally come from the report-ui package
// For now, we'll import what we can

/**
 * S3 configuration
 */
export interface S3Config {
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string; // For Cloudflare R2 or custom S3 endpoints
}

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
 * List matches from S3 for the specified date range (via API endpoint)
 * Results are cached for 5 minutes per prefix
 */
export async function listMatchesFromS3(
  config: S3Config,
  daysBack: number,
): Promise<Array<{ key: string; lastModified?: Date }>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const prefixes = generateDatePrefixes(startDate, endDate);
  const allMatches: Array<{ key: string; lastModified?: Date }> = [];

  for (const prefix of prefixes) {
    try {
      // Cache key parameters (exclude credentials for security)
      const cacheParams = {
        bucketName: config.bucketName,
        region: config.region,
        endpoint: config.endpoint,
        prefix,
      };

      // Try to get from cache first (5 minute TTL)
      const cached = await getCachedData<Array<{ key: string; lastModified?: string }>>("r2-list", cacheParams);

      let matches: Array<{ key: string; lastModified?: Date }>;

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
          console.error(`R2 list error response (${response.status}):`, text);
          try {
            const error = JSON.parse(text);
            throw new Error(error.error || "Failed to list objects");
          } catch {
            throw new Error(`Failed to list objects: ${text}`);
          }
        }

        const data = await response.json();

        if (data.contents && Array.isArray(data.contents)) {
          matches = data.contents
            .filter((obj: any) => obj.Key)
            .map((obj: any) => {
              const match: { key: string; lastModified?: Date } = {
                key: obj.Key as string,
              };
              if (obj.LastModified) {
                match.lastModified = new Date(obj.LastModified as string);
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
          await setCachedData("r2-list", cacheParams, cacheableData, 5 * 60 * 1000); // 5 minutes
        } else {
          matches = [];
        }
      }

      allMatches.push(...matches);
    } catch (error) {
      console.warn(`Could not list ${prefix}:`, error);
    }
  }

  return allMatches;
}

/**
 * Fetch a match from S3 (via API endpoint)
 * Results are cached for 1 hour (match data is immutable)
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

    // Try to get from cache first (1 hour TTL - match data is immutable)
    const cached = await getCachedData<MatchV5DTOs.MatchDto>("r2-get", cacheParams);

    if (cached) {
      return cached;
    }

    // Fetch from API
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
      const error = await response.json();
      throw new Error(error.error || "Failed to get object");
    }

    const data = await response.json();
    const matchDto = data as MatchV5DTOs.MatchDto;

    // Cache the result for 1 hour
    await setCachedData("r2-get", cacheParams, matchDto, 60 * 60 * 1000);

    return matchDto;
  } catch (error) {
    console.error(`Failed to fetch match ${key}:`, error);
    return null;
  }
}

/**
 * Convert a Riot API match to our internal format
 * This is a simplified conversion for dev tool purposes - we use example match structure
 * but populate it with real player data including Riot IDs
 * @param matchDto - The Riot API match DTO
 * @param selectedPlayerName - The Riot ID (GameName#Tagline) of the player to prioritize as first player
 */
export async function convertMatchDtoToInternalFormat(
  matchDto: MatchV5DTOs.MatchDto,
  selectedPlayerName?: string,
): Promise<CompletedMatch | ArenaMatch> {
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
      const riotId =
        p.riotIdGameName && p.riotIdTagline ? `${p.riotIdGameName}#${p.riotIdTagline}` : (p.summonerName ?? "Unknown");
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

  // Update players with real Riot IDs from the match
  const updatedPlayers = baseMatch.players.map((player, index) => {
    const participant = reorderedParticipants[index];
    if (participant) {
      // Build Riot ID (GameName#Tagline)
      const riotId =
        participant.riotIdGameName && participant.riotIdTagline
          ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
          : (participant.summonerName ?? player.playerConfig.alias);

      return {
        ...player,
        playerConfig: {
          ...player.playerConfig,
          alias: riotId,
        },
        champion: {
          ...player.champion,
          championName: participant.championName ?? player.champion.championName,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
        },
      } as typeof player;
    }
    return player;
  });

  // Update match with real data
  const updatedMatch = {
    ...baseMatch,
    players: updatedPlayers,
    durationInSeconds: matchDto.info.gameDuration,
  };

  // Update team rosters for non-arena matches
  if (queueType !== "arena") {
    // Build team rosters from all participants
    const blueTeam = matchDto.info.participants
      .filter((p) => p.teamId === 100)
      .map((p) => ({
        riotIdGameName: p.riotIdGameName && p.riotIdTagline ? p.riotIdGameName : (p.summonerName ?? "Unknown"),
        championName: p.championName ?? "Unknown",
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        level: p.champLevel,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].filter((item) => item !== 0),
        spells: [p.summoner1Id, p.summoner2Id],
        gold: p.goldEarned,
        runes: [],
        creepScore: p.totalMinionsKilled + p.neutralMinionsKilled,
        visionScore: p.visionScore,
        damage: p.totalDamageDealtToChampions,
      }));

    const redTeam = matchDto.info.participants
      .filter((p) => p.teamId === 200)
      .map((p) => ({
        riotIdGameName: p.riotIdGameName && p.riotIdTagline ? p.riotIdGameName : (p.summonerName ?? "Unknown"),
        championName: p.championName ?? "Unknown",
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        level: p.champLevel,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].filter((item) => item !== 0),
        spells: [p.summoner1Id, p.summoner2Id],
        gold: p.goldEarned,
        runes: [],
        creepScore: p.totalMinionsKilled + p.neutralMinionsKilled,
        visionScore: p.visionScore,
        damage: p.totalDamageDealtToChampions,
      }));

    return {
      ...updatedMatch,
      teams: {
        blue: blueTeam,
        red: redTeam,
      },
    } as CompletedMatch;
  }

  return updatedMatch as ArenaMatch;
}

/**
 * Match metadata for display
 */
export interface MatchMetadata {
  key: string;
  queueType: string;
  playerName: string;
  champion: string;
  outcome: string;
  kda: string;
  timestamp: Date;
}

/**
 * Extract metadata for all participants from a Riot API match DTO
 */
export function extractMatchMetadataFromDto(matchDto: MatchV5DTOs.MatchDto, key: string): MatchMetadata[] {
  const queueType = parseQueueType(matchDto.info.queueId);
  const timestamp = new Date(matchDto.info.gameEndTimestamp ?? matchDto.info.gameStartTimestamp);

  return matchDto.info.participants.map((participant) => {
    // Build Riot ID (GameName#Tagline)
    const riotId =
      participant.riotIdGameName && participant.riotIdTagline
        ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
        : (participant.summonerName ?? "Unknown");

    // Determine outcome
    let outcome: string;
    if (queueType === "arena") {
      outcome = `${participant.placement ?? "?"}${getOrdinalSuffix(participant.placement ?? 1)} place`;
    } else {
      outcome = participant.win ? "Victory" : "Defeat";
    }

    return {
      key,
      queueType: queueType ?? "unknown",
      playerName: riotId,
      champion: participant.championName ?? "Unknown",
      outcome,
      kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
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
    const arenaPlayer = player as ArenaMatch["players"][0];
    return {
      key,
      queueType: "arena",
      playerName: player.playerConfig.alias,
      champion: player.champion.championName,
      outcome: `${arenaPlayer.placement}${getOrdinalSuffix(arenaPlayer.placement)} place`,
      kda: `${player.champion.kills}/${player.champion.deaths}/${player.champion.assists}`,
      timestamp: new Date(),
    };
  } else {
    const completedMatchPlayer = player as CompletedMatch["players"][0];
    return {
      key,
      queueType: match.queueType ?? "unknown",
      playerName: completedMatchPlayer.playerConfig.alias,
      champion: completedMatchPlayer.champion.championName,
      outcome: completedMatchPlayer.outcome,
      kda: `${completedMatchPlayer.champion.kills}/${completedMatchPlayer.champion.deaths}/${completedMatchPlayer.champion.assists}`,
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
