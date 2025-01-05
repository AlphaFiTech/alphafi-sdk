import { PoolName } from "../../common/types.js";

interface CommonEventAttributes {
  type: string;
  timestamp: number;
  txDigest: string;
  eventSeq: number;
  transactionModule: string;
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

export interface NaviLoopAutoCompoundingEvent extends NaviAutoCompoundingEvent {
  cur_total_debt: bigint;
  accrued_interest: bigint;
}

export interface AutobalancingAutoCompoundingEvent {
  blue_reward_amount: bigint;
  current_liquidity: bigint;
  fee_collected: bigint;
  free_balance_a: bigint;
  free_balance_b: bigint;
  investor_id: string;
  total_amount_a: bigint;
  total_amount_b: bigint;
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

//verify, this might be wrong, alphapool reward event is defined as alpha autocompounding event
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

export interface AlphaWithdrawV2Event {
  amount: string;
  amount_withdrawn_from_locked: string;
  amount_withdrawn_from_unlocked: string;
  fee_collected: string;
  instant_withdraw_fee_collected: string;
  pool_id: string;
  sender: string;
  tokens_invested: string;
  user_total_x_token_balance: string;
  x_token_supply: string;
}

export interface CetusAfterTransactionEvent {
  liquidity: string;
  tokensInvested: string;
  xtokenSupply: string;
}
export interface NaviAfterTransactionEvent {
  amount: string;
  tokensInvested: string;
  xtokenSupply: string;
}

// only event sequence non zero are after transaction
export interface AlphaBeforeAndAfterEvent {
  tokensInvested: string;
  xTokenSupply: string;
}

export type CetusAddLiquidityEvent = {
  after_liquidity: string;
  amount_a: string;
  amount_b: string;
  liquidity: string;
  pool: string;
  position: string;
  tick_lower: { bits: number };
  tick_upper: { bits: number };
};
export type CetusRemoveLiquidityEvent = {
  after_liquidity: string;
  amount_a: string;
  amount_b: string;
  liquidity: string;
  pool: string;
  position: string;
  tick_lower: { bits: number };
  tick_upper: { bits: number };
};

export type NaviPoolDepositEvent = {
  amount: string;
  pool: string;
  sender: string;
};
export type NaviPoolWithdrawEvent = {
  amount: string;
  pool: string;
  recipient: string;
  sender: string;
};

export interface CheckRatioEvent {
  ratio: string;
}

export type AfterTransactionEventNode =
  | (CetusAfterTransactionEvent &
      CommonEventAttributes & {
        poolName: PoolName | undefined;
        id: { eventSeq: number; txDigest: string };
      })
  | (NaviAfterTransactionEvent &
      CommonEventAttributes & {
        poolName: PoolName | undefined;
        id: { eventSeq: number; txDigest: string };
      })
  | (AlphaBeforeAndAfterEvent &
      CommonEventAttributes & {
        poolName: PoolName | undefined;
        id: { eventSeq: number; txDigest: string };
      });

export type AutoCompoundingEventNode =
  | (CetusAutoCompoundingEvent & CommonEventAttributes)
  | (NaviAutoCompoundingEvent & CommonEventAttributes)
  | (NaviLoopAutoCompoundingEvent & CommonEventAttributes)
  | (AlphaAutoCompoundingEvent & CommonEventAttributes)
  | (AutobalancingAutoCompoundingEvent & CommonEventAttributes);

export type RebalanceEventNode = RebalanceEvent & CommonEventAttributes;

export type LiquidityChangeEventNode =
  | (CetusLiquidityChangeEvent & CommonEventAttributes)
  | (NaviLiquidityChangeEvent & CommonEventAttributes)
  | (AlphaLiquidityChangeEvent & CommonEventAttributes);

export type WithdrawV2EventNode = AlphaWithdrawV2Event & CommonEventAttributes;

export type CheckRatioEventNode = CheckRatioEvent & CommonEventAttributes;

export type EventNode =
  | AutoCompoundingEventNode
  | RebalanceEventNode
  | LiquidityChangeEventNode
  | WithdrawV2EventNode
  | AfterTransactionEventNode
  | CheckRatioEventNode;

export type FetchAutoCompoundingEventsParams = {
  startTime?: number;
  endTime?: number;
  poolNames?: PoolName[];
  order?: "ascending" | "descending";
};

export type FetchRebalanceEventsParams = FetchAutoCompoundingEventsParams;

export type FetchLiquidityChangeEventsParams = FetchAutoCompoundingEventsParams;

export type FetchWithdrawV2EventsParams = {
  startTime?: number;
  endTime?: number;
  order?: "ascending" | "descending";
};

export type FetchCheckRatioEventsParams = FetchAutoCompoundingEventsParams;

export type FetchEventsParams = {
  eventTypes: string[];
  startTime?: number;
  endTime?: number;
  order?: "ascending" | "descending";
};

export type EventCategory =
  | "AutoCompounding"
  | "LiquidityChange"
  | "WithdrawV2";

export const eventCategories: EventCategory[] = [
  "AutoCompounding",
  "LiquidityChange",
  "WithdrawV2",
];
