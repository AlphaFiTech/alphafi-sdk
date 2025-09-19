import { GET_RECEIPT_DATA } from "./queries.js";
import client from "./client.js";
import { poolInfo } from "../common/maps.js";
import {
  ReceiptsResponse,
  ReceiptNode,
  ReceiptMoveObjectContents,
} from "./types.js";

export async function fetchReceiptsGql(): Promise<ReceiptMoveObjectContents[]> {
  let receiptNodes: ReceiptNode[] = [];

  let hasNextPage = true;
  let cursor: string | null = null;
  //   let count = 0;
  while (hasNextPage) {
    const result: { data: ReceiptsResponse | undefined } =
      await client.query<ReceiptsResponse>({
        query: GET_RECEIPT_DATA,
        variables: {
          after: cursor,
          receiptType: poolInfo["ALPHA"].receiptType,
          limit: 10,
        },
      });

    // Now destructure from the properly typed variable
    const data: ReceiptsResponse | undefined = result.data;
    if (!data) break;
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
