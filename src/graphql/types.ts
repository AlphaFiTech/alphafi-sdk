export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface KeyValue {
  key: {
    name: string;
  };
  value: string;
}

export interface LastAccRewardPerXToken {
  contents: KeyValue[];
}

export interface LockedBalance {
  id: string;
  size: string;
  head: string;
  tail: string;
}

export interface PendingRewards {
  contents: KeyValue[];
}

export type Receipt = {
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: { id: string };
      image_url: string;
      last_acc_reward_per_xtoken: {
        type: string;
        fields: {
          contents: [
            {
              type: string;
              fields: {
                value: string;
                key: {
                  type: string;
                  fields: {
                    name: string;
                  };
                };
              };
            },
          ];
        };
      };
      locked_balance:
        | {
            type: string;
            fields: {
              head: string;
              id: { id: string };
              size: string;
              tail: string;
            };
          }
        | undefined;
      name: string;
      owner: string;
      pending_rewards: {
        type: string;
        fields: {
          contents: [
            {
              fields: {
                key: {
                  type: string;
                  fields: {
                    name: string;
                  };
                };
                value: string;
              };
              type: string;
            },
          ];
        };
      };
      pool_id: string;
      xTokenBalance: string;
      unlocked_xtokens: string | undefined;
    };
  };
};

export interface ReceiptMoveObjectContents {
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

export interface AsReceiptMoveObject {
  status: string;
  contents: {
    json: ReceiptMoveObjectContents;
  };
}

export interface ReceiptNode {
  asMoveObject: AsReceiptMoveObject;
}

export interface ReceiptsResponse {
  objects: {
    pageInfo: PageInfo;
    nodes: ReceiptNode[];
  };
}

export interface LockedTableNode {
  name: { json: string };
  value: {
    json: {
      prev: string | null;
      next: string | null;
      value: string;
    };
  };
}

export interface DynamicFieldsResponse {
  dynamicFields: {
    pageInfo: PageInfo;
    nodes: LockedTableNode[];
  };
}
