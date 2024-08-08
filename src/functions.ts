import BN from "bn.js";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { PaginatedObjectsResponse, SuiClient } from "@mysten/sui/client";
import Decimal from "decimal.js";
import { cetusPoolMap, poolInfo } from "./common/maps";
import {
  CetusInvestor,
  CetusPoolType,
  CoinAmounts,
  PoolName,
  Receipt,
  SimpleCache,
} from "./common/types";
import { getPool } from "./portfolioAmount";
import { getLatestPrice } from "./price";
import { conf, CONF_ENV } from "./common/constants";
import { Distributor } from "./common/alphaTypes";

export const launchTimestamp = 1719519457000;

const receiptsCache = new SimpleCache<Receipt[]>();
const receiptsPromiseCache = new SimpleCache<Promise<Receipt[]>>();
export async function getReceipts(
  poolName: string,
  options: {
    address: string;
    suiClient: SuiClient;
  },
  ignoreCache: boolean = false
): Promise<Receipt[]> {
  const receiptsCacheKey = `getReceipts-${poolName}-${options.address}`;
  if (ignoreCache) {
    receiptsCache.delete(receiptsCacheKey);
    receiptsPromiseCache.delete(receiptsCacheKey);
  }
  const cachedResponse = receiptsCache.get(receiptsCacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const nfts: Receipt[] = [];

  let cachedPromise = receiptsPromiseCache.get(receiptsCacheKey);
  if (!cachedPromise) {
    cachedPromise = (async (): Promise<Receipt[]> => {
      // const first_package = conf[CONF_ENV].ALPHA_FIRST_PACKAGE_ID;
      let currentCursor: string | null | undefined = null;
      /* eslint-disable-next-line no-constant-condition */
      while (true) {
        const paginatedObjects: PaginatedObjectsResponse =
          await options.suiClient.getOwnedObjects({
            owner: options.address,
            cursor: currentCursor,
            filter: {
              // StructType: `${first_package}::${module}::Receipt`,
              StructType: poolInfo[poolName].receiptType,
            },
            options: {
              showType: true,
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
          break;
        }
      }
      receiptsCache.set(receiptsCacheKey, nfts);
      receiptsPromiseCache.delete(receiptsCacheKey);
      return nfts;
    })().catch((error) => {
      // TODO: Jugaad
      if (poolInfo[poolName].parentProtocolName === "NAVI") {
        return nfts;
      } else {
        receiptsPromiseCache.delete(receiptsCacheKey); // Remove the promise from cache
        throw error;
      }
    });
    receiptsPromiseCache.set(receiptsCacheKey, cachedPromise);
  }
  return cachedPromise;
}

const poolExchangeRateCache = new SimpleCache<Decimal>();

export async function getPoolExchangeRate(
  poolName: PoolName,
  options: { suiClient: SuiClient },
  ignoreCache: boolean = false
): Promise<Decimal | undefined> {
  const poolExchangeRateCacheKey = `getPoolExchangeRate-${poolName}`;
  if (ignoreCache) {
    poolExchangeRateCache.delete(poolExchangeRateCacheKey);
  }
  const cachedResponse = poolExchangeRateCache.get(poolExchangeRateCacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  let pool = undefined;
  try {
    if (poolName === "ALPHA") {
      pool = await getPool("ALPHA", options);
    } else if (
      poolName === "ALPHA-SUI" ||
      poolName === "USDT-USDC" ||
      poolName === "USDY-USDC" ||
      poolName === "HASUI-SUI" ||
      poolName === "USDC-SUI" ||
      poolName === "WETH-USDC"
    ) {
      pool = await getPool(poolName, options);
    } else {
      pool = await getPool(poolName, options);
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

export async function getCoinAmountsFromLiquidity(
  poolName: PoolName,
  liquidity: number,
  options: { suiClient: SuiClient }
): Promise<[number, number]> {
  const cetus_pool = await getCetusPool(poolName, options);
  const cetusInvestor = await getCetusInvestor(poolName, options);

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
      true
    );

    return [coin_amounts.coinA.toNumber(), coin_amounts.coinB.toNumber()];
  } else {
    return [0, 0];
  }
}

const cetusPoolCache = new SimpleCache<CetusPoolType>();
const cetusPoolPromiseCache = new SimpleCache<
  Promise<CetusPoolType | undefined>
>();

export async function getCetusPool(
  poolName: string,
  options: {
    suiClient: SuiClient;
  },
  ignoreCache: boolean = false
): Promise<CetusPoolType | undefined> {
  const cacheKey = `pool_${cetusPoolMap[poolName.toUpperCase()]}`;
  if (ignoreCache) {
    cetusPoolCache.delete(cacheKey);
    cetusPoolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = cetusPoolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let cetusPoolPromise = cetusPoolPromiseCache.get(cacheKey);
  if (cetusPoolPromise) {
    return cetusPoolPromise;
  }

  // If not, create a new promise and cache it
  cetusPoolPromise = (async () => {
    try {
      const o = await options.suiClient.getObject({
        id: cetusPoolMap[poolName.toUpperCase()],
        options: {
          showContent: true,
        },
      });
      const cetusPool = o.data as CetusPoolType;

      // Cache the pool object
      cetusPoolCache.set(cacheKey, cetusPool);
      return cetusPool;
    } catch (e) {
      console.error(`getCetusPool failed for poolName: ${poolName}`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      cetusPoolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  cetusPoolPromiseCache.set(cacheKey, cetusPoolPromise);
  return cetusPoolPromise;
}

const cetusInvestorCache = new SimpleCache<CetusInvestor>();
const cetusInvestorPromiseCache = new SimpleCache<
  Promise<CetusInvestor | undefined>
>();

export async function getCetusInvestor(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
  ignoreCache: boolean = false
): Promise<CetusInvestor | undefined> {
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
      const o = await options.suiClient.getObject({
        id: poolInfo[poolName.toUpperCase()].investorId,
        options: {
          showContent: true,
        },
      });
      const cetus_investor = o.data as CetusInvestor;

      // Cache the investor object
      cetusInvestorCache.set(cacheKey, cetus_investor);
      return cetus_investor;
    } catch (e) {
      console.error(`getCetusInvestor failed for pool: ${poolName}`);
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

export const fetchAirdropReserves = async () => {
  //airdrop reserves calculation
  const presentTimestamp = new Date().getTime();
  const time_elapsed_in_days = (presentTimestamp - launchTimestamp) / 86400000;
  const alpha_price: any = await getLatestPrice("ALPHA/USD");
  const airdrop_reserves_in_usd = 2500 * time_elapsed_in_days * alpha_price;
  return airdrop_reserves_in_usd;
};

const distributorCache = new SimpleCache<Distributor>();
const distributorPromiseCache = new SimpleCache<
  Promise<Distributor | undefined>
>();

export async function getDistributor(
  options: {
    suiClient: SuiClient;
  },
  ignoreCache: boolean = false
): Promise<Distributor | undefined> {
  const cacheKey = `distributor_${conf[CONF_ENV].ALPHA_DISTRIBUTOR}`;
  if (ignoreCache) {
    distributorCache.delete(cacheKey);
    distributorPromiseCache.delete(cacheKey);
  }
  // Check if the distributor is already in the cache
  const cachedDistributor = distributorCache.get(cacheKey);
  if (cachedDistributor) {
    return cachedDistributor;
  }

  // Check if there is already a promise in the cache
  let distributorPromise = distributorPromiseCache.get(cacheKey);
  if (distributorPromise) {
    return distributorPromise;
  }

  // If not, create a new promise and cache it
  distributorPromise = (async () => {
    try {
      const o = await options.suiClient.getObject({
        id: conf[CONF_ENV].ALPHA_DISTRIBUTOR,
        options: {
          showContent: true,
        },
      });
      const distributor = o.data as Distributor;

      // Cache the distributor object
      distributorCache.set(cacheKey, distributor);
      return distributor;
    } catch (e) {
      console.error(`getDistributor failed`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      distributorPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  distributorPromiseCache.set(cacheKey, distributorPromise);
  return distributorPromise;
}
