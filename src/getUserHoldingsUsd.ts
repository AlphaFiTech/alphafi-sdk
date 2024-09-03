import {
  getCetusSqrtPriceMap,
  getCetusInvestorTicksMap,
  getTokenPriceMap,
  poolCoinPairMap,
  poolCoinMap,
} from "./common/maps";
import { getUserTokens } from "./getUserHoldings";
import { PoolName, CoinName, CoinAmounts } from "./common/types";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { coins } from "./common/coins";
import BN from "bn.js";
import Decimal from "decimal.js";

export async function getUserHoldingsUsd(params?: {
  pools?: string[];
  startTime?: number;
  endTime?: number;
  owners?: string[];
}): Promise<[string, string, string][]> {
  let usdHoldings: [string, string, string][] = [];

  // format: [address pool tokens][]
  const tokenHoldings = await getUserTokens(params);
  const sqrtPriceCetusMap = await getCetusSqrtPriceMap();
  const ticksCetusMap = await getCetusInvestorTicksMap();
  const tokenPriceMap = await getTokenPriceMap();
  usdHoldings = tokenHoldings.map(([address, pool, tokens]) => {
    const params = {
      liquidity: tokens,
      pool: pool,
      ticksCetusMap: ticksCetusMap,
      sqrtPriceCetusMap: sqrtPriceCetusMap,
      tokenPriceMap: tokenPriceMap,
    };
    const usdVal = liquidityToUSD(params) as string;
    return [address, pool, usdVal];
  });
  usdHoldings = mergeDuplicateHoldings(usdHoldings);

  return usdHoldings;
}

function liquidityToUSD(params: {
  liquidity: string;
  pool: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
  tokenPriceMap: Map<CoinName, string>;
}): string | undefined {
  let holdingUSD: string | undefined;
  if (params.pool.slice(0, 4) === "NAVI") {
    holdingUSD = singleAssetLiquidityToUSD(
      params.liquidity,
      params.pool,
      params.tokenPriceMap,
    );
  } else if (params.pool === "ALPHA") {
    holdingUSD = alphaLiquidityToUSD(params.liquidity, params.tokenPriceMap);
  } else {
    holdingUSD = doubleAssetliquidityToUSD(params);
  }
  return holdingUSD;
}
function doubleAssetliquidityToUSD(params: {
  liquidity: string;
  pool: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
  tokenPriceMap: Map<CoinName, string>;
}): string | undefined {
  const pool = params.pool;
  const liquidity = params.liquidity;
  const ticksCetusMap = params.ticksCetusMap;
  const sqrtPriceCetusMap = params.sqrtPriceCetusMap;
  const tokenPriceMap = params.tokenPriceMap;

  try {
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
    const coin1 =
      poolCoinPairMap[
        pool as Exclude<
          PoolName,
          | "NAVI-VSUI"
          | "NAVI-SUI"
          | "NAVI-WETH"
          | "NAVI-USDC"
          | "NAVI-USDT"
          | "ALPHA"
        >
      ].coinA;
    const coin2 =
      poolCoinPairMap[
        pool as Exclude<
          PoolName,
          | "NAVI-VSUI"
          | "NAVI-SUI"
          | "NAVI-WETH"
          | "NAVI-USDC"
          | "NAVI-USDT"
          | "ALPHA"
        >
      ].coinB;

    const amount1 = new Decimal(coinAmounts[0]).div(ten.pow(coins[coin1].expo));
    const amount2 = new Decimal(coinAmounts[1]).div(ten.pow(coins[coin2].expo));
    const priceOfCoin1 = tokenPriceMap.get(coin1);
    const priceOfCoin2 = tokenPriceMap.get(coin2);
    if (priceOfCoin1 && priceOfCoin2) {
      const amount = amount1.mul(priceOfCoin1).add(amount2.mul(priceOfCoin2));
      return amount.toFixed(2).toString();
    }
  } catch (error) {
    console.error(`Error fetching price of ${pool}:`, error);
    return undefined;
  }
}
function alphaLiquidityToUSD(
  liquidity: string,
  tokenPriceMap: Map<CoinName, string>,
) {
  try {
    const priceOfAlpha = tokenPriceMap.get("ALPHA");
    if (priceOfAlpha) {
      let amount = new Decimal(liquidity).div(1e9);
      amount = amount.mul(priceOfAlpha);
      return amount.toFixed(2).toString();
    }
  } catch (error) {
    console.error(`Error fetching price of ALPHA:`, error);
    return undefined;
  }
}
function singleAssetLiquidityToUSD(
  liquidity: string,
  pool: string,
  tokenPriceMap: Map<CoinName, string>,
) {
  try {
    const singlePool = pool as Extract<
      PoolName,
      "NAVI-VSUI" | "NAVI-SUI" | "NAVI-WETH" | "NAVI-USDC" | "NAVI-USDT"
    >;
    const coin = poolCoinMap[singlePool];
    let amount = new Decimal(liquidity).div(Math.pow(10, 9 - coins[coin].expo));
    amount = amount.div(new Decimal(Math.pow(10, coins[coin].expo)));
    const priceOfCoin = tokenPriceMap.get(coin);
    if (priceOfCoin) {
      const amountInUSD = amount.mul(priceOfCoin);
      return amountInUSD.toFixed(2).toString();
    }
  } catch (error) {
    console.error(`Error fetching price of ${pool}:`, error);
    return undefined;
  }
}

function mergeDuplicateHoldings(
  userTokens: [string, string, string][],
): [string, string, string][] {
  const map = new Map<string, number>();
  userTokens.forEach(([address, pool, value]) => {
    const key = `${address}~${pool}`;
    const numericValue = parseFloat(value);
    if (map.has(key)) {
      map.set(key, map.get(key)! + numericValue);
    } else {
      map.set(key, numericValue);
    }
  });
  return Array.from(map.entries()).map(([key, value]) => {
    const [address, pool] = key.split("~");
    return [address, pool, value.toString()];
  });
}
