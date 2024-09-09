import { SuiTransactionBlockResponse, TransactionFilter, SuiObjectResponse } from "@mysten/sui/client";
import { fetchTransactions } from "./sui-sdk/transactions/fetchTransactions";
import { nonAlphaDepositFilters, alphaDepositFilters } from "./sui-sdk/transactions/constants";
import { GetUserTokensFromTransactionsParams, AlphaReceiptFields, OtherReceiptFields, GetUserTokensInUsdFromTransactionsParams, UserUsdHoldings, LiquidityToUsdParams } from "./types";
import { getReceipts } from "./utils/getReceipts";
import { poolIdPoolNameMap, getPoolExchangeRateMap, getCetusSqrtPriceMap, getCetusInvestorTicksMap, getTokenPriceMap, poolCoinPairMap, poolCoinMap } from "./common/maps";
import { PoolName, CoinName } from "./common/types";
import Decimal from "decimal.js";
import { CoinAmounts, ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { BN } from "bn.js";
import { coins } from "./common/coins";


// TODO: add functionality for Pool
export async function getHoldersFromTransactions(params?: {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<string[]> {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  const startTime = params?.startTime ? params.startTime : twentyFourHoursAgo;
  const endTime = params?.endTime ? params.endTime : now;

  let userList: string[] = [];
  const filters: TransactionFilter[] = [...alphaDepositFilters, ...nonAlphaDepositFilters];
  const transactions: SuiTransactionBlockResponse[] = await fetchTransactions({
    startTime: startTime,
    endTime: endTime,
    filter: filters,
    sort: "descending",
  });
  const users = transactions.map((tx) => {
    const owner = tx.effects?.gasObject.owner as { AddressOwner: string };
    return owner.AddressOwner;
  })

  const userSet = new Set<string>(userList);
  return Array.from(userSet);
}

export async function getUserTokensFromTransactions(
  params?: GetUserTokensFromTransactionsParams,
): Promise<[string, string, string][]> {
  let owners: string[];
  if (params?.owners) {
    owners = params.owners;
  } else {
    owners = await getHoldersFromTransactions({
      poolNames: params?.poolNames,
      startTime: params?.startTime,
      endTime: params?.endTime,
    });
  }
  const receipts = await getReceipts({
    poolNames: params?.poolNames,
    owners: owners,
  });
  const userTokens = parseTokensFromReceipts(receipts);
  return userTokens;
}

export async function getUserTokensInUsdFromTransactions(
  params?: GetUserTokensInUsdFromTransactionsParams
): Promise<UserUsdHoldings[]> {
  let usdHoldings: [string, string, string][] = [];

  // format: [address pool tokens][]
  let tokenHoldings: [string, string, string][];
  if (params?.userTokensHoldings) {
    tokenHoldings = params.userTokensHoldings;
  } else {
    tokenHoldings = await getUserTokensFromTransactions(params);
  }
  const sqrtPriceCetusMap = await getCetusSqrtPriceMap();
  const ticksCetusMap = await getCetusInvestorTicksMap();
  const tokenPriceMap = await getTokenPriceMap();
  usdHoldings = tokenHoldings.map(([address, poolName, tokens]) => {
    const params: LiquidityToUsdParams = {
      liquidity: tokens,
      poolName: poolName,
      ticksCetusMap: ticksCetusMap,
      sqrtPriceCetusMap: sqrtPriceCetusMap,
      tokenPriceMap: tokenPriceMap,
    };
    const usdVal = liquidityToUsd(params) as string;
    return [address, poolName, usdVal];
  });
  usdHoldings = mergeDuplicateHoldings(usdHoldings);
  const userUsdHoldings: UserUsdHoldings[] = usdHoldings.map(
    ([address, pool, value]) => {
      return {
        user: address,
        poolName: pool as PoolName,
        usdHoldings: value,
      };
    },
  );

  return userUsdHoldings;
}

async function parseTokensFromReceipts(
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

function liquidityToUsd(params: LiquidityToUsdParams): string | undefined {
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
