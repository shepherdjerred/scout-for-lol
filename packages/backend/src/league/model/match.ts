import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { entries, filter, first, groupBy, map, pipe, sortBy } from "remeda";
import { z } from "zod";
import {
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
import { type ArenaSubteam } from "@scout-for-lol/data";

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
  const participant = findParticipant(
    player.config.league.leagueAccount.puuid,
    matchDto.info.participants,
  );
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

  return {
    queueType,
    players: [
      {
        playerConfig: player.config,
        rankBeforeMatch,
        rankAfterMatch,
        wins:
          queueType === "solo" || queueType === "flex"
            ? (player.ranks[queueType]?.wins ?? undefined)
            : undefined,
        losses:
          queueType === "solo" || queueType === "flex"
            ? (player.ranks[queueType]?.losses ?? undefined)
            : undefined,
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
  playerSubteamId: z.number().int().min(1).max(8),
}).passthrough();

const ArenaParticipantFieldsSchema = z
  .object({
    playerSubteamId: z.number().int().min(1).max(8),
    placement: z.number().int().min(1).max(8),
  })
  .passthrough();

type ArenaParticipantValidatedMin = MatchV5DTOs.ParticipantDto & {
  playerSubteamId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export function groupArenaTeams(participants: MatchV5DTOs.ParticipantDto[]) {
  const validated: ArenaParticipantValidatedMin[] = participants.map((p) => {
    const parsed = ArenaParticipantMinimalSchema.parse(p);
    return { ...p, playerSubteamId: parsed.playerSubteamId as ArenaParticipantValidatedMin["playerSubteamId"] };
  });
  const bySubteam = groupBy(validated, (e) => e.playerSubteamId);
  const groups = pipe(
    entries(bySubteam),
    map(([key, entriesForKey]) => [Number(key), entriesForKey] as const),
    sortBy(([subteamId]) => subteamId),
    map(([subteamId, players]) => {
      if (players.length !== 2) {
        throw new Error(`subteam ${subteamId} must have exactly 2 players`);
      }
      return { subteamId, players };
    }),
  );
  if (groups.length !== 8) {
    throw new Error(`expected 8 subteams, got ${groups.length}`);
  }
  return groups;
}

export function getArenaTeammate(
  participant: ArenaParticipantValidatedMin,
  participants: ArenaParticipantValidatedMin[],
) {
  for (const p of participants) {
    if (p === participant) continue;
    if (p.playerSubteamId === participant.playerSubteamId) return p;
  }
  return undefined;
}

export function toArenaSubteams(
  participants: MatchV5DTOs.ParticipantDto[],
): ArenaSubteam[] {
  const grouped = groupArenaTeams(participants);
  return grouped.map(({ subteamId, players }) => {
    const placement0 = ArenaParticipantFieldsSchema.parse(players[0]).placement;
    const placement1 = ArenaParticipantFieldsSchema.parse(players[1]).placement;
    if (placement0 !== placement1) {
      throw new Error(
        `inconsistent placement for subteam ${subteamId}: ${placement0} !== ${placement1}`,
      );
    }
    return {
      subteamId,
      players: players.map(participantToArenaChampion),
      placement: placement0,
    };
  });
}

export function getArenaPlacement(participant: MatchV5DTOs.ParticipantDto) {
  return ArenaParticipantFieldsSchema.parse(participant).placement;
}
