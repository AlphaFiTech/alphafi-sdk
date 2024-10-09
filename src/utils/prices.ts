import { PythPriceIdPair } from "../common/pyth.js";
import { getAlphaPrice, getBUCKPrice, getUSDYPrice } from "./clmm/prices.js";
import { getBlubPrice, getWsolPrice, getFudPrice } from "./hop.js";
import { SimpleCache } from "./simpleCache.js";

const debug = false;

export async function getLatestPrices(
  pairs: PythPriceIdPair[],
): Promise<(string | undefined)[]> {
  const prices: (string | undefined)[] = new Array(pairs.length).fill(
    undefined,
  );
  const pairsToFetch: PythPriceIdPair[] = [];
  const indexMap: Map<PythPriceIdPair, number[]> = new Map();

  // Initialize indexMap with the indices of pairs that need to be fetched
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (pair === ("ALPHA/USD" as PythPriceIdPair)) {
      const alphaPrice = await getAlphaPrice();
      prices[i] = alphaPrice ? `${alphaPrice}` : undefined;
    } else if (pair === ("USDY/USD" as PythPriceIdPair)) {
      const usdyPrice = await getUSDYPrice();
      prices[i] = usdyPrice ? `${usdyPrice}` : undefined;
    } else if (pair === ("BUCK/USD" as PythPriceIdPair)) {
      const buckPrice = await getBUCKPrice();
      prices[i] = buckPrice ? `${buckPrice}` : undefined;
    } else if (pair === ("WSOL/USD" as PythPriceIdPair)) {
      const wsolPrice = await getWsolPrice();
      prices[i] = wsolPrice ? `${wsolPrice}` : undefined;
    } else if (pair === ("FUD/USD" as PythPriceIdPair)) {
      const fudPrice = await getFudPrice();
      prices[i] = fudPrice ? `${fudPrice}` : undefined;
    } else if (pair === ("BLUB/USD" as PythPriceIdPair)) {
      const blubPrice = await getBlubPrice();
      prices[i] = blubPrice ? `${blubPrice}` : undefined;
    } else {
      pairsToFetch.push(pair);
      if (!indexMap.has(pair)) {
        indexMap.set(pair, []);
      }
      indexMap.get(pair)!.push(i);
    }
  }

  if (pairsToFetch.length > 0) {
    try {
      const fetchedPrices = await fetchPricesFromAlphaAPI(pairsToFetch);
      pairsToFetch.forEach((pair, i) => {
        const price = fetchedPrices[i];
        indexMap.get(pair)!.forEach((index) => {
          prices[index] = price;
        });
      });
    } catch (error) {
      console.error(
        `Error in getLatestPrices for pairs ${pairsToFetch}:`,
        error,
      );
    }
  }

  return prices;
}

export async function getLatestTokenPricePairs(
  pairs: PythPriceIdPair[],
): Promise<{ [key: string]: string | undefined }> {
  const priceMap: { [key: string]: string | undefined } = {};

  // Use getLatestPrices to fetch all prices at once
  const prices = await getLatestPrices(pairs);

  pairs.forEach((pair, index) => {
    priceMap[pair] = prices[index];
  });

  return priceMap;
}

export async function getLatestPrice(
  pair: PythPriceIdPair,
): Promise<string | undefined> {
  let price: string | undefined = undefined;

  if (pair === ("ALPHA/USD" as PythPriceIdPair)) {
    const alphaPrice = await getAlphaPrice();
    if (alphaPrice) {
      price = `${alphaPrice}`;
    }
  } else if (pair === ("USDY/USD" as PythPriceIdPair)) {
    const usdyPrice = await getUSDYPrice();
    if (usdyPrice) {
      price = `${usdyPrice}`;
    }
  } else if (pair === ("BUCK/USD" as PythPriceIdPair)) {
    const buckPrice = await getBUCKPrice();
    if (buckPrice) {
      price = `${buckPrice}`;
    }
  } else if (pair === ("WSOL/USD" as PythPriceIdPair)) {
    const wsolPrice = await getWsolPrice();
    if (wsolPrice) {
      price = `${wsolPrice}`;
    }
  } else if (pair === ("BLUB/USD" as PythPriceIdPair)) {
    const blubPrice = await getBlubPrice();
    if (blubPrice) {
      price = `${blubPrice}`;
    }
  } else if (pair === ("FUD/USD" as PythPriceIdPair)) {
    const fudPrice = await getFudPrice();
    if (fudPrice) {
      price = `${fudPrice}`;
    }
  } else {
    try {
      price = await fetchPriceFromAlphaAPI(pair);
      if (!price) {
        console.log(`Failed to get price for pair ${pair}`);
      }
    } catch (error) {
      console.error(`Error in getPrice for pair ${pair}:`, error);
    }
  }
  return price;
}

