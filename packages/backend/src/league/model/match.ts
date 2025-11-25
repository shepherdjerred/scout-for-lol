import { entries, groupBy, map, pipe, sortBy } from "remeda";
import { z } from "zod";
import {
  ArenaPlacementSchema,
  type ArenaTeam,
  ArenaTeamIdSchema,
  type CompletedMatch,
  CompletedMatchSchema,
  getLaneOpponent,
  invertTeam,
  parseQueueType,
  parseTeam,
  type Player,
  type Rank,
  type ArenaMatch,
  type MatchDto,
  type ParticipantDto,
  findParticipant,
  getOutcome,
  getTeams,
  PlayerConfigEntrySchema,
} from "@scout-for-lol/data";
import { strict as assert } from "assert";
import { participantToArenaChampion } from "@scout-for-lol/backend/league/model/champion.js";
import { participantToChampion } from "@scout-for-lol/data/model/match-helpers";

/**
 * Debug helper: Check for unexpected puuid fields in a player object
 */
function checkPlayerObjectForPuuid(playerObj: unknown, index: number): void {
  const PlayerObjectSchema = z
    .object({
      puuid: z.unknown().optional(),
      playerConfig: z
        .object({
          puuid: z.unknown().optional(),
        })
        .loose()
        .optional(),
    })
    .loose();

  const result = PlayerObjectSchema.safeParse(playerObj);
  if (!result.success) {
    return;
  }

  const playerObjStr = JSON.stringify(playerObj);
  const puuidMatches = playerObjStr.match(/"puuid"/g);
  if (puuidMatches) {
    console.log(
      `[debug][toMatch] Player ${index.toString()} JSON has ${puuidMatches.length.toString()} puuid field(s)`,
    );
    // Check if puuid is at top level of playerObj
    if ("puuid" in result.data) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: Player ${index.toString()} has puuid at top level!`,
        JSON.stringify(playerObj, null, 2),
      );
    }
    // Check if puuid is at top level of playerConfig
    if (result.data.playerConfig && "puuid" in result.data.playerConfig) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: Player ${index.toString()}.playerConfig has puuid at top level!`,
        JSON.stringify(result.data.playerConfig, null, 2),
      );
    }
  }
}

