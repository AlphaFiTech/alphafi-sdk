import { poolIdPoolNameMap, getPoolExchangeRateMap } from "./common/maps";
import { PoolName } from "./common/types";
import { fetchLiquidityChangeEvents } from "./sui-sdk/events/fetchLiquidityChangeEvents";
import { LiquidityChangeEventNode } from "./sui-sdk/events/types";
import { Decimal } from "decimal.js";

export async function getHoldersFromEvents(params?: {
  pools?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<string[]> {
  const liquidityChangeEvents = await fetchLiquidityChangeEvents({
    startTime: params?.startTime,
    endTime: params?.endTime,
    poolNames: params?.pools as PoolName[],
  });
  const holders = parseHoldersLiquidityChange(liquidityChangeEvents);
  return holders;
}

function parseHoldersLiquidityChange(events: LiquidityChangeEventNode[]) {
  const holders: Set<string> = new Set<string>();
  for (const event of events) {
    holders.add(event.sender);
  }
  return Array.from(holders);
}

export async function getTokensFromEvents(params?: {
  pools?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<[string, string, string][]> {
  const liquidityChangeEvents = await fetchLiquidityChangeEvents({
    startTime: params?.startTime,
    endTime: params?.endTime,
    poolNames: params?.pools as PoolName[],
  });
  const xTokenHoldings = parseXTokensFromEvent(liquidityChangeEvents);
  const conversionMap = await getPoolExchangeRateMap();
  const userTokens: [string, string, string][] = xTokenHoldings.map(
    ([owner, pool, xTokens]) => {
      const conversion = new Decimal(
        conversionMap.get(pool as PoolName) as string,
      );
      const tokens = new Decimal(xTokens).mul(conversion).toFixed(4).toString();
      return [owner, pool, tokens];
    },
  );

  return userTokens;
}

// From descending order events
function parseXTokensFromEvent(events: LiquidityChangeEventNode[]) {
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

// getHoldersFromEvents();