function generateCacheKey(pair: PythPriceIdPair) {
  return `pyth_${pair}`;
}

function generateCacheKeyForPairs(pairs: PythPriceIdPair[]) {
  return `pyth_${pairs.join("_")}`;
}

interface PythPricePair {
  pair: PythPriceIdPair;
  price: string;
}

const pythCache = new SimpleCache<PythPricePair>(10000); // cache TTL = 10 seconds
const pythPromiseCache = new SimpleCache<Promise<PythPricePair>>(10000);

async function fetchPriceFromAlphaAPI(
  pair: string,
): Promise<string | undefined> {
  let pythPricePair: PythPricePair | undefined = undefined;

  const priceCacheKey = generateCacheKey(pair as PythPriceIdPair);
  if (debug) console.log(`Key generated for ${pair}: ${priceCacheKey}`);

  const cachedResponse = pythCache.get(priceCacheKey);

  if (cachedResponse) {
    if (debug) console.log(`From CACHE for ${pair}`, cachedResponse);
    pythPricePair = cachedResponse;
  } else {
    let cachedPromise = pythPromiseCache.get(priceCacheKey);

    if (!cachedPromise) {
      if (debug)
        console.log(`https://api.alphafi.xyz/alpha/fetchPrice?pair=${pair}`);
      cachedPromise = fetch(
        `https://api.alphafi.xyz/alpha/fetchPrice?pair=${pair}`,
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = (await response.json()) as PythPricePair; // Parse the JSON response
          if (debug) console.log(`From SERVER for ${pair}`, data);
          pythCache.set(priceCacheKey, data); // Cache the response
          pythPromiseCache.delete(priceCacheKey); // Remove the promise from the cache
          return data;
        })
        .catch((error) => {
          pythPromiseCache.delete(priceCacheKey); // Ensure the promise is removed on error
          throw error;
        });
      pythPromiseCache.set(priceCacheKey, cachedPromise);
    }
    pythPricePair = await cachedPromise;
  }

  if (pythPricePair) {
    return pythPricePair.price;
  } else {
    throw new Error(`Price not found for pair: ${pair}`);
  }
}

const pythPromisesCache = new SimpleCache<Promise<PythPricePair[]>>(10000);

async function fetchPricesFromAlphaAPI(pairs: string[]): Promise<string[]> {
  const prices: (string | undefined)[] = new Array(pairs.length).fill(
    undefined,
  );
  const pairsToFetch: PythPriceIdPair[] = [];
  const pairsToFetchIndexes: number[] = [];

  pairs.forEach((pair, index) => {
    const priceCacheKey = generateCacheKey(pair as PythPriceIdPair);
    const cachedResponse = pythCache.get(priceCacheKey);

    if (cachedResponse) {
      if (debug) console.log(`From CACHE for ${pair}`);
      prices[index] = cachedResponse.price;
    } else {
      pairsToFetch.push(pair as PythPriceIdPair);
      pairsToFetchIndexes.push(index);
    }
  });

  if (pairsToFetch.length > 0) {
    const pairsToFetchKey = generateCacheKeyForPairs(pairsToFetch);
    let cachedPairsPromise = pythPromisesCache.get(pairsToFetchKey);

    if (!cachedPairsPromise) {
      if (debug) console.log(`Fetching prices for: ${pairsToFetch.join(",")}`);
      cachedPairsPromise = fetch(
        `https://api.alphafi.xyz/alpha/fetchPrices?pairs=${pairsToFetch.join(",")}`,
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = (await response.json()) as PythPricePair[]; // Parse the JSON response
          if (debug) console.log(`From SERVER for ${pairsToFetch}`, data);
          data.forEach((pricePair, idx) => {
            const priceCacheKey = generateCacheKey(
              pricePair.pair as PythPriceIdPair,
            );
            pythCache.set(priceCacheKey, pricePair); // Cache each response
            pythPromiseCache.delete(priceCacheKey); // Remove the promise from the cache
            prices[pairsToFetchIndexes[idx]] = pricePair.price; // Set the price at the correct index
          });
          pythPromisesCache.delete(pairsToFetchKey); // Remove the promise for the array
          return data;
        })
        .catch((error) => {
          console.error(
            `Error fetching prices for pairs ${pairsToFetch}:`,
            error,
          );
          pythPromisesCache.delete(pairsToFetchKey); // Ensure the promise is removed on error
          throw error;
        });
      pythPromisesCache.set(pairsToFetchKey, cachedPairsPromise);
    }

    const fetchedPrices = await cachedPairsPromise;
    fetchedPrices.forEach((pricePair, idx) => {
      prices[pairsToFetchIndexes[idx]] = pricePair.price;
    });
  }

  return prices as string[];
}
