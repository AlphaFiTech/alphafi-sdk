import { poolInfo, poolIdPoolNameMap } from "../../common/maps.js";
import { PoolName } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import { fetchEventsFromDigests } from "./fetchEventsFromDigests.js";
import {
  AlphaLiquidityChangeEvent,
  CetusLiquidityChangeEvent,
  FetchLiquidityChangeEventsParams,
  LiquidityChangeEventNode,
  NaviLiquidityChangeEvent,
} from "./types.js";

export async function fetchLiquidityChangeEvents(
  params: FetchLiquidityChangeEventsParams,
): Promise<LiquidityChangeEventNode[]>;
export async function fetchLiquidityChangeEvents(params: {
  digests: string[];
}): Promise<LiquidityChangeEventNode[]>;
export async function fetchLiquidityChangeEvents(params: {
  startTime?: number;
  endTime?: number;
  poolNames?: PoolName[];
  digests?: string[];
}): Promise<LiquidityChangeEventNode[]> {
  if (!params.digests) {
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
    let liquidityChangeEvents = events.map((e) => {
      return e as LiquidityChangeEventNode;
    });

    if (params.poolNames) {
      liquidityChangeEvents = liquidityChangeEvents.filter((e) =>
        params.poolNames!.includes(poolIdPoolNameMap[e.pool_id]),
      );
    }

    return liquidityChangeEvents;
  } else if (params.digests) {
    const digestEventsMap = await fetchEventsFromDigests({
      digests: params.digests,
    });
    const liquidityChangeEventTypes = new Set<string>(
      Object.values(poolInfo).map((info) => info.liquidityChangeEventType),
    );

    let liquidityChangeEventNodes: LiquidityChangeEventNode[] = [];
    for (const digest in digestEventsMap) {
      const timestamp = digestEventsMap[digest].timestamp;
      const liquidityChangeEvents = digestEventsMap[digest].events?.filter(
        (event) => liquidityChangeEventTypes.has(event.type),
      );
      if (liquidityChangeEvents) {
        liquidityChangeEventNodes = liquidityChangeEventNodes.concat(
          liquidityChangeEvents.map((suiEvent) => {
            const suiEventJson = suiEvent.parsedJson as
              | CetusLiquidityChangeEvent
              | NaviLiquidityChangeEvent
              | AlphaLiquidityChangeEvent;
            let eventNode: LiquidityChangeEventNode;
            if ("amount_a" in suiEventJson) {
              // cetus, bluefin
              eventNode = {
                type: suiEvent.type,
                timestamp: timestamp,
                amount_a: suiEventJson.amount_a,
                amount_b: suiEventJson.amount_b,
                event_type: suiEventJson.event_type,
                fee_collected_a: suiEventJson.fee_collected_a,
                fee_collected_b: suiEventJson.fee_collected_b,
                pool_id: suiEventJson.pool_id,
                sender: suiEventJson.sender,
                tokens_invested: suiEventJson.tokens_invested,
                total_amount_a: suiEventJson.total_amount_a,
                total_amount_b: suiEventJson.total_amount_b,
                user_total_x_token_balance:
                  suiEventJson.user_total_x_token_balance,
                x_token_supply: suiEventJson.x_token_supply,
                txDigest: suiEvent.id.txDigest,
                eventSeq: Number(suiEvent.id.eventSeq),
                transactionModule: suiEvent.transactionModule,
              };
            } else if ("amount" in suiEventJson) {
              // navi, navi-loop, alpha, bucket
              eventNode = {
                type: suiEvent.type,
                timestamp: timestamp,
                amount: suiEventJson.amount,
                event_type: suiEventJson.event_type,
                fee_collected: suiEventJson.fee_collected,
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
              throw new Error("Unexpected Event Found");
            }
            return eventNode;
          }),
        );
      }
    }
    return liquidityChangeEventNodes;
  } else {
    throw new Error("Improper event params");
  }
}
