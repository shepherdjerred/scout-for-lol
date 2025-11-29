/**
 * Prompt loading and management utilities
 */
import type { Personality, PlayerMetadata } from "./config/schema";
import { PersonalityMetadataSchema, PlayerMetadataSchema } from "./config/schema";
import type { Lane } from "@scout-for-lol/data";

// Import personality files
import aaronJson from "./prompts/personalities/aaron.json";
import aaronTxt from "./prompts/personalities/aaron.txt?raw";
import brianJson from "./prompts/personalities/brian.json";
import brianTxt from "./prompts/personalities/brian.txt?raw";
import irfanJson from "./prompts/personalities/irfan.json";
import irfanTxt from "./prompts/personalities/irfan.txt?raw";
import nekoryanjson from "./prompts/personalities/nekoryan.json";
import nekoryanTxt from "./prompts/personalities/nekoryan.txt?raw";
import genericJson from "./prompts/personalities/generic.json";
import genericTxt from "./prompts/personalities/generic.txt?raw";
import aaronStyleCard from "./prompts/style-cards/aaron_style.json";
import brianStyleCard from "./prompts/style-cards/brian_style.json";
import irfanStyleCard from "./prompts/style-cards/irfan_style.json";
import ryanStyleCard from "./prompts/style-cards/ryan_style.json";

// Import lane contexts
import topLane from "./prompts/lanes/top.txt?raw";
import middleLane from "./prompts/lanes/middle.txt?raw";
import jungleLane from "./prompts/lanes/jungle.txt?raw";
import adcLane from "./prompts/lanes/adc.txt?raw";
import supportLane from "./prompts/lanes/support.txt?raw";
import genericLane from "./prompts/lanes/generic.txt?raw";

// Import base prompt
import basePrompt from "./prompts/base.txt?raw";

// Import player metadata
import genericPlayer from "./prompts/players/generic.json";

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
  {
    id: "generic",
    metadata: PersonalityMetadataSchema.parse(genericJson),
    instructions: genericTxt,
    styleCard: "",
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

/**
 * Get generic player metadata
 */
export function getGenericPlayerMetadata(): PlayerMetadata {
  return PlayerMetadataSchema.parse(genericPlayer);
}
