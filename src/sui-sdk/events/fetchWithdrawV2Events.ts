import { poolInfo } from "../../common/maps.js";
import { fetchEvents } from "./fetchEvents.js";
import { fetchEventsFromDigests } from "./fetchEventsFromDigests.js";
import {
  AlphaWithdrawV2Event,
  FetchWithdrawV2EventsParams,
  WithdrawV2EventNode,
} from "./types.js";

export async function fetchWithdrawV2Events(
  params: FetchWithdrawV2EventsParams,
): Promise<WithdrawV2EventNode[]>;
export async function fetchWithdrawV2Events(params: {
  digests: string[];
}): Promise<WithdrawV2EventNode[]>;
export async function fetchWithdrawV2Events(params: {
  startTime?: number;
  endTime?: number;
  digests?: string[];
}): Promise<WithdrawV2EventNode[]> {
  if (!params.digests) {
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
      });
      return events;
    });
    const events = (await Promise.all(eventsPromises)).flat();
    const withdrawV2EventNodes = events.map((e) => {
      return e as WithdrawV2EventNode;
    });

    return withdrawV2EventNodes;
  } else {
    const digestEventsMap = await fetchEventsFromDigests({
      digests: params.digests,
    });
    const withdrawV2EventTypes = new Set<string>(
      Object.values(poolInfo)
        .map((info) => info?.withdrawV2EventType)
        .filter((type) => type !== undefined),
    );

    let withdrawV2EventNodes: WithdrawV2EventNode[] = [];
    for (const digest in digestEventsMap) {
      const timestamp = digestEventsMap[digest].timestamp;
      const withdrawV2Events = digestEventsMap[digest].events?.filter((event) =>
        withdrawV2EventTypes.has(event.type),
      );
      if (withdrawV2Events) {
        withdrawV2EventNodes = withdrawV2EventNodes.concat(
          withdrawV2Events.map((suiEvent) => {
            const suiEventJson = suiEvent.parsedJson as AlphaWithdrawV2Event;
            let eventNode: WithdrawV2EventNode;
            if ("amount_withdrawn_from_locked" in suiEventJson) {
              eventNode = {
                type: suiEvent.type,
                timestamp: timestamp,
                amount: suiEventJson.amount,
                amount_withdrawn_from_locked:
                  suiEventJson.amount_withdrawn_from_locked,
                amount_withdrawn_from_unlocked:
                  suiEventJson.amount_withdrawn_from_unlocked,
                fee_collected: suiEventJson.fee_collected,
                instant_withdraw_fee_collected:
                  suiEventJson.instant_withdraw_fee_collected,
                pool_id: suiEventJson.pool_id,
                sender: suiEventJson.sender,
                tokens_invested: suiEventJson.tokens_invested,
                user_total_x_token_balance:
                  suiEventJson.user_total_x_token_balance,
                x_token_supply: suiEventJson.x_token_supply,
                txDigest: suiEvent.id.txDigest,
                eventSeq: Number(suiEvent.id.eventSeq),
                transactionModule: suiEvent.transactionModule,
              };
            } else {
              console.error("event: ", suiEvent);
              throw new Error("Unexpected event found");
            }
            return eventNode;
          }),
        );
      }
    }
    return withdrawV2EventNodes;
  }
}
