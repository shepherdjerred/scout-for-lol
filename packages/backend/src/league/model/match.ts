import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { entries, filter, first, groupBy, map, pipe, sortBy } from "remeda";
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
} from "@scout-for-lol/data";
import { strict as assert } from "assert";
import { match } from "ts-pattern";
import { participantToArenaChampion, participantToChampion } from "./champion.js";
import { type ArenaMatch } from "@scout-for-lol/data";

function getTeams(participants: MatchV5DTOs.ParticipantDto[]) {
  return {
    blue: pipe(participants.slice(0, 5), map(participantToChampion)),
    red: pipe(participants.slice(5, 10), map(participantToChampion)),
  };
}

export function toMatch(
  player: Player,
  matchDto: MatchV5DTOs.MatchDto,
  rankBeforeMatch: Rank | undefined,
  rankAfterMatch: Rank | undefined,
): CompletedMatch {
  const participant = findParticipant(player.config.league.leagueAccount.puuid, matchDto.info.participants);
  if (participant === undefined) {
    console.debug("Player PUUID:", player.config.league.leagueAccount.puuid);
    console.debug("Match Participants:", matchDto.info.participants);
    throw new Error("participant not found");
  }

  const champion = participantToChampion(participant);
  const team = parseTeam(participant.teamId);
  const teams = getTeams(matchDto.info.participants);

  assert(team !== undefined);

  const enemyTeam = invertTeam(team);
  const queueType = parseQueueType(matchDto.info.queueId);

  if (queueType === "arena") {
    throw new Error("arena matches are not supported");
  }

  return {
    queueType,
    players: [
      {
        playerConfig: player.config,
        rankBeforeMatch,
        rankAfterMatch,
        wins: queueType === "solo" || queueType === "flex" ? (player.ranks[queueType]?.wins ?? undefined) : undefined,
        losses:
          queueType === "solo" || queueType === "flex" ? (player.ranks[queueType]?.losses ?? undefined) : undefined,
        champion,
        outcome: getOutcome(participant),
        team: team,
        lane: champion.lane,
        laneOpponent: getLaneOpponent(champion, teams[enemyTeam]),
      },
    ],
    durationInSeconds: matchDto.info.gameDuration,
    teams,
  };
}

export function getOutcome(participant: MatchV5DTOs.ParticipantDto) {
  return match(participant)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with({ win: true }, () => "Victory")
    .with({ gameEndedInSurrender: true }, () => "Surrender")
    .with({ win: false }, () => "Defeat")
    .exhaustive();
}

function findParticipant(
  puuid: string,
  participants: MatchV5DTOs.ParticipantDto[],
): MatchV5DTOs.ParticipantDto | undefined {
  return pipe(
    participants,
    filter((participant) => participant.puuid === puuid),
    first(),
  );
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

type ArenaParticipantValidatedMin = MatchV5DTOs.ParticipantDto & {
  playerSubteamId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export function groupArenaTeams(participants: MatchV5DTOs.ParticipantDto[]) {
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

export function getArenaTeammate(participant: MatchV5DTOs.ParticipantDto, participants: MatchV5DTOs.ParticipantDto[]) {
  const sub = ArenaParticipantMinimalSchema.parse(participant).playerSubteamId;
  for (const p of participants) {
    if (p === participant) continue;
    const otherSub = ArenaParticipantMinimalSchema.parse(p).playerSubteamId;
    if (otherSub === sub) return p;
  }
  return undefined;
}

export async function toArenaSubteams(participants: MatchV5DTOs.ParticipantDto[]): Promise<ArenaTeam[]> {
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

export function getArenaPlacement(participant: MatchV5DTOs.ParticipantDto) {
  return ArenaParticipantFieldsSchema.parse(participant).placement;
}

export async function toArenaMatch(players: Player[], matchDto: MatchV5DTOs.MatchDto): Promise<ArenaMatch> {
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
