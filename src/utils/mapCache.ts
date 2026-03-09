const CACHE_KEY = 'smartsafe_map_cache';
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

export interface CachedTile {
  url: string;
  data: string; // Base64 encoded image data
  timestamp: number;
  size: number; // Size in bytes
}

export interface MapCache {
  tiles: CachedTile[];
  totalSize: number;
  lastCleanup: number;
}

/**
 * Get the map cache from LocalStorage
 */
export function getMapCache(): MapCache {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) {
      return { tiles: [], totalSize: 0, lastCleanup: Date.now() };
    }
    return JSON.parse(cacheStr);
  } catch (error) {
    console.error('Failed to load map cache:', error);
    return { tiles: [], totalSize: 0, lastCleanup: Date.now() };
  }
}

/**
 * Save the map cache to LocalStorage
 */
export function saveMapCache(cache: MapCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save map cache:', error);
    // If storage is full, try to clean up old tiles
    cleanupOldTiles(cache);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (retryError) {
      console.error('Failed to save map cache after cleanup:', retryError);
    }
  }
}

/**
 * Cache a map tile
 */
export async function cacheTile(url: string): Promise<void> {
  try {
    const cache = getMapCache();
    
    // Check if tile is already cached
    const existingTile = cache.tiles.find(t => t.url === url);
    if (existingTile) {
      // Update timestamp
      existingTile.timestamp = Date.now();
      saveMapCache(cache);
      return;
    }

    // Fetch the tile
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tile: ${response.statusText}`);
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const size = base64.length;

    // Check if adding this tile would exceed cache size
    if (cache.totalSize + size > MAX_CACHE_SIZE_BYTES) {
      // Remove oldest tiles until there's enough space
      while (cache.totalSize + size > MAX_CACHE_SIZE_BYTES && cache.tiles.length > 0) {
        const oldestTile = cache.tiles.reduce((oldest, tile) => 
          tile.timestamp < oldest.timestamp ? tile : oldest
        );
        removeTile(cache, oldestTile.url);
      }
    }

    // Add new tile
    cache.tiles.push({
      url,
      data: base64,
      timestamp: Date.now(),
      size
    });
    cache.totalSize += size;

    saveMapCache(cache);
  } catch (error) {
    console.error('Failed to cache tile:', error);
  }
}

/**
 * Get a cached tile
 */
export function getCachedTile(url: string): string | null {
  const cache = getMapCache();
  const tile = cache.tiles.find(t => t.url === url);
  
  if (tile) {
    // Update timestamp (LRU)
    tile.timestamp = Date.now();
    saveMapCache(cache);
    return tile.data;
  }
  
  return null;
}

/**
 * Check if a tile is cached
 */
export function isTileCached(url: string): boolean {
  const cache = getMapCache();
  return cache.tiles.some(t => t.url === url);
}

/**
 * Remove a tile from cache
 */
function removeTile(cache: MapCache, url: string): void {
  const index = cache.tiles.findIndex(t => t.url === url);
  if (index !== -1) {
    const tile = cache.tiles[index];
    cache.totalSize -= tile.size;
    cache.tiles.splice(index, 1);
  }
}

/**
 * Clean up old tiles (older than 30 days)
 */
function cleanupOldTiles(cache: MapCache): void {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const tilesToRemove = cache.tiles.filter(t => t.timestamp < thirtyDaysAgo);
  
  tilesToRemove.forEach(tile => {
    removeTile(cache, tile.url);
  });
  
  cache.lastCleanup = Date.now();
}

/**
 * Clear all cached tiles
 */
export function clearMapCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { tileCount: number; totalSizeMB: number; lastCleanup: Date } {
  const cache = getMapCache();
  return {
    tileCount: cache.tiles.length,
    totalSizeMB: cache.totalSize / (1024 * 1024),
    lastCleanup: new Date(cache.lastCleanup)
  };
}

/**
 * Convert Blob to Base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
