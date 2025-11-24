/**
 * S3 integration for fetching match data (direct client-side)
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { MatchDtoSchema } from "@scout-for-lol/packages/review-dev-tool/src/lib/schemas/match-dto.schema.js";
import type { ArenaMatch, CompletedMatch, Champion } from "@scout-for-lol/data";
import { parseQueueType, parseLane, getLaneOpponent, parseTeam, invertTeam } from "@scout-for-lol/data";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import { getCachedDataAsync, setCachedData } from "@scout-for-lol/review-dev-tool/lib/cache";
import { match } from "ts-pattern";
import { z } from "zod";

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
 * List matches from S3 for the last 7 days (direct client-side)
 * Results are cached: 10 minutes for today, 24 hours for older days
 */
export async function listMatchesFromS3(config: S3Config): Promise<{ key: string; lastModified: Date | undefined }[]> {
  const allMatches: { key: string; lastModified: Date | undefined }[] = [];

  // Create S3 client
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

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
        const cached: unknown = await getCachedDataAsync("r2-list", cacheParams);

        let matches: { key: string; lastModified: Date | undefined }[];

        // Validate cached data with Zod
        const CachedMatchListSchema = z.array(
          z.object({
            key: z.string(),
            lastModified: z.string().optional(),
          }),
        );

        const cachedResult = CachedMatchListSchema.safeParse(cached);
        if (cachedResult.success && cachedResult.data.length > 0) {
          // Convert cached string dates back to Date objects
          matches = cachedResult.data.map((obj): { key: string; lastModified: Date | undefined } => {
            const match: { key: string; lastModified: Date | undefined } = {
              key: obj.key,
              lastModified: obj.lastModified ? new Date(obj.lastModified) : undefined,
            };
            return match;
          });
        } else {
          // Fetch directly from S3
          type S3Object = {
            Key?: string | undefined;
            LastModified?: Date | undefined;
            ETag?: string | undefined;
            Size?: number | undefined;
            StorageClass?: string | undefined;
          };
          const allContents: S3Object[] = [];
          let nextToken: string | undefined = undefined;
          let iterations = 0;
          const maxIterations = 10; // Max 10k objects (10 * 1000)

          do {
            const command = new ListObjectsV2Command({
              Bucket: config.bucketName,
              Prefix: prefix,
              MaxKeys: 1000,
              ...(nextToken ? { ContinuationToken: nextToken } : {}),
            });

            const response: ListObjectsV2CommandOutput = await client.send(command);

            if (response.Contents) {
              allContents.push(...response.Contents);
            }

            nextToken = response.NextContinuationToken;
            iterations++;
          } while (nextToken && iterations < maxIterations);

          // Validate S3 objects have required Key field using Zod
          const S3ObjectWithKeySchema = z.object({
            Key: z.string(),
            LastModified: z.date().optional(),
          });

          matches = allContents.flatMap((obj) => {
            const result = S3ObjectWithKeySchema.safeParse(obj);
            if (!result.success) {
              return [];
            }
            const validatedObj = result.data;
            const match: { key: string; lastModified: Date | undefined } = {
              key: validatedObj.Key,
              lastModified: validatedObj.LastModified,
            };
            return [match];
          });

          // Cache the result (store dates as ISO strings for serialization)
          const cacheableData = matches.map((m) => {
            if (m.lastModified) {
              return { key: m.key, lastModified: m.lastModified.toISOString() };
            }
            return { key: m.key };
          });
          await setCachedData("r2-list", cacheParams, cacheableData, cacheTTL);
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
 * Fetch a match from S3 (direct client-side)
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
    const cached: unknown = await getCachedDataAsync("r2-get", cacheParams);

    // Note: MatchV5DTOs.MatchDto is a very complex external type from twisted library
    // with many nested objects. For pragmatic reasons, we validate basic structure
    // and rely on the S3 data format being correct. Using passthrough() allows
    // additional properties beyond what we validate.
    const MatchDtoSchema = z
      .object({
        metadata: z.object({
          matchId: z.string(),
        }),
        info: z.object({
          gameEndTimestamp: z.number(),
          gameDuration: z.number(),
          queueId: z.number(),
          participants: z.array(z.unknown()),
        }),
      })
      .passthrough();

    const cachedResult = MatchDtoSchema.safeParse(cached);
    if (cachedResult.success) {
      // Data structure is valid. The passthrough schema validated the required fields
      // and preserved all other fields. Cast required because MatchDto is complex external type.
      // TODO: use Zod schema to parse MatchDto
      return cachedResult.data as unknown as MatchV5DTOs.MatchDto;
    }

    // Cache miss - fetch directly from S3
    console.log(`[S3] Fetching match: ${key}`);

    // Create S3 client
    const client = new S3Client({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    // Get object
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new Error("Object not found");
    }

    // Convert stream to string
    const bodyString = await response.Body.transformToString();
    const rawData: unknown = JSON.parse(bodyString);

    // Validate basic structure before using
    const rawDataResult = MatchDtoSchema.parse(rawData);

    // Cache the result for 7 days (match data is immutable)
    await setCachedData("r2-get", cacheParams, rawDataResult, 7 * 24 * 60 * 60 * 1000);

    // Return as MatchDto since validation passed. Cast required because MatchDto is complex external type.
    // TODO: use Zod schema to parse MatchDto
    return rawDataResult as unknown as MatchV5DTOs.MatchDto;
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
        return {
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
      }

      // For regular matches, convert participant to full champion and calculate lane opponent
      const champion = participantToChampion(participant);
      const team = parseTeam(participant.teamId);
      // Team should always be defined for valid matches (teamId is 100 or 200)
      if (!team) {
        console.warn(`Invalid teamId ${participant.teamId.toString()} for participant`);
        return player; // Keep original player if team is invalid
      }
      const enemyTeam = invertTeam(team);
      const laneOpponent = getLaneOpponent(champion, teams[enemyTeam]);
      const outcome = getOutcome(participant);

      // For regular matches, include lane, lane opponent, outcome, and team
      return {
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
    }
    return player;
  });

  // Update team rosters for non-arena matches (use teams we already built)
  if (queueType !== "arena") {
    // Cast required: example match structure updated with real data, types don't match exactly
    return {
      ...baseMatch,
      players: updatedPlayers,
      durationInSeconds: matchDto.info.gameDuration,
      teams,
    } satisfies CompletedMatch;
  }

  // For arena matches, no teams roster. Cast required: example match structure updated with real data
  return {
    ...baseMatch,
    players: updatedPlayers,
    durationInSeconds: matchDto.info.gameDuration,
  } satisfies ArenaMatch;
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
      const placement = participant.placement;
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
    // Validate that the player has arena-specific fields using Zod
    const ArenaPlayerSchema = z.object({
      placement: z.number(),
      playerConfig: z.object({ alias: z.string() }),
      champion: z.object({
        championName: z.string(),
        kills: z.number(),
        deaths: z.number(),
        assists: z.number(),
      }),
    });
    const arenaPlayerResult = ArenaPlayerSchema.safeParse(player);
    if (!arenaPlayerResult.success) {
      throw new Error("Invalid arena player data");
    }
    const arenaPlayer = arenaPlayerResult.data;
    return {
      key,
      queueType: "arena",
      playerName: arenaPlayer.playerConfig.alias,
      champion: arenaPlayer.champion.championName,
      lane: "N/A", // Arena doesn't have lanes
      outcome: `${String(arenaPlayer.placement)}${getOrdinalSuffix(arenaPlayer.placement)} place`,
      kda: `${String(arenaPlayer.champion.kills)}/${String(arenaPlayer.champion.deaths)}/${String(arenaPlayer.champion.assists)}`,
      timestamp: new Date(),
    };
  } else {
    // Validate that the player has completed match-specific fields using Zod
    const CompletedMatchPlayerSchema = z.object({
      outcome: z.string(),
      playerConfig: z.object({ alias: z.string() }),
      champion: z.object({
        championName: z.string(),
        kills: z.number(),
        deaths: z.number(),
        assists: z.number(),
        lane: z.string().optional(),
      }),
    });
    const completedPlayerResult = CompletedMatchPlayerSchema.safeParse(player);
    if (!completedPlayerResult.success) {
      throw new Error("Invalid completed match player data");
    }
    const completedMatchPlayer = completedPlayerResult.data;
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
