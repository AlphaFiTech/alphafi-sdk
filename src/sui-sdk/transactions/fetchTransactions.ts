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
    let i = 0; //debug
    while (hasNextPage) {
      console.log(i++); //debug
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
        console.log("later earlier", laterTime, earlierTime); //debug
        if (Number(laterTime) < params.startTime) {
          // Page beyond interval
          hasNextPage = false;
          break;
        } else if (Number(earlierTime) > params.endTime) {
          // Page beyond interval
          hasNextPage = res.hasNextPage;
          nextCursor = res.nextCursor;
          continue;
        } else if (
          Number(laterTime) > params.startTime &&
          Number(laterTime) < params.endTime &&
          Number(earlierTime) < params.startTime
        ) {
          // Page spills from interval startTime
          for (let i = 0; i < res.data.length; i++) {
            if (Number(res.data[i].timestampMs) > params.startTime) {
              transactionBlocks.push(res.data[i]);
            } else {
              break;
            }
          }
          hasNextPage = res.hasNextPage;
          nextCursor = res.nextCursor;
        } else if (
          Number(laterTime) > params.endTime &&
          Number(earlierTime) > params.startTime &&
          Number(earlierTime) < params.endTime
        ) {
          // Page spills from interval endTIme
          for (let i = res.data.length - 1; i >= 0; i--) {
            if (Number(res.data[i].timestampMs) < params.endTime) {
              transactionBlocks.push(res.data[i]);
            } else {
              break;
            }
          }
          hasNextPage = res.hasNextPage;
          nextCursor = res.nextCursor;
        } else if (
          Number(laterTime) > params.endTime &&
          Number(earlierTime) < params.startTime
        ) {
          // Page spills from interval both bounds
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
        } else {
          // Page is in the interval
          transactionBlocks = transactionBlocks.concat(res.data);
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
