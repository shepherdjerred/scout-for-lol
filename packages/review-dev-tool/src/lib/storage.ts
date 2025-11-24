/**
 * Unified IndexedDB storage utility for all persistent data
 * Replaces localStorage with a more robust and capable storage solution
 */
import { z } from "zod";

const DB_NAME = "scout-review-storage";
const DB_VERSION = 1;

// Object store names
export const STORES = {
  CONFIGS: "configs",
  CURRENT_CONFIG: "current-config",
  GLOBAL_CONFIG: "global-config",
  PERSONALITIES: "personalities",
  ART_STYLES: "art-styles",
  ART_THEMES: "art-themes",
  COSTS: "costs",
  PREFERENCES: "preferences",
} as const;

const IDBOpenDBRequestSchema = z.instanceof(IDBOpenDBRequest);

/**
 * IndexedDB connection (lazy initialized)
 */
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB connection with all required object stores
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = request.error;
      console.warn("IndexedDB failed to open:", error);
      reject(error ?? new Error("Storage operation failed"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const targetResult = IDBOpenDBRequestSchema.safeParse(event.target);
      if (targetResult.success) {
        const db = targetResult.data.result;

        // Create all object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.CONFIGS)) {
          db.createObjectStore(STORES.CONFIGS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.CURRENT_CONFIG)) {
          db.createObjectStore(STORES.CURRENT_CONFIG);
        }
        if (!db.objectStoreNames.contains(STORES.GLOBAL_CONFIG)) {
          db.createObjectStore(STORES.GLOBAL_CONFIG);
        }
        if (!db.objectStoreNames.contains(STORES.PERSONALITIES)) {
          db.createObjectStore(STORES.PERSONALITIES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.ART_STYLES)) {
          db.createObjectStore(STORES.ART_STYLES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.ART_THEMES)) {
          db.createObjectStore(STORES.ART_THEMES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.COSTS)) {
          db.createObjectStore(STORES.COSTS);
        }
        if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
          db.createObjectStore(STORES.PREFERENCES);
        }
      }
    };
  });

  return dbPromise;
}

/**
 * Get a single value from a store
 */
export async function getItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result: T | undefined = request.result;
        resolve(result ?? null);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to get item from ${storeName}:`, error);
    return null;
  }
}

/**
 * Set a single value in a store
 */
export async function setItem(storeName: string, key: string, value: unknown): Promise<boolean> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to set item in ${storeName}:`, error);
    return false;
  }
}

/**
 * Get all values from a store (for stores with keyPath)
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const result: T[] | undefined = request.result;
        resolve(result || []);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to get all items from ${storeName}:`, error);
    return [];
  }
}

/**
 * Add or update an item in a store with keyPath
 */
export async function putItem(storeName: string, value: unknown): Promise<boolean> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to put item in ${storeName}:`, error);
    return false;
  }
}

/**
 * Delete an item from a store with keyPath
 */
export async function deleteItem(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to delete item from ${storeName}:`, error);
    return false;
  }
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: string): Promise<boolean> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        const error = request.error;
        reject(error ?? new Error("Storage operation failed"));
      };
    });
  } catch (error) {
    console.warn(`Failed to clear store ${storeName}:`, error);
    return false;
  }
}

/**
 * Migrate a single item from localStorage to IndexedDB
 */
async function migrateSingleItem(
  localStorageKey: string,
  store: string,
  isArray?: boolean,
  key?: string,
): Promise<void> {
  const stored = localStorage.getItem(localStorageKey);
  if (!stored) {
    return;
  }

  const parsed = JSON.parse(stored);

  if (isArray) {
    // For array data, store each item individually
    const ArraySchema = z.array(z.unknown());
    const result = ArraySchema.safeParse(parsed);
    if (result.success) {
      for (const item of result.data) {
        await putItem(store, item);
      }
    }
  } else if (key) {
    // For single value data, store with specified key
    await setItem(store, key, parsed);
  }

  // Remove from localStorage after successful migration
  localStorage.removeItem(localStorageKey);
  console.log(`Migrated ${localStorageKey} to IndexedDB`);
}

/**
 * Migrate data from localStorage to IndexedDB
 * This should be called once on app startup
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const migrations = [
    {
      localStorageKey: "review-dev-tool-configs",
      store: STORES.CONFIGS,
      isArray: true,
    },
    {
      localStorageKey: "review-dev-tool-current",
      store: STORES.CURRENT_CONFIG,
      key: "current",
    },
    {
      localStorageKey: "review-dev-tool-global-config",
      store: STORES.GLOBAL_CONFIG,
      key: "global",
    },
    {
      localStorageKey: "review-dev-tool-custom-personalities",
      store: STORES.PERSONALITIES,
      isArray: true,
    },
    {
      localStorageKey: "review-dev-tool-custom-art-styles",
      store: STORES.ART_STYLES,
      isArray: true,
    },
    {
      localStorageKey: "review-dev-tool-custom-art-themes",
      store: STORES.ART_THEMES,
      isArray: true,
    },
    {
      localStorageKey: "scout-review-costs",
      store: STORES.COSTS,
      key: "costs",
    },
    {
      localStorageKey: "darkMode",
      store: STORES.PREFERENCES,
      key: "darkMode",
    },
  ];

  for (const migration of migrations) {
    try {
      await migrateSingleItem(migration.localStorageKey, migration.store, migration.isArray, migration.key);
    } catch (error) {
      console.error(`Failed to migrate ${migration.localStorageKey}:`, error);
    }
  }
}
