import { PoolName } from "../../common/types";

interface CommonEventAttributes {
  type: string;
  timestamp: number;
}

export interface CetusAutoCompoundingEvent {
  compound_amount_a: bigint;
  compound_amount_b: number;
  current_liquidity: bigint;
  fee_collected_a: bigint;
  fee_collected_b: bigint;
  free_balance_a: bigint;
  free_balance_b: bigint;
  investor_id: string;
  total_amount_a: bigint;
  total_amount_b: bigint;
}

export interface NaviAutoCompoundingEvent {
  compound_amount: bigint;
  fee_collected: bigint;
  investor_id: string;
  location: number;
  total_amount: bigint;
}

export type AutoCompoundingEventNode =
  | (CetusAutoCompoundingEvent & CommonEventAttributes)
  | (NaviAutoCompoundingEvent & CommonEventAttributes);

export type EventNode = AutoCompoundingEventNode;

export type FetchAutoCompoundingEventsParams = {
  startTime?: number;
  endTime?: number;
  poolNames?: PoolName[];
};

export type FetchEventsParams = {
  eventTypes: string[];
  startTime?: number;
  endTime?: number;
};
