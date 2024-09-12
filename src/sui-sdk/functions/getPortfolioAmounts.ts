import { SuiClient } from "@mysten/sui/client";
import Decimal from "decimal.js";
import { CoinName, PoolName } from "../..";
import {
  getCoinAmountsFromLiquidity,
  getPool,
  getPoolExchangeRate,
  getReceipts,
} from "./getReceipts";
import { SimpleCache } from "../../utils/simpleCache";
import { coins } from "../../common/coins";
import { poolCoinMap, poolCoinPairMap } from "../../common/maps";
import { PythPriceIdPair } from "../../common/pyth";
import { getLatestPrice } from "../../utils/prices";
import { getAlphaPrice } from "../../utils/clmm/prices";

export async function getAlphaPortfolioAmount(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
) {
  const receipts = await getReceipts(poolName, options);
  const pool = await getPool(poolName, { suiClient: options.suiClient });
  if (!pool) {
    throw new Error("Pool not found");
  }

  const exchangeRate = await getPoolExchangeRate(poolName, {
    suiClient: options.suiClient,
  });
  let totalXTokens = new Decimal(0);
  if (!exchangeRate) {
    return "0"; // if pool has 0 xtokens
  }
  if (options.isLocked === true) {
    receipts.forEach(async (receipt) => {
      const xTokens = new Decimal(receipt.content.fields.xTokenBalance);
      const bal = new Decimal(
        Number(receipt.content.fields.unlocked_xtokens) *
          exchangeRate.toNumber(),
      );
      totalXTokens = totalXTokens.add(xTokens.sub(bal));
    });
  } else if (options.isLocked === false) {
    receipts.forEach((receipt) => {
      const bal = new Decimal(
        Number(receipt.content.fields.unlocked_xtokens) *
          exchangeRate.toNumber(),
      );
      totalXTokens = totalXTokens.add(bal);
    });
  } else {
    receipts.forEach((receipt) => {
      const xTokens = receipt.content.fields.xTokenBalance;
      totalXTokens = totalXTokens.add(xTokens);
    });
  }
  if (totalXTokens.gt(0)) {
    const poolExchangeRate = await getPoolExchangeRate(poolName, options);
    if (poolExchangeRate) {
      const tokens = totalXTokens.div(1e9).mul(poolExchangeRate);
      return `${tokens}`;
    } else {
      console.error(`Could not get poolExchangeRate for poolName: ${poolName}`);
    }
  } else {
    return "0";
  }
}

export async function getAlphaPortfolioAmountInUSD(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
) {
  const tokens = await getAlphaPortfolioAmount(poolName, options);
  const priceOfAlpha = await getAlphaPrice();
  if (priceOfAlpha && tokens) {
    let amount = new Decimal(tokens);
    amount = amount.mul(priceOfAlpha);
    return amount.toString();
  }
}

const portfolioAmountCache = new SimpleCache<[number, number]>();
const portfolioAmountPromiseCache = new SimpleCache<
  Promise<[number, number]>
