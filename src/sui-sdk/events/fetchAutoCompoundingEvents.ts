import { coins } from "../../common/coins";
import { getInvestorPoolMap, poolCoinMap, poolInfo } from "../../common/maps";
import { PoolName } from "../../common/types";
import { fetchEvents } from "./fetchEvents";
import {
  AutoCompoundingEventNode,
  FetchAutoCompoundingEventsParams,
} from "./types";

export async function fetchAutoCompoundingEvents(
  params: FetchAutoCompoundingEventsParams,
): Promise<AutoCompoundingEventNode[]> {
  const eventTypesSet = new Set<string>();

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

  // Variables to hold previous compound amounts and total amounts in case of zero total amounts
  let previousCompoundAmountA = 0n;
  let previousCompoundAmountB = 0n;
  let previousTotalAmountA = 0n;
  let previousTotalAmountB = 0n;

  const investorPoolMap = await getInvestorPoolMap();

  for (const event of events) {
    //console.log(event);
    // Calculate the time difference from the previous event
    const timeDiff = event.timestamp - previousTimestamp; // / (1000 * 60 * 60 * 24);

    // Calculate growth rate
    let growthRate = 0;
    if ("total_amount_a" in event && "total_amount_b" in event) {
      // CetusAutoCompoundingEvent
      // if (
      //   event.investor_id ===
      //   "0x87a76889bf4ed211276b16eb482bf6df8d4e27749ebecd13017d19a63f75a6d5"
      // ) {
      //   console.log(
      //     `${event.timestamp},${event.compound_amount_a},${event.total_amount_a},${event.compound_amount_b},${event.total_amount_b}`,
      //   );
      // }
      let growthA = 0;
      let growthB = 0;
      if (!(event.total_amount_a === 0n || event.total_amount_b === 0n)) {
        growthA = isNaN(
          Number(event.compound_amount_a) / Number(event.total_amount_a),
        )
          ? 0
          : Number(event.compound_amount_a) / Number(event.total_amount_a);

        growthB = isNaN(
          Number(event.compound_amount_b) / Number(event.total_amount_b),
        )
          ? 0
          : Number(event.compound_amount_b) / Number(event.total_amount_b);

        // Reset the previous amounts since we have valid amounts now
        previousCompoundAmountA = event.compound_amount_a;
        previousCompoundAmountB = event.compound_amount_b;
        previousTotalAmountA = event.total_amount_a;
        previousTotalAmountB = event.total_amount_b;
      } else {
        // Handle the scenario where total amounts are zero
        const adjustedCompoundAmountA =
          event.compound_amount_a + previousCompoundAmountA;
        const adjustedCompoundAmountB =
          event.compound_amount_b + previousCompoundAmountB;

        growthA = isNaN(
          Number(adjustedCompoundAmountA) / Number(previousTotalAmountA),
        )
          ? 0
          : Number(adjustedCompoundAmountA) / Number(previousTotalAmountA);

        growthB = isNaN(
          Number(adjustedCompoundAmountB) / Number(previousTotalAmountB),
        )
          ? 0
          : Number(adjustedCompoundAmountB) / Number(previousTotalAmountB);

        // Keep the adjusted values for the next iteration if needed
        previousCompoundAmountA = adjustedCompoundAmountA;
        previousCompoundAmountB = adjustedCompoundAmountB;
      }
      growthRate = (growthA + growthB) / 2; // Averaging growth rates for token A and B
    } else if ("total_amount" in event) {
      // NaviAutoCompoundingEvent
      growthRate = isNaN(
        Number(event.compound_amount) / Number(event.total_amount),
      )
        ? 0
        : Number(event.compound_amount) / Number(event.total_amount);
      const poolName = investorPoolMap.get(event.investor_id) as Extract<
        PoolName,
        | "NAVI-VSUI"
        | "NAVI-SUI"
        | "NAVI-WETH"
        | "NAVI-USDC"
        | "NAVI-USDT"
        | "ALPHA"
      >;
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
