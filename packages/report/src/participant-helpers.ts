import type { ParticipantDto, Champion, Rune } from "@scout-for-lol/data";
import { participantToChampion as participantToChampionBase } from "@scout-for-lol/data/model/match-helpers.js";
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
 * Converts a participant DTO to a Champion object with full details including runes.
 * This extends the base implementation from @scout-for-lol/data by adding rune extraction.
 */
export function participantToChampion(participant: ParticipantDto): Champion {
  const baseChampion = participantToChampionBase(participant);
  return {
    ...baseChampion,
    runes: extractRunes(participant),
  };
}
