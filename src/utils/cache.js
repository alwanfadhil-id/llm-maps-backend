/**
 * Simple in-memory cache for API responses
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Store a value in the cache with expiration
   */
  set(key, value, ttl = 300000) { // Default 5 minutes TTL
    const expiration = Date.now() + ttl;
    this.cache.set(key, { value, expiration });
  }

  /**
   * Get a value from the cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiration) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiration) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expiration) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
const cache = new SimpleCache();

module.exports = cache;