import {
  PersonalityMetadataSchema,
  PlayerMetadataSchema,
  LANE_CONTEXT_MAP,
  type Personality,
  type PlayerMetadata,
} from "@scout-for-lol/data";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("review-prompts");

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

// Resolve the analysis style card directory (packages/analysis/llm-out)
function getStyleCardsDir(): string {
  const dataPackageUrl = import.meta.resolve("@scout-for-lol/data");
  const url = new URL(dataPackageUrl);
  // Navigate from data/src/index.ts -> packages/data/src/review/prompts/style-cards
  return url.pathname.replace(/\/src\/index\.ts$/, "/src/review/prompts/style-cards");
}

const PROMPTS_DIR = getPromptsDir();
const STYLECARDS_DIR = getStyleCardsDir();
const EXCLUDED = new Set(["generic.json"]);

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

  // Load a matching style card from analysis/llm-out (required)
  const normalizedBasename = basename.toLowerCase();
  const normalizedDisplayName = metadata.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const styleCardCandidates = Array.from(new Set([normalizedBasename, normalizedDisplayName]));

  let styleCard: string | undefined;
  for (const candidate of styleCardCandidates) {
    const stylePath = `${STYLECARDS_DIR}/${candidate}_style.json`;
    const styleFile = Bun.file(stylePath);
    if (await styleFile.exists()) {
      styleCard = (await styleFile.text()).trim();
      break;
    }
  }

  if (!styleCard) {
    throw new Error(
      `Missing required style card for personality "${basename}". Expected one of: ${styleCardCandidates.map((c) => `${c}_style.json`).join(", ")}`,
    );
  }

  return {
    metadata,
    instructions,
    styleCard,
    filename: basename,
  };
}

/**
 * Select a random personality prompt
 * Note: Currently hardcoded to always return "aaron" personality
 */
export async function selectRandomPersonality(): Promise<Personality> {
  const personalities = await listValidPersonalities();
  const pick = personalities[Math.floor(Math.random() * personalities.length)];
  if (!pick) {
    throw new Error("No personalities available with complete data.");
  }
  return pick;
}

let cachedPersonalities: Personality[] | null = null;

async function listValidPersonalities(): Promise<Personality[]> {
  if (cachedPersonalities) {
    return cachedPersonalities;
  }

  const personalitiesDir = `${PROMPTS_DIR}/personalities`;
  const glob = new Bun.Glob("*.json");
  const basenames: string[] = [];
  for await (const file of glob.scan(personalitiesDir)) {
    const name = file.replace(/\.json$/, "");
    if (!EXCLUDED.has(`${name}.json`)) {
      basenames.push(name);
    }
  }

  const valid: Personality[] = [];
  const discarded: string[] = [];

  for (const base of basenames) {
    try {
      const personality = await loadPersonality(base);
      valid.push(personality);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      discarded.push(`${base} (${reason})`);
    }
  }

  if (discarded.length > 0) {
    logger.warn(`[ai-review] Discarded personalities due to incomplete data: ${discarded.join("; ")}`);
  }

  if (valid.length === 0) {
    throw new Error("No personalities with complete data (metadata + instructions + style card).");
  }

  cachedPersonalities = valid;
  return valid;
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