export function toMatch(
  players: Player[],
  matchDto: MatchDto,
  rankBeforeMatch: Rank | undefined,
  rankAfterMatch: Rank | undefined,
): CompletedMatch {
  const teams = getTeams(matchDto.info.participants, participantToChampion);
  const queueType = parseQueueType(matchDto.info.queueId);

  if (queueType === "arena") {
    throw new Error("arena matches are not supported");
  }

  // Build CompletedMatch.players for all tracked players
  const matchPlayers = players.map((player, index) => {
    console.log(`[debug][toMatch] Processing player ${index.toString()}: ${player.config.alias}`);
    console.log(`[debug][toMatch] Player.config keys:`, Object.keys(player.config));
    console.log(`[debug][toMatch] Player.config full structure:`, JSON.stringify(player.config, null, 2));
    console.log(`[debug][toMatch] Player.config has puuid at top level:`, "puuid" in player.config);
    if ("puuid" in player.config) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: player.config has unexpected puuid field!`,
        JSON.stringify(player.config, null, 2),
      );
    }
    console.log(`[debug][toMatch] Player object keys:`, Object.keys(player));
    if ("puuid" in player) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: player object has unexpected puuid field!`,
        JSON.stringify(player, null, 2),
      );
    }

    // Deep check for puuid in config structure
    const configStr = JSON.stringify(player.config);
    const configPuuidMatches = configStr.match(/"puuid"/g);
    if (configPuuidMatches && configPuuidMatches.length > 1) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: Found ${configPuuidMatches.length.toString()} puuid fields in config!`,
        configStr,
      );
    }

    const participantRaw = findParticipant(player.config.league.leagueAccount.puuid, matchDto.info.participants);
    if (participantRaw === undefined) {
      console.debug("Player PUUID:", player.config.league.leagueAccount.puuid);
      console.debug("Match Participants:", matchDto.info.participants);
      throw new Error(`participant not found for player ${player.config.alias}`);
    }

    // TypeScript needs explicit narrowing after throw
    const participant: ParticipantDto = participantRaw;

    const champion = participantToChampion(participant);
    const team = parseTeam(participant.teamId);

    assert(team !== undefined);

    const enemyTeam = invertTeam(team);

    // CRITICAL: Validate player.config doesn't have puuid at top level
    // This ensures no participant data leaks into player config
    const configValidation = PlayerConfigEntrySchema.safeParse(player.config);
    if (!configValidation.success) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: player.config validation failed for ${player.config.alias}:`,
        configValidation.error,
      );
      console.error(`[debug][toMatch] player.config structure:`, JSON.stringify(player.config, null, 2));
      throw new Error(`Invalid player config for ${player.config.alias}: config has unexpected fields`);
    }
    // Use validated config to ensure no extra fields
    const validatedConfig = configValidation.data;

    const playerObject = {
      playerConfig: validatedConfig,
      rankBeforeMatch,
      rankAfterMatch,
      wins: queueType === "solo" || queueType === "flex" ? (player.ranks[queueType]?.wins ?? undefined) : undefined,
      losses: queueType === "solo" || queueType === "flex" ? (player.ranks[queueType]?.losses ?? undefined) : undefined,
      champion,
      outcome: getOutcome(participant),
      team: team,
      lane: champion.lane,
      laneOpponent: getLaneOpponent(champion, teams[enemyTeam]),
    };

    console.log(`[debug][toMatch] Built player object ${index.toString()} keys:`, Object.keys(playerObject));
    console.log(`[debug][toMatch] playerObject full structure:`, JSON.stringify(playerObject, null, 2));
    if ("puuid" in playerObject) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: playerObject has unexpected puuid field!`,
        JSON.stringify(playerObject, null, 2),
      );
    }
    console.log(`[debug][toMatch] playerObject.playerConfig keys:`, Object.keys(playerObject.playerConfig));
    if ("puuid" in playerObject.playerConfig) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: playerObject.playerConfig has unexpected puuid field!`,
        JSON.stringify(playerObject.playerConfig, null, 2),
      );
    }

    // Deep check for puuid in playerObject
    const playerObjectStr = JSON.stringify(playerObject);
    const objectPuuidMatches = playerObjectStr.match(/"puuid"/g);
    if (objectPuuidMatches) {
      // Count how many times puuid appears - should only be once in leagueAccount
      const expectedPuuidPath = '"leagueAccount":{"puuid"';
      if (!playerObjectStr.includes(expectedPuuidPath) || objectPuuidMatches.length > 1) {
        console.error(
          `[debug][toMatch] ⚠️  ERROR: Found ${objectPuuidMatches.length.toString()} puuid field(s) in playerObject!`,
          playerObjectStr,
        );
      } else {
        console.log(`[debug][toMatch] ✅ playerObject has puuid only in expected location (leagueAccount)`);
      }
    }

    return playerObject;
  });

  console.log(`[debug][toMatch] Built ${matchPlayers.length.toString()} player objects`);
  console.log(`[debug][toMatch] Checking all player objects for puuid field...`);
  for (let i = 0; i < matchPlayers.length; i++) {
    const playerObj = matchPlayers[i];
    if (playerObj && "puuid" in playerObj) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: Player object ${i.toString()} has puuid field at top level!`,
        playerObj,
      );
    }
    if (playerObj?.playerConfig && "puuid" in playerObj.playerConfig) {
      console.error(
        `[debug][toMatch] ⚠️  ERROR: Player object ${i.toString()}.playerConfig has puuid field!`,
        playerObj.playerConfig,
      );
    }
  }

  const result: CompletedMatch = {
    queueType,
    players: matchPlayers,
    durationInSeconds: matchDto.info.gameDuration,
    teams,
  };

  // Validate the result to catch any extra fields (like puuid) that shouldn't be there
  console.log(`[debug][toMatch] About to validate CompletedMatch with ${matchPlayers.length.toString()} player(s)`);
  console.log(`[debug][toMatch] Full result structure before validation:`, JSON.stringify(result, null, 2));

  // Pre-validation check: look for puuid in players array
  for (let i = 0; i < matchPlayers.length; i++) {
    checkPlayerObjectForPuuid(matchPlayers[i], i);
  }

  try {
    const validated = CompletedMatchSchema.parse(result);
    console.log(`[debug][toMatch] ✅ Validation passed - match object is valid`);
    return validated;
  } catch (error) {
    console.error("[debug][toMatch] ❌ Validation error - match object has unexpected fields");
    if (error instanceof Error) {
      console.error("[debug][toMatch] Error message:", error.message);
    }
    console.error("[debug][toMatch] Error details:", error);
    console.error("[debug][toMatch] First player object keys:", Object.keys(matchPlayers[0] ?? {}));
    if (matchPlayers[0]) {
      console.error("[debug][toMatch] First player object:", JSON.stringify(matchPlayers[0], null, 2));
    }
    if (matchPlayers.length > 1 && matchPlayers[1]) {
      console.error("[debug][toMatch] Second player object keys:", Object.keys(matchPlayers[1]));
      console.error("[debug][toMatch] Second player object:", JSON.stringify(matchPlayers[1], null, 2));
    }

    // Additional debug: check what Zod is complaining about
    const ZodErrorSchema = z.object({
      issues: z.unknown(),
    });
    const zodErrorResult = ZodErrorSchema.safeParse(error);
    if (zodErrorResult.success) {
      console.error("[debug][toMatch] Zod validation issues:", JSON.stringify(zodErrorResult.data.issues, null, 2));
    }

    throw error;
  }
}

// Arena helpers
// Validate playerSubteamId is a valid arena subteam ID (1-8)
const ArenaSubteamIdSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);

function validateArenaSubteamId(participant: ParticipantDto): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  return ArenaSubteamIdSchema.parse(participant.playerSubteamId);
}

const ArenaParticipantFieldsSchema = z.object({
  playerSubteamId: z.number().int().min(1).max(8),
  placement: z.number().int().min(1).max(8),
});

type ArenaParticipantValidatedMin = ParticipantDto & {
  playerSubteamId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export function groupArenaTeams(participants: ParticipantDto[]) {
  const validated: ArenaParticipantValidatedMin[] = participants.map((p) => {
    const playerSubteamId = validateArenaSubteamId(p);
    return { ...p, playerSubteamId };
  });
  const bySubteam = groupBy(validated, (e) => e.playerSubteamId);
  const groups = pipe(
    entries(bySubteam),
    map(([key, entriesForKey]) => [Number(key), entriesForKey] as const),
    sortBy(([subteamId]) => subteamId),
    map(([subteamId, players]) => {
      if (players.length !== 2) {
        throw new Error(`subteam ${subteamId.toString()} must have exactly 2 players`);
      }
      return { subteamId, players };
    }),
  );
  if (groups.length !== 8) {
    throw new Error(`expected 8 subteams, got ${groups.length.toString()}`);
  }
  return groups;
}

export function getArenaTeammate(participant: ParticipantDto, participants: ParticipantDto[]) {
  const sub = validateArenaSubteamId(participant);
  for (const p of participants) {
    if (p === participant) {
      continue;
    }
    const otherSub = validateArenaSubteamId(p);
    if (otherSub === sub) {
      return p;
    }
  }
  return undefined;
}

export async function toArenaSubteams(participants: ParticipantDto[]): Promise<ArenaTeam[]> {
  const grouped = groupArenaTeams(participants);
  const result: ArenaTeam[] = [];
  for (const { subteamId, players } of grouped) {
    const placement0 = ArenaParticipantFieldsSchema.parse(players[0]).placement;
    const placement1 = ArenaParticipantFieldsSchema.parse(players[1]).placement;
    if (placement0 !== placement1) {
      throw new Error(
        `inconsistent placement for subteam ${subteamId.toString()}: ${placement0.toString()} !== ${placement1.toString()}`,
      );
    }
    const converted = await Promise.all(players.map((p) => participantToArenaChampion(p)));
    result.push({
      teamId: ArenaTeamIdSchema.parse(subteamId),
      players: converted,
      placement: ArenaPlacementSchema.parse(placement0),
    });
  }
  return result;
}

export function getArenaPlacement(participant: ParticipantDto) {
  return ArenaParticipantFieldsSchema.parse(participant).placement;
}

export async function toArenaMatch(players: Player[], matchDto: MatchDto): Promise<ArenaMatch> {
  const subteams = await toArenaSubteams(matchDto.info.participants);

  // Build ArenaMatch.players for all tracked players
  const arenaPlayers = await Promise.all(
    players.map(async (player, index) => {
      console.log(`[debug][toArenaMatch] Processing player ${index.toString()}: ${player.config.alias}`);
      console.log(`[debug][toArenaMatch] Player.config keys:`, Object.keys(player.config));

      // CRITICAL: Validate player.config doesn't have puuid at top level
      // This ensures no participant data leaks into player config
      const configValidation = PlayerConfigEntrySchema.safeParse(player.config);
      if (!configValidation.success) {
        console.error(
          `[debug][toArenaMatch] ⚠️  ERROR: player.config validation failed for ${player.config.alias}:`,
          configValidation.error,
        );
        console.error(`[debug][toArenaMatch] player.config structure:`, JSON.stringify(player.config, null, 2));
        throw new Error(`Invalid player config for ${player.config.alias}: config has unexpected fields`);
      }
      // Use validated config to ensure no extra fields
      const validatedConfig = configValidation.data;

      const participant = findParticipant(validatedConfig.league.leagueAccount.puuid, matchDto.info.participants);
      if (participant === undefined) {
        throw new Error(`participant not found for player ${validatedConfig.alias}`);
      }
      const subteamId = validateArenaSubteamId(participant);
      const placement = getArenaPlacement(participant);
      const champion = await participantToArenaChampion(participant);
      const teammateDto = getArenaTeammate(participant, matchDto.info.participants);
      if (!teammateDto) {
        throw new Error(`arena teammate not found for player ${validatedConfig.alias}`);
      }
      const arenaTeammate = await participantToArenaChampion(teammateDto);

      return {
        playerConfig: validatedConfig,
        placement: ArenaPlacementSchema.parse(placement),
        champion,
        teamId: ArenaTeamIdSchema.parse(subteamId),
        teammate: arenaTeammate,
      };
    }),
  );

  return {
    durationInSeconds: matchDto.info.gameDuration,
    queueType: "arena",
    players: arenaPlayers,
    teams: subteams,
  } satisfies ArenaMatch;
}
