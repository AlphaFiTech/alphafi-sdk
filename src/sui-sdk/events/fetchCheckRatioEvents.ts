import { poolInfo } from "../../common/maps.js";
import { fetchEvents } from "./fetchEvents.js";
import { CheckRatioEventNode, FetchCheckRatioEventsParams } from "./types.js";

export async function fetchCheckRatioEvents(
  params: FetchCheckRatioEventsParams,
): Promise<CheckRatioEventNode[]> {
  const eventTypesSet = new Set<string>();
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      if (poolInfo[poolName].strategyType !== "LOOPING") {
        console.error("Check Ratio event only applicable in looping pools");
        throw new Error("Inavlid Params");
      }
      const eventType = poolInfo[poolName].checkRatioEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.checkRatioEventType;
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
  const checkRatioEvents = events.map((e) => {
    return e as CheckRatioEventNode;
  });

  return checkRatioEvents;
}
