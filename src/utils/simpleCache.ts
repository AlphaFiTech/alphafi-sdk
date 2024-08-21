export class SimpleCache<T> {
  private cache: { [key: string]: { value: T; expiry: number } } = {};
  private defaultTTL: number;

  constructor(defaultTTL: number = 60000) {
    // Default TTL is 60 seconds
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const cacheEntry = this.cache[key];
    if (cacheEntry && cacheEntry.expiry > Date.now()) {
      return cacheEntry.value;
    } else {
      // If the entry has expired, delete it
      this.delete(key);
      return null;
    }
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache[key] = { value, expiry };
  }

  delete(key: string): void {
    delete this.cache[key];
  }

  clear(): void {
    this.cache = {};
  }
}

// // Usage example:
// const cache = new SimpleCache<string>(60000); // TTL of 60 seconds

// // Set a cache entry
// cache.set('example', 'value');

// // Get a cache entry
// const value = cache.get('example');

// // Delete a specific cache entry
// cache.delete('example');

// // Clear all cache entries
// cache.clear();
