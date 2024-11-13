import {
  getPoolExchangeRateMap,
  getCetusInvestorTicksMap,
  getCetusSqrtPriceMap,
  poolCoinPairMap,
  poolCoinMap,
  poolInfo,
  coinsInPool,
} from "../common/maps.js";
import {
  DoubleAssetTokenHoldings,
  HoldingsObj,
  SingleAssetTokenHoldings,
  LiquidityToTokensParams,
} from "../types.js";
import { Decimal } from "decimal.js";
import {
  DoubleAssetPoolNames,
  PoolName,
  SingleAssetPoolNames,
} from "../common/types.js";
import {
  CoinAmounts,
  ClmmPoolUtil,
  TickMath,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import { coins } from "../common/coins.js";
import { getLatestTokenPricePairs } from "./prices.js";
import { PythPriceIdPair } from "../common/pyth.js";

export async function multiXTokensToLiquidity(xTokensHoldings: HoldingsObj[]) {
  let holdings: HoldingsObj[] = [];

  const exchangeRateMap = await getPoolExchangeRateMap();
  holdings = xTokensHoldings.map((holdingsObj) => {
    const conversion = new Decimal(
      exchangeRateMap.get(holdingsObj.poolName) as string,
    );
    const liquidity = new Decimal(holdingsObj.holding)
      .mul(conversion)
      .toString();
    return {
      owner: holdingsObj.owner,
      poolName: holdingsObj.poolName,
      holding: liquidity,
    };
  });

  return holdings;
}

export async function multiLiquidityToTokens(holdings: HoldingsObj[]) {
  const sqrtPriceCetusMap = await getCetusSqrtPriceMap();
  const ticksCetusMap = await getCetusInvestorTicksMap();
  let tokenHoldings: (SingleAssetTokenHoldings | DoubleAssetTokenHoldings)[] =
    holdings.map((holdingsObj) => {
      const tokens = liquidityToTokens({
        liquidity: holdingsObj.holding,
        poolName: holdingsObj.poolName,
        ticksCetusMap: ticksCetusMap,
        sqrtPriceCetusMap: sqrtPriceCetusMap,
      });
      if (typeof tokens === "string") {
        return {
          user: holdingsObj.owner,
          poolName: holdingsObj.poolName,
          tokens: tokens,
        } as SingleAssetTokenHoldings;
      } else {
        return {
          user: holdingsObj.owner,
          poolName: holdingsObj.poolName,
          tokenAmountA: tokens[0],
          tokenAmountB: tokens[1],
        } as DoubleAssetTokenHoldings;
      }
    });
  tokenHoldings = mergeDuplicateTokenHoldings(tokenHoldings);
  return tokenHoldings;
}

export function liquidityToTokens(
  params: LiquidityToTokensParams,
): string | [string, string] {
  let holdingUSD: string | undefined;
  if (params.poolName.slice(0, 4) === "NAVI") {
    holdingUSD = singleAssetLiquidityToTokens(
      params.liquidity,
      params.poolName,
    );
  } else if (params.poolName === "ALPHA") {
    holdingUSD = alphaLiquidityToTokens(params.liquidity);
  } else if (poolInfo[params.poolName].parentProtocolName === "CETUS") {
    const [holdingA, holdingB] = doubleAssetliquidityToTokens(params);
    return [holdingA, holdingB];
  } else if (poolInfo[params.poolName].parentProtocolName === "BUCKET") {
    if (params.poolName in poolCoinMap) {
      holdingUSD = singleAssetLiquidityToTokens(
        params.liquidity,
        params.poolName,
      );
    }
  } else {
    console.error(params.poolName);
    throw new Error("Unexpected Parent Protocol");
  }
  if (!holdingUSD)
    throw new Error(`holdingsUsd undefined for poolName: ${params.poolName}`);
  return holdingUSD;
}

function doubleAssetliquidityToTokens(params: {
  liquidity: string;
  poolName: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
}): [string, string] {
  const pool = params.poolName;
  const liquidity = params.liquidity;
  const ticksCetusMap = params.ticksCetusMap;
  const sqrtPriceCetusMap = params.sqrtPriceCetusMap;

  const upper_bound = 443636;
  let lower_tick = Number(ticksCetusMap[pool].lower);
  let upper_tick = Number(ticksCetusMap[pool].upper);

  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }
  const liquidityInt = Math.floor(Number(liquidity));
  const sqrtPrice = sqrtPriceCetusMap.get(pool as PoolName) as string;
  const coin_amounts: CoinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
    new BN(`${liquidityInt}`),
    new BN(sqrtPrice),
    TickMath.tickIndexToSqrtPriceX64(lower_tick),
    TickMath.tickIndexToSqrtPriceX64(upper_tick),
    true,
  );
  const coinAmounts = [
    coin_amounts.coinA.toNumber(),
    coin_amounts.coinB.toNumber(),
  ];
  const ten = new Decimal(10);
  const coin1 = poolCoinPairMap[pool as DoubleAssetPoolNames].coinA;
  const coin2 = poolCoinPairMap[pool as DoubleAssetPoolNames].coinB;

  const amount1 = new Decimal(coinAmounts[0]).div(ten.pow(coins[coin1].expo));
  const amount2 = new Decimal(coinAmounts[1]).div(ten.pow(coins[coin2].expo));
  return [amount1.toFixed(5).toString(), amount2.toFixed(4).toString()];
}

