import { CetusLiquidityChangeEvent, NaviLiquidityChangeEvent, AlphaLiquidityChangeEvent, LiquidityChangeEventNode, CommonEventAttributes } from "./types";
import { poolIdPoolNameMap, poolInfo } from "../../common/maps";
import {
  DepositEventNode,
  ParseInvestmentsfromDepositEventsParams,
  ParseAlphaRewardsFromDepositEventsParams,
  ParseInvestmentsFromLCEventsParams,
  ParseAlphaRewardsFromLCEventsParams,
} from "./types";
import {
  UsersInvestmentsInPools,
  UsersCollectedAlphaRewards,
} from "../../utils/poolEarnings/types";
import Decimal from "decimal.js";
import { PoolAmounts, SingleTokenAmounts } from "../../common/types";
import { conf, CONF_ENV } from "../../common/constants";

export function parseHoldersFromLCEvents(events: LiquidityChangeEventNode[]) {
  const holders: Set<string> = new Set<string>();
  for (const event of events) {
    holders.add(event.sender);
  }
  return Array.from(holders);
}

// From descending order events
export function parseXTokensFromLCEvent(events: LiquidityChangeEventNode[]) {
  let userXTokens: [string, string, string][] = [];
  const ownerPoolTokensMap: { [owner_pool: string]: string } = {};
  for (const event of events) {
    const sender = event.sender;
    const xTokens = event.user_total_x_token_balance;
    const pool = poolIdPoolNameMap[event.pool_id];
    const key = `${sender}_${pool}`;
    if (!ownerPoolTokensMap[key]) {
      ownerPoolTokensMap[key] = xTokens;
    }
  }
  userXTokens = Object.entries(ownerPoolTokensMap).map(
    ([owner_pool, xToken]) => {
      return [owner_pool.split("_")[0], owner_pool.split("_")[1], xToken];
    },
  );
  return userXTokens;
}

export function parseInvestmentsfromDepositEvents(
  params: ParseInvestmentsfromDepositEventsParams,
): UsersInvestmentsInPools {
  let usersInvestmentsInPools: UsersInvestmentsInPools = {};

  if (params.poolNames.some((poolName) => poolName !== "ALPHA")) {
    console.warn(
      "Investments from Deposit Events only supported for ALPHA yet",
    );
  }

  for (const node of params.events) {
    if (node.txModule !== "alphapool") {
      continue;
    }
    const owner = node.sender;
    const investment = new Decimal(node.amount_deposited).div(1e9);
    if (owner in usersInvestmentsInPools) {
      const prevInvestment = usersInvestmentsInPools[owner]
        .ALPHA as SingleTokenAmounts;
      const newInvestment = new Decimal(prevInvestment.tokens)
        .add(investment)
        .toFixed(5)
        .toString();
      usersInvestmentsInPools[owner].ALPHA = {
        tokens: newInvestment,
      } as SingleTokenAmounts;
    } else {
      usersInvestmentsInPools[owner] = {
        ALPHA: { tokens: investment.toFixed(5).toString() },
      } as PoolAmounts;
    }
  }

  if (params.owners.length === 0) {
    return usersInvestmentsInPools;
  }
  usersInvestmentsInPools = Object.fromEntries(
    params.owners
      .filter((owner) => owner in usersInvestmentsInPools)
      .map((owner) => [owner, usersInvestmentsInPools[owner]]),
  );
  return usersInvestmentsInPools;
}

// this function takes the deposits coming from other modules
// checks the transaction digests for each of the event
// finds out the pool that it came from using the input objects from the transactions
// uses that to create the mapping
// returs each users collected rewards from each pool
export function parseAlphaRewardsFromDepositEvents(
  params: ParseAlphaRewardsFromDepositEventsParams,
): UsersCollectedAlphaRewards {
  let usersCollectedAlphaRewards: UsersCollectedAlphaRewards = {};  

  for (const node of params.events) {
    if (node.type !== poolInfo["ALPHA"].depositEventType) {
      console.error("parseAlphaRewardsFromDepositEvents expects only alphapool deposit events");
      continue;
    }
    if (node.txModule === "alphapool") {
      continue;
    }
    const owner = node.sender;
    const reward = new Decimal(node.amount_deposited).div(1e9);

    // TODO add mapping, this is total collected rewards, filter based on user's ask (poolNames)
    if (owner in usersCollectedAlphaRewards) {
      const prevReward = usersCollectedAlphaRewards[owner]["ALPHA"];
      usersCollectedAlphaRewards[owner]["ALPHA"] = reward.add(new Decimal(prevReward)).toFixed(5).toString();
    } else {
      usersCollectedAlphaRewards[owner]["ALPHA"] = reward.toFixed(5).toString();
    }
  }

  return usersCollectedAlphaRewards;
}

