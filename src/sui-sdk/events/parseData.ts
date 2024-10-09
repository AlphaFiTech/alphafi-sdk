import { LiquidityChangeEventNode } from "./types.js";
import { poolIdPoolNameMap } from "../../common/maps.js";

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
