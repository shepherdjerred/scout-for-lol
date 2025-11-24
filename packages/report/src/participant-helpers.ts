import type { ParticipantDto, Champion, Rune } from "@scout-for-lol/data";
import { parseLane } from "@scout-for-lol/data";
import { getRuneInfo } from "@scout-for-lol/report/dataDragon/runes.js";

/**
 * Helper to extract runes from a single rune style
 */
function extractRunesFromStyle(style: ParticipantDto["perks"]["styles"][number] | undefined): Rune[] {
  const runes: Rune[] = [];
  if (!style) {
    return runes;
  }

  for (const selection of style.selections) {
    const info = getRuneInfo(selection.perk);
    runes.push({
      id: selection.perk,
      name: info?.name ?? `Rune ${selection.perk.toString()}`,
      description: info?.longDesc ?? info?.shortDesc ?? "",
    });
  }

  return runes;
}

/**
 * Helper to extract rune details from participant perks
 */
export function extractRunes(participant: ParticipantDto): Rune[] {
  const runes: Rune[] = [];

  // Extract primary rune selections
  const primaryStyle = participant.perks.styles[0];
  runes.push(...extractRunesFromStyle(primaryStyle));

  // Extract secondary rune selections
  const subStyle = participant.perks.styles[1];
  runes.push(...extractRunesFromStyle(subStyle));

  return runes;
}

/**
 * Converts a participant DTO to a Champion object with full details including runes
 */
export function participantToChampion(participant: ParticipantDto): Champion {
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
    runes: extractRunes(participant),
    creepScore: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    damage: participant.totalDamageDealtToChampions,
    lane: parseLane(participant.teamPosition),
  };
}
