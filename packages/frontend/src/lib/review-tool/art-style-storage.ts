/**
 * Custom art style storage in IndexedDB
 */
import { z } from "zod";
import { STORES, getAllItems, putItem, deleteItem } from "./storage.ts";

/**
 * Custom art style schema
 */
export const CustomArtStyleSchema = z.object({
  id: z.string(),
  description: z.string(), // The style description (same as name)
});

export type CustomArtStyle = z.infer<typeof CustomArtStyleSchema>;

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
