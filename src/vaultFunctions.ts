import { LpBreakdownType, PoolName } from "./common/types.js";

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

export async function lastAutocompoundTime(
  poolName: PoolName,
): Promise<string> {
  console.log(poolName);
  return "1234";
}
