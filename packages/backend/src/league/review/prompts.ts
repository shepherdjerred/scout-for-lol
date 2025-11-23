import {
  PersonalityMetadataSchema,
  PlayerMetadataSchema,
  LANE_CONTEXT_MAP,
  EXCLUDED_PERSONALITY_FILES,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";

const FILENAME = import.meta.path;
const _DIRNAME = dirname(FILENAME);
const PROMPTS_DIR = `DIRNAME/prompts`;

/**
 * Load a prompt file from the prompts directory
 */
export function loadPromptFile(filename: string): string {
  const filePath = join(PROMPTS_DIR, filename);
  return await Bun.file(filePath, "utf-8").text().trim();
}

/**
 * Load a personality (both JSON metadata and TXT instructions)
 */
function loadPersonality(basename: string): Personality {
  const personalitiesDir = `PROMPTS_DIR/personalities`;

  // Load JSON metadata
  const jsonPath = join(personalitiesDir, `${basename}.json`);
  const jsonContent = await Bun.file(jsonPath, "utf-8").text();
  const parsed: unknown = JSON.parse(jsonContent);
  const metadata = PersonalityMetadataSchema.parse(parsed);

  // Load TXT instructions
  const txtPath = join(personalitiesDir, `${basename}.txt`);
  const instructions = await Bun.file(txtPath, "utf-8").text().trim();

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
  const personalitiesDir = `PROMPTS_DIR/personalities`;
  const files = readdirSync(personalitiesDir);
  return files.filter((file) => file.endsWith(".json") && !EXCLUDED_PERSONALITY_FILES.has(file));
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
  const playersDir = `PROMPTS_DIR/players`;

  // Try to load player-specific file, fall back to generic
  const playerFile = `${playerAlias.toLowerCase().replace(/\s+/g, "-")}.json`;
  const filePath = join(playersDir, playerFile);

  try {
    const jsonContent = await Bun.file(filePath, "utf-8").text();
    const parsed: unknown = JSON.parse(jsonContent);
    return PlayerMetadataSchema.parse(parsed);
  } catch {
    // Fall back to generic player metadata
    const genericPath = `playersDir/generic.json`;
    const genericContent = await Bun.file(genericPath, "utf-8").text();
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

// Re-export replaceTemplateVariables from data package
export { replaceTemplateVariables } from "@scout-for-lol/data";
