import { coins } from "../../common/coins.js";
import {
  getInvestorPoolMap,
  poolCoinMap,
  poolInfo,
} from "../../common/maps.js";
import { PoolName, SingleAssetPoolNames } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  AutoCompoundingEventNode,
  FetchAutoCompoundingEventsParams,
  RebalanceEventNode,
} from "./types.js";

export async function fetchAutoCompoundingEvents(
  params: FetchAutoCompoundingEventsParams,
): Promise<AutoCompoundingEventNode[]> {
  const eventTypesSet = new Set<string>();
  const rebalanceEventTypesSet = new Set<string>();
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].autoCompoundingEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.autoCompoundingEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  }
  // for rebalance
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].rebalanceEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        rebalanceEventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.rebalanceEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        rebalanceEventTypesSet.add(eventType);
      }
    });
  }

  const eventTypes = Array.from(eventTypesSet);
  const rebalanceEventTypes = Array.from(rebalanceEventTypesSet);

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
          .includes((e as AutoCompoundingEventNode).investor_id);
      } else {
        return true;
      }
    });
    return events;
  });
  const rebalanceEventsPromises = rebalanceEventTypes.map(async (eventType) => {
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
          .includes((e as AutoCompoundingEventNode).investor_id);
      } else {
        return true;
      }
    });
    return events;
  });

  const events = (await Promise.all(eventsPromises)).flat();

  const autoCompoundingEvents = events.map((e) => {
    return e as AutoCompoundingEventNode;
  });

  const rebalanceEvents = (await Promise.all(rebalanceEventsPromises)).flat();

  const rebalancingEvents = rebalanceEvents.map((e) => {
    return e as RebalanceEventNode;
  });

  const investorPoolMap = await getInvestorPoolMap();

  for (const x of autoCompoundingEvents) {
    if (
      investorPoolMap.get(x.investor_id) &&
      poolInfo[investorPoolMap.get(x.investor_id)!].parentProtocolName ==
        "CETUS"
    ) {
      if (
        "total_amount_a" in x &&
        x.total_amount_a == 0n &&
        x.total_amount_b == 0n
      ) {
        for (const y of rebalancingEvents) {
          if (y.investor_id == x.investor_id && y.timestamp == x.timestamp) {
            // works if its guaranteed that for one timestamp there is only one rebalance for one pool
            x.total_amount_a = BigInt(y.amount_a_before);
            x.total_amount_b = BigInt(y.amount_b_before);
          }
        }
      }
    }
  }

  return autoCompoundingEvents;
}

export async function calculateAprForInvestor(
  events: AutoCompoundingEventNode[],
): Promise<number> {
  // Sort events by timestamp to process them in order
  events.sort((a, b) => a.timestamp - b.timestamp);

  let totalGrowth = 0;
  let totalTimeSpan = 0;
  let previousTimestamp = events[0].timestamp; // Start with the timestamp of the first event

  const investorPoolMap = await getInvestorPoolMap();

  for (const event of events) {
    // Calculate the time difference from the previous event
    const timeDiff = event.timestamp - previousTimestamp; // / (1000 * 60 * 60 * 24);

    // Calculate growth rate
    let growthRate = 0;
    if ("total_amount_a" in event && "total_amount_b" in event) {
      let growthA = 0;
      let growthB = 0;
      growthA =
        Number(event.total_amount_a) === 0
          ? 0
          : Number(event.compound_amount_a) / Number(event.total_amount_a);

      growthB =
        Number(event.total_amount_b) == 0
          ? 0
          : Number(event.compound_amount_b) / Number(event.total_amount_b);

      growthRate = (growthA + growthB) / 2; // Averaging growth rates for token A and B
    } else if ("total_amount" in event) {
      let compoundAmount: number = Number(event.compound_amount);
      let totalAmount: number = Number(event.total_amount);
      if ("cur_total_debt" in event && "accrued_interest" in event) {
        compoundAmount = Number(event.compound_amount - event.accrued_interest);
        totalAmount = Number(event.total_amount - event.cur_total_debt);
      }
      // NaviAutoCompoundingEvent
      growthRate = isNaN(compoundAmount / totalAmount)
        ? 0
        : compoundAmount / totalAmount;
      const poolName = investorPoolMap.get(
        event.investor_id,
      ) as SingleAssetPoolNames;
      const coinName = poolCoinMap[poolName];

      growthRate = growthRate * Math.pow(10, 9 - coins[coinName].expo);
    }

    // Accumulate the time-weighted growth
    totalGrowth += growthRate;

    // Accumulate the total time span
    totalTimeSpan += timeDiff;

    // Update the previous timestamp to the current event's timestamp
    previousTimestamp = event.timestamp;
  }

  const apr = (totalGrowth / totalTimeSpan) * (1000 * 60 * 60 * 24 * 365) * 100;

  return apr;
}

async function calculateAprForInvestors(
  events: AutoCompoundingEventNode[],
): Promise<Record<string, number>> {
  const investorEvents: Record<string, AutoCompoundingEventNode[]> = {};

  // Step 1: Segregate events by investor_id
  for (const event of events) {
    const investorId = event.investor_id;
    if (!investorEvents[investorId]) {
      investorEvents[investorId] = [];
    }
    investorEvents[investorId].push(event);
  }

  // Step 2: Calculate APR for each event and aggregate for each investor
  const aprPromises: Promise<{ investorId: string; apr: number }>[] = [];

  for (const investorId in investorEvents) {
    const investorEventList = investorEvents[investorId];

    // Push a promise that resolves to an object containing the investorId and the corresponding APR
    aprPromises.push(
      calculateAprForInvestor(investorEventList).then((apr) => ({
        investorId,
        apr,
      })),
    );
  }

  // Resolve all promises and map them to the corresponding APR
  const aprs = await Promise.all(aprPromises);

  // Convert the array of results into an object mapping investorId to APR
  const aprMap = aprs.reduce(
    (map, result) => {
      map[result.investorId] = result.apr;
      return map;
    },
    {} as Record<string, number>,
  );

  return aprMap;
}

export async function calculateAprForPools(
  events: AutoCompoundingEventNode[],
): Promise<Record<PoolName, number>> {
  const aprMap: Record<string, number> = {};
  const investorPoolNameMap = await getInvestorPoolMap();
  const investorAprMap = await calculateAprForInvestors(events);
  for (const investorId in investorAprMap) {
    const poolName = investorPoolNameMap.get(investorId);
    if (poolName) {
      aprMap[poolName] = investorAprMap[investorId];
    }
  }
  return aprMap;
}
