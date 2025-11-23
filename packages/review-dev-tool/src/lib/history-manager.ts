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
 * Automatically prunes incomplete/pending entries (they can't be recovered)
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

    // Filter out pending entries (they're unrecoverable after reload)
    const completedEntries = entries.filter((entry) => entry.status !== "pending");

    // Save back if we removed any pending entries
    if (completedEntries.length !== entries.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedEntries));
      } catch (error) {
        console.error("Failed to save pruned history:", error);
      }
    }

    return completedEntries;
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
}

/**
 * Create a new pending history entry (called when generation starts)
 */
export function createPendingEntry(configSnapshot: HistoryEntry["configSnapshot"]): string {
  if (typeof window === "undefined") return "";

  const entry: HistoryEntry = {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    result: {
      text: "",
      metadata: {
        textDurationMs: 0,
        imageGenerated: false,
      },
    },
    configSnapshot,
    status: "pending",
  };

  const history = loadHistory();
  history.unshift(entry); // Add to beginning

  // Limit history size
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return entry.id;
  } catch (error) {
    console.error("Failed to save to history:", error);
    // If localStorage is full, try removing old entries
    if (history.length > 10) {
      const reduced = history.slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        return entry.id;
      } catch {
        console.error("Failed to save even after reducing history");
      }
    }
    return "";
  }
}

/**
 * Update an existing history entry with results
 */
export function updateHistoryEntry(
  id: string,
  result: GenerationResult,
  additionalConfig?: Partial<HistoryEntry["configSnapshot"]>,
): void {
  if (typeof window === "undefined") return;

  const history = loadHistory();
  const entryIndex = history.findIndex((entry) => entry.id === id);

  if (entryIndex === -1) {
    console.warn(`History entry ${id} not found`);
    return;
  }

  const entry = history[entryIndex];
  if (!entry) return;

  // Update the entry
  entry.result = result;
  entry.status = result.error ? "error" : "complete";

  // Update config snapshot with additional info (e.g., personality, art style)
  if (additionalConfig) {
    entry.configSnapshot = {
      ...entry.configSnapshot,
      ...additionalConfig,
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to update history entry:", error);
  }
}

/**
 * Save a new generation to history (legacy - kept for compatibility)
 * @deprecated Use createPendingEntry and updateHistoryEntry instead
 */
export function saveToHistory(result: GenerationResult, configSnapshot: HistoryEntry["configSnapshot"]): string {
  if (typeof window === "undefined") return "";

  const entry: HistoryEntry = {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
    result,
    configSnapshot,
    status: result.error ? "error" : "complete",
  };

  const history = loadHistory();
  history.unshift(entry); // Add to beginning

  // Limit history size
  const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return entry.id;
  } catch (error) {
    console.error("Failed to save to history:", error);
    // If localStorage is full, try removing old entries
    if (history.length > 10) {
      const reduced = history.slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        return entry.id;
      } catch {
        console.error("Failed to save even after reducing history");
      }
    }
    return "";
  }
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
  const entryIndex = history.findIndex((entry) => entry.id === id);

  if (entryIndex === -1) {
    console.warn(`History entry ${id} not found`);
    return;
  }

  const entry = history[entryIndex];
  if (!entry) return;

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
