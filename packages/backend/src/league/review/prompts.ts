import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Lane } from "@scout-for-lol/data";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = dirname(FILENAME);
const PROMPTS_DIR = join(DIRNAME, "prompts");

// Personality metadata schema
const PersonalityMetadataSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

type PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;

export type Personality = {
  metadata: PersonalityMetadata;
  instructions: string;
  filename: string;
};

// Player metadata schema
const PlayerMetadataSchema = z.strictObject({
  description: z.string(),
  favoriteChampions: z.array(z.string()),
  favoriteLanes: z.array(z.string()),
});

export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;

// Lane context mapping
const LANE_CONTEXT_MAP: Record<Lane, string> = {
  top: "lanes/top.txt",
  middle: "lanes/middle.txt",
  jungle: "lanes/jungle.txt",
  adc: "lanes/adc.txt",
  support: "lanes/support.txt",
};

// Files to exclude from personality selection
const EXCLUDED_FILES = new Set(["generic.json"]);

/**
 * Load a prompt file from the prompts directory
 */
export function loadPromptFile(filename: string): string {
  const filePath = join(PROMPTS_DIR, filename);
  return readFileSync(filePath, "utf-8").trim();
}

/**
 * Load a personality (both JSON metadata and TXT instructions)
 */
function loadPersonality(basename: string): Personality {
  const personalitiesDir = join(PROMPTS_DIR, "personalities");

  // Load JSON metadata
  const jsonPath = join(personalitiesDir, `${basename}.json`);
  const jsonContent = readFileSync(jsonPath, "utf-8");
  const parsed: unknown = JSON.parse(jsonContent);
  const metadata = PersonalityMetadataSchema.parse(parsed);

  // Load TXT instructions
  const txtPath = join(personalitiesDir, `${basename}.txt`);
  const instructions = readFileSync(txtPath, "utf-8").trim();

  return {
    metadata,
    instructions,
    filename: basename,
  };
}

/**
 * Get list of personality files from the filesystem
 */
function getPersonalityFiles(): string[] {
  const personalitiesDir = join(PROMPTS_DIR, "personalities");
  const files = readdirSync(personalitiesDir);
  return files.filter((file) => file.endsWith(".json") && !EXCLUDED_FILES.has(file));
}

/**
 * Select a random personality prompt
 */
export function selectRandomPersonality(): Personality {
  const personalityFiles = getPersonalityFiles();
  if (personalityFiles.length === 0) {
    throw new Error("No personality files found");
  }
  const randomIndex = Math.floor(Math.random() * personalityFiles.length);
  const selectedFile = personalityFiles[randomIndex];
  if (!selectedFile) {
    throw new Error("Failed to select personality file");
  }
  // Remove .json extension to get basename
  const basename = selectedFile.replace(".json", "");
  return loadPersonality(basename);
}

/**
 * Load player metadata from JSON file
 */
export function loadPlayerMetadata(playerAlias: string): PlayerMetadata {
  const playersDir = join(PROMPTS_DIR, "players");

  // Try to load player-specific file, fall back to generic
  const playerFile = `${playerAlias.toLowerCase().replace(/\s+/g, "-")}.json`;
  const filePath = join(playersDir, playerFile);

  try {
    const jsonContent = readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(jsonContent);
    return PlayerMetadataSchema.parse(parsed);
  } catch {
    // Fall back to generic player metadata
    const genericPath = join(playersDir, "generic.json");
    const genericContent = readFileSync(genericPath, "utf-8");
    const parsed: unknown = JSON.parse(genericContent);
    return PlayerMetadataSchema.parse(parsed);
  }
}

/**
 * Get lane context based on player's lane
 */
export function getLaneContext(lane: string | undefined): { content: string; filename: string } {
  const lowerLane = lane?.toLowerCase();
  let laneFile: string | undefined = undefined;

  // Type-safe lane lookup
  if (lowerLane) {
    switch (lowerLane) {
      case "top":
      case "middle":
      case "jungle":
      case "adc":
      case "support":
        laneFile = LANE_CONTEXT_MAP[lowerLane];
        break;
    }
  }

  const filename = laneFile ?? "lanes/generic.txt";
  return {
    content: loadPromptFile(filename),
    filename: filename,
  };
}

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
