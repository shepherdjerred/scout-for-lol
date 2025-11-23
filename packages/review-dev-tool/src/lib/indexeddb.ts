/**
 * IndexedDB wrapper for storing history entries with large images
 * IndexedDB can handle much larger data than localStorage (hundreds of MB vs 5-10MB)
 */

const DB_NAME = "scout-review-history";
const DB_VERSION = 1;
const STORE_NAME = "history";

export type DBHistoryEntry = {
  id: string;
  timestamp: Date;
  result: {
    text: string;
    image?: string | undefined; // base64 encoded
    metadata: unknown;
    error?: string | undefined;
  };
  configSnapshot: {
    model: string;
    personality?: string | undefined;
    artStyle?: string | undefined;
    artTheme?: string | undefined;
  };
  status: "pending" | "complete" | "error";
  rating?: 1 | 2 | 3 | 4 | undefined;
  notes?: string | undefined;
};

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
        objectStore.createIndex("status", "status", { unique: false });
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
      reject(request.error);
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
      reject(request.error);
    };
    request.onsuccess = () => {
      const entries = request.result as DBHistoryEntry[];
      // Sort by timestamp, newest first
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(entries);
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
      reject(request.error);
    };
    request.onsuccess = () => {
      resolve(request.result as DBHistoryEntry | undefined);
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
      reject(request.error);
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
      reject(request.error);
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
      reject(request.error);
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
        reject(request.error);
      };
    }
  });
}
