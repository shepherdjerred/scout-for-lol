// Re-export the functions from @scout-for-lol/data for backwards compatibility
import {
  extractRunes as extractRunesBase,
  participantToChampion as participantToChampionBase,
} from "@scout-for-lol/data/model/match-helpers.ts";

export const extractRunes = extractRunesBase;
export const participantToChampion = participantToChampionBase;
