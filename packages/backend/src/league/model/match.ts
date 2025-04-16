import type { MatchV5DTOs } from "https://esm.sh/v135/twisted@1.63.3/dist/models-dto/index.js";
import { filter, first, map, pipe } from "remeda";
import {
  type CompletedMatch,
  getLaneOpponent,
  invertTeam,
  parseQueueType,
  parseTeam,
  type Player,
  type Rank,
} from "@scout/data";
import { assert } from "@std/assert";
import { match } from "ts-pattern";
import { participantToChampion } from "./champion.ts";

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
    player: {
      playerConfig: player.config,
      rankBeforeMatch,
      rankAfterMatch,
      wins: queueType === "solo" || queueType === "flex"
        ? player.ranks[queueType]?.wins || undefined
        : undefined,
      losses: queueType === "solo" || queueType === "flex"
        ? player.ranks[queueType]?.losses || undefined
        : undefined,
      champion,
      outcome: getOutcome(participant),
      team: team,
      lane: champion.lane,
      laneOpponent: getLaneOpponent(champion, teams[enemyTeam]),
    },
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
