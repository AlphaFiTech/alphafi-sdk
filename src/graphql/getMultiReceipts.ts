import {
  ApolloClient,
  ApolloQueryResult,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { getMultiReceiptsQuery } from "./queries/getMultiReceipts.js";
import { ReceiptGQL } from "./types.js";
import { poolInfo } from "../common/maps.js";

type ReceiptType = {
  type: string;
  cursor: string;
};

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://sui-mainnet.mystenlabs.com/graphql",
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Owner: {
        keyFields: (owner) => {
          const objectKeys = Object.keys(owner)
            .filter((k) => k !== "__typename")
            .sort();
          const uniqueKey = objectKeys.join(",");

          // Return the final unique ID string
          return `Owner:${uniqueKey}`;
        },
      },
    },
  }),
});

const getReceiptTypes = () => {
  const receiptTypes: { [key: string]: ReceiptType } = {};
  const mySet: Set<string> = new Set();
  Object.keys(poolInfo).forEach((pool) => {
    const key = pool.replace(/-/g, "_");
    if (!mySet.has(poolInfo[pool].receiptType)) {
      receiptTypes[key] = {
        type: poolInfo[pool].receiptType,
        cursor: "",
      } as ReceiptType;
      mySet.add(poolInfo[pool].receiptType);
    }
  });
  return receiptTypes;
};

export async function fetchMultiReceipts(
  address: string,
): Promise<Map<string, ReceiptGQL[]>> {
  const multiReceipts: any[] = [];

  const receiptTypes = getReceiptTypes();
  const batchSize = 10; // Set the desired batch size

  // Convert the receiptTypes object into an array of entries
  const entries = Object.entries(receiptTypes);

  // Create an array to hold the batches
  const batches: { [k: string]: ReceiptType }[] = [];
  //const batches = [];
  // Loop through the entries array and create batches
  for (let i = 0; i < entries.length; i += batchSize) {
    const batchEntries = entries.slice(i, i + batchSize);
    batches.push(Object.fromEntries(batchEntries)); // Convert to object before pushing
  }

  for (const receiptTypes of batches) {
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
        error,
      );
    } finally {
      Object.keys(receiptTypes).forEach((key) => {
        receiptTypes[key].cursor = "";
      });
    }
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
