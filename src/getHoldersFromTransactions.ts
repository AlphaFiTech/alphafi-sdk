import {
  SuiTransactionBlockResponse,
  TransactionFilter,
} from "@mysten/sui/client";
import { fetchTransactions } from "./sui-sdk/transactions/fetchTransactions";
import {
  nonAlphaDepositFilters,
  alphaDepositFilters,
} from "./sui-sdk/transactions/constants";
import {
  GetUserTokensFromTransactionsParams,
  GetUserTokensInUsdFromTransactionsParams,
  UserUsdHoldings,
  LiquidityToUsdParams,
} from "./types";
import { getReceipts } from "./utils/getReceipts";
import {
  getCetusSqrtPriceMap,
  getCetusInvestorTicksMap,
  getTokenPriceMap,
} from "./common/maps";
import { PoolName } from "./common/types";
import {
  parseTokensFromReceipts,
  liquidityToUsd,
  mergeDuplicateHoldings,
} from "./utils/getHoldersFromTransactionsUtils";

// TODO: add functionality for Pool
export async function getHoldersFromTransactions(params?: {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<string[]> {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  const startTime = params?.startTime ? params.startTime : twentyFourHoursAgo;
  const endTime = params?.endTime ? params.endTime : now;

  const filters: TransactionFilter[] = [
    ...alphaDepositFilters,
    ...nonAlphaDepositFilters,
  ];
  const transactions: SuiTransactionBlockResponse[] = await fetchTransactions({
    startTime: startTime,
    endTime: endTime,
    filter: filters,
    sort: "descending",
  });
  const users = transactions.map((tx) => {
    const owner = tx.effects?.gasObject.owner as { AddressOwner: string };
    return owner.AddressOwner;
  });

  const userSet = new Set<string>(users);
  return Array.from(userSet);
}

export async function getUserTokensFromTransactions(
  params?: GetUserTokensFromTransactionsParams,
): Promise<[string, string, string][]> {
  let owners: string[];
  if (params?.owners) {
    owners = params.owners;
  } else {
    owners = await getHoldersFromTransactions({
      poolNames: params?.poolNames,
      startTime: params?.startTime,
      endTime: params?.endTime,
    });
  }
  const receipts = await getReceipts({
    poolNames: params?.poolNames,
    owners: owners,
  });
  const userTokens = parseTokensFromReceipts(receipts);
  return userTokens;
}

export async function getUserTokensInUsdFromTransactions(
  params?: GetUserTokensInUsdFromTransactionsParams,
): Promise<UserUsdHoldings[]> {
  let usdHoldings: [string, string, string][] = [];

  // format: [address pool tokens][]
  let tokenHoldings: [string, string, string][];
  if (params?.userTokensHoldings) {
    tokenHoldings = params.userTokensHoldings;
  } else {
    tokenHoldings = await getUserTokensFromTransactions(params);
  }
  const sqrtPriceCetusMap = await getCetusSqrtPriceMap();
  const ticksCetusMap = await getCetusInvestorTicksMap();
  const tokenPriceMap = await getTokenPriceMap();
  usdHoldings = tokenHoldings.map(([address, poolName, tokens]) => {
    const params: LiquidityToUsdParams = {
      liquidity: tokens,
      poolName: poolName,
      ticksCetusMap: ticksCetusMap,
      sqrtPriceCetusMap: sqrtPriceCetusMap,
      tokenPriceMap: tokenPriceMap,
    };
    const usdVal = liquidityToUsd(params) as string;
    return [address, poolName, usdVal];
  });
  usdHoldings = mergeDuplicateHoldings(usdHoldings);
  const userUsdHoldings: UserUsdHoldings[] = usdHoldings.map(
    ([address, pool, value]) => {
      return {
        user: address,
        poolName: pool as PoolName,
        usdHoldings: value,
      };
    },
  );

  return userUsdHoldings;
}
