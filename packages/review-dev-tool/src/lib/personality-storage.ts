/**
 * Custom personality storage in localStorage
 */
import type { Personality } from "../config/schema";
import { PersonalitySchema } from "../config/schema";

const STORAGE_KEY = "review-dev-tool-custom-personalities";

/**
 * Load custom personalities from localStorage
 */
export function loadCustomPersonalities(): Personality[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((p) => PersonalitySchema.parse(p));
  } catch {
    return [];
  }
}

/**
 * Save custom personalities to localStorage
 */
export function saveCustomPersonalities(personalities: Personality[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personalities));
}

/**
 * Add a custom personality
 */
export function addCustomPersonality(personality: Personality): void {
  const customs = loadCustomPersonalities();
  customs.push(personality);
  saveCustomPersonalities(customs);
}

/**
 * Update a custom personality
 */
export function updateCustomPersonality(id: string, personality: Personality): boolean {
  const customs = loadCustomPersonalities();
  const index = customs.findIndex((p) => p.id === id);

  if (index === -1) {
    return false;
  }

  customs[index] = personality;
  saveCustomPersonalities(customs);
  return true;
}

/**
 * Delete a custom personality
 */
export function deleteCustomPersonality(id: string): boolean {
  const customs = loadCustomPersonalities();
  const filtered = customs.filter((p) => p.id !== id);

  if (filtered.length === customs.length) {
    return false;
  }

  saveCustomPersonalities(filtered);
  return true;
}

/**
 * Check if a personality is custom (not built-in)
 */
export function isCustomPersonality(id: string): boolean {
  const customs = loadCustomPersonalities();
  return customs.some((p) => p.id === id);
}

/**
 * Generate a unique ID for a new personality
 */
export function generatePersonalityId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `custom-${slug}-${Date.now().toString(36)}`;
}
