import { PoolName } from "../../common/types";

// Add others also if fetchLiquidityEvents is not merged
export interface CommonEventAttributes {
  type: string;
  timestamp: number;
  txModule: string;
  txDigest: string;
  eventSeq: string;
}

export interface CetusAutoCompoundingEvent {
  compound_amount_a: bigint;
  compound_amount_b: bigint;
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

export interface RebalanceEvent {
  investor_id: string;
  lower_tick_after: string;
  upper_tick_after: string;
  sqrt_price_after: string;
  amount_a_before: string;
  amount_b_before: string;
  amount_a_after: string;
  amount_b_after: string;
}

export interface AlphaAutoCompoundingEvent {
  amount: string;
  investor_id: string;
}

export interface CetusLiquidityChangeEvent {
  amount_a: string;
  amount_b: string;
  event_type: number;
  fee_collected_a: string;
  fee_collected_b: string;
  pool_id: string;
  sender: string;
  tokens_invested: string;
  total_amount_a: string;
  total_amount_b: string;
  user_total_x_token_balance: string;
  x_token_supply: string;
}

export interface NaviLiquidityChangeEvent {
  amount: string;
  event_type: number;
  fee_collected: string;
  pool_id: string;
  sender: string;
  tokens_invested: string;
  user_total_x_token_balance: string;
  x_token_supply: string;
}

export interface AlphaLiquidityChangeEvent {
  amount: string;
  event_type: number;
  fee_collected: string;
  pool_id: string;
  sender: string;
  tokens_invested: string;
  user_total_x_token_balance: string;
  x_token_supply: string;
}

export interface DepositEvent {
  amount_deposited: string;
  coin_type: { name: string };
  sender: string;
}

export type AutoCompoundingEventNode =
  | (CetusAutoCompoundingEvent & CommonEventAttributes)
  | (NaviAutoCompoundingEvent & CommonEventAttributes)
  | (AlphaAutoCompoundingEvent & CommonEventAttributes);

export type DepositEventNode = DepositEvent & CommonEventAttributes;

export type RebalanceEventNode = RebalanceEvent & CommonEventAttributes;

export type LiquidityChangeEventNode =
  | (CetusLiquidityChangeEvent & CommonEventAttributes)
  | (NaviLiquidityChangeEvent & CommonEventAttributes)
  | (AlphaLiquidityChangeEvent & CommonEventAttributes);

export type EventNode =
  | AutoCompoundingEventNode
  | RebalanceEventNode
  | LiquidityChangeEventNode
  | DepositEventNode;
// export type EventNode = AutoCompoundingEventNode | RebalanceEventNode;

export type FetchAutoCompoundingEventsParams = {
  startTime?: number;
  endTime?: number;
  poolNames?: PoolName[];
};

export type FetchRebalanceEventsParams = FetchAutoCompoundingEventsParams;

export type FetchLiquidityChangeEventsParams = FetchAutoCompoundingEventsParams;

export type FetchDepositEventsParams = {
  startTime: number;
  endTime: number;
  poolNames?: PoolName[];
};

export type FetchEventsParams = {
  eventTypes: string[];
  startTime?: number;
  endTime?: number;
};

export type FetchDepositEventsResponse = DepositEventNode[];

export type ParseInvestmentsfromDepositEventsParams = {
  poolNames: PoolName[];
  owners: string[];
  events: DepositEventNode[];
};

export type ParseAlphaRewardsFromDepositEventsParams = {
  poolNames: PoolName[];
  owners: string[];
  events: DepositEventNode[];
}

export type ParseInvestmentsFromLCEventsParams = {
  poolNames: PoolName[];
  owners: string[];
  events: LiquidityChangeEventNode[];
};

export type ParseAlphaRewardsFromLCEventsParams = {
  poolNames: PoolName[];
  owners: string[];
  events: LiquidityChangeEventNode[];
}