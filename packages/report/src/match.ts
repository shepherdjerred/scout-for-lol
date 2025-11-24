import type { MatchDto, ParticipantDto, CompletedMatch, Player, Rank, Rune } from "@scout-for-lol/data";
import { getLaneOpponent, invertTeam, parseQueueType, parseTeam, parseLane } from "@scout-for-lol/data";
import { getRuneInfo } from "@scout-for-lol/report/dataDragon/runes.js";
import { filter, first, map, pipe } from "remeda";
import { strict as assert } from "assert";
import { match } from "ts-pattern";

// Helper to extract rune details from participant perks
function extractRunes(participant: ParticipantDto): Rune[] {
  const runes: Rune[] = [];

  // Extract primary rune selections
  const primaryStyle = participant.perks.styles[0];
  if (primaryStyle) {
    for (const selection of primaryStyle.selections) {
      const info = getRuneInfo(selection.perk);
      runes.push({
        id: selection.perk,
        name: info?.name ?? `Rune ${selection.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
      });
    }
  }

  // Extract secondary rune selections
  const subStyle = participant.perks.styles[1];
  if (subStyle) {
    for (const selection of subStyle.selections) {
      const info = getRuneInfo(selection.perk);
      runes.push({
        id: selection.perk,
        name: info?.name ?? `Rune ${selection.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
      });
    }
  }

  return runes;
}

// Champion conversion function - adapted to match the expected Champion type
function participantToChampion(participant: ParticipantDto) {
  return {
    riotIdGameName:
      participant.riotIdGameName && participant.riotIdGameName.length > 0 ? participant.riotIdGameName : "Unknown",
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
    runes: extractRunes(participant),
    creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    damage: participant.totalDamageDealtToChampions,
    lane: parseLane(participant.lane),
  };
}

function getTeams(participants: ParticipantDto[]) {
  return {
    blue: pipe(participants.slice(0, 5), map(participantToChampion)),
    red: pipe(participants.slice(5, 10), map(participantToChampion)),
  };
}

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

export function getOutcome(participant: ParticipantDto) {
  return match(participant)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with({ win: true }, () => "Victory")
    .with({ gameEndedInSurrender: true }, () => "Surrender")
    .with({ win: false }, () => "Defeat")
    .exhaustive();
}

function findParticipant(puuid: string, participants: ParticipantDto[]): ParticipantDto | undefined {
  return pipe(
    participants,
    filter((participant) => participant.puuid === puuid),
    first(),
  );
}
