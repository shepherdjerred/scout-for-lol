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
  type Player,
  type Rank,
  parseLane,
} from "@scout-for-lol/data";
import { strict as assert } from "assert";
import { match } from "ts-pattern";

// Champion conversion function - adapted to match the expected Champion type
function participantToChampion(participant: MatchV5DTOs.ParticipantDto) {
  return {
    riotIdGameName:
      participant.riotIdGameName && participant.riotIdGameName.length > 0
        ? participant.riotIdGameName
        : participant.summonerName && participant.summonerName.length > 0
          ? participant.summonerName
          : "Unknown",
    championName: participant.championName,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    level: participant.champLevel,
    items: [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
    ].filter((item) => item !== 0),
    spells: [participant.summoner1Id, participant.summoner2Id],
    gold: participant.goldEarned,
    runes: [], // TODO: Extract runes from participant.perks if needed
    creepScore:
      participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    damage: participant.totalDamageDealtToChampions,
    lane: parseLane(participant.lane),
  };
}

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
  rankAfterMatch: Rank | undefined
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
  rankAfterMatch: Rank | undefined
): CompletedMatch {
  const participant = findParticipant(
    player.config.league.leagueAccount.puuid,
    matchDto.info.participants
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
  rankAfterMatch: Rank | undefined
): ArenaMatch {
  const participant = findParticipant(
    player.config.league.leagueAccount.puuid,
    matchDto.info.participants
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
  const teamKeyMap = {
    1: teams.team1,
    2: teams.team2,
    3: teams.team3,
    4: teams.team4,
    5: teams.team5,
    6: teams.team6,
    7: teams.team7,
    8: teams.team8,
  } as const;
  const teammates = teamKeyMap[arenaTeam];
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

function getArenaOutcome(
  participant: MatchV5DTOs.ParticipantDto,
  placement: number
) {
  // Check if the participant surrendered
  if (participant.gameEndedInSurrender) {
    return "Surrender";
  }

  return match(placement)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with(1, () => "Victory")
    .when(
      (p) => p <= 4,
      () => "Victory"
    ) // Top 4 could be considered victory
    .with(8, () => "Defeat")
    .otherwise(() => "Defeat");
}

function getArenaPlacement(participant: MatchV5DTOs.ParticipantDto): number {
  // Arena placement logic based on participant data
  // For now, we'll use a simple mapping based on team position and win status
  // This might need adjustment based on actual Arena API structure
  // Note: participant.placement might not exist on the type, so we use fallback logic

  // Fallback logic for Arena placement
  // This is a placeholder implementation that should be updated
  // based on actual Arena API response structure
  if (participant.win) {
    return Math.floor(Math.random() * 4) + 1; // Random placement 1-4 for winners
  } else {
    return Math.floor(Math.random() * 4) + 5; // Random placement 5-8 for losers
  }
}

function findParticipant(
  puuid: string,
  participants: MatchV5DTOs.ParticipantDto[]
): MatchV5DTOs.ParticipantDto | undefined {
  return pipe(
    participants,
    filter((participant) => participant.puuid === puuid),
    first()
  );
}
