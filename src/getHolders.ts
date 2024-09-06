import {
  SuiTransactionBlockResponse,
  TransactionFilter,
} from "@mysten/sui/client";
import { conf } from "./common/constants";
import { fetchTransactions } from "./sui-sdk/transactions/fetchTransactions";

const nonAlphaFilters: TransactionFilter[] = [
  {
    MoveFunction: {
      function: "user_deposit",
      module: "alphafi_cetus_pool",
      package:
        "0x7666ad8f8b0201c0a33cc5b3444167c9bd4a029393e3807adc2f82df016d5cea",
    },
  },
  {
    MoveFunction: {
      function: "user_deposit",
      module: "alphafi_cetus_sui_pool",
      package:
        "0x7666ad8f8b0201c0a33cc5b3444167c9bd4a029393e3807adc2f82df016d5cea",
    },
  },
  {
    MoveFunction: {
      function: "user_deposit",
      module: "alphafi_cetus_pool_base_a",
      package:
        "0x7666ad8f8b0201c0a33cc5b3444167c9bd4a029393e3807adc2f82df016d5cea",
    },
  },
];

const alphaFilters: TransactionFilter[] = conf.production.ALPHA_PACKAGE_IDS.map(
  (id) => {
    return {
      MoveFunction: {
        function: "user_deposit",
        module: "alphapool",
        package: id,
      },
    };
  },
);

// TODO: add functionality for Pool
export async function getHolders(params?: {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
}): Promise<string[]> {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago
  const startTime = params?.startTime ? params.startTime : twentyFourHoursAgo;
  const endTime = params?.endTime ? params.endTime : now;

  let userList: string[] = [];
  const filters: TransactionFilter[] = [...alphaFilters, ...nonAlphaFilters];
  for (const filter of filters) {
    const txbs: SuiTransactionBlockResponse[] = await fetchTransactions({
      startTime: startTime,
      endTime: endTime,
      filter: filter,
    });
    const users = txbs.map((txb) => {
      const owner = txb.effects?.gasObject.owner as { AddressOwner: string };
      return owner.AddressOwner;
    });
    userList = userList.concat(users);
  }

  const userSet = new Set<string>(userList);
  return Array.from(userSet);
}
