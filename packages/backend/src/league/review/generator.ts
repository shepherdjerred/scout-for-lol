import type { ArenaMatch, CompletedMatch, Lane } from "@scout-for-lol/data";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { match as matchPattern } from "ts-pattern";
import { z } from "zod";
import config from "../../configuration.js";

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

type Personality = {
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

type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;

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
function loadPromptFile(filename: string): string {
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
function selectRandomPersonality(): Personality {
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
function loadPlayerMetadata(playerAlias: string): PlayerMetadata {
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
 * Replace template variables in the base prompt
 */
function replaceTemplateVariables(
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

/**
 * Get lane context based on player's lane
 */
function getLaneContext(lane: string | undefined): { content: string; filename: string } {
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
 * Initialize OpenAI client if API key is configured
 */
function getOpenAIClient(): OpenAI | undefined {
  if (!config.openaiApiKey) {
    return undefined;
  }
  return new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Generate an AI-powered review using OpenAI
 */
async function generateAIReview(match: CompletedMatch | ArenaMatch): Promise<string | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[generateAIReview] OpenAI API key not configured, skipping AI review");
    return undefined;
  }

  try {
    // Get personality and base prompt template
    const personality = selectRandomPersonality();
    const basePromptTemplate = loadPromptFile("base.txt");

    console.log(`[generateAIReview] Selected personality: ${personality.filename}`);

    // Build match data and lane context based on match type using ts-pattern
    const { matchData, lane } = matchPattern(match)
      .with({ queueType: "arena" }, (arenaMatch: ArenaMatch) => {
        const player = arenaMatch.players[0];
        if (!player) {
          throw new Error("No player data found");
        }

        const placement = player.placement;
        const kills = player.champion.kills;
        const deaths = player.champion.deaths;
        const assists = player.champion.assists;

        return {
          lane: undefined,
          matchData: {
            playerName: player.playerConfig.alias,
            champion: player.champion.championName,
            lane: "arena",
            outcome: `${placement.toString()}${getOrdinalSuffix(placement)} place`,
            kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
            queueType: arenaMatch.queueType,
            teammate: player.teammate.championName,
          },
        };
      })
      .otherwise((regularMatch: CompletedMatch) => {
        const player = regularMatch.players[0];
        if (!player) {
          throw new Error("No player data found");
        }

        const kills = player.champion.kills;
        const deaths = player.champion.deaths;
        const assists = player.champion.assists;

        const data: Record<string, string> = {
          playerName: player.playerConfig.alias,
          champion: player.champion.championName,
          lane: player.lane ?? "unknown",
          outcome: player.outcome,
          kda: `${kills.toString()}/${deaths.toString()}/${assists.toString()}`,
          queueType: regularMatch.queueType ?? "unknown",
        };

        // Add lane opponent if available
        if (player.laneOpponent) {
          data["laneOpponent"] = player.laneOpponent.championName;
        }

        return {
          lane: player.lane,
          matchData: data,
        };
      });

    const laneContextInfo = getLaneContext(lane);
    console.log(`[generateAIReview] Selected lane context: ${laneContextInfo.filename}`);

    const playerName = matchData["playerName"];
    if (!playerName) {
      console.log("[generateAIReview] No player name found");
      return undefined;
    }

    // Extract reviewer information from personality metadata
    const reviewerName = personality.metadata.name;
    const reviewerPersonality = personality.metadata.description;
    const reviewerFavoriteChampions = JSON.stringify(personality.metadata.favoriteChampions);
    const reviewerFavoriteLanes = JSON.stringify(personality.metadata.favoriteLanes);

    // Load player information from JSON
    const playerMeta = loadPlayerMetadata(playerName);
    const playerPersonality = playerMeta.description;
    const playerFavoriteChampions = JSON.stringify(playerMeta.favoriteChampions);
    const playerFavoriteLanes = JSON.stringify(playerMeta.favoriteLanes);

    // Match-specific information
    const playerChampion = matchData["champion"] ?? "unknown champion";
    const playerLane = matchData["lane"] ?? "unknown lane";
    const opponentChampion = matchData["laneOpponent"] ?? "an unknown opponent";
    const laneDescription = laneContextInfo.content;
    const matchReport = JSON.stringify(match, null, 2);

    // Replace all template variables
    const userPrompt = replaceTemplateVariables(basePromptTemplate, {
      reviewerName,
      reviewerPersonality,
      reviewerFavoriteChampions,
      reviewerFavoriteLanes,
      playerName,
      playerPersonality,
      playerFavoriteChampions,
      playerFavoriteLanes,
      playerChampion,
      playerLane,
      opponentChampion,
      laneDescription,
      matchReport,
    });

    // System prompt remains separate with personality instructions and lane context
    const systemPrompt = `${personality.instructions}\n\n${laneContextInfo.content}`;

    console.log("[generateAIReview] Calling OpenAI API...");
    const completion = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 25000,
    });

    const firstChoice = completion.choices[0];
    if (!firstChoice) {
      console.log("[generateAIReview] No choices returned from OpenAI");
      return undefined;
    }

    const review = firstChoice.message.content?.trim();
    if (!review) {
      console.log("[generateAIReview] No review content returned from OpenAI");
      return undefined;
    }

    console.log("[generateAIReview] Successfully generated AI review");
    return review;
  } catch (error) {
    console.error("[generateAIReview] Error generating AI review:", error);
    return undefined;
  }
}

/**
 * Generates a post-game review for a player's performance.
 *
 * This function analyzes the match data and generates a text review
 * that will be attached to the post-game report image.
 *
 * The ai_reviews_enabled flag should be checked by the caller (where server context is available)
 * before calling this function. This function will attempt to generate an AI review if the
 * OpenAI API key is configured, otherwise it will fall back to a placeholder review.
 *
 * @param match - The completed match data (regular or arena)
 * @returns A promise that resolves to a string containing the review text
 */
export async function generateMatchReview(match: CompletedMatch | ArenaMatch): Promise<string> {
  // Try to generate AI review
  const aiReview = await generateAIReview(match);

  // Fall back to placeholder if AI review generation failed or is not configured
  if (!aiReview) {
    console.log("[generateMatchReview] Falling back to placeholder review");
    return generatePlaceholderReview(match);
  }

  return aiReview;
}

/**
 * Generate a placeholder review (used when AI reviews are disabled or not yet implemented)
 */
function generatePlaceholderReview(match: CompletedMatch | ArenaMatch): string {
  if (match.queueType === "arena") {
    // Arena match review
    const player = match.players[0]; // Primary tracked player
    if (!player) {
      return "Unable to generate review: no player data found.";
    }

    const placementStr = player.placement.toString();
    return `[Placeholder Review] ${player.playerConfig.alias} finished in ${placementStr}${getOrdinalSuffix(player.placement)} place playing ${player.champion.championName} with ${player.teammate.championName}.`;
    // TODO: use ts-pattern for exhaustive match
  } else {
    // Regular match review
    const player = match.players[0]; // Primary tracked player
    if (!player) {
      return "Unable to generate review: no player data found.";
    }

    const outcome = player.outcome;
    const champion = player.champion;
    const killsStr = champion.kills.toString();
    const deathsStr = champion.deaths.toString();
    const assistsStr = champion.assists.toString();
    const kda = `${killsStr}/${deathsStr}/${assistsStr}`;
    const queueTypeStr = match.queueType ?? "unknown";

    return `[Placeholder Review] ${player.playerConfig.alias} played ${champion.championName} in ${queueTypeStr} and got a ${outcome} with a ${kda} KDA.`;
  }
}

/**
 * Helper function to get ordinal suffix for placement (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
