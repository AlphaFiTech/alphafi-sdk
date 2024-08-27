import suiClient from "../client";
import { EventId, PaginatedEvents } from "@mysten/sui/client";
import {
  AutoCompoundingEventNode,
  CetusAutoCompoundingEvent,
  EventNode,
  FetchEventsParams,
  NaviAutoCompoundingEvent,
} from "./types";

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
        | NaviAutoCompoundingEvent;
      const autoCompoundingEventNode: AutoCompoundingEventNode = {
        type: suiEvent.type,
        timestamp: Number(suiEvent.timestampMs),
        ...suiEventJson,
      };
      const eventNode: EventNode = autoCompoundingEventNode;
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
