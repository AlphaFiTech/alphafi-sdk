import { ApolloQueryResult, gql } from "@apollo/client/core";
import client from "./client.js";
import { getMultiReceiptsQuery } from "./queries/getMultiReceipts.js";
import { ReceiptGQL } from "./types.js";

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
  cetusSuiV2PoolReceipts: {
    type: "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  naviPoolReceipts: {
    type: "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  naviLoopSuiVsuiPoolReceipts: {
    type: "0x531989a4be74dd43b25e7bb1eeade871f4524bdf437a8eaa30b4ac2a932b5579::alphafi_navi_sui_vsui_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  naviNativeUsdcUsdtPoolReceipts: {
    type: "0xad4f82d9956085bdab812d46fb2ea4d95c35e9e936cb53d04a79d3989ef97774::alphafi_navi_native_usdc_usdt_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  bucketPoolReceipts: {
    type: "0xa095412a92ff0f063cbea962f2f88b1a93cbc85c72bebf5dd7d90a8e2d6375ae::alphafi_bucket_pool_v1::Receipt",
    cursor: "",
  } as ReceiptType,
  naviV2PoolReceipts: {
    type: "0x5d90d17172b9e38da9f13a982668a9e48d0b0b5f864e421b60686f60758b37bd::alphafi_navi_pool_v2::Receipt",
    cursor: "",
  } as ReceiptType,
  naviLoopHasuiSuiPoolReceipts: {
    type: "0xb7039e74683423783f5179d6359df115af06b040bc439cbef3b307bdaceb050d::alphafi_navi_hasui_sui_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  bluefinSuiUsdcPoolReceipts: {
    type: "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_sui_first_pool::Receipt",
    cursor: "",
  } as ReceiptType,
  bluefinUsdtUsdcPoolReceipts: {
    type: "0x066648edaf473d6cc14b7ab46f56b673be4e44f9c940f70b6bacd7848808859b::alphafi_bluefin_type_1_pool::Receipt",
    cursor: "",
  } as ReceiptType,
};

export async function fetchMultiReceipts(
  address: string,
): Promise<Map<string, ReceiptGQL[]>> {
  const multiReceipts: any[] = [];
  let hasNextPage = true;

  try {
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
  } catch (error) {
    console.warn(
      "Error fetching receipts from GraphQL, now fetching from suiClient query",
    );
  } finally {
    Object.keys(receiptTypes).forEach((key) => {
      receiptTypes[key].cursor = "";
    });
  }

  const receiptMap: Map<string, ReceiptGQL[]> = new Map();
  multiReceipts.forEach((receipt) => {
    const name = receipt.contents.json.name;
    let arr = receiptMap.get(name);
    if (!arr) arr = [];
    arr.push(receipt);
    receiptMap.set(name, arr);
  });

  return receiptMap;
}
