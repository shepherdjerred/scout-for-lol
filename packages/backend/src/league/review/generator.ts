import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { match as matchPattern } from "ts-pattern";
import config from "../../configuration.js";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = dirname(FILENAME);
const PROMPTS_DIR = join(DIRNAME, "prompts");

// Lane context mapping
const LANE_CONTEXT_MAP: Record<string, string> = {
  top: "top.txt",
  middle: "middle.txt",
  jungle: "jungle.txt",
  adc: "adc.txt",
  support: "support.txt",
};

// Files to exclude from personality selection
const EXCLUDED_FILES = new Set([
  "base.txt",
  "generic.txt",
  "top.txt",
  "middle.txt",
  "jungle.txt",
  "adc.txt",
  "support.txt",
]);

/**
 * Load a prompt file from the prompts directory
 */
function loadPromptFile(filename: string): string {
  const filePath = join(PROMPTS_DIR, filename);
  return readFileSync(filePath, "utf-8").trim();
}

/**
 * Get list of personality files from the filesystem
 */
function getPersonalityFiles(): string[] {
  const files = readdirSync(PROMPTS_DIR);
  return files.filter((file) => file.endsWith(".txt") && !EXCLUDED_FILES.has(file));
}

/**
 * Select a random personality prompt
 */
function selectRandomPersonality(): { content: string; filename: string } {
  const personalityFiles = getPersonalityFiles();
  if (personalityFiles.length === 0) {
    throw new Error("No personality files found");
  }
  const randomIndex = Math.floor(Math.random() * personalityFiles.length);
  const selectedFile = personalityFiles[randomIndex];
  if (!selectedFile) {
    throw new Error("Failed to select personality file");
  }
  return {
    content: loadPromptFile(selectedFile),
    filename: selectedFile,
  };
}

/**
 * Get lane context based on player's lane
 */
function getLaneContext(lane: string | undefined): { content: string; filename: string } {
  const laneFile = lane ? LANE_CONTEXT_MAP[lane.toLowerCase()] : undefined;
  const filename = laneFile ?? "generic.txt";
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
    const personalityInfo = selectRandomPersonality();
    const basePromptTemplate = loadPromptFile("base.txt");

    console.log(`[generateAIReview] Selected personality: ${personalityInfo.filename}`);

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

    const systemPrompt = `${personalityInfo.content}\n\n${laneContextInfo.content}`;
    const playerName = matchData["playerName"];
    if (!playerName) {
      console.log("[generateAIReview] No player name found");
      return undefined;
    }

    // Construct user prompt from base template with match data appended
    const userPrompt = `${basePromptTemplate}
${JSON.stringify(matchData, null, 2)}`;

    console.log("[generateAIReview] Calling OpenAI API...");
    const completion = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 5000,
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
