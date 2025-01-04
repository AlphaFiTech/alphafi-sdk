import { poolInfo, poolIdPoolNameMap } from "../../common/maps.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  FetchLiquidityChangeEventsParams,
  LiquidityChangeEventNode,
} from "./types.js";

export async function fetchLiquidityChangeEvents(
  params: FetchLiquidityChangeEventsParams,
): Promise<LiquidityChangeEventNode[]> {
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
      order: params.order,
    });
    return events;
  });
  const events = (await Promise.all(eventsPromises)).flat();
  let liquidityChangeEvents = events.map((e) => {
    return e as LiquidityChangeEventNode;
  });

  if (params.poolNames) {
    liquidityChangeEvents = liquidityChangeEvents.filter((e) =>
      params.poolNames!.includes(poolIdPoolNameMap[e.pool_id]),
    );
  }

  return liquidityChangeEvents;
}
