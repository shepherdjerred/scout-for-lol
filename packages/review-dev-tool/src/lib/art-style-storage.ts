/**
 * Custom art style and theme storage in localStorage
 */
import { z } from "zod";

const STYLES_STORAGE_KEY = "review-dev-tool-custom-art-styles";
const THEMES_STORAGE_KEY = "review-dev-tool-custom-art-themes";

/**
 * Custom art style schema
 */
export const CustomArtStyleSchema = z.object({
  id: z.string(),
  description: z.string(), // The style description (same as name)
});

export type CustomArtStyle = z.infer<typeof CustomArtStyleSchema>;

/**
 * Custom art theme schema
 */
export const CustomArtThemeSchema = z.object({
  id: z.string(),
  description: z.string(), // The theme description (same as name)
});

export type CustomArtTheme = z.infer<typeof CustomArtThemeSchema>;

/**
 * Load custom art styles from localStorage
 */
export function loadCustomArtStyles(): CustomArtStyle[] {
  const stored = localStorage.getItem(STYLES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    const ArraySchema = CustomArtStyleSchema.array();
    const result = ArraySchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Save custom art styles to localStorage
 */
export function saveCustomArtStyles(styles: CustomArtStyle[]): void {
  localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(styles));
}

/**
 * Add a custom art style
 */
export function addCustomArtStyle(style: CustomArtStyle): void {
  const customs = loadCustomArtStyles();
  customs.push(style);
  saveCustomArtStyles(customs);
}

/**
 * Update a custom art style
 */
export function updateCustomArtStyle(id: string, style: CustomArtStyle): boolean {
  const customs = loadCustomArtStyles();
  const index = customs.findIndex((s) => s.id === id);

  if (index === -1) {
    return false;
  }

  customs[index] = style;
  saveCustomArtStyles(customs);
  return true;
}

/**
 * Delete a custom art style
 */
export function deleteCustomArtStyle(id: string): boolean {
  const customs = loadCustomArtStyles();
  const filtered = customs.filter((s) => s.id !== id);

  if (filtered.length === customs.length) {
    return false;
  }

  saveCustomArtStyles(filtered);
  return true;
}

/**
 * Check if an art style is custom (not built-in)
 */
export function isCustomArtStyle(id: string): boolean {
  const customs = loadCustomArtStyles();
  return customs.some((s) => s.id === id);
}

/**
 * Generate a unique ID for a new art style
 */
export function generateArtStyleId(description: string): string {
  // Use first few words for a readable slug
  const slug = description
    .split(" ")
    .slice(0, 3)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return `custom-style-${slug}-${Date.now().toString(36)}`;
}

/**
 * Load custom art themes from localStorage
 */
export function loadCustomArtThemes(): CustomArtTheme[] {
  const stored = localStorage.getItem(THEMES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    const ArraySchema = CustomArtThemeSchema.array();
    const result = ArraySchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Save custom art themes to localStorage
 */
export function saveCustomArtThemes(themes: CustomArtTheme[]): void {
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
}

/**
 * Add a custom art theme
 */
export function addCustomArtTheme(theme: CustomArtTheme): void {
  const customs = loadCustomArtThemes();
  customs.push(theme);
  saveCustomArtThemes(customs);
}

/**
 * Update a custom art theme
 */
export function updateCustomArtTheme(id: string, theme: CustomArtTheme): boolean {
  const customs = loadCustomArtThemes();
  const index = customs.findIndex((t) => t.id === id);

  if (index === -1) {
    return false;
  }

  customs[index] = theme;
  saveCustomArtThemes(customs);
  return true;
}

/**
 * Delete a custom art theme
 */
export function deleteCustomArtTheme(id: string): boolean {
  const customs = loadCustomArtThemes();
  const filtered = customs.filter((t) => t.id !== id);

  if (filtered.length === customs.length) {
    return false;
  }

  saveCustomArtThemes(filtered);
  return true;
}

/**
 * Check if an art theme is custom (not built-in)
 */
export function isCustomArtTheme(id: string): boolean {
  const customs = loadCustomArtThemes();
  return customs.some((t) => t.id === id);
}

/**
 * Generate a unique ID for a new art theme
 */
export function generateArtThemeId(description: string): string {
  // Use first few words for a readable slug
  const slug = description
    .split(" ")
    .slice(0, 3)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return `custom-theme-${slug}-${Date.now().toString(36)}`;
}
