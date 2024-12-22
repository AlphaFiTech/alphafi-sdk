import { GetObjectParams, SuiObjectResponse } from "@mysten/sui/client";
import { getSuiClient } from "../sui-sdk/client.js";

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

const getObjectCache = new SimpleCache<SuiObjectResponse>();
const getObjectPromiseCache = new SimpleCache<Promise<SuiObjectResponse>>();

export async function getObjectFromChain(
  input: GetObjectParams,
  ignoreCache: boolean,
): Promise<SuiObjectResponse> {
  const suiClient = getSuiClient();
  const cacheKey = `getObject_${input.id}`;
  if (ignoreCache) {
    getObjectCache.delete(cacheKey);
    getObjectPromiseCache.delete(cacheKey);
  }
  // Check if the distributor is already in the cache
  const cachedDistributor = getObjectCache.get(cacheKey);
  if (cachedDistributor) {
    return cachedDistributor;
  }

  // Check if there is already a promise in the cache
  let getObjectPromise = getObjectPromiseCache.get(cacheKey);
  if (getObjectPromise) {
    return getObjectPromise;
  }

  // If not, create a new promise and cache it
  getObjectPromise = (async () => {
    try {
      const res = await suiClient.getObject(input);

      // Cache the distributor object
      getObjectCache.set(cacheKey, res);
      return res;
    } catch (err) {
      console.error(`getDistributor failed`);
      throw err;
    } finally {
      // Remove the promise from the cache after it resolves
      getObjectPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  getObjectPromiseCache.set(cacheKey, getObjectPromise);
  return getObjectPromise;
}

// suiClient.getDynamicFields
// suiClient.getDynamicFieldObject
// suiClient.getOwnedObjects
// suiClient.multiGetObjects
// suiClient.getCoins
