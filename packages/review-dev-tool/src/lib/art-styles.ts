/**
 * Art style selection utilities
 */
import { ART_STYLES, ART_THEMES } from "@scout-for-lol/data";
import { loadCustomArtStyles, loadCustomArtThemes } from "@scout-for-lol/review-dev-tool/lib/art-style-storage";

/**
 * Styles that may not work well with character-specific themes
 */
const ABSTRACT_STYLES = [
  "Glitch art with digital corruption, chromatic aberration, and databending effects",
  "Aboriginal dot painting with symbolic patterns, earth tones, and dreamtime storytelling",
  "Chinese ink wash painting with flowing brushwork, misty atmosphere, and calligraphic elegance",
];

/**
 * Themes that are very specific and may clash with abstract styles
 */
const SPECIFIC_CHARACTER_THEMES = [
  "Among Us crewmates with emergency meeting energy and sus vibes",
  "Doge/Shiba Inu meme with wholesome derp energy",
];

/**
 * Check if a style-theme combination is incompatible
 */
function isIncompatible(style: string, theme: string): boolean {
  // Abstract styles don't work well with very specific character themes
  if (ABSTRACT_STYLES.includes(style) && SPECIFIC_CHARACTER_THEMES.includes(theme)) {
    return true;
  }

  return false;
}

/**
 * Select a random style from the styles array
 */
function selectRandomStyle(): string {
  const randomIndex = Math.floor(Math.random() * ART_STYLES.length);
  const style = ART_STYLES[randomIndex];
  if (!style) {
    throw new Error("Failed to select art style");
  }
  return style.description;
}

/**
 * Select a random theme from the themes array
 */
function selectRandomTheme(): string {
  const randomIndex = Math.floor(Math.random() * ART_THEMES.length);
  const theme = ART_THEMES[randomIndex];
  if (!theme) {
    throw new Error("Failed to select art theme");
  }
  return theme.description;
}

/**
 * Select a random style-theme pair (simplified - just pick random for now)
 */
function selectRandomPair(): { style: string; theme: string } {
  // For simplicity, just pick random style and theme
  // The backend has more sophisticated category-based matching
  return {
    style: selectRandomStyle(),
    theme: selectRandomTheme(),
  };
}

/**
 * Select a random style and theme combination with weighted probability
 */
export function selectRandomStyleAndTheme(
  useMatchingPairs = true,
  matchingPairProbability = 0.7,
): { style: string; theme: string } {
  if (!useMatchingPairs) {
    // Always use random combination if matching pairs disabled
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const style = selectRandomStyle();
      const theme = selectRandomTheme();

      if (!isIncompatible(style, theme)) {
        return { style, theme };
      }

      attempts++;
    }

    // Fall back to matching pair if we can't find compatible combo
    return selectRandomPair();
  }

  const useMatchingPair = Math.random() < matchingPairProbability;

  if (useMatchingPair) {
    return selectRandomPair();
  } else {
    // Random combination
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const style = selectRandomStyle();
      const theme = selectRandomTheme();

      if (!isIncompatible(style, theme)) {
        return { style, theme };
      }

      attempts++;
    }

    // Fall back to matching pair
    return selectRandomPair();
  }
}

/**
 * Get all available art styles (built-in + custom)
 */
export function getAllArtStyles(): string[] {
  const customStyles = loadCustomArtStyles();
  return [...ART_STYLES.map((s) => s.description), ...customStyles.map((s) => s.description)];
}

/**
 * Get all available art themes (built-in + custom)
 */
export function getAllArtThemes(): string[] {
  const customThemes = loadCustomArtThemes();
  return [...ART_THEMES.map((t) => t.description), ...customThemes.map((t) => t.description)];
}

/**
 * Get all style-theme pairs (for gallery display)
 * Note: This creates simple pairs from the categorized data
 */
export function getAllStyleThemePairs(): { style: string; theme: string }[] {
  // Create some example pairs by matching styles and themes
  // For simplicity, just pair first few styles with first few themes
  const pairs: { style: string; theme: string }[] = [];
  const maxPairs = Math.min(ART_STYLES.length, ART_THEMES.length, 50);

  for (let i = 0; i < maxPairs; i++) {
    const style = ART_STYLES[i];
    const theme = ART_THEMES[i];
    if (style && theme) {
      pairs.push({
        style: style.description,
        theme: theme.description,
      });
    }
  }

  return pairs;
}