function alphaLiquidityToTokens(liquidity: string) {
  const amount = new Decimal(liquidity).div(1e9);
  return amount.toFixed(5);
}

function singleAssetLiquidityToTokens(liquidity: string, pool: string) {
  const singlePool = pool;
  if (
    poolInfo[pool].parentProtocolName === "NAVI" &&
    poolInfo[pool].strategyType !== "LOOPING"
  ) {
    const coin = poolCoinMap[singlePool as SingleAssetPoolNames];
    let amount = new Decimal(liquidity).div(Math.pow(10, 9 - coins[coin].expo));
    amount = amount.div(new Decimal(Math.pow(10, coins[coin].expo)));
    return amount.toFixed(5);
  } else if (
    poolInfo[pool].parentProtocolName === "NAVI" &&
    poolInfo[pool].strategyType === "LOOPING"
  ) {
    const coin = coinsInPool(pool as SingleAssetPoolNames);
    const amount = new Decimal(liquidity).div(Math.pow(10, coins[coin].expo));
    return amount.toFixed(5);
  } else if (
    poolInfo[pool].parentProtocolName === "BUCKET" &&
    pool in poolCoinMap
  ) {
    const coin = poolCoinMap[singlePool as SingleAssetPoolNames];
    const amount = new Decimal(liquidity).div(
      new Decimal(Math.pow(10, coins[coin].expo)),
    );
    return amount.toFixed(5);
  } else {
    throw new Error("Incorrect pool in argument");
  }
}

