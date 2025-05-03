import { getClient } from "./client.js";
import { GET_ALPHALEND_TVL } from "./queries.js";

export async function getTvl(clientUrl?: string) {
  const client = getClient(clientUrl);
  const {
    data,
  }: {
    data: {
      protocolStats: { totalSuppliedUsd: number; totalBorrowedUsd: number };
    };
  } = await client.query({
    query: GET_ALPHALEND_TVL,
    fetchPolicy: "no-cache",
  });
  return (
    data.protocolStats.totalSuppliedUsd - data.protocolStats.totalBorrowedUsd
  ).toFixed(5);
}
