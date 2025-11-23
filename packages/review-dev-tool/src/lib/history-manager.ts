/**
 * Manages generation history in localStorage
 */
import type { GenerationResult } from "../config/schema";

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  result: GenerationResult;
  configSnapshot: {
    model: string;
    personality?: string;
    artStyle?: string;
    artTheme?: string;
  };
  status: "pending" | "complete" | "error";
  rating?: 1 | 2 | 3 | 4;
  notes?: string;
}

const STORAGE_KEY = "scout-review-history";
const MAX_HISTORY_ENTRIES = 50;

/**
 * Load all history entries from localStorage
 * Only completed and error entries are stored - pending entries are never persisted
 */
export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    // Convert timestamp strings back to Date objects
    const entries = parsed.map((entry) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    })) as HistoryEntry[];

    return entries;
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
}

/**
 * Create a new pending history entry (called when generation starts)
 * Returns the entry ID for later updating - NOT saved to localStorage yet
 */
export function createPendingEntry(_configSnapshot: HistoryEntry["configSnapshot"]): string {
  if (typeof window === "undefined") return "";

  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  console.log("[History] Created pending entry ID:", id, "(not persisted yet)");
  return id;
}

/**
 * Save a completed generation to history
 * This is the ONLY way entries get persisted to localStorage
 */
export function saveCompletedEntry(
  id: string,
  result: GenerationResult,
  configSnapshot: HistoryEntry["configSnapshot"],
): void {
  if (typeof window === "undefined") return;

  console.log("[History] Saving completed entry:", id);

  const entry: HistoryEntry = {
    id,
    timestamp: new Date(),
    result,
    configSnapshot,
    status: result.error ? "error" : "complete",
  };

  const history = loadHistory();

  // Check if entry already exists (shouldn't happen, but handle it)
  const existingIndex = history.findIndex((e) => e.id === id);
  if (existingIndex !== -1) {
    console.log("[History] Entry already exists, updating");
    history[existingIndex] = entry;
  } else {
    console.log("[History] Adding new entry");
    history.unshift(entry); // Add to beginning
  }

  // Limit history size
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);

  try {
    console.log("[History] Saving to localStorage");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log("[History] Successfully saved entry");
  } catch (error) {
    console.error("Failed to save to history:", error);
    // If localStorage is full, try removing old entries
    if (trimmed.length > 10) {
      const reduced = trimmed.slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
      } catch {
        console.error("Failed to save even after reducing history");
      }
    }
  }
}

/**
 * Save a new generation to history (legacy - kept for compatibility)
 * @deprecated Use createPendingEntry and saveCompletedEntry instead
 */
export function saveToHistory(result: GenerationResult, configSnapshot: HistoryEntry["configSnapshot"]): string {
  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  saveCompletedEntry(id, result, configSnapshot);
  return id;
}

/**
 * Delete a specific history entry
 */
export function deleteHistoryEntry(id: string): void {
  if (typeof window === "undefined") return;

  const history = loadHistory();
  const filtered = history.filter((entry) => entry.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete history entry:", error);
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

/**
 * Get a specific history entry by ID
 */
export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return loadHistory().find((entry) => entry.id === id);
}

/**
 * Update rating for a history entry
 */
export function updateHistoryRating(id: string, rating: 1 | 2 | 3 | 4, notes?: string): void {
  if (typeof window === "undefined") return;

  const history = loadHistory();
  const entry = history.find((e) => e.id === id);

  if (!entry) {
    console.warn(`History entry ${id} not found`);
    return;
  }

  entry.rating = rating;
  if (notes !== undefined) {
    entry.notes = notes;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to update rating:", error);
  }
}
