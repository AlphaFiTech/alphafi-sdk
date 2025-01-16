import { Decimal } from "decimal.js";
import { coinsList } from "../../common/coins.js";
import {
  getInvestorPoolMap,
  singleAssetPoolCoinMap,
  poolInfo,
  doubleAssetPoolCoinMap,
} from "../../common/maps.js";
import { PoolName, SingleAssetPoolNames } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  AutoCompoundingEventNode,
  FetchAutoCompoundingEventsParams,
} from "./types.js";
import { getLatestPrices } from "../../index.js";

export async function fetchAutoCompoundingEvents(
  params: FetchAutoCompoundingEventsParams,
): Promise<AutoCompoundingEventNode[]> {
  const eventTypesSet = new Set<string>();
  // const rebalanceEventTypesSet = new Set<string>();
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
  // if (params.poolNames) {
  //   params.poolNames.forEach((poolName) => {
  //     const eventType = poolInfo[poolName].rebalanceEventType;
  //     if (eventType !== undefined && eventType !== null && eventType !== "") {
  //       rebalanceEventTypesSet.add(eventType);
  //     }
  //   });
  // } else {
  //   // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
  //   Object.values(poolInfo).forEach((info) => {
  //     const eventType = info.rebalanceEventType;
  //     if (eventType !== undefined && eventType !== null && eventType !== "") {
  //       rebalanceEventTypesSet.add(eventType);
  //     }
  //   });
  // }

  const eventTypes = Array.from(eventTypesSet);
  // const rebalanceEventTypes = Array.from(rebalanceEventTypesSet);

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
          .includes((e as AutoCompoundingEventNode).investor_id);
      } else {
        return true;
      }
    });
    return events;
  });
  // const rebalanceEventsPromises = rebalanceEventTypes.map(async (eventType) => {
  //   const events = (
  //     await fetchEvents({
  //       startTime: params.startTime,
  //       endTime: params.endTime,
  //       eventTypes: [eventType],
  //     })
  //   ).filter((e) => {
  //     if (params.poolNames) {
  //       return params.poolNames
  //         .map((poolName) => poolInfo[poolName].investorId)
  //         .includes((e as AutoCompoundingEventNode).investor_id);
  //     } else {
  //       return true;
  //     }
  //   });
  //   return events;
  // });

  const events = (await Promise.all(eventsPromises)).flat();

  const autoCompoundingEvents = events.map((e) => {
    return e as AutoCompoundingEventNode;
  });

  // const rebalanceEvents = (await Promise.all(rebalanceEventsPromises)).flat();

  // const rebalancingEvents = rebalanceEvents.map((e) => {
  //   return e as RebalanceEventNode;
  // });

  // const investorPoolMap = await getInvestorPoolMap();

  // for (const x of autoCompoundingEvents) {
  //   if (
  //     investorPoolMap.get(x.investor_id) &&
  //     poolInfo[investorPoolMap.get(x.investor_id)!].parentProtocolName ==
  //       "CETUS"
  //   ) {
  //     if (
  //       "total_amount_a" in x &&
  //       x.total_amount_a == 0n &&
  //       x.total_amount_b == 0n
  //     ) {
  //       for (const y of rebalancingEvents) {
  //         if (y.investor_id == x.investor_id && y.timestamp == x.timestamp) {
  //           // works if its guaranteed that for one timestamp there is only one rebalance for one pool
  //           x.total_amount_a = BigInt(y.amount_a_before);
  //           x.total_amount_b = BigInt(y.amount_b_before);
  //         }
  //       }
  //     }
  //   }
  // }

  return autoCompoundingEvents;
}

