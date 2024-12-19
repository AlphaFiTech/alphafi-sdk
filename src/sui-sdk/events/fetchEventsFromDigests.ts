import { SuiEvent, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { getSuiClient } from "../client.js";

type FetchEventsFromDigestsResponse = {
  [digest: string]: { timestamp: number; events: SuiEvent[] | undefined };
};
type FetchEventsFromDigestsParams = {
  digests: string[];
};

export async function fetchEventsFromDigests(
  params: FetchEventsFromDigestsParams,
): Promise<FetchEventsFromDigestsResponse> {
  const suiClient = getSuiClient();
  const digests = params.digests;

  let transactions: SuiTransactionBlockResponse[] = [];
  while (digests.length > 0) {
    const batch = digests.splice(0, 50);
    const batchTransactions = await suiClient.multiGetTransactionBlocks({
      digests: batch,
      options: { showEvents: true },
    });
    transactions = transactions.concat(batchTransactions);
  }

  const digestEventsMap: FetchEventsFromDigestsResponse = {};
  transactions.forEach((tx) => {
    const events = tx.events ? tx.events : undefined;
    const digest = tx.digest;
    const time = Number(tx.timestampMs);
    digestEventsMap[digest] = { timestamp: time, events: events };
  });
  return digestEventsMap;
}
