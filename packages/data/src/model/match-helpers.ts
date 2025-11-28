import { filter, first, map, pipe } from "remeda";
import { match } from "ts-pattern";
import type { RawParticipant } from "@scout-for-lol/data/league/raw-match.schema.js";
import type { Champion } from "@scout-for-lol/data/model/champion.js";
import { parseLane } from "@scout-for-lol/data/model/lane.js";

/**
 * Finds a participant in a match by their PUUID
 */
export function findParticipant(puuid: string, participants: RawParticipant[]): RawParticipant | undefined {
  return pipe(
    participants,
    filter((participant) => participant.puuid === puuid),
    first(),
  );
}

/**
 * Determines the outcome of a match for a participant
 */
export function getOutcome(participant: RawParticipant): "Victory" | "Surrender" | "Defeat" {
  return match(participant)
    .returnType<"Victory" | "Surrender" | "Defeat">()
    .with({ win: true }, () => "Victory")
    .with({ gameEndedInSurrender: true }, () => "Surrender")
    .with({ win: false }, () => "Defeat")
    .exhaustive();
}

/**
 * Converts a raw participant to a Champion object.
 * Note: This is a minimal conversion. For rune extraction, see extractRunes.
 */
export function participantToChampion(participant: RawParticipant): Champion {
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
      participant.item6,
    ].filter((item) => item !== 0),
    spells: [participant.summoner1Id, participant.summoner2Id],
    gold: participant.goldEarned,
    runes: [], // Populated separately - requires Data Dragon access
    creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    damage: participant.totalDamageDealtToChampions,
    lane: parseLane(participant.teamPosition),
  };
}

/**
 * Splits participants into blue and red teams
 */
export function getTeams(participants: RawParticipant[], championConverter: (p: RawParticipant) => Champion) {
  return {
    blue: pipe(participants.slice(0, 5), map(championConverter)),
    red: pipe(participants.slice(5, 10), map(championConverter)),
  };
}
