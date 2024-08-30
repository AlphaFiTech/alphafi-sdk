import { PoolName, RebalanceHistoryType } from "./common/types";
import {
  calculateRebalanceHistoryFromEvents,
  fetchRebalanceEvents,
} from "./sui-sdk/events/fetchRebalanceEvents";

export async function getRebalanceHistory(
  poolName: PoolName,
): Promise<RebalanceHistoryType[]> {
  const historyMap = await getRebalanceHistories([poolName]);
  const history = historyMap[poolName];
  return history;
}

export async function getRebalanceHistories(
  poolNames?: PoolName[],
): Promise<Record<string, RebalanceHistoryType[]>> {
  const endTime = Date.now();
  const startTime = endTime - 24 * 60 * 60 * 1000 * 30; // timestamp for 1 month ago

  const events = await fetchRebalanceEvents({
    startTime: startTime,
    endTime: endTime,
    poolNames: poolNames,
  });

  const rebalanceHistoryMap = await calculateRebalanceHistoryFromEvents(events);
  return rebalanceHistoryMap;
}
