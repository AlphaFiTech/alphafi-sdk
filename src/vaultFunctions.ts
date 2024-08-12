import { PaginatedTransactionResponse, SuiClient } from "@mysten/sui/client";
import {
  CoinName,
  LpBreakdownType,
  PoolName,
  RebalanceHistoryType,
  TransactionBlockType,
} from "./common/types";
import { getPool } from "./portfolioAmount";
import { getCetusPool, getCoinAmountsFromLiquidity } from "./functions";
import { poolInfo, poolCoinPairMap } from "./common/maps";
import { getLatestPrice } from "./price";
import { PythPriceIdPair } from "./common/pyth";
import { conf, CONF_ENV } from "./common/constants";
import { coins } from "./common/coins";
import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";

export async function alphaLpBreakdown(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<LpBreakdownType | undefined> {
  const pool = await getPool(poolName, options);
  if (pool) {
    const liquidity = pool.content.fields.tokensInvested;
    const amounts = await getCoinAmountsFromLiquidity(
      poolName,
      Number(liquidity),
      options,
    );

    const pool1 =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinA;
    const pool2 =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB;

    const priceOfCoin0 = await getLatestPrice(
      `${pool1}/USD` as PythPriceIdPair,
    );
    const priceOfCoin1 = await getLatestPrice(
      `${pool2}/USD` as PythPriceIdPair,
    );
    const coinAInUsd = amounts[0] * Number(priceOfCoin0);
    const coinBInUsd = amounts[1] * Number(priceOfCoin1);

    const res: LpBreakdownType = {
      coinA: amounts[0].toString(),
      coinAInUsd: coinAInUsd.toString(),
      coinB: amounts[1].toString(),
      coinBInUsd: coinBInUsd.toString(),
      liquidity: liquidity,
    };
    return res;
  }
}

export async function cetusLpBreakdown(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<LpBreakdownType | undefined> {
  const pool = await getCetusPool(poolName, options);
  if (pool) {
    const liquidity = pool.content.fields.liquidity;
    const amounts = [pool.content.fields.coin_a, pool.content.fields.coin_b];

    const pool1 =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinA;
    const pool2 =
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB;

    const priceOfCoin0 = await getLatestPrice(
      `${pool1}/USD` as PythPriceIdPair,
    );
    const priceOfCoin1 = await getLatestPrice(
      `${pool2}/USD` as PythPriceIdPair,
    );
    const coinAInUsd = Number(amounts[0]) * Number(priceOfCoin0);
    const coinBInUsd = Number(amounts[1]) * Number(priceOfCoin1);

    const res: LpBreakdownType = {
      coinA: amounts[0].toString(),
      coinAInUsd: coinAInUsd.toString(),
      coinB: amounts[1].toString(),
      coinBInUsd: coinBInUsd.toString(),
      liquidity: liquidity,
    };
    return res;
  }
  return undefined;
}

export async function fetchRebalanceHistory(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<RebalanceHistoryType[]> {
  const coin1Type =
    coins[
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap]
        .coinA as CoinName
    ].type;
  const coin2Type =
    coins[
      poolCoinPairMap[poolName as keyof typeof poolCoinPairMap]
        .coinB as CoinName
    ].type;
  const module =
    poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB === "SUI"
      ? "alphafi_cetus_sui_investor"
      : "alphafi_cetus_investor";
  const rebalanceArr: RebalanceHistoryType[] = [];
  let currentCursor: string | null | undefined = null;
  let flag = true;
  while (flag) {
    const paginatedObjects: PaginatedTransactionResponse =
      await options.suiClient.queryTransactionBlocks({
        cursor: currentCursor,
        filter: {
          MoveFunction: {
            function: "rebalance",
            module: module,
            package: `${conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID}`,
          },
        },
        options: {
          showInput: true,
          showEvents: true,
        },
      });

    paginatedObjects.data.forEach((obj) => {
      const o = obj as unknown as TransactionBlockType;
      const type_arguments =
        o.transaction.data.transaction.transactions[0].MoveCall.type_arguments;
      if (type_arguments[0] === coin1Type && type_arguments[1] === coin2Type) {
        const events = o.events;
        events.reverse();
        let after_sqrt_price: string = "";
        for (const event of events) {
          if (event.type.includes(`::pool::SwapEvent`)) {
            after_sqrt_price = event.parsedJson.after_sqrt_price;
            break;
          }
        }
        const after_price = TickMath.sqrtPriceX64ToPrice(
          new BN(after_sqrt_price),
          coins[poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinA]
            .expo,
          coins[poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB]
            .expo,
        );
        const inputs = o.transaction.data.transaction.inputs;
        const rebalanceObj: RebalanceHistoryType = {
          timestamp: o.timestampMs,
          lower_tick: inputs[8].value,
          upper_tick: inputs[9].value,
          after_price: after_price.toString(),
        };
        rebalanceArr.push(rebalanceObj);
      }
    });

    if (paginatedObjects.hasNextPage && paginatedObjects.nextCursor) {
      currentCursor = paginatedObjects.nextCursor;
    } else {
      flag = false;
    }
  }
  return rebalanceArr;
}

export async function lastAutocompoundTime(
  poolName: PoolName,
  options: {
    suiClient: SuiClient;
  },
): Promise<string | null | undefined> {
  const { suiClient } = options;
  const investorId = poolInfo[poolName].investorId;
  const ok = await suiClient.queryTransactionBlocks({
    filter: {
      InputObject: investorId,
    },
  });
  const tb = await suiClient.getTransactionBlock({
    digest: ok.data[0].digest,
    options: { showEvents: true },
  });
  return tb.timestampMs;
}
