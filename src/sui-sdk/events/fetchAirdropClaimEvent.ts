import { conf, CONF_ENV } from "../../common/constants.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  AirdropClaimEventNode,
  FetchAirdropClaimEventsParams,
} from "./types.js";

export async function fetchAirdropClaimEvents(
  params: FetchAirdropClaimEventsParams,
): Promise<AirdropClaimEventNode[]> {
  const eventType = conf[CONF_ENV].AIRDROP_CLAIM_EVENT_TYPE;

  const events = await fetchEvents({
    startTime: params.startTime,
    endTime: params.endTime,
    eventTypes: [eventType],
    order: "descending",
  });

  const airdropClaimEvents = events.map((e) => {
    return e as AirdropClaimEventNode;
  });

  return airdropClaimEvents;
}
