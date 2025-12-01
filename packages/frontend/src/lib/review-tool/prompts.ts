/**
 * Prompt loading and management utilities
 */
import type { Personality } from "./config/schema.ts";
import { PersonalityMetadataSchema } from "./config/schema.ts";
import type { Lane } from "@scout-for-lol/data";

// Import personality files
import aaronJson from "@scout-for-lol/data/src/review/prompts/personalities/aaron.json";
import aaronTxt from "@scout-for-lol/data/src/review/prompts/personalities/aaron.txt?raw";
import brianJson from "@scout-for-lol/data/src/review/prompts/personalities/brian.json";
import brianTxt from "@scout-for-lol/data/src/review/prompts/personalities/brian.txt?raw";
import irfanJson from "@scout-for-lol/data/src/review/prompts/personalities/irfan.json";
import irfanTxt from "@scout-for-lol/data/src/review/prompts/personalities/irfan.txt?raw";
import nekoryanjson from "@scout-for-lol/data/src/review/prompts/personalities/nekoryan.json";
import nekoryanTxt from "@scout-for-lol/data/src/review/prompts/personalities/nekoryan.txt?raw";
import aaronStyleCard from "@scout-for-lol/data/src/review/prompts/style-cards/aaron_style.json";
import brianStyleCard from "@scout-for-lol/data/src/review/prompts/style-cards/brian_style.json";
import irfanStyleCard from "@scout-for-lol/data/src/review/prompts/style-cards/irfan_style.json";
import ryanStyleCard from "@scout-for-lol/data/src/review/prompts/style-cards/nekoryan_style.json";

// Import lane contexts
import topLane from "@scout-for-lol/data/src/review/prompts/lanes/top.txt?raw";
import middleLane from "@scout-for-lol/data/src/review/prompts/lanes/middle.txt?raw";
import jungleLane from "@scout-for-lol/data/src/review/prompts/lanes/jungle.txt?raw";
import adcLane from "@scout-for-lol/data/src/review/prompts/lanes/adc.txt?raw";
import supportLane from "@scout-for-lol/data/src/review/prompts/lanes/support.txt?raw";
import genericLane from "@scout-for-lol/data/src/review/prompts/lanes/generic.txt?raw";

// Import base prompt template (user prompt for review text stage)
import basePrompt from "@scout-for-lol/data/src/review/prompts/user/2-review-text.txt?raw";

/**
 * Built-in personalities (from prompt files)
 */
const RAW_BUILTIN_PERSONALITIES: Personality[] = [
  {
    id: "aaron",
    metadata: PersonalityMetadataSchema.parse(aaronJson),
    instructions: aaronTxt,
    styleCard: JSON.stringify(aaronStyleCard),
  },
  {
    id: "brian",
    metadata: PersonalityMetadataSchema.parse(brianJson),
    instructions: brianTxt,
    styleCard: JSON.stringify(brianStyleCard),
  },
  {
    id: "irfan",
    metadata: PersonalityMetadataSchema.parse(irfanJson),
    instructions: irfanTxt,
    styleCard: JSON.stringify(irfanStyleCard),
  },
  {
    id: "nekoryan",
    metadata: PersonalityMetadataSchema.parse(nekoryanjson),
    instructions: nekoryanTxt,
    styleCard: JSON.stringify(ryanStyleCard),
  },
];

const discardedPersonalities: string[] = [];
const BUILTIN_PERSONALITIES_INTERNAL: Personality[] = RAW_BUILTIN_PERSONALITIES.filter((p) => {
  if (p.styleCard.trim().length === 0) {
    discardedPersonalities.push(p.id);
    return false;
  }
  return true;
});

if (discardedPersonalities.length > 0) {
  console.warn(`[review-tool] Discarded personalities missing style cards: ${discardedPersonalities.join(", ")}`);
}

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
