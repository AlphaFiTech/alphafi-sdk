import { ApolloQueryResult, gql } from "@apollo/client/core";
import client from "./client.js";
import { getMultiReceiptsQuery } from "./queries/getMultiReceipts.js";
import { Receipt } from "./types.js";

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
): Promise<Map<string, Receipt[]>> {
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
          // const res: Receipt = {
          //   objectId: node.address,
          //   version: node.version,
          //   digest: node.digest,
          //   content: {
          //     type: node.contents.type.repr,
          //     fields: {
          //       id: {
          //         id: node.contents.json.id,
          //       },
          //       image_url: node.contents.json.image_url,
          //       name: node.contents.json.name,
          //       owner: node.contents.json.owner,
          //       pool_id: node.contents.json.pool_id,
          //       xTokenBalance: node.contents.json.xTokenBalance,
          //       unlocked_xtokens: node.contents.json.unlocked_xtokens,
          //       locked_balance: node.contents.json.locked_balance
          //         ? {
          //             type: "string",
          //             fields: {
          //               head: node.contents.json.locked_balance.head,
          //               id: { id: node.contents.json.locked_balance.id },
          //               size: node.contents.json.locked_balance.size,
          //               tail: node.contents.json.locked_balance.tail,
          //             },
          //           }
          //         : undefined,
          //       pending_rewards: {
          //         type: "0x2::vec_map::VecMap<0x1::type_name::TypeName, u64>",
          //         fields: node.contents.json.pending_rewards,
          //       },
          //       last_acc_reward_per_xtoken: {
          //         type: "0x2::vec_map::VecMap<0x1::type_name::TypeName, u256>",
          //         fields: node.contents.json.last_acc_reward_per_xtoken,
          //       },
          //     },
          //     dataType: "moveObject",
          //     hasPublicTransfer: node.hasPublicTransfer,
          //   },
          // };
          multiReceipts.push(node.contents.fields);
        });
      }
    });
  }
  console.log(multiReceipts);
  const receiptMap: Map<string, Receipt[]> = new Map();
  multiReceipts.forEach((receipt) => {
    const name = receipt.content.fields.name;
    let arr = receiptMap.get(name);
    if (!arr) arr = [];
    arr.push(receipt);
    receiptMap.set(name, arr);
  });
  console.log(receiptMap);
  return receiptMap;
}

fetchMultiReceipts(
  "0x5560f3edb5ed527c6a2c3db6c9042dd4bd9e2a41e1ae38e297306800bcf7365c",
);
