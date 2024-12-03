import {
  AlphaFiVaultBalance,
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  PoolName,
  SingleAssetVaultBalance,
} from "./common/types.js";
import { fetchUserVaultBalances } from "./sui-sdk/functions/fetchUserVaultBalances.js";
import {
  MultiGetVaultBalancesParams,
  HoldingsObj,
  SingleAssetTokenHoldings,
  DoubleAssetTokenHoldings,
  AlphaFiMultiVaultBalance,
  SingleAssetMultiVaultBalance,
  DoubleAssetMultiVaultBalance,
  VaultBalance,
  GetVaultBalanceForActiveUsersParams,
} from "./types.js";
import { FetchLiquidityChangeEventsParams } from "./sui-sdk/events/types.js";
import { fetchLiquidityChangeEvents } from "./sui-sdk/events/fetchLiquidityChangeEvents.js";
import { parseXTokensFromLCEvent } from "./sui-sdk/events/parseData.js";
import {
  multiLiquidityToTokens,
  multiTokensToUsd,
  multiXTokensToLiquidity,
} from "./utils/userHoldings.js";
import { getMultiLatestPrices } from "./utils/prices.js";
import { poolInfo } from "./common/maps.js";

export async function getXTokenVaultBalanceForActiveUsers(
  params: GetVaultBalanceForActiveUsersParams,
) {
  const liquidityChangeEvents = await fetchLiquidityChangeEvents(
    params as FetchLiquidityChangeEventsParams,
  );
  const xTokenHoldingsArr = parseXTokensFromLCEvent(liquidityChangeEvents);
  const xTokenHoldingsObj: HoldingsObj[] = xTokenHoldingsArr.map(
    ([address, poolName, xTokens]) => {
      return {
        owner: address,
        poolName: poolName as PoolName,
        holding: xTokens,
      };
    },
  );
  return xTokenHoldingsObj;
}

export async function getVaultBalanceForActiveUsers(
  params: GetVaultBalanceForActiveUsersParams,
) {
  // multirun

  const liquidityChangeEvents = await fetchLiquidityChangeEvents(
    params as FetchLiquidityChangeEventsParams,
  );
  const xTokenHoldingsArr = parseXTokensFromLCEvent(liquidityChangeEvents);
  const xTokenHoldingsObj: HoldingsObj[] = xTokenHoldingsArr.map(
    ([address, poolName, xTokens]) => {
      return {
        owner: address,
        poolName: poolName as PoolName,
        holding: xTokens,
      };
    },
  );
  const liquidityHoldingsObj: HoldingsObj[] =
    await multiXTokensToLiquidity(xTokenHoldingsObj);
  const tokenHoldingsObj: (
    | SingleAssetTokenHoldings
    | DoubleAssetTokenHoldings
  )[] = await multiLiquidityToTokens(liquidityHoldingsObj);
  const usdHoldingsObj: HoldingsObj[] =
    await multiTokensToUsd(tokenHoldingsObj);
  const uniqueUsdHoldings: { [key: string]: string } = {};
  usdHoldingsObj.map((usdHolding) => {
    uniqueUsdHoldings[`${usdHolding.owner}_${usdHolding.poolName}`] =
      usdHolding.holding;
  });
  const multiVaultBalances: AlphaFiMultiVaultBalance[] = tokenHoldingsObj.map(
    (tokenHolding) => {
      const owner = tokenHolding.user;
      const poolName = tokenHolding.poolName;
      const tokensInUsd = uniqueUsdHoldings[`${owner}_${poolName}`];

      if ("tokens" in tokenHolding) {
        return {
          owner: owner,
          poolName: poolName,
          tokens: tokenHolding.tokens,
          tokensInUsd: tokensInUsd,
        } as SingleAssetMultiVaultBalance;
      } else {
        return {
          owner: owner,
          poolName: poolName,
          tokenA: tokenHolding.tokenAmountA,
          tokenB: tokenHolding.tokenAmountB,
          tokensInUsd: tokensInUsd,
        } as DoubleAssetMultiVaultBalance;
      }
    },
  );

  return multiVaultBalances;
}

export async function getVaultBalance(
  address?: string,
  poolName?: PoolName,
  multiGet?: MultiGetVaultBalancesParams,
): Promise<VaultBalance> {
  if (address && poolName && !multiGet) {
    const vaultBalance = await fetchUserVaultBalances(address, poolName, false);

    return vaultBalance;
  } else if (!address && !poolName && multiGet) {
    // multirun
    const liquidityChangeEvents = await fetchLiquidityChangeEvents(
      multiGet as FetchLiquidityChangeEventsParams,
    );
    const xTokenHoldingsArr = parseXTokensFromLCEvent(liquidityChangeEvents);
    const xTokenHoldingsObj: HoldingsObj[] = xTokenHoldingsArr.map(
      ([address, poolName, xTokens]) => {
        return {
          owner: address,
          poolName: poolName as PoolName,
          holding: xTokens,
        };
      },
    );
    const liquidityHoldingsObj: HoldingsObj[] =
      await multiXTokensToLiquidity(xTokenHoldingsObj);
    const tokenHoldingsObj: (
      | SingleAssetTokenHoldings
      | DoubleAssetTokenHoldings
    )[] = await multiLiquidityToTokens(liquidityHoldingsObj);
    const usdHoldingsObj: HoldingsObj[] =
      await multiTokensToUsd(tokenHoldingsObj);
    const uniqueUsdHoldings: { [key: string]: string } = {};
    usdHoldingsObj.map((usdHolding) => {
      uniqueUsdHoldings[`${usdHolding.owner}_${usdHolding.poolName}`] =
        usdHolding.holding;
    });
    const multiVaultBalances: AlphaFiMultiVaultBalance[] = tokenHoldingsObj.map(
      (tokenHolding) => {
        const owner = tokenHolding.user;
        const poolName = tokenHolding.poolName;
        const tokensInUsd = uniqueUsdHoldings[`${owner}_${poolName}`];

        if ("tokens" in tokenHolding) {
          return {
            owner: owner,
            poolName: poolName,
            tokens: tokenHolding.tokens,
            tokensInUsd: tokensInUsd,
          } as SingleAssetMultiVaultBalance;
        } else {
          return {
            owner: owner,
            poolName: poolName,
            tokenA: tokenHolding.tokenAmountA,
            tokenB: tokenHolding.tokenAmountB,
            tokensInUsd: tokensInUsd,
          } as DoubleAssetMultiVaultBalance;
        }
      },
    );

    return multiVaultBalances;
  } else {
    throw new Error(
      "Invalid Params: Give only multiGet or only address and poolName",
    );
  }
}

export async function getAlphaVaultBalance(
  address: string,
): Promise<AlphaVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, "ALPHA");
  return vaultBalance as AlphaVaultBalance;
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, poolName);
  return vaultBalance as SingleAssetVaultBalance;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, poolName);
  return vaultBalance as DoubleAssetVaultBalance;
}

export async function getAllVaultBalances(
  address: string,
): Promise<Map<PoolName, AlphaFiVaultBalance>> {
  await getMultiLatestPrices();
  const pools = Object.keys(poolInfo);
  const res = new Map<PoolName, AlphaFiVaultBalance>();
  const promises = pools.map(async (pool) => {
    const result = await getVaultBalance(address, pool as PoolName);
    res.set(pool as PoolName, result as AlphaFiVaultBalance);
  });
  await Promise.all(promises);
  return res;
}
