import { PythPriceIdPair } from "../common/pyth.js";
import { SimpleCache } from "./simpleCache.js";

const latestPriceCache = new SimpleCache<string>(5000);

export const coinsToGetFromPyth: PythPriceIdPair[] = [
  "SUI/USD" as PythPriceIdPair,
  "USDC/USD" as PythPriceIdPair,
  "USDT/USD" as PythPriceIdPair,
  "HASUI/USD" as PythPriceIdPair,
  "CETUS/USD" as PythPriceIdPair,
  "VSUI/USD" as PythPriceIdPair,
  "NAVX/USD" as PythPriceIdPair,
  "SCA/USD" as PythPriceIdPair,
  "AFSUI/USD" as PythPriceIdPair,
  "WETH/USD" as PythPriceIdPair,
  "WBTC/USD" as PythPriceIdPair,
  "TURBOS/USD" as PythPriceIdPair,
  "CELO/USD" as PythPriceIdPair,
  "SLP/USD" as PythPriceIdPair,
  "SOL/USD" as PythPriceIdPair,
  "APT/USD" as PythPriceIdPair,
  "BUCK/USD" as PythPriceIdPair,
  "WSOL/USD" as PythPriceIdPair,
  "WUSDC/USD" as PythPriceIdPair,
  "ALPHA/USD" as PythPriceIdPair,
  "FUD/USD" as PythPriceIdPair,
  "BLUB/USD" as PythPriceIdPair,
  "ETH/USD" as PythPriceIdPair,
  "DEEP/USD" as PythPriceIdPair,
  "AUSD/USD" as PythPriceIdPair,
  "USDY/USD" as PythPriceIdPair,
  "NS/USD" as PythPriceIdPair,
  "BLUE/USD" as PythPriceIdPair,
  "SEND/USD" as PythPriceIdPair,
  "STSUI/USD" as PythPriceIdPair,
  "SUIUSDT/USD" as PythPriceIdPair,
  "SUIBTC/USD" as PythPriceIdPair,
  "LBTC/USD" as PythPriceIdPair,
  "WAL/USD" as PythPriceIdPair,
  "MUSD/USD" as PythPriceIdPair,
];

export async function getMultiLatestPrices() {
  const pricesFromPyth = await getLatestPrices(coinsToGetFromPyth, true);
  pricesFromPyth.forEach((price, index) => {
    if (price) {
      const cacheKey = `getLatestPrice-${coinsToGetFromPyth[index]}`;
      latestPriceCache.set(cacheKey, price);
    }
  });
}

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
      for (let i = 0; i < pairsToFetch.length; i++) {
        const price = fetchedPrices[i];
        prices[pairsToFetchIndexes[i]] = price.price;
      }
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
