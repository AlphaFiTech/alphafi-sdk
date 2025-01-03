import { SuiEvent, SuiTransactionBlockResponse } from "@mysten/sui/client";
import {
  parentPoolMap,
  singleAssetPoolCoinMap,
  poolInfo,
} from "../../common/maps.js";
import { CoinName, PoolName } from "../../common/types.js";
import { fetchEvents } from "./fetchEvents.js";
import {
  AfterTransactionEventNode,
  CetusAddLiquidityEvent,
  CetusRemoveLiquidityEvent,
  NaviPoolDepositEvent,
  NaviPoolWithdrawEvent,
} from "./types.js";
import { getSuiClient } from "../client.js";
import { conf, CONF_ENV } from "../../common/constants.js";
import { coinsList } from "../../common/coins.js";

export async function fetchAfterTransactionEvents(params: {
  startTime: number;
  endTime: number;
  poolNames?: PoolName[];
  order?: "ascending" | "descending";
}) {
  const eventTypesSet = new Set<string>();
  if (params.poolNames) {
    params.poolNames.forEach((poolName) => {
      const eventType = poolInfo[poolName].afterTransactionEventType;
      if (eventType !== undefined && eventType !== null && eventType !== "") {
        eventTypesSet.add(eventType);
      }
    });
  } else {
    // Iterate over all the values in poolInfo and add each autoCompoundingEventType to the Set
    Object.values(poolInfo).forEach((info) => {
      const eventType = info.afterTransactionEventType;
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
      order: params.order,
    });
    return events;
  });
  const events = (await Promise.all(eventsPromises)).flat();
  const afterTransactionEvents = events.map((e) => {
    return e as AfterTransactionEventNode;
  });

  if (
    params.poolNames &&
    params.poolNames.length === 1 &&
    params.poolNames[0] === "ALPHA"
  ) {
    return afterTransactionEvents;
  }
  const afterTransactionEventsWithPool = await (async () => {
    const txDigests: string[] = [];
    for (const event of afterTransactionEvents) {
      if (!event.poolName) {
        txDigests.push(event.id.txDigest);
      }
    }
    const suiClient = getSuiClient();
    let eventsFromTx: SuiTransactionBlockResponse[] = [];
    while (txDigests.length > 0) {
      const batch = txDigests.splice(0, Math.min(50, txDigests.length));
      const eventsFromTxBatch = await suiClient.multiGetTransactionBlocks({
        digests: batch,
        options: { showEvents: true },
      });
      eventsFromTx = eventsFromTx.concat(eventsFromTxBatch);
    }
    return new Map<string, SuiTransactionBlockResponse>(
      eventsFromTx.map((txData) => {
        return [txData.digest, txData];
      }),
    );
  })();
  for (let i = 0; i < afterTransactionEvents.length; i++) {
    const event = afterTransactionEvents[i];
    if (event.poolName) continue;
    const otherEvents = afterTransactionEventsWithPool.get(
      event.id.txDigest,
    )?.events;
    if (!otherEvents) {
      throw new Error(
        `SuiTransactionBlockResponse not found for digest: ${event.id.txDigest}`,
      );
    }
    const thisPoolName = ((otherEvents: SuiEvent[]) => {
      for (let j = 0; j < otherEvents.length; j++) {
        const otherEvent = otherEvents[j];
        if (
          otherEvent.type === conf[CONF_ENV].CETUS_ADD_LIQUIDITY_EVENT ||
          otherEvent.type === conf[CONF_ENV].CETUS_REMOVE_LIQUIDITY_EVENT
        ) {
          //CETUS
          const eventJson = otherEvent.parsedJson as
            | CetusAddLiquidityEvent
            | CetusRemoveLiquidityEvent;
          const cetusPoolId = eventJson.pool;
          const poolName = Object.keys(parentPoolMap).find(
            (pool) => parentPoolMap[pool] === cetusPoolId,
          );
          if (!poolName)
            throw new Error(`cetusPoolName not found for event: ${otherEvent}`);
          return poolName;
        } else if (
          otherEvent.type === conf[CONF_ENV].NAVI_POOL_DEPOSIT_EVENT ||
          otherEvent.type === conf[CONF_ENV].NAVI_POOL_WITHDRAW_EVENT
        ) {
          //NAVI
          const eventJson = otherEvent.parsedJson as
            | NaviPoolDepositEvent
            | NaviPoolWithdrawEvent;
          const naviCoinId =
            eventJson.pool ===
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
              ? "0x2::sui::SUI"
              : `0x${eventJson.pool}`;
          const coinName = Object.keys(coinsList).find(
            (coin) => coinsList[coin as CoinName].type === naviCoinId,
          );
          const poolName = Object.keys(singleAssetPoolCoinMap).find(
            (pool) => singleAssetPoolCoinMap[pool].coin === coinName,
          );
          if (!poolName) {
            console.error("for event: ", otherEvent);
            throw new Error(`naviPoolName not found`);
          }
          return poolName;
        } else {
          if (j === otherEvents.length - 1) {
            console.error("digest", event.id.txDigest);
            throw new Error(
              "deposit/withdraw events not found for either CETUS, or NAVI",
            );
          }
        }
      }
    })(otherEvents);
    if (!thisPoolName) throw new Error(`PoolName not found`);
    const eventWithPool: AfterTransactionEventNode = {
      ...event,
      poolName: thisPoolName as PoolName,
    };
    afterTransactionEvents[i] = eventWithPool;
  }

  if (params.poolNames && params.poolNames.length >= 1) {
    const allowedPoolNames = params.poolNames;
    return afterTransactionEvents.filter((event) =>
      allowedPoolNames.includes(event.poolName!),
    );
  }

  return afterTransactionEvents;
}
