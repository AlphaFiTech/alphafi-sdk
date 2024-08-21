import {
  poolIdPoolNameMap,
  poolIdQueryPoolMap,
  poolIdQueryInvestorMap,
  poolInfo,
  poolIdQueryCetusPoolMap,
  poolCoinPairMap,
  poolCoinMap,
} from "./common/maps";
import {
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  SingleAssetVaultBalance,
  PoolName,
  Receipt,
  AlphaReceipt,
  CoinName,
} from "./common/types";
import Decimal from "decimal.js";
import { fetchUserVaultBalances } from "./graphql/fetchData";
import { getLatestPrice, getLatestPrices } from "./utils/prices";
import { PythPriceIdPair } from "./common/pyth";
import { coins } from "./common/coins";

/**
 * Get the Alpha balance for a given address. AlphaVaultBalance
 * contains, locked, unlocked and total Alpha balance.
 *
 * @param address - Sui format account address
 *
 * @return AlphaVaultBalance
 */
export async function getAlphaVaultBalance(
  address: string,
): Promise<AlphaVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildAlphaVaultBalance(address, vaultsData);
  return balance;
}

/**
 * Get the liquidity pool balance for a given address and
   pool. DoubleAssetVaultBalance contains amounts for coinA * and
   coinB.
 *
 * @param address - Sui format account address
 *
 * @param poolName - AlphaFi PoolName
 *
 * @return DoubleAssetVaultBalance
 */
export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildDoubleAssetVaultBalance(
    address,
    vaultsData,
    poolName,
  );
  return balance;
}

/**
 * Get the vault balance for a given address and
   pool. SingleAssetVaultBalance contains amount of coin.
 *
 * @param address - Sui format account address
 *
 * @param poolName - AlphaFi PoolName
 *
 * @return SingleAssetVaultBalance
 */
export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildSingleAssetVaultBalance(
    address,
    vaultsData,
    poolName,
  );
  return balance;
}

async function buildAlphaVaultBalance(
  address: string,
  vaultsData: any,
): Promise<AlphaVaultBalance> {
  const receipt = (await buildReceipt(
    address,
    vaultsData,
    vaultsData.owner.alphaPoolReceipts.nodes,
    "ALPHA",
  )) as AlphaReceipt;
  if (receipt) {
    const balance: AlphaVaultBalance = {
      lockedAlphaCoins: receipt.lockedBalance,
      lockedAlphaCoinsInUSD: await coinAmountInUsd(
        receipt.lockedBalance,
        "ALPHA",
      ),
      unlockedAlphaCoins: receipt.unlockedBalance,
      unlockedAlphaCoinsInUSD: await coinAmountInUsd(
        receipt.unlockedBalance,
        "ALPHA",
      ),
      totalAlphaCoins: receipt.balance,
      totalAlphaCoinsInUSD: await coinAmountInUsd(receipt.balance, "ALPHA"),
    };
    return balance;
  } else {
    return {
      lockedAlphaCoins: "0",
      lockedAlphaCoinsInUSD: "0",
      unlockedAlphaCoins: "0",
      unlockedAlphaCoinsInUSD: "0",
      totalAlphaCoins: "0",
      totalAlphaCoinsInUSD: "0",
    };
  }
}

