import { poolInfo } from "../../common/maps.js";
import { fetchEvents } from "./fetchEvents.js";
import { FetchWithdrawV2EventsParams, WithdrawV2EventNode } from "./types.js";

export async function fetchWithdrawV2Events(
  params: FetchWithdrawV2EventsParams,
): Promise<WithdrawV2EventNode[]> {
  const eventTypes = [poolInfo["ALPHA"].withdrawV2EventType];
  const eventsPromises = eventTypes.map(async (eventType) => {
    if (!eventType) {
      console.error(`Event type not found: ${eventTypes}`);
      throw new Error("Incomplete Event Types");
    }
    const events = await fetchEvents({
      startTime: params.startTime,
      endTime: params.endTime,
      eventTypes: [eventType],
      order: params.order,
    });
    return events;
  });
  const events = (await Promise.all(eventsPromises)).flat();
  const withdrawV2EventNodes = events.map((e) => {
    return e as WithdrawV2EventNode;
  });

  return withdrawV2EventNodes;
}
