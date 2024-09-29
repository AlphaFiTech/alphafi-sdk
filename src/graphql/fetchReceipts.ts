import { GET_RECEIPT_DATA } from "./queries";
import client from "./client";
import { poolInfo } from "../common/maps";
import { ApolloQueryResult } from "@apollo/client";
import {
  ReceiptsResponse,
  ReceiptNode,
  ReceiptMoveObjectContents,
} from "./types";

export async function fetchReceiptsGql(): Promise<ReceiptMoveObjectContents[]> {
  let receiptNodes: ReceiptNode[] = [];

  let hasNextPage = true;
  let cursor: string | null = null;
  //   let count = 0;
  while (hasNextPage) {
    const result: ApolloQueryResult<ReceiptsResponse> = await client.query({
      query: GET_RECEIPT_DATA,
      variables: {
        after: cursor,
        receiptType: poolInfo["ALPHA"].receiptType,
        limit: 10,
      },
    });

    // Now destructure from the properly typed variable
    const { data } = result;
    const { nodes, pageInfo } = data.objects;
    receiptNodes = receiptNodes.concat(nodes);

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
    // console.log(count++);
  }

  const receiptsJson: ReceiptMoveObjectContents[] = receiptNodes.map((node) => {
    return node.asMoveObject.contents.json;
  });

  return receiptsJson;
}
