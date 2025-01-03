import { getSuiClient } from "../client.js";
import { EventId, PaginatedEvents } from "@mysten/sui/client";
import {
  AlphaLiquidityChangeEvent,
  AlphaAutoCompoundingEvent,
  CetusAutoCompoundingEvent,
  CetusLiquidityChangeEvent,
  EventNode,
  FetchEventsParams,
  NaviAutoCompoundingEvent,
  NaviLoopAutoCompoundingEvent,
  NaviLiquidityChangeEvent,
  RebalanceEvent,
  AutoCompoundingEventNode,
  AlphaWithdrawV2Event,
  AfterTransactionEventNode,
  CheckRatioEvent,
  AutobalancingAutoCompoundingEvent,
} from "./types.js";
import { poolInfo } from "../../common/maps.js";
import { conf, CONF_ENV } from "../../common/constants.js";

export async function fetchEvents(
  params: FetchEventsParams,
): Promise<EventNode[]> {
  const allEvents: EventNode[] = [];
  let hasNextPage = true;
  let startCursor: EventId | null | undefined = null;
  const order = params.order ? params.order : "descending";

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

  const suiClient = getSuiClient();
  //const prevTS = 0;

  while (hasNextPage) {
    const result: PaginatedEvents = await suiClient.queryEvents({
      cursor: startCursor,
      order: order,
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
        | NaviLoopAutoCompoundingEvent
        | AutobalancingAutoCompoundingEvent
        | RebalanceEvent
        | CetusLiquidityChangeEvent
        | AlphaLiquidityChangeEvent
        | NaviLiquidityChangeEvent
        | AlphaAutoCompoundingEvent
        | AlphaWithdrawV2Event
        | AfterTransactionEventNode // TODO: this needs to be changed to AfterTransactionEvent Eventually
        | CheckRatioEvent;

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
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };

        // if (
        //   eventNode.investor_id ===
        //   "0xd060e81548aee885bd3d37ae0caec181185be792bf45412e0d0acccd1e0174e6"
        // ) {
        //   console.log(
        //     eventNode.timestamp,
        //     (prevTS - eventNode.timestamp) / (1000 * 60),
        //   );
        //   prevTS = eventNode.timestamp;
        // }
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
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
        if (
          "cur_total_debt" in suiEventJson &&
          "accrued_interest" in suiEventJson
        ) {
          const loopEvent: AutoCompoundingEventNode = {
            ...eventNode,
            cur_total_debt: BigInt(suiEventJson.cur_total_debt.toString()),
            accrued_interest: BigInt(suiEventJson.accrued_interest.toString()),
          };
          eventNode = loopEvent;
        }
      } else if (
        isAutoCompoundingEvent(suiEvent.type) &&
        "amount" in suiEventJson
      ) {
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          amount: suiEventJson.amount,
          investor_id: conf[CONF_ENV].ALPHA_POOL,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isAutoCompoundingEvent(suiEvent.type) &&
        "blue_reward_amount" in suiEventJson
      ) {
        // Handling CetusAutoCompoundingEvent
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          blue_reward_amount: BigInt(
            suiEventJson.blue_reward_amount.toString(),
          ),
          current_liquidity: BigInt(suiEventJson.current_liquidity.toString()),
          fee_collected: BigInt(suiEventJson.fee_collected.toString()),
          free_balance_a: BigInt(suiEventJson.free_balance_a.toString()),
          free_balance_b: BigInt(suiEventJson.free_balance_b.toString()),
          investor_id: suiEventJson.investor_id,
          total_amount_a: BigInt(suiEventJson.total_amount_a.toString()),
          total_amount_b: BigInt(suiEventJson.total_amount_b.toString()),
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };

        // if (
        //   eventNode.investor_id ===
        //   "0xd060e81548aee885bd3d37ae0caec181185be792bf45412e0d0acccd1e0174e6"
        // ) {
        //   console.log(
        //     eventNode.timestamp,
        //     (prevTS - eventNode.timestamp) / (1000 * 60),
        //   );
        //   prevTS = eventNode.timestamp;
        // }
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
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
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
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isLiquidityChangeEvent(suiEvent.type) &&
        "amount" in suiEventJson &&
        !("investor_id" in suiEventJson) &&
        !("amount_withdrawn_from_locked" in suiEventJson) &&
        !("xtokenSupply" in suiEventJson)
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
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isWithdrawV2Event(suiEvent.type) &&
        "amount_withdrawn_from_locked" in suiEventJson
      ) {
        // Handling Alpha WithdrawV2 Events
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
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
          user_total_x_token_balance: suiEventJson.user_total_x_token_balance,
          x_token_supply: suiEventJson.x_token_supply,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isAfterTransactionEvent(suiEvent.type) &&
        "tokensInvested" in suiEventJson &&
        !("liquidity" in suiEventJson) &&
        !("amount" in suiEventJson)
      ) {
        //handling alpha after transaction event
        if (suiEvent.id.eventSeq === "0") continue;
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          poolName: "ALPHA",
          id: {
            eventSeq: Number(suiEvent.id.eventSeq),
            txDigest: suiEvent.id.txDigest,
          },
          tokensInvested: suiEventJson.tokensInvested,
          xTokenSupply: suiEventJson.xTokenSupply,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isAfterTransactionEvent(suiEvent.type) &&
        "tokensInvested" in suiEventJson &&
        "liquidity" in suiEventJson
      ) {
        //handling  cetus after transaction event
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          poolName: undefined,
          id: {
            eventSeq: Number(suiEvent.id.eventSeq),
            txDigest: suiEvent.id.txDigest,
          },
          tokensInvested: suiEventJson.tokensInvested,
          xtokenSupply: suiEventJson.xtokenSupply,
          liquidity: suiEventJson.liquidity,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if (
        isAfterTransactionEvent(suiEvent.type) &&
        "amount" in suiEventJson &&
        "tokensInvested" in suiEventJson
      ) {
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          poolName: undefined,
          id: {
            eventSeq: Number(suiEvent.id.eventSeq),
            txDigest: suiEvent.id.txDigest,
          },
          tokensInvested: suiEventJson.tokensInvested,
          xtokenSupply: suiEventJson.xtokenSupply,
          amount: suiEventJson.amount,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else if ("ratio" in suiEventJson) {
        // Check Ratio - looping pools
        eventNode = {
          type: suiEvent.type,
          timestamp: Number(suiEvent.timestampMs),
          ratio: suiEventJson.ratio,
          txDigest: suiEvent.id.txDigest,
          eventSeq: Number(suiEvent.id.eventSeq),
          transactionModule: suiEvent.transactionModule,
        };
      } else {
        console.error("event: ", suiEvent, "json: ", suiEventJson);
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

const isWithdrawV2Event = (eventType: string) => {
  const eventTypes: string[] = Object.values(poolInfo)
    .map((info) => {
      return info.withdrawV2EventType;
    })
    .filter((type) => type !== undefined);
  return eventTypes.includes(eventType);
};

const isAfterTransactionEvent = (eventType: string) => {
  const eventTypes: string[] = Object.values(poolInfo)
    .map((info) => {
      return info.afterTransactionEventType;
    })
    .filter((type) => type !== undefined);
  return eventTypes.includes(eventType);
};
