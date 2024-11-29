import { PaginatedObjectsResponse } from "@mysten/sui/client";
import {
  AlphaPoolType,
  CetusInvestor,
  NaviInvestor,
  CommonInvestorFields,
  CetusPoolType,
  CoinAmounts,
  PoolName,
  PoolType,
  Receipt,
  NaviVoloData,
  Investor,
  BluefinInvestor,
  BucketInvestor,
  SingleAssetPoolNames,
} from "../../index.js";
import { poolInfo } from "../../common/maps.js";
import { SimpleCache } from "../../utils/simpleCache.js";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import { Decimal } from "decimal.js";
import { getSuiClient } from "../client.js";

const receiptsCache = new SimpleCache<Receipt[]>();
const receiptsPromiseCache = new SimpleCache<Promise<Receipt[]>>();
export async function getReceipts(
  poolName: string,
  address: string,
  ignoreCache: boolean,
): Promise<Receipt[]> {
  const suiClient = getSuiClient();
  const receiptsCacheKey = `getReceipts-${poolInfo[poolName].receiptName}-${address}`;
  if (ignoreCache) {
    receiptsCache.delete(receiptsCacheKey);
    receiptsPromiseCache.delete(receiptsCacheKey);
  }
  const cachedResponse = receiptsCache.get(receiptsCacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  //
  const nfts: Receipt[] = [];
  if (poolInfo[poolName].receiptType == "") {
    return nfts;
  }
  let cachedPromise = receiptsPromiseCache.get(receiptsCacheKey);
  if (!cachedPromise) {
    cachedPromise = (async (): Promise<Receipt[]> => {
      // const first_package = getConf().ALPHA_FIRST_PACKAGE_ID;
      let currentCursor: string | null | undefined = null;
      while (true) {
        const paginatedObjects: PaginatedObjectsResponse =
          await suiClient.getOwnedObjects({
            owner: address,
            cursor: currentCursor,
            filter: {
              // StructType: `${first_package}::${module}::Receipt`,
              StructType: poolInfo[poolName].receiptType,
            },
            options: {
              showContent: true,
            },
          });
        // Traverse the current page data and push to coins array
        paginatedObjects.data.forEach((obj) => {
          const o = obj.data as Receipt;
          if (o) {
            if (poolInfo[poolName].receiptName === o.content.fields.name) {
              nfts.push(o);
            }
          }
        });
        // Check if there's a next page
        if (paginatedObjects.hasNextPage && paginatedObjects.nextCursor) {
          currentCursor = paginatedObjects.nextCursor;
        } else {
          // No more pages available
          // console.log("No more receipts available.");
          break;
        }
      }
      receiptsCache.set(receiptsCacheKey, nfts);
      receiptsPromiseCache.delete(receiptsCacheKey);
      return nfts;
    })().catch((error) => {
      receiptsPromiseCache.delete(receiptsCacheKey); // Remove the promise from cache
      throw error;
    });
    // const data = await cachedPromise;
    // console.log("received cached data", data);
    receiptsPromiseCache.set(receiptsCacheKey, cachedPromise);
  }
  return cachedPromise;
}

const poolExchangeRateCache = new SimpleCache<Decimal>();

export async function getPoolExchangeRate(
  poolName: PoolName,
  ignoreCache: boolean = false,
): Promise<Decimal | undefined> {
  const poolExchangeRateCacheKey = `getPoolExchangeRate-${poolName}`;
  if (ignoreCache) {
    poolExchangeRateCache.delete(poolExchangeRateCacheKey);
  }
  const cachedResponse = poolExchangeRateCache.get(poolExchangeRateCacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  let pool: PoolType | AlphaPoolType | undefined;
  try {
    if (poolName === "ALPHA") {
      pool = await getPool("ALPHA", ignoreCache);
    } else if (
      poolName === "ALPHA-SUI" ||
      poolName === "USDT-WUSDC" ||
      poolName === "USDY-WUSDC" ||
      poolName === "HASUI-SUI" ||
      poolName === "WUSDC-SUI" ||
      poolName === "WETH-WUSDC"
    ) {
      pool = await getPool(poolName, ignoreCache);
    } else {
      pool = await getPool(poolName, ignoreCache);
    }
    if (pool) {
      const xTokenSupply = new Decimal(pool.content.fields.xTokenSupply);
      let tokensInvested = new Decimal(pool.content.fields.tokensInvested);
      if (poolName == "ALPHA") {
        tokensInvested = new Decimal(pool.content.fields.alpha_bal);
      }

      // Check for division by zero
      if (xTokenSupply.eq(0)) {
        console.error("Division by zero error: tokensInvested is zero.");
        return undefined;
      }
      const poolExchangeRate = tokensInvested.div(xTokenSupply);

      poolExchangeRateCache.set(poolExchangeRateCacheKey, poolExchangeRate);

      return poolExchangeRate;
    }
  } catch (e) {
    console.error(`getPoolExchangeRate failed for poolName: ${poolName}`);
  }

  return undefined;
}

const poolCache = new SimpleCache<PoolType | AlphaPoolType>();
const poolPromiseCache = new SimpleCache<
  Promise<PoolType | AlphaPoolType | undefined>
>();

export async function getPool(
  poolName: string,
  ignoreCache: boolean,
): Promise<PoolType | AlphaPoolType | undefined> {
  const suiClient = getSuiClient();
  const cacheKey = `pool_${poolInfo[poolName.toUpperCase()].poolId}`;

  if (ignoreCache) {
    poolCache.delete(cacheKey);
    poolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = poolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let poolPromise = poolPromiseCache.get(cacheKey);
  if (poolPromise) {
    return poolPromise;
  }
  // If not, create a new promise and cache it
  poolPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: poolInfo[poolName].poolId,
        options: {
          showContent: true,
        },
      });

      const poolData =
        poolName === "ALPHA" ? (o.data as AlphaPoolType) : (o.data as PoolType);

      // Cache the pool object
      poolCache.set(cacheKey, poolData);
      return poolData;
    } catch (e) {
      console.error(`Error in getPool; poolName => ${poolName}`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      poolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  poolPromiseCache.set(cacheKey, poolPromise);
  return poolPromise;
}

const parentPoolCache = new SimpleCache<CetusPoolType>();
const parentPoolPromiseCache = new SimpleCache<
  Promise<CetusPoolType | undefined>
>();

export async function getParentPool(
  poolName: string,
  ignoreCache: boolean,
): Promise<CetusPoolType | undefined> {
  const suiClient = getSuiClient();
  const cacheKey = `pool_${poolInfo[poolName.toUpperCase()].parentPoolId}`;
  if (ignoreCache) {
    parentPoolCache.delete(cacheKey);
    parentPoolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = parentPoolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let parentPoolPromise = parentPoolPromiseCache.get(cacheKey);
  if (parentPoolPromise) {
    return parentPoolPromise;
  }
  // If not, create a new promise and cache it
  parentPoolPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: poolInfo[poolName.toUpperCase()].parentPoolId,
        options: {
          showContent: true,
        },
      });
      const parentPool = o.data as CetusPoolType;

      // Cache the pool object
      parentPoolCache.set(cacheKey, parentPool);
      return parentPool;
    } catch (e) {
      console.error(`getCetusPool failed for poolName: ${poolName}`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      parentPoolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  parentPoolPromiseCache.set(cacheKey, parentPoolPromise);
  return parentPoolPromise;
}

const cetusInvestorCache = new SimpleCache<Investor>();
const cetusInvestorPromiseCache = new SimpleCache<
  Promise<Investor | undefined>
>();

export async function getInvestor(
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<Investor | undefined> {
  const suiClient = getSuiClient();
  const cacheKey = `investor_${poolInfo[poolName.toUpperCase()].investorId}`;
  if (ignoreCache) {
    cetusInvestorCache.delete(cacheKey);
    cetusInvestorPromiseCache.delete(cacheKey);
  }
  // Check if the investor is already in the cache
  const cachedInvestor = cetusInvestorCache.get(cacheKey);
  if (cachedInvestor) {
    return cachedInvestor;
  }

  // Check if there is already a promise in the cache
  let cetusInvestorPromise = cetusInvestorPromiseCache.get(cacheKey);
  if (cetusInvestorPromise) {
    return cetusInvestorPromise;
  }
  // If not, create a new promise and cache it
  cetusInvestorPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: poolInfo[poolName.toUpperCase()].investorId,
        options: {
          showContent: true,
        },
      });
      let cetusInvestor;
      if (poolInfo[poolName].parentProtocolName == "NAVI") {
        cetusInvestor = o.data as NaviInvestor & CommonInvestorFields;
      } else if (poolInfo[poolName].parentProtocolName == "BUCKET") {
        cetusInvestor = o.data as BucketInvestor & CommonInvestorFields;
      } else if (poolInfo[poolName].parentProtocolName == "BLUEFIN") {
        cetusInvestor = o.data as BluefinInvestor & CommonInvestorFields;
      } else {
        cetusInvestor = o.data as CetusInvestor & CommonInvestorFields;
      }

      // Cache the investor object
      cetusInvestorCache.set(cacheKey, cetusInvestor);
      return cetusInvestor;
    } catch (e) {
      console.error(`getInvestor failed for pool: ${poolName}`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      cetusInvestorPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  cetusInvestorPromiseCache.set(cacheKey, cetusInvestorPromise);
  return cetusInvestorPromise;
}

const naviVoloExchangeRateCache = new SimpleCache<NaviVoloData>();
const naviVoloExchangeRatePromiseCache = new SimpleCache<
  Promise<NaviVoloData>
>();

export async function fetchVoloExchangeRate(
  ignoreCache: boolean = false,
): Promise<NaviVoloData> {
  const apiUrl = "https://open-api.naviprotocol.io/api/volo/stats";
  let NaviVoloDetails: NaviVoloData;
  if (ignoreCache) {
    naviVoloExchangeRateCache.clear();
    naviVoloExchangeRatePromiseCache.delete(apiUrl);
  }

  const cachedResponse = naviVoloExchangeRateCache.get(apiUrl);
  if (cachedResponse) {
    NaviVoloDetails = cachedResponse;
  } else {
    let cachedPromise = naviVoloExchangeRatePromiseCache.get(apiUrl);

    if (!cachedPromise) {
      cachedPromise = fetch(apiUrl)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = (await response.json()) as NaviVoloData; // Parse the JSON response
          naviVoloExchangeRateCache.set(apiUrl, data); // Cache the response
          naviVoloExchangeRatePromiseCache.delete(apiUrl); // Remove the promise from the cache
          return data;
        })
        .catch((error) => {
          naviVoloExchangeRatePromiseCache.delete(apiUrl); // Ensure the promise is removed on error
          throw error;
        });
      naviVoloExchangeRatePromiseCache.set(apiUrl, cachedPromise);
      NaviVoloDetails = await cachedPromise;
    }
    return cachedPromise;
  }

  return NaviVoloDetails;
}

