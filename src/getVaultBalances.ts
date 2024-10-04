import {
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  PoolName,
  SingleAssetVaultBalance,
} from "./common/types";
import { fetchUserVaultBalances } from "./sui-sdk/functions/fetchUserVaultBalances";
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
  GetUsersActivityParams,
  GetUsersActivityResponse,
} from "./types";
import { FetchLiquidityChangeEventsParams } from "./sui-sdk/events/types";
import { fetchLiquidityChangeEvents } from "./sui-sdk/events/fetchLiquidityChangeEvents";
import { parseXTokensFromLCEvent } from "./sui-sdk/events/parseData";
import {
  getDepositActivity,
  getFullWithdrawActivity,
  multiLiquidityToTokens,
  multiTokensToUsd,
  multiXTokensToLiquidity,
} from "./utils/userHoldings";
import { poolInfo } from "./common/maps";

// TODO: Deprecate in favour of getUsersActivity()
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
    const vaultBalance = await fetchUserVaultBalances(address, poolName);

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

export async function getUsersActivity(
  params: GetUsersActivityParams,
): Promise<GetUsersActivityResponse> {
  const poolNames = params.poolNames
    ? params.poolNames
    : (Object.keys(poolInfo) as PoolName[]);
  const startTime = params.startTime
    ? params.startTime
    : Date.now() - 24 * 60 * 60 * 1000;
  const endTime = params.endTime ? params.endTime : Date.now();
  if (startTime > endTime) {
    throw new Error("startTime must be less than endTime");
  }
  const liquidityChangeEvents = await fetchLiquidityChangeEvents({
    startTime,
    endTime,
    poolNames,
  });
  const depositActivity = getDepositActivity({ events: liquidityChangeEvents });
  const fullWithdrawActivity = getFullWithdrawActivity({
    events: liquidityChangeEvents,
  });
  return { depositActivity, fullWithdrawActivity };
}
