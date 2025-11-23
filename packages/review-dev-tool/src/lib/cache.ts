/**
 * Client-side caching for CloudFlare R2 API calls
 */
import { z } from "zod";

const CacheEntrySchema = z.object({
  data: z.unknown(),
  timestamp: z.number(),
  ttl: z.number(),
});

type CacheEntry = z.infer<typeof CacheEntrySchema>;

const CACHE_KEY_PREFIX = "r2-cache-";

/**
 * In-memory cache for fast repeated access within the same session
 */
const memoryCache = new Map<string, CacheEntry>();

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
 * Get cached data if available and valid
 */
export function getCachedData<T>(endpoint: string, params: Record<string, unknown>): T | null {
  const cacheKey = generateCacheKey(endpoint, params);

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
 * Cache data with specified TTL (in milliseconds)
 */
export function setCachedData(endpoint: string, params: Record<string, unknown>, data: unknown, ttl: number): void {
  const cacheKey = generateCacheKey(endpoint, params);
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  // Store in memory cache
  memoryCache.set(cacheKey, entry);

  // Store in localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn("Cache write error (localStorage may be full):", error);
    // If localStorage fails, memory cache still works
  }
}

/**
 * Clear all cached data (both memory and localStorage)
 */
export function clearAllCache(): void {
  // Clear memory cache
  memoryCache.clear();

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
    console.warn("Cache clear error:", error);
  }
}

/**
 * Clear cached data for a specific endpoint
 */
export function clearCacheForEndpoint(endpoint: string): void {
  // Clear from memory cache
  const keysToDelete: string[] = [];
  for (const key of memoryCache.keys()) {
    if (key.includes(`:${endpoint}:`)) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    memoryCache.delete(key);
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
    console.warn("Cache clear error:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryEntries: number;
  localStorageEntries: number;
  totalSizeBytes: number;
} {
  let localStorageEntries = 0;
  let totalSizeBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        localStorageEntries++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSizeBytes += key.length * 2 + value.length * 2; // UTF-16 encoding
        }
      }
    }
  } catch (error) {
    console.warn("Error calculating cache stats:", error);
  }

  return {
    memoryEntries: memoryCache.size,
    localStorageEntries,
    totalSizeBytes,
  };
}
