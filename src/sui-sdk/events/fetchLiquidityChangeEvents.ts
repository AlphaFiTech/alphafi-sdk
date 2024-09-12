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
