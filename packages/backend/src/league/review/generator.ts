import type { ArenaMatch, CompletedMatch } from "@scout-for-lol/data";

/**
 * Generates a post-game review for a player's performance.
 *
 * This function analyzes the match data and generates a text review
 * that will be attached to the post-game report image.
 *
 * TODO: AI-generated reviews will be implemented here in the future.
 * The ai_reviews_enabled flag should be checked by the caller (where server context is available)
 * before calling this function.
 *
 * @param match - The completed match data (regular or arena)
 * @returns A string containing the review text
 */
export function generateMatchReview(match: CompletedMatch | ArenaMatch): string {
  // TODO: Integrate with LLM service for AI-generated reviews
  // For now, always return placeholder review
  return generatePlaceholderReview(match);
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