function mergeDuplicateTokenHoldings(
  tokenHoldings: (SingleAssetTokenHoldings | DoubleAssetTokenHoldings)[],
) {
  const uniqueOwnerPoolMap = new Map<
    string,
    { tokens: string } | { tokenAmountA: string; tokenAmountB: string }
  >();

  for (const holding of tokenHoldings) {
    const owner = holding.user;
    const poolName = holding.poolName;
    const key = `${owner}_${poolName}`;
    if (uniqueOwnerPoolMap.has(key)) {
      const existingTokens = uniqueOwnerPoolMap.get(key);
      if ("tokens" in existingTokens!) {
        const thisHolding = holding as SingleAssetTokenHoldings;
        uniqueOwnerPoolMap.set(key, {
          tokens: (
            parseFloat(thisHolding.tokens) + parseFloat(existingTokens.tokens)
          )
            .toFixed(5)
            .toString(),
        });
      } else {
        const thisHolding = holding as DoubleAssetTokenHoldings;
        const tokensObj = {
          tokenAmountA: (
            parseFloat(thisHolding.tokenAmountA) +
            parseFloat(existingTokens!.tokenAmountA)
          )
            .toFixed(5)
            .toString(),
          tokenAmountB: (
            parseFloat(thisHolding.tokenAmountB) +
            parseFloat(existingTokens!.tokenAmountB)
          )
            .toFixed(5)
            .toString(),
        };
        uniqueOwnerPoolMap.set(key, tokensObj);
      }
    } else {
      if ("tokens" in holding) {
        uniqueOwnerPoolMap.set(key, { tokens: holding.tokens });
      } else {
        uniqueOwnerPoolMap.set(key, {
          tokenAmountA: holding.tokenAmountA,
          tokenAmountB: holding.tokenAmountB,
        });
      }
    }
  }

  const uniqueOwnerPoolMapArr = Array.from(uniqueOwnerPoolMap);
  const result: (SingleAssetTokenHoldings | DoubleAssetTokenHoldings)[] =
    uniqueOwnerPoolMapArr.map(([owner_pool, holding]) => {
      const owner = owner_pool.split("_")[0];
      const poolName = owner_pool.split("_")[1];
      return { user: owner, poolName: poolName, ...holding } as
        | SingleAssetTokenHoldings
        | DoubleAssetTokenHoldings;
    });
  return result;
}

export async function multiTokensToUsd(
  tokensHoldings: (SingleAssetTokenHoldings | DoubleAssetTokenHoldings)[],
): Promise<HoldingsObj[]> {
  const time0 = Date.now();
  const pricePairs = new Set<PythPriceIdPair>();
  tokensHoldings.map((o) => {
    if ("tokens" in o) {
      const thisCoins = coinsInPool(o.poolName);
      pricePairs.add(`${thisCoins}/USD` as PythPriceIdPair);
    } else if ("tokenAmountA" in o) {
      const thisCoins = coinsInPool(o.poolName);
      pricePairs.add(`${thisCoins.coinA}/USD` as PythPriceIdPair);
      pricePairs.add(`${thisCoins.coinB}/USD` as PythPriceIdPair);
    }
  });

  const usdHoldings: HoldingsObj[] = [];
  const prices = await getLatestTokenPricePairs(Array.from(pricePairs), false);

  for (const tokenHolding of tokensHoldings) {
    if ("tokens" in tokenHolding) {
      // SingleAssetTokenHoldings
      const singlePool = tokenHolding.poolName;
      const coin = coinsInPool(singlePool);
      const priceOfCoin = prices[`${coin}/USD`];
      if (priceOfCoin) {
        const amountInUSD = new Decimal(tokenHolding.tokens).mul(priceOfCoin);
        usdHoldings.push({
          owner: tokenHolding.user,
          poolName: tokenHolding.poolName,
          holding: amountInUSD.toFixed(2).toString(),
        });
      }
    } else {
      // DoubleAssetTokenHoldings
      const poolName = tokenHolding.poolName;
      const coin1 = poolCoinPairMap[poolName].coinA;
      const coin2 = poolCoinPairMap[poolName].coinB;
      const priceOfCoin1 = prices[`${coin1}/USD`];
      const priceOfCoin2 = prices[`${coin2}/USD`];

      if (priceOfCoin1 && priceOfCoin2) {
        const amount = new Decimal(tokenHolding.tokenAmountA)
          .mul(priceOfCoin1)
          .add(new Decimal(tokenHolding.tokenAmountB).mul(priceOfCoin2));
        usdHoldings.push({
          owner: tokenHolding.user,
          poolName: tokenHolding.poolName,
          holding: amount.toFixed(2).toString(),
        });
      }
    }
  }

  return usdHoldings;
}
