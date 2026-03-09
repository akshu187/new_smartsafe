/**
 * Generic caching utility for SmartSafe application
 * Provides localStorage-based caching with TTL (Time To Live) support
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Namespace for cache keys
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_NAMESPACE = 'smartsafe_cache';

/**
 * Generate cache key with namespace
 */
function getCacheKey(key: string, namespace: string): string {
  return `${namespace}_${key}`;
}

/**
 * Set item in cache with TTL
 */
export function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const { ttl = DEFAULT_TTL, namespace = DEFAULT_NAMESPACE } = options;
  
  try {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      key
    };
    
    const cacheKey = getCacheKey(key, namespace);
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Cache write error:', error);
    // If storage is full, try to clean up expired entries
    cleanupExpiredCache(namespace);
    
    // Retry once after cleanup
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        key
      };
      const cacheKey = getCacheKey(key, namespace);
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (retryError) {
      console.error('Cache write failed after cleanup:', retryError);
    }
  }
}

/**
 * Get item from cache
 * Returns null if not found or expired
 */
export function getCache<T>(
  key: string,
  options: CacheOptions = {}
): T | null {
  const { namespace = DEFAULT_NAMESPACE } = options;
  
  try {
    const cacheKey = getCacheKey(key, namespace);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const cacheEntry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > cacheEntry.expiresAt) {
      // Remove expired entry
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cacheEntry.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Check if cache entry exists and is valid
 */
export function hasCache(
  key: string,
  options: CacheOptions = {}
): boolean {
  return getCache(key, options) !== null;
}

/**
 * Remove specific cache entry
 */
export function removeCache(
  key: string,
  options: CacheOptions = {}
): void {
  const { namespace = DEFAULT_NAMESPACE } = options;
  
  try {
    const cacheKey = getCacheKey(key, namespace);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Cache remove error:', error);
  }
}

/**
 * Clear all cache entries in a namespace
 */
export function clearCache(namespace: string = DEFAULT_NAMESPACE): void {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `${namespace}_`;
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(namespace: string = DEFAULT_NAMESPACE): void {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `${namespace}_`;
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheEntry: CacheEntry<any> = JSON.parse(cached);
            if (now > cacheEntry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (err) {
          // If parsing fails, remove the corrupted entry
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(namespace: string = DEFAULT_NAMESPACE): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  totalSizeKB: number;
} {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `${namespace}_`;
    const now = Date.now();
    
    let totalEntries = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        totalEntries++;
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(cached);
            if (now > cacheEntry.expiresAt) {
              expiredEntries++;
            } else {
              validEntries++;
            }
          } catch (err) {
            expiredEntries++;
          }
        }
      }
    });
    
    return {
      totalEntries,
      validEntries,
      expiredEntries,
      totalSizeKB: totalSize / 1024
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      totalSizeKB: 0
    };
  }
}

/**
 * Get or set cache with a factory function
 * Useful for lazy loading data
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = getCache<T>(key, options);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  setCache(key, data, options);
  
  return data;
}
