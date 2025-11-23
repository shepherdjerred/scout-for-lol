/**
 * Client-side caching for CloudFlare R2 API calls
 * Uses a three-tier cache system:
 * 1. Memory (fastest, session-only)
 * 2. IndexedDB (fast, large capacity ~100s of MB)
 * 3. localStorage (fallback, ~5-10MB limit)
 */
import { z } from "zod";

const CacheEntrySchema = z.object({
  data: z.unknown(),
  timestamp: z.number(),
  ttl: z.number(),
});

type CacheEntry = z.infer<typeof CacheEntrySchema>;

const CACHE_KEY_PREFIX = "r2-cache-";
const DB_NAME = "r2-cache-db";
const DB_VERSION = 1;
const STORE_NAME = "cache-entries";

/**
 * In-memory cache for fast repeated access within the same session
 */
const memoryCache = new Map<string, CacheEntry>();

/**
 * IndexedDB connection (lazy initialized)
 */
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB connection
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn("IndexedDB failed to open:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create object store with key path
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        // Create index on timestamp for efficient cleanup
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Write to IndexedDB
 */
async function setInIndexedDB(key: string, entry: CacheEntry): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, ...entry });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn("IndexedDB write error:", error);
    return false;
  }
}

/**
 * Generate a cache key from request parameters
 */
function generateCacheKey(endpoint: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

  return `${CACHE_KEY_PREFIX}${endpoint}:${JSON.stringify(sortedParams)}`;
}

/**
 * Check if a cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < entry.ttl;
}

/**
 * Periodically clean up expired entries (throttled to once per minute)
 */
let lastCleanupTime = 0;
function cleanupExpiredEntries(): void {
  const now = Date.now();
  // Only run cleanup once per minute
  if (now - lastCleanupTime < 60_000) return;
  lastCleanupTime = now;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed: unknown = JSON.parse(value);
            const result = CacheEntrySchema.safeParse(parsed);
            if (!result.success || !isCacheValid(result.data)) {
              keysToRemove.push(key);
            }
          } catch {
            // Invalid JSON - remove it
            keysToRemove.push(key);
          }
        }
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      memoryCache.delete(key);
    }

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn("Error during cache cleanup:", error);
  }
}

/**
 * Get cached data if available and valid
 */
export function getCachedData<T>(endpoint: string, params: Record<string, unknown>): T | null {
  const cacheKey = generateCacheKey(endpoint, params);

  // Periodically clean up expired entries
  cleanupExpiredEntries();

  // Check in-memory cache first (fastest)
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && isCacheValid(memoryEntry)) {
    return memoryEntry.data as T;
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      const result = CacheEntrySchema.safeParse(parsed);

      if (result.success && isCacheValid(result.data)) {
        // Restore to memory cache for faster subsequent access
        memoryCache.set(cacheKey, result.data);
        return result.data.data as T;
      }

      // Invalid or expired - clean up
      localStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.warn("Cache read error:", error);
  }

  return null;
}

/**
 * Evict old cache entries to free up space
 * Removes expired entries first, then oldest non-expired entries
 */
function evictOldCacheEntries(targetBytesToFree: number): number {
  const entries: Array<{ key: string; timestamp: number; size: number; expired: boolean }> = [];

  try {
    // Collect all cache entries with metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = key.length * 2 + value.length * 2; // UTF-16
          try {
            const parsed: unknown = JSON.parse(value);
            const result = CacheEntrySchema.safeParse(parsed);
            const expired = result.success ? !isCacheValid(result.data) : true;
            entries.push({
              key,
              timestamp: result.success ? result.data.timestamp : 0,
              size,
              expired,
            });
          } catch {
            // Invalid entry - mark for removal
            entries.push({ key, timestamp: 0, size, expired: true });
          }
        }
      }
    }

    // Sort: expired first, then by oldest timestamp
    entries.sort((a, b) => {
      if (a.expired !== b.expired) return a.expired ? -1 : 1;
      return a.timestamp - b.timestamp;
    });

    // Remove entries until we've freed enough space
    let freedBytes = 0;
    for (const entry of entries) {
      if (freedBytes >= targetBytesToFree) break;
      localStorage.removeItem(entry.key);
      memoryCache.delete(entry.key);
      freedBytes += entry.size;
    }

    return freedBytes;
  } catch (error) {
    console.warn("Error during cache eviction:", error);
    return 0;
  }
}

