import suiClient from "../client";
import {
  TransactionFilter,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";

export async function fetchTxbs(params: {
  startTime: number;
  endTime: number;
  filter: TransactionFilter;
}) {
  let hasNextPage: boolean = true;
  let nextCursor: null | string | undefined = null;
  let transactionBlocks: SuiTransactionBlockResponse[] = [];
  while (hasNextPage) {
    const res = await suiClient.queryTransactionBlocks({
      cursor: nextCursor,
      filter: params.filter,
      options: {
        showEffects: true,
        showInput: true,
        showObjectChanges: true,
      },
    });
    if (res.data.length !== 0) {
      const lastTx = res.data[res.data.length - 1];
      const firstTx = res.data[0];
      const laterTime = firstTx.timestampMs as string;
      const earlierTime = lastTx.timestampMs as string;
      if (Number(laterTime) < params.startTime) {
        hasNextPage = false;
        break;
      } else if (Number(earlierTime) > params.endTime) {
        continue;
      } else {
        transactionBlocks = transactionBlocks.concat(res.data);
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      }
    } else {
      transactionBlocks = transactionBlocks.concat(res.data);
      hasNextPage = res.hasNextPage;
      nextCursor = res.nextCursor;
    }
  }
  return transactionBlocks;
}
