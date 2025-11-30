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
  type RawMatch,
  type RawParticipant,
  findParticipant,
  getOutcome,
  getTeams,
  PlayerConfigEntrySchema,
} from "@scout-for-lol/data/index.ts";
import { strict as assert } from "assert";
import { participantToArenaChampion } from "@scout-for-lol/backend/league/model/champion.ts";
import { participantToChampion } from "@scout-for-lol/data/model/match-helpers.ts";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("model-match");

export function toMatch(
  players: Player[],
  rawMatch: RawMatch,
  rankBeforeMatch: Rank | undefined,
  rankAfterMatch: Rank | undefined,
): CompletedMatch {
  const teams = getTeams(rawMatch.info.participants, participantToChampion);
  const queueType = parseQueueType(rawMatch.info.queueId);

  if (queueType === "arena") {
    throw new Error("arena matches are not supported");
  }

  // Build CompletedMatch.players for all tracked players
  const matchPlayers = players.map((player) => {
    // CRITICAL: Validate player.config doesn't have puuid at top level
    // This ensures no participant data leaks into player config
    const configValidation = PlayerConfigEntrySchema.safeParse(player.config);
    if (!configValidation.success) {
      throw new Error(`Invalid player config for ${player.config.alias}: config has unexpected fields`);
    }
    // Use validated config to ensure no extra fields
    const validatedConfig = configValidation.data;

    const participantRaw = findParticipant(player.config.league.leagueAccount.puuid, rawMatch.info.participants);
    if (participantRaw === undefined) {
      logger.debug("Player PUUID:", player.config.league.leagueAccount.puuid);
      logger.debug("Match Participants:", rawMatch.info.participants);
      throw new Error(`participant not found for player ${player.config.alias}`);
    }

    // TypeScript needs explicit narrowing after throw
    const participant: RawParticipant = participantRaw;

    const champion = participantToChampion(participant);
    const team = parseTeam(participant.teamId);

    assert(team !== undefined);

    const enemyTeam = invertTeam(team);

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

    return playerObject;
  });

  const result: CompletedMatch = {
    queueType,
    players: matchPlayers,
    durationInSeconds: rawMatch.info.gameDuration,
    teams,
  };

  const validated = CompletedMatchSchema.parse(result);
  return validated;
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

function validateArenaSubteamId(participant: RawParticipant): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  return ArenaSubteamIdSchema.parse(participant.playerSubteamId);
}

const ArenaParticipantFieldsSchema = z.object({
  playerSubteamId: z.number().int().min(1).max(8),
  placement: z.number().int().min(1).max(8),
});

type ArenaParticipantValidatedMin = RawParticipant & {
  playerSubteamId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export function groupArenaTeams(participants: RawParticipant[]) {
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

export function getArenaTeammate(participant: RawParticipant, participants: RawParticipant[]) {
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

export async function toArenaSubteams(participants: RawParticipant[]): Promise<ArenaTeam[]> {
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

export function getArenaPlacement(participant: RawParticipant) {
  return ArenaParticipantFieldsSchema.parse(participant).placement;
}

export async function toArenaMatch(players: Player[], rawMatch: RawMatch): Promise<ArenaMatch> {
  const subteams = await toArenaSubteams(rawMatch.info.participants);

  // Build ArenaMatch.players for all tracked players
  const arenaPlayers = await Promise.all(
    players.map(async (player) => {
      // CRITICAL: Validate player.config doesn't have puuid at top level
      // This ensures no participant data leaks into player config
      const configValidation = PlayerConfigEntrySchema.safeParse(player.config);
      if (!configValidation.success) {
        throw new Error(`Invalid player config for ${player.config.alias}: config has unexpected fields`);
      }
      // Use validated config to ensure no extra fields
      const validatedConfig = configValidation.data;

      const participant = findParticipant(validatedConfig.league.leagueAccount.puuid, rawMatch.info.participants);
      if (participant === undefined) {
        throw new Error(`participant not found for player ${validatedConfig.alias}`);
      }
      const subteamId = validateArenaSubteamId(participant);
      const placement = getArenaPlacement(participant);
      const champion = await participantToArenaChampion(participant);
      const teammateRaw = getArenaTeammate(participant, rawMatch.info.participants);
      if (!teammateRaw) {
        throw new Error(`arena teammate not found for player ${validatedConfig.alias}`);
      }
      const arenaTeammate = await participantToArenaChampion(teammateRaw);

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
    durationInSeconds: rawMatch.info.gameDuration,
    queueType: "arena",
    players: arenaPlayers,
    teams: subteams,
  } satisfies ArenaMatch;
}
