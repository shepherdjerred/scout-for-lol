/**
 * Helper functions for S3 match conversion
 */
import type { ParticipantDto, Rune, Champion } from "@scout-for-lol/data";
import { parseLane } from "@scout-for-lol/data";
import { getRuneInfo } from "@scout-for-lol/report";

/**
 * Get match outcome from participant data
 * Mirrors backend implementation from packages/backend/src/league/model/match.ts
 */
export function getOutcome(participant: ParticipantDto): "Victory" | "Defeat" | "Surrender" {
  if (participant.win) {
    return "Victory";
  }
  if (participant.gameEndedInSurrender) {
    return "Surrender";
  }
  return "Defeat";
}

/**
 * Extract rune details from participant perks
 */
export function extractRunes(p: ParticipantDto): Rune[] {
  const runes: Rune[] = [];

  // Extract primary rune selections
  const primaryStyle = p.perks.styles[0];
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
  const subStyle = p.perks.styles[1];
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

/**
 * Convert participant to champion (like backend does)
 */
export function participantToChampion(p: ParticipantDto): Champion {
  const riotIdGameName = p.riotIdGameName && p.riotIdTagline ? p.riotIdGameName : "Unknown";

  return {
    riotIdGameName,
    championName: p.championName,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    level: p.champLevel,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    lane: parseLane(p.teamPosition),
    spells: [p.summoner1Id, p.summoner2Id],
    gold: p.goldEarned,
    runes: extractRunes(p),
    creepScore: p.totalMinionsKilled + p.neutralMinionsKilled,
    visionScore: p.visionScore,
    damage: p.totalDamageDealtToChampions,
  };
}
