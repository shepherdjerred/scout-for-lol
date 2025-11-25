import {
  PersonalityMetadataSchema,
  PlayerMetadataSchema,
  LANE_CONTEXT_MAP,
  EXCLUDED_PERSONALITY_FILES,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";

// Resolve the prompts directory from the data package
// import.meta.resolve returns a file:// URL, so we extract the pathname
function getPromptsDir(): string {
  // In a Bun workspace, we can resolve the data package and navigate to prompts
  // This will be resolved at runtime when the function is called
  const dataPackageUrl = import.meta.resolve("@scout-for-lol/data");
  const url = new URL(dataPackageUrl);
  // Navigate from data/src/index.ts to data/src/review/prompts
  return url.pathname.replace(/\/src\/index\.ts$/, "/src/review/prompts");
}

const PROMPTS_DIR = getPromptsDir();

/**
 * Load a prompt file from the prompts directory
 */
export async function loadPromptFile(filename: string): Promise<string> {
  const filePath = `${PROMPTS_DIR}/${filename}`;
  const text = await Bun.file(filePath).text();
  return text.trim();
}

/**
 * Load a personality (both JSON metadata and TXT instructions)
 */
async function loadPersonality(basename: string): Promise<Personality> {
  const personalitiesDir = `${PROMPTS_DIR}/personalities`;

  // Load JSON metadata
  const jsonPath = `${personalitiesDir}/${basename}.json`;
  const jsonContent = await Bun.file(jsonPath).text();
  const parsed: unknown = JSON.parse(jsonContent);
  const metadata = PersonalityMetadataSchema.parse(parsed);

  // Load TXT instructions
  const txtPath = `${personalitiesDir}/${basename}.txt`;
  const instructionsText = await Bun.file(txtPath).text();
  const instructions = instructionsText.trim();

  return {
    metadata,
    instructions,
    filename: basename,
  };
}

/**
 * Get list of personality files from the filesystem
 */
async function getPersonalityFiles(): Promise<string[]> {
  const personalitiesDir = `${PROMPTS_DIR}/personalities`;

  // Check if directory exists before scanning by trying to access it
  // We'll catch the error during glob.scan if it doesn't exist

  const glob = new Bun.Glob("*.json");
  const files: string[] = [];

  try {
    for await (const file of glob.scan({ cwd: personalitiesDir })) {
      if (!EXCLUDED_PERSONALITY_FILES.has(file)) {
        files.push(file);
      }
    }
  } catch (error) {
    // Handle case where directory might not be accessible during scan
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[getPersonalityFiles] Error scanning personalities directory: ${errorMessage}`);
    return [];
  }

  return files;
}

/**
 * Select a random personality prompt
 */
export async function selectRandomPersonality(): Promise<Personality> {
  const personalityFiles = await getPersonalityFiles();
  if (personalityFiles.length === 0) {
    const personalitiesDir = `${PROMPTS_DIR}/personalities`;
    throw new Error(
      `No personality files found in ${personalitiesDir}. ` +
        "Ensure the personalities directory exists and contains .json files.",
    );
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
export async function loadPlayerMetadata(playerAlias: string): Promise<PlayerMetadata> {
  const playersDir = `${PROMPTS_DIR}/players`;

  // Try to load player-specific file, fall back to generic
  const playerFile = `${playerAlias.toLowerCase().replace(/\s+/g, "-")}.json`;
  const filePath = `${playersDir}/${playerFile}`;

  try {
    const jsonContent = await Bun.file(filePath).text();
    const parsed: unknown = JSON.parse(jsonContent);
    return PlayerMetadataSchema.parse(parsed);
  } catch {
    // Fall back to generic player metadata
    const genericPath = `${playersDir}/generic.json`;
    const genericContent = await Bun.file(genericPath).text();
    const parsed: unknown = JSON.parse(genericContent);
    return PlayerMetadataSchema.parse(parsed);
  }
}

/**
 * Get lane context based on player's lane
 */
export async function getLaneContext(lane: string | undefined): Promise<{ content: string; filename: string }> {
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
  const content = await loadPromptFile(filename);
  return {
    content,
    filename,
  };
}
