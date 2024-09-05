import { poolInfo } from "../../common/maps";
import { fetchEvents } from "./fetchEvents";
import {
  FetchLiquidityChangeEventsParams,
  LiquidityChangeEventNode,
} from "./types";

export async function fetchLiquidityChangeEvents(
  params: FetchLiquidityChangeEventsParams,
) {
  // : Promise<LiquidityChangeEventNode[]>
  const eventTypesSet = new Set<string>();

  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].liquidityChangeEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.liquidityChangeEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  }

  const eventTypes = Array.from(eventTypesSet);

  const eventsPromises = eventTypes.map(async (eventType) => {
    const events = await fetchEvents({
      startTime: params.startTime,
      endTime: params.endTime,
      eventTypes: [eventType],
    });
    return events;
  });
  const events = (await Promise.all(eventsPromises)).flat();
  console.log(events);
  const liquidityChangeEvents = events.map((e) => {
    return e as LiquidityChangeEventNode;
  });
  return liquidityChangeEvents;
}

// export async function fetchAutoCompoundingEvents(
//   params: FetchAutoCompoundingEventsParams,
// ): Promise<AutoCompoundingEventNode[]> {
//   const eventTypesSet = new Set<string>();

//   if (params.poolNames) {
//     params.poolNames.forEach((poolName) => {
//       const eventType = poolInfo[poolName].autoCompoundingEventType;
//       if (eventType !== undefined && eventType !== null && eventType !== "") {
//         eventTypesSet.add(eventType);
//       }
//     });
//   } else {
//     // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
//     Object.values(poolInfo).forEach((info) => {
//       const eventType = info.autoCompoundingEventType;
//       if (eventType !== undefined && eventType !== null && eventType !== "") {
//         eventTypesSet.add(eventType);
//       }
//     });
//   }

//   const eventTypes = Array.from(eventTypesSet);

//   const eventsPromises = eventTypes.map(async (eventType) => {
//     const events = (
//       await fetchEvents({
//         startTime: params.startTime,
//         endTime: params.endTime,
//         eventTypes: [eventType],
//       })
//     ).filter((e) => {
//       if (params.poolNames) {
//         return params.poolNames
//           .map((poolName) => poolInfo[poolName].investorId)
//           .includes(e.investor_id);
//       } else {
//         return true;
//       }
//     });
//     return events;
//   });

//   const events = (await Promise.all(eventsPromises)).flat();

//   const autoCompoundingEvents = events.map((e) => {
//     return e as AutoCompoundingEventNode;
//   });

//   return autoCompoundingEvents;
// }

// import suiClient from "../client";
// import { EventId, PaginatedEvents } from "@mysten/sui/client";
// import fs from "fs"

// async function testFetch(params: {
//     startTime: number | undefined,
//     endTime: number | undefined,
//     eventTypes: string[],
// }) {
//     let hasNextPage = true;
//     let startCursor: EventId | null | undefined = null;
//     const res: PaginatedEvents[] = [];
//     while (hasNextPage) {
//         const result: PaginatedEvents = await suiClient.queryEvents({
//             cursor: startCursor,
//             order: "descending",
//             query: {
//                 MoveEventType: params.eventTypes[0],
//             },
//         });
//         res.push(result);
//         if (!hasNextPage) {
//             break;
//         }

//         hasNextPage = result.hasNextPage;
//         startCursor = result.nextCursor;
//     }
//     console.log(res)
//     fs.writeFileSync("./see.json", JSON.stringify(res), {flag:"a"});
// }

fetchLiquidityChangeEvents({});
