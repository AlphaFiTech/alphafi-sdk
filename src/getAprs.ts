import {
  calculateAprForPools,
  fetchAutoCompoundingEvents,
} from "./sui-sdk/events/fetchAutoCompoundingEvents.js";
import { PoolName } from "./common/types.js";
import { poolInfo } from "./common/maps.js";

export async function getApr(poolName: PoolName): Promise<number> {
  const aprMap = await getAprs([poolName]);
  const apr = aprMap[poolName];
  return apr;
}

export async function getAprs(
  poolNames?: PoolName[],
): Promise<Record<string, number>> {
  const endTime = Date.now();
  const startTime = endTime - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago

  const events = await fetchAutoCompoundingEvents({
    startTime: startTime,
    endTime: endTime,
    poolNames: poolNames,
  });

  const aprMap = await calculateAprForPools(events);

  for (const pool of Object.keys(poolInfo)) {
    const poolName = pool as PoolName;
    if (!(poolName in aprMap)) {
      aprMap[poolName] = 0;
    }
  }
  return aprMap;
}

export async function getApy(poolName: PoolName): Promise<number> {
  const apy = convertAprToApy(await getApr(poolName));
  return apy;
}

export async function getApys(
  poolNames?: PoolName[],
): Promise<Record<string, number>> {
  const aprMap = await getAprs(poolNames);

  // Convert each APR to APY
  const apyMap: Record<string, number> = {};
  for (const poolName in aprMap) {
    if (aprMap.hasOwnProperty(poolName)) {
      apyMap[poolName] = convertAprToApy(aprMap[poolName]);
    }
  }

  return apyMap;
}

/**
 * Converts APR to APY with compounding 6 times a day
 * @param apr - The annual percentage rate (APR) as a decimal
 * @returns The annual percentage yield (APY) as a decimal
 */
function convertAprToApy(apr: number): number {
  const n = 6 * 365; // 6 times a day
  const apy = 100 * (Math.pow(1 + apr / 100 / n, n) - 1);
  return apy;
}