export async function getCoinAmountsFromLiquidity(
  poolName: PoolName,
  liquidity: number,
): Promise<[number, number]> {
  const cetus_pool = await getParentPool(poolName, false);
  const cetusInvestor = (await getInvestor(poolName, false)) as CetusInvestor;

  const upper_bound = 443636;
  let lower_tick = Number(cetusInvestor!.content.fields.lower_tick);
  let upper_tick = Number(cetusInvestor!.content.fields.upper_tick);

  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }

  if (cetus_pool) {
    const liquidityInt = Math.floor(liquidity);
    const coin_amounts: CoinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
      new BN(`${liquidityInt}`),
      new BN(cetus_pool.content.fields.current_sqrt_price),
      TickMath.tickIndexToSqrtPriceX64(lower_tick),
      TickMath.tickIndexToSqrtPriceX64(upper_tick),
      true,
    );

    return [coin_amounts.coinA.toNumber(), coin_amounts.coinB.toNumber()];
  } else {
    return [0, 0];
  }
}

export async function multiGetNaviInvestor(
  poolNames: SingleAssetPoolNames[],
  ignoreCache: boolean = false,
) {
  const results: {
    [poolName in SingleAssetPoolNames]?:
      | (NaviInvestor & CommonInvestorFields)
      | undefined;
  } = {};
  const missingPoolInvestorIds: string[] = [];
  const missingPoolNames: SingleAssetPoolNames[] = [];

  for (const poolName of poolNames) {
    const cacheKey = `investor_${poolInfo[poolName.toUpperCase()].investorId}`;

    if (ignoreCache) {
      cetusInvestorCache.delete(cacheKey);
      cetusInvestorPromiseCache.delete(cacheKey);
    }

    // Check if the investor is already cached
    const cachedInvestor = cetusInvestorCache.get(cacheKey) as NaviInvestor &
      CommonInvestorFields;
    if (cachedInvestor) {
      results[poolName] = cachedInvestor;
      continue;
    } else {
      // Add to missing list if not in cache
      if (poolInfo[poolName.toUpperCase()].investorId) {
        missingPoolNames.push(poolName);
        missingPoolInvestorIds.push(
          poolInfo[poolName.toUpperCase()].investorId,
        );
      }
    }
  }

  try {
    const suiClient = getSuiClient();
    const objects = await suiClient.multiGetObjects({
      ids: missingPoolInvestorIds,
      options: { showContent: true },
    });
    for (let i = 0; i < objects.length; i++) {
      const investor = objects[i].data as NaviInvestor & CommonInvestorFields;
      const cacheKey = `investor_${missingPoolInvestorIds[i]}`;
      cetusInvestorCache.set(cacheKey, investor);
      results[missingPoolNames[i]] = investor;
    }
    return results;
  } catch (err) {
    //improve
    console.error(
      "multiGetNaviInvestor failed for poolNames: ",
      missingPoolNames.join(", "),
    );
    throw err;
  }
}

/*
for the missing pools, add a promise, each of those promises waits for there respective object from a map, that map is populated all at once, 
problem with concurrency
*/
// ask how to deal with this kind of probem with high concurrency anf throughput
