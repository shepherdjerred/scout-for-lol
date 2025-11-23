/**
 * Art styles and themes for AI-generated review images
 *
 * Styles = Visual aesthetics (how it looks)
 * Themes = Subject matter (what's depicted)
 * Matching via categories creates natural combinations
 */

import {
  ART_STYLES,
  ART_THEMES,
  CATEGORY_COMPATIBILITY,
  type ArtStyle,
  type ArtTheme,
  type StyleCategory,
  type ThemeCategory,
} from "./art-styles-data.js";

/**
 * Selection result - can have one or two themes
 */
export type StyleThemeSelection = {
  style: string;
  themes: string[]; // Usually 1, but can be 2 for mashups
};

/**
 * Select a random style from the styles array
 */
function selectRandomStyle(): ArtStyle {
  const randomIndex = Math.floor(Math.random() * ART_STYLES.length);
  const style = ART_STYLES[randomIndex];
  if (!style) {
    throw new Error("Failed to select art style");
  }
  return style;
}

/**
 * Select a random theme from the themes array
 */
function selectRandomTheme(): ArtTheme {
  const randomIndex = Math.floor(Math.random() * ART_THEMES.length);
  const theme = ART_THEMES[randomIndex];
  if (!theme) {
    throw new Error("Failed to select art theme");
  }
  return theme;
}

/**
 * Check if a style category is compatible with a theme category
 */
function areCompatible(styleCategory: StyleCategory, themeCategory: ThemeCategory): boolean {
  const compatible = CATEGORY_COMPATIBILITY[styleCategory];
  return compatible.includes(themeCategory);
}

/**
 * Select a matching style and theme (same category)
 */
function selectMatchingPair(): { style: ArtStyle; theme: ArtTheme } {
  // Pick a random style first
  const style = selectRandomStyle();

  // Find themes that share at least one category with the style
  const compatibleThemes = ART_THEMES.filter((theme) =>
    style.categories.some((styleCat) => theme.categories.some((themeCat) => areCompatible(styleCat, themeCat))),
  );

  // If we have compatible themes, pick one; otherwise fall back to random
  if (compatibleThemes.length > 0) {
    const randomIndex = Math.floor(Math.random() * compatibleThemes.length);
    const theme = compatibleThemes[randomIndex];
    if (!theme) {
      // Shouldn't happen, but fallback
      return { style, theme: selectRandomTheme() };
    }
    return { style, theme };
  }

  // No compatible themes found, just pick random
  return { style, theme: selectRandomTheme() };
}

/**
 * Select a mashup: one style with TWO themes
 */
function selectMashup(): { style: ArtStyle; themes: [ArtTheme, ArtTheme] } {
  const style = selectRandomStyle();

  // Pick two different themes
  const firstTheme = selectRandomTheme();
  let secondTheme = selectRandomTheme();

  // Make sure they're different (try a few times)
  let attempts = 0;
  while (secondTheme.description === firstTheme.description && attempts < 10) {
    secondTheme = selectRandomTheme();
    attempts++;
  }

  return { style, themes: [firstTheme, secondTheme] };
}

/**
 * Select a random style and theme combination with weighted probability
 * 65% chance of matching pair (same category)
 * 25% chance of random mix (different categories)
 * 10% chance of mashup (two themes)
 */
export function selectRandomStyleAndTheme(): StyleThemeSelection {
  const roll = Math.random();

  if (roll < 0.65) {
    // 65% - Matching pair
    const { style, theme } = selectMatchingPair();
    return {
      style: style.description,
      themes: [theme.description],
    };
  } else if (roll < 0.9) {
    // 25% - Random mix
    const style = selectRandomStyle();
    const theme = selectRandomTheme();
    return {
      style: style.description,
      themes: [theme.description],
    };
  } else {
    // 10% - Mashup (two themes)
    const { style, themes } = selectMashup();
    return {
      style: style.description,
      themes: themes.map((t) => t.description),
    };
  }
}

/**
 * @deprecated Use selectRandomStyleAndTheme() instead for better style/theme separation
 *
 * Randomly select an art style for image generation (legacy function)
 */
export function selectRandomArtStyle(): string {
  const selection = selectRandomStyleAndTheme();
  if (selection.themes.length === 1) {
    const theme = selection.themes[0];
    return `${selection.style}. Theme: ${theme ?? "unknown"}`;
  } else {
    return `${selection.style}. Themes: ${selection.themes.join(" meets ")}`;
  }
}
