import { getInvestorPoolMap, poolInfo } from "../../common/maps";
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

  const eventsPromises = eventTypes.map((eventType) => {
    const events = fetchEvents({
      startTime: params.startTime,
      endTime: params.endTime,
      eventTypes: [eventType],
    });
    return events;
  });

  const events = (await Promise.all(eventsPromises)).flat();

  const autoCompoundingEvents = events.map((e) => {
    return e as AutoCompoundingEventNode;
  });

  return autoCompoundingEvents;
}

async function calculateAprForInvestor(
  events: AutoCompoundingEventNode[],
): Promise<number> {
  // Sort events by timestamp to process them in order
  events.sort((a, b) => a.timestamp - b.timestamp);

  let totalGrowth = 0;
  let weightedTimeDiff = 0;
  const initialTimestamp = events[0].timestamp;

  for (const event of events) {
    // console.log(event);
    const timeDiffDays =
      (event.timestamp - initialTimestamp) / (1000 * 60 * 60 * 24);

    let growthRate = 0;

    if ("total_amount_a" in event && "total_amount_b" in event) {
      // CetusAutoCompoundingEvent
      const growthA = isNaN(
        Number(event.compound_amount_a) / Number(event.total_amount_a),
      )
        ? 0
        : Number(event.compound_amount_a) / Number(event.total_amount_a);

      const growthB = isNaN(
        Number(event.compound_amount_b) / Number(event.total_amount_b),
      )
        ? 0
        : Number(event.compound_amount_b) / Number(event.total_amount_b);
      growthRate = (growthA + growthB) / 2; // Averaging growth rates for token A and B
      //console.log(`growthRate = ${growthRate} = ${growthA} + ${growthB} / 2`);
    } else if ("total_amount" in event) {
      // NaviAutoCompoundingEvent
      growthRate = isNaN(
        Number(event.compound_amount) / Number(event.total_amount),
      )
        ? 0
        : Number(event.compound_amount) / Number(event.total_amount);
      // console.log(`growthRate = ${growthRate}`);
    }

    totalGrowth += growthRate;
    weightedTimeDiff += growthRate * timeDiffDays;
    // console.log(
    //   `totalGrowth = ${totalGrowth}, weightedTimeDiff = ${weightedTimeDiff}`,
    // );
  }

  const averageGrowth = totalGrowth / events.length;
  const totalTimeDiffDays = weightedTimeDiff / totalGrowth;

  // Annualize the average growth to calculate APR
  let apr = 0; // Default APR to 0

  if (totalTimeDiffDays > 0) {
    // Annualize the average growth to calculate APR
    apr = (Math.pow(1 + averageGrowth, 365 / totalTimeDiffDays) - 1) * 100;
  }

  // let investorId = "";
  // if (events.length > 0) investorId = events[0].investor_id;
  // console.log(`APR (${investorId}): ${apr}`);

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
