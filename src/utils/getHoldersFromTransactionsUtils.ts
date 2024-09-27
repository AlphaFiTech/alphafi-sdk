import { SuiObjectResponse } from "@mysten/sui/dist/cjs/client";
import {
  AlphaReceiptFields,
  OtherReceiptFields,
  LiquidityToUsdParams,
} from "../types";
import {
  poolIdPoolNameMap,
  poolCoinPairMap,
  getPoolExchangeRateMap,
  poolCoinMap,
} from "../common/maps";
import Decimal from "decimal.js";
import BN from "bn.js";
import { PoolName, CoinName, DoubleAssetPoolNames } from "../common/types";
import {
  ClmmPoolUtil,
  TickMath,
  CoinAmounts,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import { coins } from "../common/coins";

export async function parseTokensFromReceipts(
  receipts: SuiObjectResponse[],
): Promise<[string, string, string][]> {
  let userTokens: [string, string, string][] = [];

  for (const receipt of receipts) {
    const nftData = receipt.data?.content;
    if (nftData?.dataType === "moveObject") {
      const fields = nftData.fields as AlphaReceiptFields | OtherReceiptFields;
      const owner = fields.owner;
      const pool = poolIdPoolNameMap[fields.pool_id] as string;
      const xTokens = fields.xTokenBalance;
      userTokens.push([owner, pool, xTokens]);
    }
  }
  const conversionMap = await getPoolExchangeRateMap();
  userTokens = userTokens.map(([owner, pool, xTokens]) => {
    const conversion = new Decimal(
      conversionMap.get(pool as PoolName) as string,
    );
    const tokens = new Decimal(xTokens).mul(conversion).toFixed(4).toString();
    return [owner, pool, tokens];
  });

  return userTokens;
}

export function liquidityToUsd(
  params: LiquidityToUsdParams,
): string | undefined {
  let holdingUSD: string | undefined;
  if (params.poolName.slice(0, 4) === "NAVI") {
    holdingUSD = singleAssetLiquidityToUSD(
      params.liquidity,
      params.poolName,
      params.tokenPriceMap,
    );
  } else if (params.poolName === "ALPHA") {
    holdingUSD = alphaLiquidityToUSD(params.liquidity, params.tokenPriceMap);
  } else {
    holdingUSD = doubleAssetliquidityToUSD(params);
  }
  return holdingUSD;
}
function doubleAssetliquidityToUSD(params: {
  liquidity: string;
  poolName: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
  tokenPriceMap: Map<CoinName, string>;
}): string | undefined {
  const pool = params.poolName;
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
    const coin1 = poolCoinPairMap[pool as DoubleAssetPoolNames].coinA;
    const coin2 = poolCoinPairMap[pool as DoubleAssetPoolNames].coinB;

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

export function mergeDuplicateHoldings(
  userTokens: [string, string, string][],
): [string, string, string][] {
  const address_poolValueMap = new Map<string, number>();
  userTokens.forEach(([address, pool, value]) => {
    const key = `${address}_${pool}`;
    const numericValue = parseFloat(value);
    if (address_poolValueMap.has(key)) {
      address_poolValueMap.set(
        key,
        address_poolValueMap.get(key)! + numericValue,
      );
    } else {
      address_poolValueMap.set(key, numericValue);
    }
  });
  return Array.from(address_poolValueMap.entries()).map(([key, value]) => {
    const [address, pool] = key.split("_");
    return [address, pool, value.toFixed(2).toString()];
  });
}
