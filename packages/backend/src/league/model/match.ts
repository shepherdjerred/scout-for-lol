import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { filter, first, map, pipe } from "remeda";
import {
  type CompletedMatch,
  type ArenaMatch,
  type AnyMatch,
  getLaneOpponent,
  getTeammate,
  invertTeam,
  parseQueueType,
  parseTeam,
  parseArenaTeam,
  type ArenaTeam,
  type Player,
  type Rank,
} from "@scout-for-lol/data";
import { strict as assert } from "assert";
import { match } from "ts-pattern";
import { participantToChampion } from "./champion.js";

function getTeams(participants: MatchV5DTOs.ParticipantDto[]) {
  return {
    blue: pipe(participants.slice(0, 5), map(participantToChampion)),
    red: pipe(participants.slice(5, 10), map(participantToChampion)),
  };
}

function getArenaTeams(participants: MatchV5DTOs.ParticipantDto[]) {
  return {
    team1: pipe(participants.slice(0, 2), map(participantToChampion)),
    team2: pipe(participants.slice(2, 4), map(participantToChampion)),
    team3: pipe(participants.slice(4, 6), map(participantToChampion)),
    team4: pipe(participants.slice(6, 8), map(participantToChampion)),
    team5: pipe(participants.slice(8, 10), map(participantToChampion)),
    team6: pipe(participants.slice(10, 12), map(participantToChampion)),
    team7: pipe(participants.slice(12, 14), map(participantToChampion)),
    team8: pipe(participants.slice(14, 16), map(participantToChampion)),
  };
}

export function toMatch(
  player: Player,
  matchDto: MatchV5DTOs.MatchDto,
  rankBeforeMatch: Rank | undefined,
  rankAfterMatch: Rank | undefined,
): AnyMatch {
  const queueType = parseQueueType(matchDto.info.queueId);
  
  if (queueType === "arena") {
    return toArenaMatch(player, matchDto, rankBeforeMatch, rankAfterMatch);
  }
  
  return toTraditionalMatch(player, matchDto, rankBeforeMatch, rankAfterMatch);
}

function toTraditionalMatch(
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

function toArenaMatch(
  player: Player,
  matchDto: MatchV5DTOs.MatchDto,
  rankBeforeMatch: Rank | undefined,
  rankAfterMatch: Rank | undefined,
): ArenaMatch {
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
  const arenaTeam = parseArenaTeam(participant.teamId);
  const teams = getArenaTeams(matchDto.info.participants);

  assert(arenaTeam !== undefined);

  // Get teammate
  const teamKey = `team${arenaTeam}` as keyof typeof teams;
  const teammates = teams[teamKey];
  const teammate = getTeammate(champion, teammates);

  // Get placement (this might need adjustment based on actual Arena API structure)
  const placement = getArenaPlacement(participant);

  return {
    queueType: "arena",
    players: [
      {
        playerConfig: player.config,
        rankBeforeMatch,
        rankAfterMatch,
        wins: undefined, // Arena doesn't use traditional wins/losses
        losses: undefined,
        champion,
        outcome: getArenaOutcome(participant, placement),
        team: arenaTeam,
        placement,
        teammateChampion: teammate,
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

function getArenaOutcome(participant: MatchV5DTOs.ParticipantDto, placement: number) {
  return match(placement)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with(1, () => "Victory")
    .when((p) => p <= 4, () => "Victory") // Top 4 could be considered victory
    .with(8, () => "Defeat")
    .otherwise(() => "Defeat");
}

function getArenaPlacement(participant: MatchV5DTOs.ParticipantDto): number {
  // This is a placeholder - the actual placement might be stored differently
  // in the API response for Arena games. You might need to check the actual
  // API structure for Arena matches to get the correct placement.
  return participant.placement ?? 8; // Default to last place if not found
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
