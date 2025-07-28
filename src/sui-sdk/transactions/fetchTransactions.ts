import { getSuiClient } from "../client.js";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { FetchTransactionParams } from "./types.js";

export async function fetchTransactions(
  params: FetchTransactionParams,
): Promise<SuiTransactionBlockResponse[]> {
  let transactionBlocks: SuiTransactionBlockResponse[] = [];
  const suiClient = getSuiClient();
  const options = params.options
    ? params.options
    : {
        showEffects: true,
        showInput: true,
        showObjectChanges: true,
      };
  if (params.startTime >= params.endTime)
    throw new Error("startTime must be less than endTime");

  for (const filter of params.filter) {
    let hasNextPage: boolean = true;
    let nextCursor: null | string | undefined = null;
    while (hasNextPage) {
      const res = await suiClient.queryTransactionBlocks({
        cursor: nextCursor,
        filter: filter,
        options,
      });
      if (res.data.length !== 0) {
        const lastTx = res.data[res.data.length - 1];
        const firstTx = res.data[0];
        const laterTime = firstTx.timestampMs as string;
        const earlierTime = lastTx.timestampMs as string;
        if (Number(laterTime) < params.startTime) {
          // Page beyond interval
          hasNextPage = false;
          break;
        } else if (Number(earlierTime) > params.endTime) {
          // Page beyond interval
          hasNextPage = res.hasNextPage;
          nextCursor = res.nextCursor;
          continue;
        } else {
          // page is partially or completely in the interval
          for (let i = 0; i < res.data.length; i++) {
            if (
              Number(res.data[i].timestampMs) > params.startTime &&
              Number(res.data[i].timestampMs) < params.endTime
            ) {
              transactionBlocks.push(res.data[i]);
            }
          }
          hasNextPage = res.hasNextPage;
          nextCursor = res.nextCursor;
        }
      } else {
        // Empty result
        transactionBlocks = transactionBlocks.concat(res.data);
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      }
    }
  }

  return transactionBlocks;
}
