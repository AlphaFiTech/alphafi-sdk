import { poolInfo } from "../../common/maps.js";
import { PoolName } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import { RewardEventNode } from "./types.js";

// many poolNames may have the same type so unrequested pool's events may be returned as well
export async function fetchRewardEvents(params: {
  poolNames?: PoolName[];
  startTime: number;
  endTime: number;
}): Promise<RewardEventNode[]> {
  const eventTypesSet = new Set<string>();
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].rewardEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each rewardType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.rewardEventType;
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
  const rewardEvents = events.map((e) => {
    return e as RewardEventNode;
  });

  // filtering by poolName requires additional querying (looking at the transaction)
  return rewardEvents;
}

// fetchUserRewardEvents()
