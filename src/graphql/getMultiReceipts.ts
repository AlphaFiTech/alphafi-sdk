import { ApolloQueryResult, gql } from "@apollo/client/core";
import client from "./client.js";
import { getMultiReceiptsQuery } from "./queries/getMultiReceipts.js";
import { ReceiptSDK } from "./types.js";

type ReceiptType = {
  type: string;
  cursor: string;
};

const receiptTypes: { [key: string]: ReceiptType } = {
  alphaPoolReceipts: {
    type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::Receipt",
    cursor: "",
  } as ReceiptType,
  cetusSuiPoolReceipts: {
    type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  cetusPoolReceipts: {
    type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  cetusPoolBaseAReceipts: {
    type: "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",
    cursor: "",
  } as ReceiptType,
  naviPoolReceipts: {
    type: "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",
    cursor: "",
  } as ReceiptType,
};

export async function fetchMultiReceipts(
  address: string,
): Promise<Map<string, ReceiptSDK[]>> {
  const multiReceipts: any[] = [];
  let hasNextPage = true;

  while (hasNextPage) {
    const query = getMultiReceiptsQuery(receiptTypes);
    const GET_RECEIPTS = gql`
      ${query}
    `;

    const result: ApolloQueryResult<any> = await client.query({
      query: GET_RECEIPTS,
      variables: {
        address: address,
      },
    });
    const { data } = result;
    const receipts = data.owner;
    hasNextPage = false;

    Object.keys(receipts).forEach((key) => {
      if (key !== "__typename") {
        const { pageInfo, nodes } = receipts[key];
        hasNextPage = hasNextPage || pageInfo.hasNextPage;
        if (hasNextPage) receiptTypes[key].cursor = pageInfo.endCursor;
        else receiptTypes[key].cursor = "0";
        nodes.forEach((node: any) => {
          multiReceipts.push(node);
        });
      }
    });
  }
  const receiptMap: Map<string, ReceiptSDK[]> = new Map();
  multiReceipts.forEach((receipt) => {
    const name = receipt.contents.json.name;
    let arr = receiptMap.get(name);
    if (!arr) arr = [];
    arr.push(receipt);
    receiptMap.set(name, arr);
  });
  return receiptMap;
}
