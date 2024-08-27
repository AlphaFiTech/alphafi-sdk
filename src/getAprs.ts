import {
  calculateAprForPools,
  fetchAutoCompoundingEvents,
} from "./sui-sdk/events/fetchAutoCompoundingEvents";
import { PoolName } from "./common/types";

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
  return aprMap;
}
