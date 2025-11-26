/**
 * Prompt schemas and types for AI review generation
 *
 * Note: This module exports schemas and types only.
 * Actual file loading is handled by consuming packages (backend, review-dev-tool)
 * since the data package should remain platform-agnostic.
 */

import { z } from "zod";
import type { Lane } from "@scout-for-lol/data/model/lane.js";

/**
 * Personality metadata schema
 */
export const PersonalityMetadataSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

export type PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;

/**
 * Personality type (metadata + instructions)
 */
export type Personality = {
  metadata: PersonalityMetadata;
  instructions: string;
  filename: string;
};

/**
 * Player metadata schema
 */
export const PlayerMetadataSchema = z.strictObject({
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;

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
 * Replace template variables in the base prompt
 */
export function replaceTemplateVariables(
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
    friendsContext: string;
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
    .replaceAll("<MATCH REPORT>", variables.matchReport)
    .replaceAll("<FRIENDS CONTEXT>", variables.friendsContext);
}
