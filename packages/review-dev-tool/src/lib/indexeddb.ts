/**
 * IndexedDB wrapper for storing history entries with large images
 * IndexedDB can handle much larger data than localStorage (hundreds of MB vs 5-10MB)
 */
import { z } from "zod";

const DB_NAME = "scout-review-history";
const DB_VERSION = 1;
const STORE_NAME = "history";

const IDBOpenDBRequestSchema = z.instanceof(IDBOpenDBRequest);

const DBHistoryEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  result: z.object({
    text: z.string(),
    image: z.string().optional(),
    metadata: z.unknown(),
    error: z.string().optional(),
  }),
  configSnapshot: z.object({
    model: z.string(),
    personality: z.string().optional(),
    artStyle: z.string().optional(),
    artTheme: z.string().optional(),
  }),
  status: z.enum(["pending", "complete", "error"]),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  notes: z.string().optional(),
});

// Infer type from schema to ensure compatibility with exactOptionalPropertyTypes
export type DBHistoryEntry = z.infer<typeof DBHistoryEntrySchema>;

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const targetResult = IDBOpenDBRequestSchema.safeParse(event.target);
      if (targetResult.success) {
        const db = targetResult.data.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("status", "status", { unique: false });
        }
      }
    };
  });
}

/**
 * Save a history entry to IndexedDB
 */
export async function saveEntry(entry: DBHistoryEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get all history entries, sorted by timestamp (newest first)
 */
export async function getAllEntries(): Promise<DBHistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      const result: unknown = request.result;
      const entriesResult = z.array(DBHistoryEntrySchema).safeParse(result);
      if (entriesResult.success) {
        const entries = entriesResult.data;
        // Sort by timestamp, newest first
        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(entries);
      } else {
        resolve([]);
      }
    };
  });
}

/**
 * Get a specific entry by ID
 */
export async function getEntry(id: string): Promise<DBHistoryEntry | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      const result: unknown = request.result;
      if (result === undefined) {
        resolve(undefined);
      } else {
        const entryResult = DBHistoryEntrySchema.safeParse(result);
        resolve(entryResult.success ? entryResult.data : undefined);
      }
    };
  });
}

/**
 * Delete a specific entry
 */
export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Clear all entries
 */
export async function clearAllEntries(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get count of entries
 */
export async function getEntryCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Delete old entries to maintain a maximum count
 */
export async function trimToMaxEntries(maxCount: number): Promise<void> {
  const entries = await getAllEntries();
  if (entries.length <= maxCount) return;

  const toDelete = entries.slice(maxCount);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    let deletedCount = 0;
    for (const entry of toDelete) {
      const request = store.delete(entry.id);
      request.onsuccess = () => {
        deletedCount++;
        if (deletedCount === toDelete.length) {
          resolve();
        }
      };
      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("IndexedDB operation failed"));
      };
    }
  });
}
