/**
 * Reset tool settings to defaults while preserving API keys, cache, and cost data
 */
import { z } from "zod";
import { clearAllEntries } from "./indexeddb";

/**
 * Reset all settings to defaults while preserving:
 * - API keys (in global config)
 * - Cloudflare cache
 * - Cost data
 *
 * Clears:
 * - Saved configurations
 * - Current config
 * - Generation history (IndexedDB + localStorage)
 * - Custom personalities
 * - Custom art styles
 * - Custom art themes
 * - AI review ratings
 */
export async function resetToDefaults(): Promise<void> {
  const keysToRemove = [
    // Config storage
    "review-dev-tool-configs",
    "review-dev-tool-current",
    // History (old localStorage, kept for migration cleanup)
    "scout-review-history",
    // Custom content
    "review-dev-tool-custom-personalities",
    "review-dev-tool-custom-art-styles",
    "review-dev-tool-custom-art-themes",
    // AI review ratings (from report-ui package)
    "ai-review-ratings",
  ];

  try {
    // Clear localStorage
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    // Clear IndexedDB history
    await clearAllEntries();
  } catch (error) {
    console.error("Error resetting to defaults:", error);
    throw error;
  }
}

/**
 * Check which items would be cleared by reset
 * @returns Object with counts of items that would be cleared
 */
export async function getResetPreview(): Promise<{
  configs: number;
  historyEntries: number;
  customPersonalities: number;
  customArtStyles: number;
  customArtThemes: number;
  reviewRatings: number;
}> {
  const getCount = (key: string): number => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return 0;
      const parsed = JSON.parse(stored) as unknown;
      const ArraySchema = z.array(z.unknown());
      const result = ArraySchema.safeParse(parsed);
      return result.success ? result.data.length : 1;
    } catch {
      return 0;
    }
  };

  try {
    // Get IndexedDB history count
    const { getEntryCount } = await import("./indexeddb");
    const historyEntries = await getEntryCount().catch(() => 0);

    return {
      configs: getCount("review-dev-tool-configs"),
      historyEntries,
      customPersonalities: getCount("review-dev-tool-custom-personalities"),
      customArtStyles: getCount("review-dev-tool-custom-art-styles"),
      customArtThemes: getCount("review-dev-tool-custom-art-themes"),
      reviewRatings: getCount("ai-review-ratings"),
    };
  } catch {
    // Return zeros if not in browser environment
    return {
      configs: 0,
      historyEntries: 0,
      customPersonalities: 0,
      customArtStyles: 0,
      customArtThemes: 0,
      reviewRatings: 0,
    };
  }
}