async function buildDoubleAssetVaultBalance(
  address: string,
  vaultsData: any,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance> {
  const allObjects = [
    ...vaultsData.owner.cetusSuiPoolReceipts.nodes,
    ...vaultsData.owner.cetusPoolReceipts.nodes,
    ...vaultsData.owner.cetusPoolBaseAReceipts.nodes,
  ];

  const receipt = await buildReceipt(address, vaultsData, allObjects, poolName);
  if (receipt) {
    const coinAType =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinA;
    const coinBType =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB;
    const amounts = await getCoinAmountsFromLiquidity(
      poolName,
      vaultsData,
      Number(receipt.balance),
    );
    const amountsInUsd = await coinAmountsInUsd(
      amounts.map((x) => x.toString()),
      [coinAType, coinBType],
    );
    const balance: DoubleAssetVaultBalance = {
      coinA: amounts[0].toString(),
      coinB: amounts[1].toString(),
      valueInUSD: amountsInUsd.reduce(
        (acc, curr) => (Number(acc) + Number(curr)).toString(),
        "0",
      ),
    };
    return balance;
  } else {
    return {
      coinA: "0",
      coinB: "0",
      valueInUSD: "0",
    } as DoubleAssetVaultBalance;
  }
}

async function buildSingleAssetVaultBalance(
  address: string,
  vaultsData: any,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance> {
  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.owner.alphaPoolReceipts.nodes,
    ...vaultsData.owner.naviPoolReceipts.nodes,
  ];

  const receipt = await buildReceipt(address, vaultsData, allObjects, poolName);
  if (receipt) {
    const coinType = poolCoinMap[poolName as keyof typeof poolCoinMap];
    const balance: SingleAssetVaultBalance = {
      coin: receipt.balance,
      valueInUSD: await coinAmountInUsd(receipt.balance, coinType),
    };
    return balance;
  } else {
    return { coin: "0", valueInUSD: "0" } as SingleAssetVaultBalance;
  }
}

async function buildReceipt(
  address: string,
  vaultsData: any,
  allObjects: any[],
  poolName: PoolName,
): Promise<AlphaReceipt | Receipt | undefined> {
  const receiptArr = allObjects.map((o) => {
    const poolNameFromQuery: PoolName =
      poolIdPoolNameMap[o.contents.json.pool_id];
    const addressFromQuery = o.contents.json.owner;
    const pool = poolInfo[poolName];
    const poolFromQuery =
      vaultsData[poolIdQueryPoolMap[o.contents.json.pool_id]].asMoveObject
        .contents.json;
    const xTokenBalance = new Decimal(o.contents.json.xTokenBalance);
    const xTokenSupply = new Decimal(poolFromQuery.xTokenSupply);
    const tokensInvested = new Decimal(poolFromQuery.tokensInvested);
    const userLiquidity = xTokenBalance.div(xTokenSupply).mul(tokensInvested);

    // match both poolName and owner address
    if (poolName === poolNameFromQuery && address === addressFromQuery) {
      if (pool.parentProtocolName === "ALPHAFI") {
        const unlockedXTokenBalance = new Decimal(
          o.contents.json.unlocked_xtokens,
        );
        const unlockedUserLiquidity = unlockedXTokenBalance
          .div(xTokenSupply)
          .mul(tokensInvested);

        const receipt: AlphaReceipt = {
          lockedBalance: userLiquidity.minus(unlockedUserLiquidity).toString(),
          unlockedBalance: unlockedUserLiquidity.toString(),
          balance: userLiquidity.toString(),
        };
        return receipt;
      } else if (
        pool.parentProtocolName === "CETUS" ||
        pool.parentProtocolName === "NAVI"
      ) {
        const receipt: Receipt = {
          balance: userLiquidity.toString(),
        };
        return receipt;
      }
    }
  });
  // get the first receipt because we support only one receipt from one pool
  const receipt = receiptArr.find((r) => {
    if (r) return true;
  });
  return receipt;
}

async function getCoinAmountsFromLiquidity(
  poolName: PoolName,
  vaultsData: any,
  liquidity: number,
): Promise<[number, number]> {
  const { ClmmPoolUtil, TickMath } = await import(
    "@cetusprotocol/cetus-sui-clmm-sdk"
  );

  // const { getTokenAmountsFromLiquidity } = await import(
  //   "./utils/clmm/tokenAmountFromLiquidity"
  // );
  // const { default: BigNumber } = await import("bignumber.js");
  const { default: BN } = await import("bn.js");

  let [coinA, coinB] = [new BN(0), new BN(0)];
  const investorFromQuery =
    vaultsData[poolIdQueryInvestorMap[poolInfo[poolName].poolId]];
  let lower_tick = parseInt(
    investorFromQuery.asMoveObject.contents.json.lower_tick,
  );
  let upper_tick = parseInt(
    investorFromQuery.asMoveObject.contents.json.upper_tick,
  );
  const cetusPoolFromQuery =
    vaultsData[poolIdQueryCetusPoolMap[poolInfo[poolName].poolId]].asMoveObject
      .contents.json;

  if (Math.abs(lower_tick - Math.pow(2, 32)) < lower_tick) {
    lower_tick = lower_tick - Math.pow(2, 32);
  }
  if (Math.abs(upper_tick - Math.pow(2, 32)) < upper_tick) {
    upper_tick = upper_tick - Math.pow(2, 32);
  }

  const curSqrtPrice = new BN(cetusPoolFromQuery.current_sqrt_price);
  const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(upper_tick);
  const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(lower_tick);

  ({ coinA, coinB } = ClmmPoolUtil.getCoinAmountFromLiquidity(
    new BN(liquidity),
    curSqrtPrice,
    lowerSqrtPrice,
    upperSqrtPrice,
    false,
  ));

  // const { tokenAmountA, tokenAmountB } = getTokenAmountsFromLiquidity(
  //   new BigNumber(liquidity),
  //   Number(cetusPoolFromQuery.current_sqrt_price),
  //   lower_tick,
  //   upper_tick,
  //   false,
  // );

  // coinA = new BN(tokenAmountA.toNumber());
  // coinB = new BN(tokenAmountB.toNumber());

  return [coinA.toNumber(), coinB.toNumber()];
}

async function coinAmountInUsd(
  amount: string,
  coinName: CoinName,
): Promise<string> {
  const coinPrice = await getLatestPrice(
    (coinName + "/USD") as PythPriceIdPair,
  );
  const amountInUsd = (
    (Number(amount) / Math.pow(10, coins[coinName].expo)) *
    Number(coinPrice)
  ).toString();
  return amountInUsd;
}

async function coinAmountsInUsd(
  amounts: string[],
  coinNames: CoinName[],
): Promise<string[]> {
  const coinPrices = await getLatestPrices([
    (coinNames[0] + "/USD") as PythPriceIdPair,
    (coinNames[1] + "/USD") as PythPriceIdPair,
  ]);

  const amountsInUsd = amounts.map((x, i) => {
    const amountInUsd = (
      (Number(x) / Math.pow(10, coins[coinNames[i]].expo)) *
      Number(coinPrices[i])
    ).toString();
    return amountInUsd;
  });

  return amountsInUsd;
}
