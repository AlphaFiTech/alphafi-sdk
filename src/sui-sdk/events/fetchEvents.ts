import suiClient from "../client";
import { EventId, PaginatedEvents } from "@mysten/sui/client";
import {
  AlphaLiquidityChangeEvent,
  AlphaAutoCompoundingEvent,
  CetusAutoCompoundingEvent,
  CetusLiquidityChangeEvent,
  EventNode,
  FetchEventsParams,
  LiquidityChangeEventNode,
  NaviAutoCompoundingEvent,
  NaviLiquidityChangeEvent,
  RebalanceEvent,
} from "./types";
import { poolInfo } from "../../common/maps";
import { conf, CONF_ENV } from "../../common/constants";

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
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  const startTime = params.startTime ? params.startTime : twentyFourHoursAgo;
  const endTime = params.endTime ? params.endTime : now;

  if (startTime >= endTime) {
    throw new Error("startTime must be less than endTime");
  }

  while (hasNextPage) {
    const result: PaginatedEvents = await suiClient.queryEvents({
      cursor: startCursor,
      order: "descending",
      query: {
        MoveEventType: params.eventTypes[0],
      },
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
        | RebalanceEvent
        | CetusLiquidityChangeEvent
        | AlphaLiquidityChangeEvent
        | NaviLiquidityChangeEvent
        | AlphaAutoCompoundingEvent;

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
        isAutoCompoundingEvent(suiEvent.type) &&
        "amount" in suiEventJson
      ) {
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          amount: suiEventJson.amount,
          investor_id: conf[CONF_ENV].ALPHA_POOL,
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
          amount_a_before: suiEventJson.amount_a_before.toString(),
          amount_b_before: suiEventJson.amount_b_before.toString(),
          amount_a_after: suiEventJson.amount_a_after.toString(),
          amount_b_after: suiEventJson.amount_b_after.toString(),
        };
      } else if (
        isLiquidityChangeEvent(suiEvent.type) &&
        "amount_a" in suiEventJson
      ) {
        // Handling CetusLiquidityChangeEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
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
          user_total_x_token_balance: suiEventJson.user_total_x_token_balance,
          x_token_supply: suiEventJson.x_token_supply,
        } as LiquidityChangeEventNode;
      } else if (
        isLiquidityChangeEvent(suiEvent.type) &&
        "amount" in suiEventJson &&
        !("investor_id" in suiEventJson)
      ) {
        // Handling NaviLiquidityChangeEvent and AlphaLiquidityChangeEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          amount: suiEventJson.amount,
          event_type: suiEventJson.event_type,
          fee_collected: suiEventJson.fee_collected,
          pool_id: suiEventJson.pool_id,
          sender: suiEventJson.sender,
          tokens_invested: suiEventJson.tokens_invested,
          user_total_x_token_balance: suiEventJson.user_total_x_token_balance,
          x_token_supply: suiEventJson.x_token_supply,
        } as LiquidityChangeEventNode;
      } else {
        throw new Error("Unknown event type");
      }

      allEvents.push(eventNode);
    }

    // If we set hasPreviousPage to false, exit the outer loop as well
    if (!hasNextPage) {
      break;
    }

    hasNextPage = result.hasNextPage;
    startCursor = result.nextCursor;
  }

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

const isLiquidityChangeEvent = (eventType: string) => {
  const eventTypes: string[] = Object.values(poolInfo).map((info) => {
    return info.liquidityChangeEventType;
  });
  return eventTypes.includes(eventType);
};
