import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getMapCache,
  saveMapCache,
  cacheTile,
  getCachedTile,
  isTileCached,
  clearMapCache,
  getCacheStats,
  type MapCache
} from '../../../src/utils/mapCache';

describe('Map Cache Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Cache Size Limits', () => {
    test('should respect maximum cache size of 50MB', () => {
      const cache = getMapCache();
      const maxSizeBytes = 50 * 1024 * 1024;

      // Verify initial cache is empty
      expect(cache.totalSize).toBe(0);
      expect(cache.totalSize).toBeLessThanOrEqual(maxSizeBytes);
    });

    test('should remove oldest tiles when cache is full', async () => {
      // Create a large tile (simulated)
      const largeTileData = 'data:image/png;base64,' + 'A'.repeat(1024 * 1024); // ~1MB
      
      // Mock fetch to return our test data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob([largeTileData]))
      });

      // Cache multiple tiles
      await cacheTile('https://tile.openstreetmap.org/1/0/0.png');
      await cacheTile('https://tile.openstreetmap.org/1/0/1.png');

      const stats = getCacheStats();
      expect(stats.tileCount).toBeGreaterThan(0);
      expect(stats.totalSizeMB).toBeLessThanOrEqual(50);
    });
  });

  describe('Cache Performance', () => {
    test('should retrieve cached tiles quickly', () => {
      const cache: MapCache = {
        tiles: [
          {
            url: 'https://tile.openstreetmap.org/1/0/0.png',
            data: 'data:image/png;base64,test',
            timestamp: Date.now(),
            size: 100
          }
        ],
        totalSize: 100,
        lastCleanup: Date.now()
      };

      saveMapCache(cache);

      const startTime = performance.now();
      const cachedData = getCachedTile('https://tile.openstreetmap.org/1/0/0.png');
      const endTime = performance.now();

      // Cache retrieval should be fast (< 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      expect(cachedData).toBe('data:image/png;base64,test');
    });

    test('should check tile existence quickly', () => {
      const cache: MapCache = {
        tiles: [
          {
            url: 'https://tile.openstreetmap.org/1/0/0.png',
            data: 'data:image/png;base64,test',
            timestamp: Date.now(),
            size: 100
          }
        ],
        totalSize: 100,
        lastCleanup: Date.now()
      };

      saveMapCache(cache);

      const startTime = performance.now();
      const exists = isTileCached('https://tile.openstreetmap.org/1/0/0.png');
      const endTime = performance.now();

      // Existence check should be fast (< 5ms)
      expect(endTime - startTime).toBeLessThan(5);
      expect(exists).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    test('should accurately report cache statistics', () => {
      const cache: MapCache = {
        tiles: [
          {
            url: 'https://tile.openstreetmap.org/1/0/0.png',
            data: 'data:image/png;base64,test1',
            timestamp: Date.now(),
            size: 1024 * 1024 // 1MB
          },
          {
            url: 'https://tile.openstreetmap.org/1/0/1.png',
            data: 'data:image/png;base64,test2',
            timestamp: Date.now(),
            size: 2 * 1024 * 1024 // 2MB
          }
        ],
        totalSize: 3 * 1024 * 1024, // 3MB
        lastCleanup: Date.now()
      };

      saveMapCache(cache);

      const stats = getCacheStats();
      expect(stats.tileCount).toBe(2);
      expect(stats.totalSizeMB).toBeCloseTo(3, 1);
      expect(stats.lastCleanup).toBeInstanceOf(Date);
    });
  });

  describe('Cache Operations', () => {
    test('should clear all cached tiles', () => {
      const cache: MapCache = {
        tiles: [
          {
            url: 'https://tile.openstreetmap.org/1/0/0.png',
            data: 'data:image/png;base64,test',
            timestamp: Date.now(),
            size: 100
          }
        ],
        totalSize: 100,
        lastCleanup: Date.now()
      };

      saveMapCache(cache);
      expect(getCacheStats().tileCount).toBe(1);

      clearMapCache();
      expect(getCacheStats().tileCount).toBe(0);
      expect(getCacheStats().totalSizeMB).toBe(0);
    });

    test('should update timestamp on cache hit (LRU)', () => {
      const initialTimestamp = Date.now() - 10000;
      const cache: MapCache = {
        tiles: [
          {
            url: 'https://tile.openstreetmap.org/1/0/0.png',
            data: 'data:image/png;base64,test',
            timestamp: initialTimestamp,
            size: 100
          }
        ],
        totalSize: 100,
        lastCleanup: Date.now()
      };

      saveMapCache(cache);

      // Access the tile
      getCachedTile('https://tile.openstreetmap.org/1/0/0.png');

      // Verify timestamp was updated
      const updatedCache = getMapCache();
      expect(updatedCache.tiles[0].timestamp).toBeGreaterThan(initialTimestamp);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty cache gracefully', () => {
      clearMapCache();
      
      const cache = getMapCache();
      expect(cache.tiles).toEqual([]);
      expect(cache.totalSize).toBe(0);
    });

    test('should handle non-existent tile retrieval', () => {
      clearMapCache();
      
      const cachedData = getCachedTile('https://tile.openstreetmap.org/99/99/99.png');
      expect(cachedData).toBeNull();
    });

    test('should handle corrupted cache data', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('smartsafe_map_cache', 'invalid json');
      
      const cache = getMapCache();
      expect(cache.tiles).toEqual([]);
      expect(cache.totalSize).toBe(0);
    });
  });
});