export function parseInvestmentsFromLCEvents(
  params: ParseInvestmentsFromLCEventsParams
): UsersInvestmentsInPools {
  let usersInvestmentsInPools: UsersInvestmentsInPools = {};

  if (params.poolNames.some((poolName) => poolName !== "ALPHA")) {
    console.error(
      "Investments from Liquidity Change Events only supported for ALPHA yet",
    );
  }

  for (const node of params.events) {
    if (isAlphaLCEventNode(node)) {
      if (node.txModule !== "alphapool") {
        // this is collect reward
        continue;
      }
      const owner = node.sender;
      const investment = new Decimal(node.amount).div(1e9);
      if (owner in usersInvestmentsInPools) {
        const prevInvestment = usersInvestmentsInPools[owner]
          .ALPHA as SingleTokenAmounts;
        const newInvestment = new Decimal(prevInvestment.tokens)
          .add(investment)
          .toFixed(5)
          .toString();
        usersInvestmentsInPools[owner].ALPHA = {
          tokens: newInvestment,
        } as SingleTokenAmounts;
      } else {
        usersInvestmentsInPools[owner] = {
          ALPHA: { tokens: investment.toFixed(5).toString() },
        } as PoolAmounts;
      }

    }
    else if (isCetusLCEventNode(node)) {
      // TODO add investment functionality for cetus pools
      continue;
    }
    else if (isNaviLCEventNode(node)) {
      // TODO add investment functionality for navi pools
      continue;
    }
  }

  if (params.owners.length === 0) {
    return usersInvestmentsInPools;
  }
  usersInvestmentsInPools = Object.fromEntries(
    params.owners
      .filter((owner) => owner in usersInvestmentsInPools)
      .map((owner) => [owner, usersInvestmentsInPools[owner]]),
  );
  return usersInvestmentsInPools;
}

// Write Similarly to parseAlphaRewardsFromDepositEvents
export function parseAlphaRewardsFromLCEvents(params: ParseAlphaRewardsFromLCEventsParams): UsersCollectedAlphaRewards {
  let usersCollectedAlphaRewards: UsersCollectedAlphaRewards = {};

  for (const node of params.events) {
    if (isAlphaLCEventNode(node)) {
      if (node.txModule === "alphapool") {
        // this is user deposit
        continue;
      }
      const owner = node.sender;
      const reward = new Decimal(node.amount).div(1e9);
      // TODO add mapping
      if (owner in usersCollectedAlphaRewards) {
        const prevReward = usersCollectedAlphaRewards[owner]["ALPHA"]
        const newReward = new Decimal(prevReward)
          .add(reward)
          .toFixed(5)
          .toString();
        usersCollectedAlphaRewards[owner]["ALPHA"] = newReward;
      } else {
        usersCollectedAlphaRewards[owner]["ALPHA"] = reward.toFixed(5).toString();
      }
    }
    else if (isCetusLCEventNode(node)) {
      continue;
    }
    else if (isNaviLCEventNode(node)) {
      continue;
    }
  }

  return usersCollectedAlphaRewards;
}

function isCetusLCEventNode(event: LiquidityChangeEventNode): event is (CetusLiquidityChangeEvent & CommonEventAttributes) {
  return 'amount_a' in event && 'amount_b' in event;
}
function isNaviLCEventNode(event: LiquidityChangeEventNode): event is (NaviLiquidityChangeEvent & CommonEventAttributes) {
  return !('amount_a' in event) && !('amount_b' in event) && 'fee_collected' in event;
}
function isAlphaLCEventNode(event: LiquidityChangeEventNode): event is (AlphaLiquidityChangeEvent & CommonEventAttributes) {
  return !('amount_a' in event) && !('amount_b' in event) && 'fee_collected' in event;
}
