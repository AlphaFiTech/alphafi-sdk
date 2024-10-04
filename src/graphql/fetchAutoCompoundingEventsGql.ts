//import { GET_AUTOCOMPOUND_EVENTS } from "./queries";
//import { ApolloQueryResult } from "@apollo/client/core";
//import client from "./client";
import { getSuiClient } from "../sui-sdk/client";
import { EventId, PaginatedEvents } from "@mysten/sui/client";

// interface PageInfo {
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
//   startCursor: string | null;
// }

interface CommonAutoCompoundingEventAttributes {
  type: string;
  timestamp: number;
}

interface CetusAutoCompoundingEvent {
  compound_amount_a: bigint;
  compound_amount_b: number;
  current_liquidity: bigint;
  fee_collected_a: bigint;
  fee_collected_b: bigint;
  free_balance_a: bigint;
  free_balance_b: bigint;
  investor_id: string;
  total_amount_a: bigint;
  total_amount_b: bigint;
}

interface NaviAutoCompoundingEvent {
  compound_amount: bigint;
  fee_collected: bigint;
  investor_id: string;
  location: number;
  total_amount: bigint;
}

export type AutoCompoundingEventNode =
  | (CetusAutoCompoundingEvent & CommonAutoCompoundingEventAttributes)
  | (NaviAutoCompoundingEvent & CommonAutoCompoundingEventAttributes);

// interface EventNodesResponse {
//   events: {
//     pageInfo: PageInfo;
//     nodes: EventNode[];
//   };
// }

export async function fetchAutoCompoundingEventsGql(
  eventType: string,
): Promise<AutoCompoundingEventNode[]> {
  const allEvents: AutoCompoundingEventNode[] = [];
  const suiClient = getSuiClient();

  let hasNextPage = true;
  let startCursor: EventId | null | undefined = null;

  const now = Date.now();
  const twentyFourHoursAgo = now - 7 * 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  while (hasNextPage) {
    const result: PaginatedEvents = await suiClient.queryEvents({
      cursor: startCursor,
      order: "descending",
      query: {
        MoveEventType: eventType,
      },
    });

    const se = result.data;
    for (let i = 0; i < se.length; i++) {
      const suiEvent = se[i];
      if (Number(suiEvent.timestampMs) < twentyFourHoursAgo) {
        hasNextPage = false; // Stop further pagination
        break; // Exit the loop
      }

      const suiEventJson = suiEvent.parsedJson as
        | CetusAutoCompoundingEvent
        | NaviAutoCompoundingEvent;
      const eventNode: AutoCompoundingEventNode = {
        type: suiEvent.type,
        timestamp: Number(suiEvent.timestampMs),
        ...suiEventJson,
      };
      allEvents.push(eventNode);
    }

    // If we set hasPreviousPage to false, exit the outer loop as well
    if (!hasNextPage) {
      break;
    }

    hasNextPage = result.hasNextPage;
    startCursor = result.nextCursor;
  }

  // console.log(
  //   "counts(total, picked, page): ",
  //   totalCount,
  //   allEvents.length,
  //   pageCount,
  // );

  return allEvents;
}

// export async function fetchAutoCompoundEvents1(): Promise<EventNode[]> {
//   const allEvents: EventNode[] = [];
//   let hasPreviousPage = true;
//   let startCursor: string | null = null;

//   const now = Date.now();
//   const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago

//   let totalCount = 0;
//   let pageCount = 0;

//   while (hasPreviousPage) {
//     pageCount += 1;
//     // Assign the entire result to a variable with a type annotation
//     // poolId: poolInfo[poolName].poolId,
//     const result: ApolloQueryResult<EventNodesResponse> = await client.query({
//       query: GET_AUTOCOMPOUND_EVENTS,
//       variables: {
//         before: startCursor,
//         eventType:
//           "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",
//       },
//     });

//     // Now destructure from the properly typed variable
//     const { data } = result;
//     const { nodes, pageInfo } = data.events;
//     totalCount += nodes.length;
//     for (let i = nodes.length - 1; i >= 0; i--) {
//       const node = nodes[i];
//       const timestampMs = new Date(node.timestamp).getTime(); // Convert to milliseconds
//       if (timestampMs < twentyFourHoursAgo) {
//         hasPreviousPage = false;
//         break;
//       }

//       // Filter events of type "AutoCompoundEvent" or other types
//       // const autoCompoundEvents = node.effects.events.nodes.filter((event) => {
//       //   if (
//       //     [
//       //       "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",
//       //     ].includes(event.type.repr)
//       //   ) {
//       //     console.log(event.type.repr);
//       //     return true;
//       //   }
//       // });

//       // allEvents.push(...autoCompoundEvents);
//       allEvents.push(node);
//     }

//     // If we set hasPreviousPage to false, exit the outer loop as well
//     if (!hasPreviousPage) {
//       break;
//     }

//     hasPreviousPage = pageInfo.hasPreviousPage;
//     startCursor = pageInfo.startCursor;
//   }

//   console.log(
//     "counts(total, picked, page): ",
//     totalCount,
//     allEvents.length,
//     pageCount,
//   );

//   return allEvents;
// }
