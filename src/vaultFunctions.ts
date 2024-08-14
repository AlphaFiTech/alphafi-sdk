import { SuiClient } from "@mysten/sui/client";
import {
  LpBreakdownType,
  PoolName,
  RebalanceHistoryType,
} from "./common/types";

export async function alphaLpBreakdown(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<LpBreakdownType> {
  const lp = {
    coinA: null,
    coinAInUsd: null,
    coinB: null,
    coinBInUsd: null,
    liquidity: null,
  };

  console.log(poolName, options);
  return lp;
}

export async function cetusLpBreakdown(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<LpBreakdownType> {
  const lp = {
    coinA: null,
    coinAInUsd: null,
    coinB: null,
    coinBInUsd: null,
    liquidity: null,
  };

  console.log(poolName, options);
  return lp;
}

export async function fetchRebalanceHistory(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<RebalanceHistoryType[]> {
  const rebalanceArr: RebalanceHistoryType[] = [];
  console.log(poolName, options);
  return rebalanceArr;
}

export async function lastAutocompoundTime(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<string> {
  console.log(poolName, options);
  return "1234";
}
