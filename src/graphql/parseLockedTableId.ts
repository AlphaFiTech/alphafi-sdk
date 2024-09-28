import { ReceiptMoveObjectContents } from "./types";

export type OwnerTableIdPair = {
  owner: string;
  tableId: string;
};
export function parseLockedTableIdFromReceipts(
  receiptsContents: ReceiptMoveObjectContents[],
): OwnerTableIdPair[] {
  const ownertableIdPairs: OwnerTableIdPair[] = [];

  receiptsContents.map((receipt) => {
    const ownertableIdPair: OwnerTableIdPair = {
      owner: receipt.owner,
      tableId: receipt.locked_balance.id,
    };
    ownertableIdPairs.push(ownertableIdPair);
  });

  return ownertableIdPairs;
}
