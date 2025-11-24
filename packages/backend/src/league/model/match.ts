import { entries, groupBy, map, pipe, sortBy } from "remeda";
import { z } from "zod";
import {
  ArenaPlacementSchema,
  type ArenaTeam,
  ArenaTeamIdSchema,
  type CompletedMatch,
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
} from "@scout-for-lol/data";
import { strict as assert } from "assert";
import { participantToArenaChampion } from "@scout-for-lol/backend/league/model/champion.js";
import { participantToChampion } from "@scout-for-lol/data/model/match-helpers";

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
  const matchPlayers = players.map((player) => {
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

    return {
      playerConfig: player.config,
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
  });

  return {
    queueType,
    players: matchPlayers,
    durationInSeconds: matchDto.info.gameDuration,
    teams,
  };
}

// Arena helpers
const ArenaParticipantMinimalSchema = z.object({
  playerSubteamId: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
  ]),
});

const ArenaParticipantFieldsSchema = z.object({
  playerSubteamId: z.number().int().min(1).max(8),
  placement: z.number().int().min(1).max(8),
});

type ArenaParticipantValidatedMin = ParticipantDto & {
  playerSubteamId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export function groupArenaTeams(participants: ParticipantDto[]) {
  const validated: ArenaParticipantValidatedMin[] = participants.map((p) => {
    const parsed = ArenaParticipantMinimalSchema.parse(p);
    return { ...p, playerSubteamId: parsed.playerSubteamId };
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
  const sub = ArenaParticipantMinimalSchema.parse(participant).playerSubteamId;
  for (const p of participants) {
    if (p === participant) {
      continue;
    }
    const otherSub = ArenaParticipantMinimalSchema.parse(p).playerSubteamId;
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
    players.map(async (player) => {
      const participant = findParticipant(player.config.league.leagueAccount.puuid, matchDto.info.participants);
      if (participant === undefined) {
        throw new Error(`participant not found for player ${player.config.alias}`);
      }
      const subteamId = ArenaParticipantMinimalSchema.parse(participant).playerSubteamId;
      const placement = getArenaPlacement(participant);
      const champion = await participantToArenaChampion(participant);
      const teammateDto = getArenaTeammate(participant, matchDto.info.participants);
      if (!teammateDto) {
        throw new Error(`arena teammate not found for player ${player.config.alias}`);
      }
      const arenaTeammate = await participantToArenaChampion(teammateDto);

      return {
        playerConfig: player.config,
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
