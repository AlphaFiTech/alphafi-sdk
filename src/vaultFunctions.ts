//import { SuiClient } from "@mysten/sui/client";
import {
  LpBreakdownType,
  PoolName,
  RebalanceHistoryType,
} from "./common/types";

export async function alphaLpBreakdown(
  poolName: PoolName,
): Promise<LpBreakdownType> {
  const lp = {
    coinA: null,
    coinAInUsd: null,
    coinB: null,
    coinBInUsd: null,
    liquidity: null,
  };

  console.log(poolName);
  return lp;
}

export async function cetusLpBreakdown(
  poolName: PoolName,
): Promise<LpBreakdownType> {
  const lp = {
    coinA: null,
    coinAInUsd: null,
    coinB: null,
    coinBInUsd: null,
    liquidity: null,
  };

  console.log(poolName);
  return lp;
}

export async function fetchRebalanceHistory(
  poolName: PoolName,
): Promise<RebalanceHistoryType[]> {
  const rebalanceArr: RebalanceHistoryType[] = [];
  console.log(poolName);
  return rebalanceArr;
}

export async function lastAutocompoundTime(
  poolName: PoolName,
): Promise<string> {
  console.log(poolName);
  return "1234";
}
