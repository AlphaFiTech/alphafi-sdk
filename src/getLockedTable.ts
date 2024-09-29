import { fetchReceiptsGql } from "./graphql/fetchReceipts";
import {
  OwnerTableIdPair,
  parseLockedTableIdFromReceipts,
} from "./graphql/parseLockedTableId";

export async function getLockedTableId(): Promise<OwnerTableIdPair[]> {
  const receipts = await fetchReceiptsGql();
  const ownerTablePair: OwnerTableIdPair[] =
    parseLockedTableIdFromReceipts(receipts);

  return ownerTablePair;
}
