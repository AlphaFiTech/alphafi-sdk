import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import {
  getInvestorPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../../common/maps.js";
import { PoolName, RebalanceHistoryType } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  FetchRebalanceEventsParams,
  RebalanceEvent,
  RebalanceEventNode,
} from "./types.js";
import { coinsList } from "../../common/coins.js";
import BN from "bn.js";

export async function fetchRebalanceEvents(
  params: FetchRebalanceEventsParams,
): Promise<RebalanceEventNode[]> {
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
        order: params.order,
      })
    ).filter((e) => {
      if (params.poolNames) {
        return params.poolNames
          .map((poolName) => poolInfo[poolName].investorId)
          .includes((e as RebalanceEventNode).investor_id);
      } else {
        return true;
      }
    });
    return events;
  });

  const events = (await Promise.all(eventsPromises)).flat();

  const rebalanceEvents = events.map((e) => {
    return e as RebalanceEventNode;
  });

  return rebalanceEvents;
}

export async function calculateRebalanceHistoryFromEvents(
  events: RebalanceEventNode[],
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
      const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
      const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

      const after_price = TickMath.sqrtPriceX64ToPrice(
        new BN(event.sqrt_price_after),
        coinsList[pool1].expo,
        coinsList[pool2].expo,
      );
      const lower_tick = TickMath.tickIndexToPrice(
        Number(event.lower_tick_after) > Math.pow(2, 31)
          ? Number(event.lower_tick_after) - Math.pow(2, 32)
          : Number(event.lower_tick_after),
        coinsList[pool1].expo,
        coinsList[pool2].expo,
      );
      const upper_tick = TickMath.tickIndexToPrice(
        Number(event.upper_tick_after) > Math.pow(2, 31)
          ? Number(event.upper_tick_after) - Math.pow(2, 32)
          : Number(event.upper_tick_after),
        coinsList[pool1].expo,
        coinsList[pool2].expo,
      );
      const history: RebalanceHistoryType = {
        timestamp: e.timestamp.toString(),
        lower_tick: lower_tick.toString(),
        upper_tick: upper_tick.toString(),
        after_price: after_price.toString(),
        amount_a_before: e.amount_a_before,
        amount_b_before: e.amount_b_before,
        amount_a_after: e.amount_a_after,
        amount_b_after: e.amount_b_after,
      };
      rebalanceHistoryMap[poolName].push(history);
    }
  }

  return rebalanceHistoryMap;
}
