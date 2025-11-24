/**
 * Prompt loading and management utilities
 */
import type { Personality, PlayerMetadata } from "@scout-for-lol/review-dev-tool/config/schema";
import { PersonalityMetadataSchema, PlayerMetadataSchema } from "@scout-for-lol/review-dev-tool/config/schema";
import type { Lane } from "@scout-for-lol/data";

// Import personality files
import aaronJson from "@scout-for-lol/review-dev-tool/prompts/personalities/aaron.json";
import aaronTxt from "@scout-for-lol/review-dev-tool/prompts/personalities/aaron.txt?raw";
import brianJson from "@scout-for-lol/review-dev-tool/prompts/personalities/brian.json";
import brianTxt from "@scout-for-lol/review-dev-tool/prompts/personalities/brian.txt?raw";
import irfanJson from "@scout-for-lol/review-dev-tool/prompts/personalities/irfan.json";
import irfanTxt from "@scout-for-lol/review-dev-tool/prompts/personalities/irfan.txt?raw";
import nekoryanjson from "@scout-for-lol/review-dev-tool/prompts/personalities/nekoryan.json";
import nekoryanTxt from "@scout-for-lol/review-dev-tool/prompts/personalities/nekoryan.txt?raw";
import genericJson from "@scout-for-lol/review-dev-tool/prompts/personalities/generic.json";
import genericTxt from "@scout-for-lol/review-dev-tool/prompts/personalities/generic.txt?raw";

// Import lane contexts
import topLane from "@scout-for-lol/review-dev-tool/prompts/lanes/top.txt?raw";
import middleLane from "@scout-for-lol/review-dev-tool/prompts/lanes/middle.txt?raw";
import jungleLane from "@scout-for-lol/review-dev-tool/prompts/lanes/jungle.txt?raw";
import adcLane from "@scout-for-lol/review-dev-tool/prompts/lanes/adc.txt?raw";
import supportLane from "@scout-for-lol/review-dev-tool/prompts/lanes/support.txt?raw";
import genericLane from "@scout-for-lol/review-dev-tool/prompts/lanes/generic.txt?raw";

// Import base prompt
import basePrompt from "@scout-for-lol/review-dev-tool/prompts/base.txt?raw";

// Import player metadata
import genericPlayer from "@scout-for-lol/review-dev-tool/prompts/players/generic.json";

/**
 * Built-in personalities (from prompt files)
 */
const BUILTIN_PERSONALITIES_INTERNAL: Personality[] = [
  {
    id: "aaron",
    metadata: PersonalityMetadataSchema.parse(aaronJson),
    instructions: aaronTxt,
  },
  {
    id: "brian",
    metadata: PersonalityMetadataSchema.parse(brianJson),
    instructions: brianTxt,
  },
  {
    id: "irfan",
    metadata: PersonalityMetadataSchema.parse(irfanJson),
    instructions: irfanTxt,
  },
  {
    id: "nekoryan",
    metadata: PersonalityMetadataSchema.parse(nekoryanjson),
    instructions: nekoryanTxt,
  },
  {
    id: "generic",
    metadata: PersonalityMetadataSchema.parse(genericJson),
    instructions: genericTxt,
  },
];

export const BUILTIN_PERSONALITIES = BUILTIN_PERSONALITIES_INTERNAL;

/**
 * Lane context mapping
 */
const LANE_CONTEXTS: Record<Lane, string> = {
  top: topLane,
  middle: middleLane,
  jungle: jungleLane,
  adc: adcLane,
  support: supportLane,
};

/**
 * Get base prompt template
 */
export function getBasePrompt(): string {
  return basePrompt;
}

/**
 * Select a random personality from built-in personalities
 */
export function selectRandomPersonality(): Personality {
  // Exclude generic from random selection
  const selectablePersonalities = BUILTIN_PERSONALITIES_INTERNAL.filter((p) => p.id !== "generic");
  const randomIndex = Math.floor(Math.random() * selectablePersonalities.length);
  const selected = selectablePersonalities[randomIndex];
  if (!selected) {
    throw new Error("Failed to select personality");
  }
  return selected;
}

/**
 * Get personality by ID (checks built-in personalities only)
 * For custom personalities, use the personality storage functions directly
 */
export function getPersonalityById(id: string): Personality | undefined {
  return BUILTIN_PERSONALITIES_INTERNAL.find((p) => p.id === id);
}

/**
 * Get lane context
 */
export function getLaneContext(lane: string | undefined): string {
  if (!lane) {
    return genericLane;
  }

  const lowerLane = lane.toLowerCase();
  // Check if lane is a valid key
  const validLanes: Record<string, string> = LANE_CONTEXTS;
  if (lowerLane in validLanes) {
    const laneValue = validLanes[lowerLane];
    if (laneValue) {
      return laneValue;
    }
  }

  return genericLane;
}

/**
 * Get generic player metadata
 */
export function getGenericPlayerMetadata(): PlayerMetadata {
  return PlayerMetadataSchema.parse(genericPlayer);
}

/**
 * Replace template variables in the base prompt
 */
function _replaceTemplateVariables(
  template: string,
  variables: {
    reviewerName: string;
    reviewerPersonality: string;
    reviewerFavoriteChampions: string;
    reviewerFavoriteLanes: string;
    playerName: string;
    playerPersonality: string;
    playerFavoriteChampions: string;
    playerFavoriteLanes: string;
    playerChampion: string;
    playerLane: string;
    opponentChampion: string;
    laneDescription: string;
    matchReport: string;
  },
): string {
  return template
    .replaceAll("<REVIEWER NAME>", variables.reviewerName)
    .replaceAll("<REVIEWER PERSONALITY>", variables.reviewerPersonality)
    .replaceAll("<REVIEWER FAVORITE CHAMPIONS>", variables.reviewerFavoriteChampions)
    .replaceAll("<REVIEWER FAVORITE LANES>", variables.reviewerFavoriteLanes)
    .replaceAll("<PLAYER NAME>", variables.playerName)
    .replaceAll("<PLAYER PERSONALITY>", variables.playerPersonality)
    .replaceAll("<PLAYER FAVORITE CHAMPIONS>", variables.playerFavoriteChampions)
    .replaceAll("<PLAYER FAVORITE LANES>", variables.playerFavoriteLanes)
    .replaceAll("<PLAYER CHAMPION>", variables.playerChampion)
    .replaceAll("<PLAYER LANE>", variables.playerLane)
    .replaceAll("<OPPONENT CHAMPION>", variables.opponentChampion)
    .replaceAll("<LANE DESCRIPTION>", variables.laneDescription)
    .replaceAll("<MATCH REPORT>", variables.matchReport);
}
