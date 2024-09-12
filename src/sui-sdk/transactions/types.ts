import { TransactionFilter } from "@mysten/sui/client";

export type FetchTransactionParams = {
  startTime: number;
  endTime: number;
  filter: TransactionFilter[];
  sort: "ascending" | "descending";
};
