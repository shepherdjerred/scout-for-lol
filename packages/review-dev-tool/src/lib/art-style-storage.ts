/**
 * Custom art style and theme storage in IndexedDB
 */
import { z } from "zod";
import { STORES, getAllItems, putItem, deleteItem } from "@scout-for-lol/review-dev-tool/lib/storage";

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
 * Load custom art styles from IndexedDB
 */
export async function loadCustomArtStyles(): Promise<CustomArtStyle[]> {
  try {
    const stored = await getAllItems(STORES.ART_STYLES);
    const ArraySchema = CustomArtStyleSchema.array();
    const result = ArraySchema.safeParse(stored);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Save custom art styles to IndexedDB
 */
export async function saveCustomArtStyles(styles: CustomArtStyle[]): Promise<void> {
  // This function is kept for compatibility but not used anymore
  // Individual operations (add/update/delete) are preferred
  for (const style of styles) {
    await putItem(STORES.ART_STYLES, style);
  }
}

/**
 * Add a custom art style
 */
export async function addCustomArtStyle(style: CustomArtStyle): Promise<void> {
  await putItem(STORES.ART_STYLES, style);
}

/**
 * Update a custom art style
 */
export async function updateCustomArtStyle(style: CustomArtStyle): Promise<boolean> {
  return await putItem(STORES.ART_STYLES, style);
}

/**
 * Delete a custom art style
 */
export async function deleteCustomArtStyle(id: string): Promise<boolean> {
  return await deleteItem(STORES.ART_STYLES, id);
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
 * Load custom art themes from IndexedDB
 */
export async function loadCustomArtThemes(): Promise<CustomArtTheme[]> {
  try {
    const stored = await getAllItems(STORES.ART_THEMES);
    const ArraySchema = CustomArtThemeSchema.array();
    const result = ArraySchema.safeParse(stored);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Save custom art themes to IndexedDB
 */
export async function saveCustomArtThemes(themes: CustomArtTheme[]): Promise<void> {
  // This function is kept for compatibility but not used anymore
  // Individual operations (add/update/delete) are preferred
  for (const theme of themes) {
    await putItem(STORES.ART_THEMES, theme);
  }
}

/**
 * Add a custom art theme
 */
export async function addCustomArtTheme(theme: CustomArtTheme): Promise<void> {
  await putItem(STORES.ART_THEMES, theme);
}

/**
 * Update a custom art theme
 */
export async function updateCustomArtTheme(theme: CustomArtTheme): Promise<boolean> {
  return await putItem(STORES.ART_THEMES, theme);
}

/**
 * Delete a custom art theme
 */
export async function deleteCustomArtTheme(id: string): Promise<boolean> {
  return await deleteItem(STORES.ART_THEMES, id);
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
