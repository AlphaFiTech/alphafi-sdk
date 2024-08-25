import { GET_NFT_HOLDERS } from "./queries";
import { ApolloQueryResult } from "@apollo/client/core";
import client from "./client";

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

interface KeyValue {
  key: {
    name: string;
  };
  value: string;
}

interface LastAccRewardPerXToken {
  contents: KeyValue[];
}

interface LockedBalance {
  id: string;
  size: string;
  head: string;
  tail: string;
}

interface PendingRewards {
  contents: KeyValue[];
}

interface MoveObjectContents {
  id: string;
  owner: string;
  name: string;
  image_url: string;
  pool_id: string;
  xTokenBalance: string;
  last_acc_reward_per_xtoken: LastAccRewardPerXToken;
  locked_balance: LockedBalance;
  unlocked_xtokens: string;
  pending_rewards: PendingRewards;
}

interface AsMoveObject {
  status: string;
  contents: {
    json: MoveObjectContents;
  };
}

interface ReceiptNode {
  asMoveObject: AsMoveObject;
}

interface ReceiptsResponse {
  objects: {
    pageInfo: PageInfo;
    nodes: ReceiptNode[];
  };
}

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
