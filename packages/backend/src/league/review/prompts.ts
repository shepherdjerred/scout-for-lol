import {
  PersonalityMetadataSchema,
  PlayerMetadataSchema,
  LANE_CONTEXT_MAP,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";
import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * In-memory state tracking for balanced reviewer selection.
 * Tracks how many times each reviewer has been selected to ensure
 * fair distribution across all available reviewers.
 */
const reviewerUsageCount: Map<string, number> = new Map();

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
 * Discover all available personality basenames in the personalities directory.
 * A personality is available if it has both a .json and .txt file.
 * Excludes "generic" from the list as it's not meant for random selection.
 */
async function discoverAvailablePersonalities(): Promise<string[]> {
  const personalitiesDir = `${PROMPTS_DIR}/personalities`;
  const files = await readdir(personalitiesDir);

  // Group files by basename (without extension)
  const filesByBasename = new Map<string, Set<string>>();
  for (const file of files) {
    const ext = path.extname(file);
    if (ext === ".json" || ext === ".txt") {
      const basename = path.basename(file, ext);
      const existing = filesByBasename.get(basename) ?? new Set();
      existing.add(ext);
      filesByBasename.set(basename, existing);
    }
  }

  // Filter to only include personalities with both .json and .txt files
  // Exclude "generic" as it's not meant for random selection
  const availablePersonalities: string[] = [];
  for (const [basename, extensions] of filesByBasename) {
    if (basename !== "generic" && extensions.has(".json") && extensions.has(".txt")) {
      availablePersonalities.push(basename);
    }
  }

  return availablePersonalities.sort();
}

/**
 * Select a personality using a balanced pseudo-random algorithm.
 * Prioritizes reviewers who have been selected fewer times to ensure
 * fair distribution across all available reviewers.
 */
function selectBalancedReviewer(availablePersonalities: string[]): string {
  if (availablePersonalities.length === 0) {
    throw new Error("No personalities available for selection");
  }

  // Initialize usage counts for new personalities
  for (const personality of availablePersonalities) {
    if (!reviewerUsageCount.has(personality)) {
      reviewerUsageCount.set(personality, 0);
    }
  }

  // Find the minimum usage count among available personalities
  const usageCounts = availablePersonalities.map((p) => reviewerUsageCount.get(p) ?? 0);
  const minUsage = Math.min(...usageCounts);

  // Get all personalities that have the minimum usage count
  const leastUsedPersonalities = availablePersonalities.filter(
    (p) => (reviewerUsageCount.get(p) ?? 0) === minUsage
  );

  // Randomly select from the least used personalities
  const randomIndex = Math.floor(Math.random() * leastUsedPersonalities.length);
  const selected = leastUsedPersonalities[randomIndex];

  if (!selected) {
    throw new Error("Failed to select personality from least used pool");
  }

  // Increment the usage count for the selected personality
  reviewerUsageCount.set(selected, (reviewerUsageCount.get(selected) ?? 0) + 1);

  return selected;
}

/**
 * Select a random personality prompt using balanced pseudo-random selection.
 * All reviewers with both .json and .txt files are included in the pool.
 * The algorithm ensures no reviewer is selected too often or too seldom.
 */
export async function selectRandomPersonality(): Promise<Personality> {
  const availablePersonalities = await discoverAvailablePersonalities();
  const selectedBasename = selectBalancedReviewer(availablePersonalities);

  console.log(
    `[selectRandomPersonality] Selected: ${selectedBasename}, ` +
      `usage counts: ${JSON.stringify(Object.fromEntries(reviewerUsageCount))}`
  );

  return loadPersonality(selectedBasename);
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