export async function calculateAprForInvestor(
  events: AutoCompoundingEventNode[],
): Promise<number> {
  let totalGrowth = 0;
  let totalTimeSpan = 0;
  let apr = 0;

  try {
    // Sort events by timestamp to process them in order
    events.sort((a, b) => a.timestamp - b.timestamp);

    let previousTimestamp = events[0].timestamp; // Start with the timestamp of the first event
    let previousGrowthRate = 0;
    let previousTimeDiff = 0;
    let prevCompoundA = 0n;
    let prevCompoundB = 0n;

    const investorPoolMap = getInvestorPoolMap();

    if (
      events.length > 0 &&
      investorPoolMap
        .get(events[0].investor_id.toString())
        ?.toString()
        .includes("AUTOBALANCE")
    ) {
      let sumOfGrowths = new Decimal(0);
      const poolName = investorPoolMap.get(events[0].investor_id.toString());
      const c1 = doubleAssetPoolCoinMap[poolName!].coin1;
      const c2 = doubleAssetPoolCoinMap[poolName!].coin2;
      const [c1Price, c2Price] = await getLatestPrices(
        [`${c1}/USD`, `${c2}/USD`],
        false,
      );
      const [bluePrice] = await getLatestPrices(["BLUE/USD"], false);

      for (const event of events) {
        if ("blue_reward_amount" in event) {
          const blueReward = new Decimal(event.blue_reward_amount.toString());
          const totalAmountA = new Decimal(event.total_amount_a.toString());
          const totalAmountB = new Decimal(event.total_amount_b.toString());
          const blueRewardPrice = blueReward
            .mul(bluePrice)
            .div(Math.pow(10, coinsList["BLUE"].expo));
          const baseAmountsPrice = totalAmountA
            .mul(c1Price)
            .div(Math.pow(10, coinsList[c1].expo))
            .plus(
              totalAmountB.mul(c2Price).div(Math.pow(10, coinsList[c2].expo)),
            );
          if (baseAmountsPrice.gt(0)) {
            sumOfGrowths = sumOfGrowths.plus(
              blueRewardPrice.div(baseAmountsPrice),
            );
          }
        }
      }
      return sumOfGrowths.mul(36500).toDecimalPlaces(4).toNumber();
    }

    // const matchInvestor =
    //       "0x681a30beb23d2532f9413c09127525ae5e562da7aa89f9f3498bd121fef22065"; // NAVI-USDC
    // // "0xa65eaadb556a80e4cb02fe35efebb2656d82d364897530f45dabc1e99d15a8a9"; // HASUI
    // ("0x227226f22bd9e484e541005916904ca066db1d42b8a80351800ef37b26c6cd89"); // AUSD
    // // "0xf43c62ca04c2f8d4583630872429ba6f5d8a7316ccb9552c86bb1fcf9dee3ce2"; // USDY
    // if (
    //   events &&
    //   events.length > 0 &&
    //   events[0].investor_id === matchInvestor
    // ) {
    //   console.log(
    //     "Compund Amount,Total Amount,GrowthRate,Timestamp,TimeDiff (Min)",
    //   );
    // }
    // if (
    //   events &&
    //   events.length > 0 &&
    //   events[0].investor_id === matchInvestor
    // ) {
    //   console.log(
    //     "Compund A,Total A,Compound B,Total B,Freebalance A,Freebalance B,GrowthA,GrowthB,AvgGrowth,Timestamp,TimeDiff (Min)",
    //   );
    // }
    for (const event of events) {
      // if (event.investor_id === matchInvestor) {
      //   console.log(event);
      // }
      // Calculate the time difference from the previous event
      let timeDiff = event.timestamp - previousTimestamp; // / (1000 * 60 * 60 * 24);

      // Calculate growth rate
      let growthRate = 0;
      if (
        "total_amount_a" in event &&
        "total_amount_b" in event &&
        "compound_amount_a" in event
      ) {
        let growthA = 0;
        let growthB = 0;

        if (Number(event.total_amount_a) === 0) {
          prevCompoundA += event.compound_amount_a;
        } else {
          prevCompoundA = 0n;
        }
        if (prevCompoundA > 0n) {
          growthA =
            Number(event.total_amount_a) === 0
              ? 0
              : Number(event.compound_amount_a + prevCompoundA) /
                Number(event.total_amount_a - prevCompoundA);
        } else {
          growthA =
            Number(event.total_amount_a) === 0
              ? 0
              : Number(event.compound_amount_a) / Number(event.total_amount_a);
        }

        if (Number(event.total_amount_b) === 0) {
          prevCompoundB += event.compound_amount_b;
        } else {
          prevCompoundB = 0n;
        }

        if (prevCompoundB > 0n) {
          growthB =
            Number(event.total_amount_b) == 0
              ? 0
              : Number(event.compound_amount_b + prevCompoundB) /
                Number(event.total_amount_b - prevCompoundB);
        } else {
          growthB =
            Number(event.total_amount_b) == 0
              ? 0
              : Number(event.compound_amount_b) / Number(event.total_amount_b);
        }

        // if (
        //   event.investor_id ===
        //   "0xd060e81548aee885bd3d37ae0caec181185be792bf45412e0d0acccd1e0174e6"
        // ) {
        //   console.log(
        //     timeDiff / (1000 * 60),
        //     event.timestamp,
        //     event.timestamp - previousTimestamp,
        //   );
        // }
        // if (
        //   event.investor_id ===
        //   "0xd060e81548aee885bd3d37ae0caec181185be792bf45412e0d0acccd1e0174e6"
        // ) {
        //   console.log(
        //     event.compound_amount_a,
        //     event.total_amount_a,
        //     growthA,
        //     event.compound_amount_b,
        //     event.total_amount_b,
        //     growthB,
        //   );
        // }
        growthRate = (growthA + growthB) / 2; // Averaging growth rates for token A and B
        // if (event.investor_id === matchInvestor) {
        //   console.log(
        //     `${event.compound_amount_a},${event.total_amount_a},${event.compound_amount_b},${event.total_amount_b},${event.free_balance_a},${event.free_balance_b},${growthA},${growthB},${growthRate},${event.timestamp},${(event.timestamp - previousTimestamp) / (1000 * 60)}`,
        //   );
        // }
        if (Math.abs(growthA - growthB) > 0.5) {
          // skip row, fill with previous event
          growthRate = previousGrowthRate;
          timeDiff = previousTimeDiff;
        }
        if (growthRate > 0.005) {
          growthRate = 0;
        }
      } else if ("total_amount" in event) {
        let compoundAmount: number = Number(event.compound_amount);
        let totalAmount: number = Number(event.total_amount);
        if ("cur_total_debt" in event && "accrued_interest" in event) {
          compoundAmount = Number(
            event.compound_amount - event.accrued_interest,
          );
          totalAmount = Number(event.total_amount - event.cur_total_debt);
        }
        // NaviAutoCompoundingEvent
        growthRate = isNaN(compoundAmount / totalAmount)
          ? 0
          : compoundAmount / totalAmount;
        const poolName = investorPoolMap.get(
          event.investor_id,
        ) as SingleAssetPoolNames;
        const coinName = singleAssetPoolCoinMap[poolName].coin;

        growthRate = growthRate * Math.pow(10, 9 - coinsList[coinName].expo);
        // if (event.investor_id === matchInvestor) {
        //   console.log(
        //     `${event.compound_amount},${event.total_amount},${growthRate},${event.timestamp},${(event.timestamp - previousTimestamp) / (1000 * 60)}`,
        //   );
        // }
      }

      // Accumulate the time-weighted growth
      totalGrowth = (totalGrowth + 1) * (1 + growthRate) - 1;
      previousGrowthRate = growthRate;

      // Accumulate the total time span
      totalTimeSpan += timeDiff;
      previousTimeDiff = timeDiff;

      // Update the previous timestamp to the current event's timestamp
      previousTimestamp = event.timestamp;
    }

    apr = (totalGrowth / totalTimeSpan) * (1000 * 60 * 60 * 24 * 365) * 100;
  } catch (error) {
    console.error("Error calculating apr from events.", error);
    if (events.length > 0) {
      console.error("Investor-ID: ", events[0].investor_id);
    }
  }

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
