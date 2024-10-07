import { fetchReceiptsGql } from "./graphql/fetchReceipts.js";
import {
  OwnerTableIdPair,
  parseLockedTableIdFromReceipts,
} from "./graphql/parseLockedTableId.js";
import {
  getUnlocksData,
  AlphaUnlocks,
} from "./sui-sdk/functions/fetchTableData.js";

type GetAlphaUnlocksParams = {
  address?: string;
  timeRange?: { min: number; max: number };
};
type GetAlphaUnlocksResponse = {
  alphaUnlocks: AlphaUnlocks[];
};

// params coming soon, this defaults to all users, all times;
export async function getAlphaUnlocks(
  params: GetAlphaUnlocksParams,
): Promise<GetAlphaUnlocksResponse> {
  if (params.address || params.timeRange) {
    throw new Error("Params support coming soon, pass empty params");
  }

  const receipts = await fetchReceiptsGql();
  const ownerTablePair: OwnerTableIdPair[] =
    parseLockedTableIdFromReceipts(receipts);
  const owner_table: [string, string][] = ownerTablePair.map((o) => {
    return [o.owner, o.tableId];
  });
  const unlocksData = await getUnlocksData(owner_table);

  return { alphaUnlocks: unlocksData };
}
