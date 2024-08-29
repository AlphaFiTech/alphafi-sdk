import { getInvestorPoolMap, poolInfo } from "../../common/maps";
import { PoolName } from "../../common/types";
import { fetchEvents } from "./fetchEvents";
import {
  AutoCompoundingAndRebalanceEventNode,
  FetchAutoCompoundingAndRebalanceEventsParams,
  RebalanceEvent,
  RebalanceHistoryType,
} from "./types";

export async function fetchRebalanceEvents(
  params: FetchAutoCompoundingAndRebalanceEventsParams,
): Promise<AutoCompoundingAndRebalanceEventNode[]> {
  const eventTypesSet = new Set<string>();
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].rebalanceEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each rebalanceEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.rebalanceEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  }
  const eventTypes = Array.from(eventTypesSet);
  const eventsPromises = eventTypes.map(async (eventType) => {
    const events = (
      await fetchEvents({
        startTime: params.startTime,
        endTime: params.endTime,
        eventTypes: [eventType],
      })
    ).filter((e) => {
      if (params.poolNames) {
        return params.poolNames
          .map((poolName) => poolInfo[poolName].investorId)
          .includes(e.investor_id);
      } else {
        return true;
      }
    });
    return events;
  });

  const events = (await Promise.all(eventsPromises)).flat();

  const rebalanceEvents = events.map((e) => {
    return e as AutoCompoundingAndRebalanceEventNode;
  });

  return rebalanceEvents;
}

export async function calculateRebalanceHistoryFromEvents(
  events: AutoCompoundingAndRebalanceEventNode[],
): Promise<Record<PoolName, RebalanceHistoryType[]>> {
  const rebalanceHistoryMap: Record<string, RebalanceHistoryType[]> = {};
  const investorPoolNameMap = await getInvestorPoolMap();

  for (const e of events) {
    const event = e as RebalanceEvent;
    const poolName = investorPoolNameMap.get(event.investor_id);
    if (poolName) {
      if (!rebalanceHistoryMap[poolName]) {
        rebalanceHistoryMap[poolName] = [];
      }
      const history: RebalanceHistoryType = {
        timestamp: e.timestamp.toString(),
        lower_tick: event.lower_tick_after,
        upper_tick: event.upper_tick_after,
        after_price: event.sqrt_price_after,
      };
      rebalanceHistoryMap[poolName].push(history);
    }
  }

  return rebalanceHistoryMap;
}
