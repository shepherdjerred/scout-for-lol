/**
 * Manages generation history in IndexedDB (supports large images)
 */
import { z } from "zod";
import type { GenerationResult } from "@scout-for-lol/review-dev-tool/config/schema";
import * as db from "@scout-for-lol/review-dev-tool/lib/indexeddb";

// Zod schemas for validation - using passthrough to preserve all fields
// Note: We use `.optional()` which produces `T | undefined`, matching the exact optional properties
const GenerationResultSchema = z
  .object({
    text: z.string(),
    image: z.string().optional(),
    metadata: z.unknown(),
    error: z.string().optional(),
  })
  .passthrough();

const ConfigSnapshotSchema = z
  .object({
    model: z.string(),
    personality: z.string().optional(),
    artStyle: z.string().optional(),
    artTheme: z.string().optional(),
  })
  .passthrough();

export type HistoryEntry = {
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
};

const STORAGE_KEY = "scout-review-history"; // For localStorage migration
const MAX_HISTORY_ENTRIES = 50;

/**
 * Migrate old localStorage data to IndexedDB (one-time migration)
 */
async function migrateFromLocalStorage(): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    } // Nothing to migrate

    const parsed: unknown = JSON.parse(stored);

    // Validate array structure with Zod
    const MigrationEntrySchema = z.object({
      id: z.string(),
      timestamp: z.union([z.string(), z.date()]),
      result: z.unknown(),
      configSnapshot: z.unknown(),
      status: z.enum(["pending", "complete", "error"]),
      rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
      notes: z.string().optional(),
    });

    const arrayResult = z.array(MigrationEntrySchema).safeParse(parsed);
    if (!arrayResult.success || arrayResult.data.length === 0) {
      return;
    }

    console.log("[History] Migrating", arrayResult.data.length.toString(), "entries from localStorage to IndexedDB");

    // Save each entry to IndexedDB
    for (const entry of arrayResult.data) {
      const resultValidation = GenerationResultSchema.safeParse(entry.result);
      const configValidation = ConfigSnapshotSchema.safeParse(entry.configSnapshot);

      if (!resultValidation.success || !configValidation.success) {
        console.warn("[History] Skipping invalid entry during migration:", entry.id);
        continue;
      }

      // Validated with Zod but need to cast for compatibility
      const historyEntry: HistoryEntry = {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        result: resultValidation.data,
        configSnapshot: configValidation.data,
        status: entry.status,
        ...(entry.rating !== undefined && { rating: entry.rating }),
        ...(entry.notes !== undefined && { notes: entry.notes }),
      };
      await db.saveEntry(historyEntry);
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEY);
    console.log("[History] Migration complete");
  } catch (error) {
    console.error("Failed to migrate from localStorage:", error);
  }
}

/**
 * Load all history entries from IndexedDB
 * Only completed and error entries are stored - pending entries are never persisted
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    // Check if migration is needed (only on first load)
    const count = await db.getEntryCount();
    if (count === 0) {
      await migrateFromLocalStorage();
    }

    const entries = await db.getAllEntries();
    // Convert to HistoryEntry type (IndexedDB stores Date objects correctly)
    const validEntries: HistoryEntry[] = [];
    for (const entry of entries) {
      const resultValidation = GenerationResultSchema.safeParse(entry.result);
      const configValidation = ConfigSnapshotSchema.safeParse(entry.configSnapshot);

      if (!resultValidation.success || !configValidation.success) {
        console.warn("[History] Skipping invalid entry:", entry.id);
        continue;
      }

      // Validated with Zod but need to cast for compatibility
      const historyEntry: HistoryEntry = {
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        result: resultValidation.data,
        configSnapshot: configValidation.data,
        status: entry.status,
        ...(entry.rating !== undefined && { rating: entry.rating }),
        ...(entry.notes !== undefined && { notes: entry.notes }),
      };
      validEntries.push(historyEntry);
    }
    return validEntries;
  } catch (error) {
    console.error("Failed to load history from IndexedDB:", error);
    return [];
  }
}

/**
 * Create a new pending history entry (called when generation starts)
 * Returns the entry ID for later updating - NOT saved to localStorage yet
 */
export function createPendingEntry(_configSnapshot: HistoryEntry["configSnapshot"]): string {
  try {
    const id = `gen-${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;
    console.log("[History] Created pending entry ID:", id, "(not persisted yet)");
    return id;
  } catch {
    return "";
  }
}

/**
 * Save a completed generation to history
 * This is the ONLY way entries get persisted to IndexedDB
 * IndexedDB can handle large images (MB+), unlike localStorage
 */
export async function saveCompletedEntry(
  id: string,
  result: GenerationResult,
  configSnapshot: HistoryEntry["configSnapshot"],
): Promise<void> {
  console.log("[History] Saving completed entry:", id);

  const entry: HistoryEntry = {
    id,
    timestamp: new Date(),
    result, // Keep images! IndexedDB can handle them
    configSnapshot,
    status: result.error ? "error" : "complete",
  };

  try {
    console.log("[History] Saving to IndexedDB (with images)");
    await db.saveEntry(entry);
    console.log("[History] Successfully saved entry");

    // Trim old entries if we exceed max
    await db.trimToMaxEntries(MAX_HISTORY_ENTRIES);
  } catch (error) {
    console.error("Failed to save to history:", error);
  }
}

/**
 * Save a new generation to history (legacy - kept for compatibility)
 * @deprecated Use createPendingEntry and saveCompletedEntry instead
 */
export async function saveToHistory(
  result: GenerationResult,
  configSnapshot: HistoryEntry["configSnapshot"],
): Promise<string> {
  const id = `gen-${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;
  await saveCompletedEntry(id, result, configSnapshot);
  return id;
}

/**
 * Delete a specific history entry
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  try {
    await db.deleteEntry(id);
  } catch (error) {
    console.error("Failed to delete history entry:", error);
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    await db.clearAllEntries();
    // Also clear old localStorage data if it exists
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

/**
 * Get a specific history entry by ID
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  try {
    const entry = await db.getEntry(id);
    if (!entry) {
      return undefined;
    }

    const resultValidation = GenerationResultSchema.safeParse(entry.result);
    const configValidation = ConfigSnapshotSchema.safeParse(entry.configSnapshot);

    if (!resultValidation.success || !configValidation.success) {
      console.warn("[History] Invalid entry data:", id);
      return undefined;
    }

    // Validated with Zod but need to cast for compatibility
    const result: HistoryEntry = {
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      result: resultValidation.data,
      configSnapshot: configValidation.data,
      status: entry.status,
      ...(entry.rating !== undefined && { rating: entry.rating }),
      ...(entry.notes !== undefined && { notes: entry.notes }),
    };
    return result;
  } catch (error) {
    console.error("Failed to get history entry:", error);
    return undefined;
  }
}

/**
 * Update rating for a history entry
 */
export async function updateHistoryRating(id: string, rating: 1 | 2 | 3 | 4, notes?: string): Promise<void> {
  try {
    const entry = await db.getEntry(id);
    if (!entry) {
      console.warn(`History entry ${id} not found`);
      return;
    }

    entry.rating = rating;
    if (notes !== undefined) {
      entry.notes = notes;
    }

    await db.saveEntry(entry);
  } catch (error) {
    console.error("Failed to update rating:", error);
  }
}