/**
 * Cache data with specified TTL (in milliseconds)
 * Writes to memory → IndexedDB → localStorage (best effort)
 */
export async function setCachedData(
  endpoint: string,
  params: Record<string, unknown>,
  data: unknown,
  ttl: number,
): Promise<void> {
  const cacheKey = generateCacheKey(endpoint, params);
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  // Store in memory cache (always succeeds)
  memoryCache.set(cacheKey, entry);

  // Store in IndexedDB (primary storage, large capacity)
  try {
    const success = await setInIndexedDB(cacheKey, entry);
    if (success) {
      // IndexedDB succeeded, also try localStorage as backup
      try {
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        // localStorage failed but IndexedDB worked, that's fine
      }
      return;
    }
  } catch (error) {
    console.warn("IndexedDB cache write error:", error);
  }

  // IndexedDB failed, fall back to localStorage only
  try {
    const serialized = JSON.stringify(entry);
    localStorage.setItem(cacheKey, serialized);
  } catch (error) {
    // If quota exceeded, try to free up space and retry
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, attempting cache eviction...");

      const serialized = JSON.stringify(entry);
      const estimatedSize = (cacheKey.length + serialized.length) * 2; // UTF-16
      const freedBytes = evictOldCacheEntries(estimatedSize * 2); // Free 2x the needed space

      if (freedBytes > 0) {
        console.log(`Freed ${(freedBytes / 1024).toFixed(2)} KB from localStorage cache`);
        try {
          localStorage.setItem(cacheKey, serialized);
          return;
        } catch (retryError) {
          console.warn("localStorage write failed after eviction:", retryError);
        }
      } else {
        console.warn("Could not free enough space for localStorage cache entry");
      }
    } else {
      console.warn("localStorage cache write error:", error);
    }
    // If all persistent storage fails, memory cache still works
  }
}

/**
 * Clear all cached data (memory, IndexedDB, and localStorage)
 */
export async function clearAllCache(): Promise<void> {
  // Clear memory cache
  memoryCache.clear();

  // Clear IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("IndexedDB cache clear error:", error);
  }

  // Clear localStorage cache
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("localStorage cache clear error:", error);
  }
}

/**
 * Clear cached data for a specific endpoint
 */
export async function clearCacheForEndpoint(endpoint: string): Promise<void> {
  // Clear from memory cache
  const keysToDelete: string[] = [];
  for (const key of memoryCache.keys()) {
    if (key.includes(`${endpoint}:`)) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    memoryCache.delete(key);
  }

  // Clear from IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          const key = cursor.value.key as string;
          if (key.includes(`${endpoint}:`)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("IndexedDB cache clear error:", error);
  }

  // Clear from localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX) && key.includes(endpoint)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("localStorage cache clear error:", error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  memoryEntries: number;
  indexedDBEntries: number;
  localStorageEntries: number;
  indexedDBSizeBytes: number;
  localStorageSizeBytes: number;
  totalSizeBytes: number;
}> {
  let localStorageEntries = 0;
  let localStorageSizeBytes = 0;
  let indexedDBEntries = 0;
  let indexedDBSizeBytes = 0;

  // Calculate localStorage stats
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        localStorageEntries++;
        const value = localStorage.getItem(key);
        if (value) {
          localStorageSizeBytes += key.length * 2 + value.length * 2; // UTF-16 encoding
        }
      }
    }
  } catch (error) {
    console.warn("Error calculating localStorage cache stats:", error);
  }

  // Calculate IndexedDB stats
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          indexedDBEntries++;
          // Estimate size (rough approximation)
          const value = cursor.value;
          const serialized = JSON.stringify(value);
          indexedDBSizeBytes += serialized.length * 2; // UTF-16 encoding
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Error calculating IndexedDB cache stats:", error);
  }

  return {
    memoryEntries: memoryCache.size,
    indexedDBEntries,
    localStorageEntries,
    indexedDBSizeBytes,
    localStorageSizeBytes,
    totalSizeBytes: indexedDBSizeBytes + localStorageSizeBytes,
  };
}
