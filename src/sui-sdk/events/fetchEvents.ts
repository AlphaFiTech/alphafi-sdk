import suiClient from "../client";
import { EventId, PaginatedEvents } from "@mysten/sui/client";
import {
  CetusAutoCompoundingEvent,
  EventNode,
  FetchEventsParams,
  NaviAutoCompoundingEvent,
  RebalanceEvent,
} from "./types";
import { poolInfo } from "../../common/maps";

export async function fetchEvents(
  params: FetchEventsParams,
): Promise<EventNode[]> {
  const allEvents: EventNode[] = [];
  let hasNextPage = true;
  let startCursor: EventId | null | undefined = null;

  if (params.eventTypes.length > 1) {
    console.warn(
      "Multiple eventTypes not supported right now, pass only one element in the array.",
    );
  }

  if (params.eventTypes.length < 1) {
    hasNextPage = false;
  }

  const now = Date.now();
  const twentyFourHoursAgo = now - 7 * 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  const startTime = params.startTime ? params.startTime : twentyFourHoursAgo;
  const endTime = params.endTime ? params.endTime : now;

  while (hasNextPage) {
    const result: PaginatedEvents = await suiClient.queryEvents({
      cursor: startCursor,
      order: "descending",
      query: {
        MoveEventType: params.eventTypes[0],
      },
      // query: {
      //   All: [
      //     {
      //       MoveEventType:
      //         "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor::AutoCompoundingEvent",
      //     },
      //     {
      //       MoveEventType:
      //         "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_sui_investor::AutoCompoundingEvent",
      //     },
      //     {
      //       MoveEventType:
      //         "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_cetus_investor_base_a::AutoCompoundingEvent",
      //     },
      //     {
      //       MoveEventType:
      //         "0x73754ff4132adde2c28995739e8bb403aeb7219ba92003245529681dbc379c08::alphafi_navi_investor::AutoCompoundingEvent",
      //     },
      //   ],
      // },
    });

    const se = result.data;
    for (let i = 0; i < se.length; i++) {
      const suiEvent = se[i];

      if (Number(suiEvent.timestampMs) > endTime) {
        continue;
      }

      if (Number(suiEvent.timestampMs) < startTime) {
        hasNextPage = false; // Stop further pagination
        break; // Exit the loop
      }

      const suiEventJson = suiEvent.parsedJson as
        | CetusAutoCompoundingEvent
        | NaviAutoCompoundingEvent
        | RebalanceEvent;

      let eventNode: EventNode;

      if (
        isAutoCompoundingEvent(suiEvent.type) &&
        "compound_amount_a" in suiEventJson &&
        "compound_amount_b" in suiEventJson
      ) {
        // Handling CetusAutoCompoundingEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          compound_amount_a: BigInt(suiEventJson.compound_amount_a.toString()),
          compound_amount_b: BigInt(suiEventJson.compound_amount_b.toString()),
          current_liquidity: BigInt(suiEventJson.current_liquidity.toString()),
          fee_collected_a: BigInt(suiEventJson.fee_collected_a.toString()),
          fee_collected_b: BigInt(suiEventJson.fee_collected_b.toString()),
          free_balance_a: BigInt(suiEventJson.free_balance_a.toString()),
          free_balance_b: BigInt(suiEventJson.free_balance_b.toString()),
          investor_id: suiEventJson.investor_id,
          total_amount_a: BigInt(suiEventJson.total_amount_a.toString()),
          total_amount_b: BigInt(suiEventJson.total_amount_b.toString()),
        };
      } else if (
        isAutoCompoundingEvent(suiEvent.type) &&
        "compound_amount" in suiEventJson
      ) {
        // Handling NaviAutoCompoundingEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          compound_amount: BigInt(suiEventJson.compound_amount.toString()),
          fee_collected: BigInt(suiEventJson.fee_collected.toString()),
          investor_id: suiEventJson.investor_id,
          location: suiEventJson.location,
          total_amount: BigInt(suiEventJson.total_amount.toString()),
        };
      } else if (
        isRebalanceEvent(suiEvent.type) &&
        "lower_tick_after" in suiEventJson
      ) {
        // Handling RebalanceEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          investor_id: suiEventJson.investor_id.toString(),
          lower_tick_after: suiEventJson.lower_tick_after.toString(),
          upper_tick_after: suiEventJson.upper_tick_after.toString(),
          sqrt_price_after: suiEventJson.sqrt_price_after.toString(),
        };
      } else {
        throw new Error("Unknown event type");
      }
      // const autoCompoundingEventNode: AutoCompoundingEventNode = {
      //   type: suiEvent.type,
      //   timestamp: Number(suiEvent.timestampMs),
      //   ...suiEventJson,
      // };
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

const isAutoCompoundingEvent = (eventType: string) => {
  const eventTypes: string[] = Object.values(poolInfo).map((info) => {
    return info.autoCompoundingEventType;
  });
  return eventTypes.includes(eventType);
};

const isRebalanceEvent = (eventType: string) => {
  const eventTypes: string[] = Object.values(poolInfo)
    .filter((info) => {
      return info.rebalanceEventType ? true : false;
    })
    .map((info) => {
      return info.rebalanceEventType as string;
    });
  return eventTypes.includes(eventType);
};