>();
export async function getPortfolioAmount(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean = false,
): Promise<[number, number] | undefined> {
  let portfolioAmount: [number, number] = [0, 0];
  const portfolioAmountCacheKey = `getPortfolioAmount:${poolName}-${options.address}}`;
  if (ignoreCache) {
    portfolioAmountCache.delete(portfolioAmountCacheKey);
    portfolioAmountPromiseCache.delete(portfolioAmountCacheKey);
  }
  const cachedResponse = portfolioAmountCache.get(portfolioAmountCacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  let cachedPromise = portfolioAmountPromiseCache.get(portfolioAmountCacheKey);

  if (!cachedPromise) {
    cachedPromise = (async () => {
      const receipts = await getReceipts(poolName, options);
      let totalXTokens = new Decimal(0);
      if (receipts) {
        receipts.forEach((receipt) => {
          const xTokens = receipt.content.fields.xTokenBalance;
          totalXTokens = totalXTokens.add(xTokens);
        });
      }

      if (totalXTokens.gt(0)) {
        const poolExchangeRate = await getPoolExchangeRate(poolName, options);
        if (poolExchangeRate) {
          const tokens = totalXTokens.mul(poolExchangeRate);
          const poolTokenAmounts = await getCoinAmountsFromLiquidity(
            poolName,
            tokens.toNumber(),
            { suiClient: options.suiClient },
          );
          portfolioAmount = poolTokenAmounts;
        } else {
          console.error(
            `Could not get poolExchangeRate for poolName: ${poolName}`,
          );
        }
      } else {
        portfolioAmount = [0, 0];
      }

      portfolioAmountCache.set(portfolioAmountCacheKey, portfolioAmount);
      portfolioAmountPromiseCache.delete(portfolioAmountCacheKey); // Remove the promise from cache
      return portfolioAmount;
    })().catch((error) => {
      portfolioAmountPromiseCache.delete(portfolioAmountCacheKey); // Remove the promise from cache
      throw error;
    });

    portfolioAmountPromiseCache.set(portfolioAmountCacheKey, cachedPromise);
  }

  return cachedPromise;
}

export async function getPortfolioAmountInUSD(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean = false,
): Promise<string | undefined> {
  if (
    poolName === "ALPHA-SUI" ||
    poolName === "USDT-USDC" ||
    poolName === "HASUI-SUI" ||
    poolName === "USDY-USDC" ||
    poolName === "USDC-SUI" ||
    poolName === "WETH-USDC" ||
    poolName === "USDC-WBTC" ||
    poolName === "NAVX-SUI"
  ) {
    const amounts = await getPortfolioAmount(poolName, options, ignoreCache);
    if (amounts !== undefined) {
      const ten = new Decimal(10);
      const pool1 = poolCoinPairMap[poolName].coinA as CoinName;
      const pool2 = poolCoinPairMap[poolName].coinB as CoinName;
      const amount0 = new Decimal(amounts[0]).div(
        ten.pow(coins[pool1 as CoinName].expo),
      );
      const amount1 = new Decimal(amounts[1]).div(
        ten.pow(coins[pool2 as CoinName].expo),
      );
      const tokens = poolName.split("-");
      const priceOfCoin0 = await getLatestPrice(
        `${tokens[0]}/USD` as PythPriceIdPair,
      );
      const priceOfCoin1 = await getLatestPrice(
        `${tokens[1]}/USD` as PythPriceIdPair,
      );
      if (priceOfCoin0 && priceOfCoin1) {
        const amount = amount0.mul(priceOfCoin0).add(amount1.mul(priceOfCoin1));
        return amount.toString();
      }
    } else {
      console.error(
        `getPortfolioAmountInUSD is not implemented for poolName: ${poolName}`,
      );
    }
    return "0";
  }
}

const singleAssetPortfolioAmountCache = new SimpleCache<number>();
const singleAssetPortfolioAmountPromiseCache = new SimpleCache<
  Promise<number>
>();
export async function getSingleAssetPortfolioAmount(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean = false,
) {
  let portfolioAmount: number = 0;
  const portfolioAmountCacheKey = `getPortfolioAmount:${poolName}-${options.address}}`;
  if (ignoreCache) {
    singleAssetPortfolioAmountCache.delete(portfolioAmountCacheKey);
    singleAssetPortfolioAmountPromiseCache.delete(portfolioAmountCacheKey);
  }
  const cachedResponse = singleAssetPortfolioAmountCache.get(
    portfolioAmountCacheKey,
  );

  if (cachedResponse) {
    return cachedResponse;
  }

  let cachedPromise = singleAssetPortfolioAmountPromiseCache.get(
    portfolioAmountCacheKey,
  );

  if (!cachedPromise) {
    cachedPromise = (async () => {
      const receipts = await getReceipts(poolName, options, ignoreCache);
      let totalXTokens = new Decimal(0);
      if (receipts) {
        receipts.forEach((receipt) => {
          const xTokens = receipt.content.fields.xTokenBalance;
          totalXTokens = totalXTokens.add(xTokens);
        });
      }
      if (totalXTokens.gt(0)) {
        const poolExchangeRate = await getPoolExchangeRate(
          poolName,
          options,
          ignoreCache,
        );
        if (poolExchangeRate) {
          let tokens = totalXTokens.mul(poolExchangeRate);
          tokens = tokens.div(
            Math.pow(
              10,
              9 - coins[poolCoinMap[poolName as keyof typeof poolCoinMap]].expo,
            ),
          );
          portfolioAmount = tokens.toNumber();
        } else {
          console.error(
            `Could not get poolExchangeRate for poolName: ${poolName}`,
          );
        }
      } else {
        portfolioAmount = 0;
      }

      singleAssetPortfolioAmountCache.set(
        portfolioAmountCacheKey,
        portfolioAmount,
      );
      singleAssetPortfolioAmountPromiseCache.delete(portfolioAmountCacheKey); // Remove the promise from cache
      return portfolioAmount;
    })().catch((error) => {
      singleAssetPortfolioAmountPromiseCache.delete(portfolioAmountCacheKey); // Remove the promise from cache
      throw error;
    });

    singleAssetPortfolioAmountPromiseCache.set(
      portfolioAmountCacheKey,
      cachedPromise,
    );
  }

  return cachedPromise;
}

export async function getSingleAssetPortfolioAmountInUSD(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean = false,
): Promise<string | undefined> {
  const amounts = await getSingleAssetPortfolioAmount(
    poolName,
    options,
    ignoreCache,
  );
  if (amounts !== undefined) {
    const amount = new Decimal(amounts).div(
      new Decimal(
        Math.pow(
          10,
          coins[poolCoinMap[poolName as keyof typeof poolCoinMap]].expo,
        ),
      ),
    );
    const priceOfCoin = await getLatestPrice(
      `${poolCoinMap[poolName as keyof typeof poolCoinMap]}/USD` as PythPriceIdPair,
    );
    if (priceOfCoin) {
      const amountInUSD = amount.mul(priceOfCoin);
      return amountInUSD.toString();
    }
  } else {
    console.error(
      `getPortfolioAmountInUSD is not implemented for poolName: ${poolName}`,
    );
  }
  return "0";
}
