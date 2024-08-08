export type Distributor = {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      airdrop_wallet: string;
      airdrop_wallet_balance: string;
      dust_wallet_address: string;
      fee_wallet: string;
      id: {
        id: string;
      };
      next_halving_timestamp: string;
      pool_allocator: Allocator;

      // to-do
      reward_unlock: {
        fields: { contents: [] };
        type: string;
      };
      start_timestamp: string;
      target: string;
      team_wallet_address: string;
      team_wallet_balance: string;
    };
  };
};

export type Allocator = {
  fields: {
    id: {
      id: string;
    };
    members: {
      fields: {
        contents: MemberType[];
      };
      type: string;
    };
    rewards: {
      fields: {
        id: {
          id: string;
        };
        size: string;
      };
      type: string;
    };
    total_weights: {
      fields: {
        contents: TotalWeightType[];
      };
      type: string;
    };
  };
  type: string;
};

export type TotalWeightType = {
  fields: {
    key: {
      fields: {
        name: string;
      };
      type: string;
    };
    value: string;
  };
  type: string;
};

export type MemberPoolDataType = {
  fields: {
    key: {
      fields: {
        name: string;
      };
      type: string;
    };
    value: {
      fields: {
        last_update_time: string;
        pending_rewards: string;
        weight: string;
      };
      type: string;
    };
  };
  type: string;
};

export type MemberType = {
  fields: {
    key: string;
    value: {
      fields: {
        pool_data: {
          fields: {
            contents: MemberPoolDataType[];
          };
          type: string;
        };
      };
      type: string;
    };
  };
  type: string;
};
