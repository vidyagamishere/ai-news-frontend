/**
 * Cache Service for API Response Caching
 * Reduces API calls and improves performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes - for frequently changing data
  MEDIUM: 30 * 60 * 1000,    // 30 minutes - for semi-static data
  LONG: 24 * 60 * 60 * 1000, // 24 hours - for static data
  TRENDING: 10 * 60 * 1000,  // 10 minutes for trending data (frequently updated)
};

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  /**
   * Get cached data or execute fetcher function
   * Implements request deduplication to prevent duplicate API calls
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_DURATION.MEDIUM
  ): Promise<T> {
    // Check if we have a valid cached item
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached.data as T;
    }

    // Check if there's already an in-flight request for this key
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      console.log(`⏳ Request DEDUP: ${key}`);
      return inFlight as Promise<T>;
    }

    // Execute fetcher and cache the promise to prevent duplicate requests
    console.log(`🔄 Cache MISS: ${key} - Fetching...`);
    const promise = fetcher()
      .then((data) => {
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        });
        // Remove from in-flight requests
        this.inFlightRequests.delete(key);
        console.log(`💾 Cached: ${key}`);
        return data;
      })
      .catch((error) => {
        // Remove from in-flight requests on error
        this.inFlightRequests.delete(key);
        throw error;
      });

    // Store the promise to prevent duplicate requests
    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Get data from localStorage with expiration
   */
  getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item) as CacheItem<T>;
      if (Date.now() < parsed.expiresAt) {
        console.log(`✅ LocalStorage HIT: ${key}`);
        return parsed.data;
      } else {
        // Expired - remove it
        localStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error(`❌ LocalStorage read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Save data to localStorage with expiration
   */
  saveToLocalStorage<T>(key: string, data: T, ttl: number = CACHE_DURATION.LONG): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
      console.log(`💾 Saved to LocalStorage: ${key}`);
    } catch (error) {
      console.error(`❌ LocalStorage write error for ${key}:`, error);
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    // Clear in-memory cache
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }

    // Clear localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && pattern.test(key)) {
        localStorage.removeItem(key);
      }
    }
    console.log(`🗑️ Cache invalidated by pattern: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export { CACHE_DURATION };
