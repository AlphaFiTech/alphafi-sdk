import { GET_NFT_HOLDERS } from "./queries";
import { ApolloQueryResult } from "@apollo/client/core";
import client from "./client";
import { ReceiptNode, ReceiptsResponse } from "./types";

export async function fetchNftHolders(): Promise<ReceiptNode[]> {
  const allEvents: ReceiptNode[] = [];
  let hasPreviousPage = true;
  let startCursor: string | null = null;
  let count = 0;

  while (hasPreviousPage) {
    // Assign the entire result to a variable with a type annotation
    console.log("cursor", startCursor);
    const result: ApolloQueryResult<ReceiptsResponse> = await client.query({
      query: GET_NFT_HOLDERS,
      variables: {
        before: startCursor,
        receipt:
          "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::Receipt",
      },
    });

    // Now destructure from the properly typed variable
    const { data } = result;
    const { nodes, pageInfo } = data.objects;

    for (const node of nodes) {
      console.log(
        node.asMoveObject.contents.json.owner,
        node.asMoveObject.contents.json.pool_id,
        node.asMoveObject.contents.json.xTokenBalance,
      );
    }

    hasPreviousPage = pageInfo.hasPreviousPage;
    startCursor = pageInfo.startCursor;
    console.log(count++);
  }

  return allEvents;
}
