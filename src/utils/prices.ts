import { PythPriceIdPair } from "../common/pyth.js";
import { SimpleCache } from "./simpleCache.js";

const latestPriceCache = new SimpleCache<string>(5000);
export async function getLatestPrices(
  pairs: PythPriceIdPair[],
  ignoreCache: boolean,
): Promise<string[]> {
  const pairsToFetch: PythPriceIdPair[] = [];
  const pairsToFetchIndexes: number[] = [];

  const prices: string[] = pairs.map((pair, index) => {
    const cacheKey = `getLatestPrice-${pair}`;
    if (ignoreCache) {
      latestPriceCache.delete(cacheKey);
    }
    const cachedResponse = latestPriceCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    pairsToFetch.push(pair);
    pairsToFetchIndexes.push(index);
    return "";
  });
  if (pairsToFetch.length > 0) {
    try {
      const fetchedPrices = await fetchPricesFromAlphaAPI(pairsToFetch);
      pairsToFetch.forEach((_pair, i) => {
        const price = fetchedPrices[i];
        prices[pairsToFetchIndexes[i]] = price.price;
      });
    } catch (error) {
      console.error(
        `Error in getLatestPrices for pairs ${pairsToFetch}:`,
        error,
      );
    }
  }
  prices.forEach((price, i) => {
    if (price) {
      const cacheKey = `getLatestPrice-${pairs[i]}`;
      latestPriceCache.set(cacheKey, price);
    }
  });
  return prices;
}

export async function getLatestTokenPricePairs(
  pairs: PythPriceIdPair[],
  ignoreCache: boolean,
): Promise<{ [key: string]: string | undefined }> {
  const priceMap: { [key: string]: string | undefined } = {};

  // Use getLatestPrices to fetch all prices at once
  const prices = await getLatestPrices(pairs, ignoreCache);

  pairs.forEach((pair, index) => {
    priceMap[pair] = prices[index];
  });

  return priceMap;
}

interface PythPricePair {
  pair: PythPriceIdPair;
  price: string;
}

async function fetchPricesFromAlphaAPI(
  pairs: PythPriceIdPair[],
): Promise<PythPricePair[]> {
  const req_url = `https://api.alphafi.xyz/alpha/fetchPrices?pairs=${pairs.join(",")}`;
  let prices: PythPricePair[] = [];
  try {
    const res = await fetch(req_url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = (await res.json()) as PythPricePair[];
    prices = data;
  } catch (error) {
    console.error(`Error fetching prices for pairs ${pairs}:`, error);
    throw error;
  }
  return prices;
}
