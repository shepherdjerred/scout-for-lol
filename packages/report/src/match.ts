import type { MatchDto, CompletedMatch, Player, Rank } from "@scout-for-lol/data";
import {
  getLaneOpponent,
  invertTeam,
  parseQueueType,
  parseTeam,
  findParticipant,
  getOutcome,
  getTeams,
} from "@scout-for-lol/data";
import { participantToChampion } from "@scout-for-lol/report/participant-helpers.js";
import { strict as assert } from "assert";

export function toMatch(
  player: Player,
  matchDto: MatchDto,
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
  const teams = getTeams(matchDto.info.participants, participantToChampion);

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
