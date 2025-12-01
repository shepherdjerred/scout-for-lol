/**
 * Prompt schemas and types for AI review generation
 *
 * Note: This module exports schemas and types only.
 * Actual file loading is handled by consuming packages (backend, review-dev-tool)
 * since the data package should remain platform-agnostic.
 */

import { z } from "zod";
import type { Lane } from "@scout-for-lol/data/model/lane.ts";

/**
 * Random behavior schema - weighted random prompts
 */
export const RandomBehaviorSchema = z.strictObject({
  prompt: z.string(),
  weight: z.number().min(0).max(100), // Percentage chance (0-100)
});

export type RandomBehavior = z.infer<typeof RandomBehaviorSchema>;

/**
 * Personality metadata schema
 */
export const PersonalityMetadataSchema = z.strictObject({
  name: z.string(),
  randomBehaviors: z.array(RandomBehaviorSchema).optional(),
  image: z.array(z.string()).optional(),
});

export type PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;

/**
 * Personality type (metadata + instructions)
 */
export type Personality = {
  metadata: PersonalityMetadata;
  instructions: string;
  /**
   * Style card loaded from analysis/llm-out to help match voice
   */
  styleCard: string;
  filename?: string;
};

/**
 * Lane context mapping (relative paths from prompts directory)
 */
export const LANE_CONTEXT_MAP: Record<Lane, string> = {
  top: "lanes/top.txt",
  middle: "lanes/middle.txt",
  jungle: "lanes/jungle.txt",
  adc: "lanes/adc.txt",
  support: "lanes/support.txt",
};

/**
 * Files to exclude from personality selection
 */
export const EXCLUDED_PERSONALITY_FILES = new Set(["generic.json"]);

/**
 * Select a random behavior from a list based on weights.
 * Each behavior has an independent percentage chance of being selected.
 * If no behavior is selected (roll exceeds total weights), returns undefined.
 *
 * @param behaviors - Array of behaviors with prompts and weights
 * @returns The selected behavior's prompt, or undefined if none selected
 */
export function selectRandomBehavior(behaviors: RandomBehavior[] | undefined): string | undefined {
  if (!behaviors || behaviors.length === 0) {
    return undefined;
  }

  // Calculate total weight
  const totalWeight = behaviors.reduce((sum, b) => sum + b.weight, 0);

  // Roll a random number between 0 and 100
  const roll = Math.random() * 100;

  // If roll exceeds total weight, no behavior triggers
  if (roll >= totalWeight) {
    return undefined;
  }

  // Find which behavior was selected based on cumulative weights
  let cumulative = 0;
  for (const behavior of behaviors) {
    cumulative += behavior.weight;
    if (roll < cumulative) {
      return behavior.prompt;
    }
  }

  return undefined;
}

/**
 * Select 2-3 random image prompts from a personality's image array.
 * These prompts are used to influence AI-generated image concepts.
 *
 * @param imagePrompts - Array of image prompt strings from personality metadata
 * @returns Array of 2-3 randomly selected prompts, or empty array if no prompts available
 */
export function selectRandomImagePrompts(imagePrompts: string[] | undefined): string[] {
  if (!imagePrompts || imagePrompts.length === 0) {
    return [];
  }

  // Determine how many prompts to select (2-3)
  const count = Math.min(imagePrompts.length, Math.random() < 0.5 ? 2 : 3);

  // Shuffle and take the first `count` items
  const shuffled = [...imagePrompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Replace template variables in the base prompt
 */
export function replaceTemplateVariables(
  template: string,
  variables: {
    reviewerName: string;
    reviewerPersonality: string;
    playerName: string;
    playerChampion: string;
    playerLane: string;
    opponentChampion: string;
    friendsContext: string;
    randomBehavior: string;
    matchAnalysis: string;
    queueContext: string;
  },
): string {
  return template
    .replaceAll("<REVIEWER NAME>", variables.reviewerName)
    .replaceAll("<REVIEWER PERSONALITY>", variables.reviewerPersonality)
    .replaceAll("<PLAYER NAME>", variables.playerName)
    .replaceAll("<PLAYER CHAMPION>", variables.playerChampion)
    .replaceAll("<PLAYER LANE>", variables.playerLane)
    .replaceAll("<OPPONENT CHAMPION>", variables.opponentChampion)
    .replaceAll("<FRIENDS CONTEXT>", variables.friendsContext)
    .replaceAll("<RANDOM BEHAVIOR>", variables.randomBehavior)
    .replaceAll("<MATCH ANALYSIS>", variables.matchAnalysis)
    .replaceAll("<QUEUE CONTEXT>", variables.queueContext);
}
