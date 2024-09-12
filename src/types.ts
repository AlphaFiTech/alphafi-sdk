import {
  CoinName,
  DoubleAssetPoolNames,
  PoolName,
  SingleAssetPoolNames,
  AlphaFiVaultBalance,
} from "./common/types";

export type GetUserTokensFromTransactionsParams = {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
  owners?: string[];
};

export type GetUserTokensInUsdFromTransactionsParams = {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
  owners?: string[];
  userTokensHoldings?: [string, string, string][];
};

export type AlphaReceiptFields = {
  id: { id: string };
  image_url: string;
  last_acc_reward_per_xtoken: {
    type: string;
    fields: {
      contents: [
        {
          type: string;
          fields: {
            key: {
              type: string;
              fields: {
                name: string;
              };
            };
            value: string;
          };
        },
      ];
    };
  };
  locked_balance: {
    type: string;
    fields: {
      head: string;
      id: {
        id: string;
      };
      size: string;
      tail: string;
    };
  };
  name: string;
  owner: string;
  pending_rewards: {
    type: string;
    fields: {
      contents: [
        {
          type: string;
          fields: {
            key: {
              type: string;
              fields: {
                name: string;
              };
            };
            value: string;
          };
        },
      ];
    };
  };
  pool_id: string;
  unlocked_xtokens: string;
  xTokenBalance: string;
};

export type OtherReceiptFields = {
  id: { id: string };
  image_url: string;
  last_acc_reward_per_xtoken: {
    fields: {
      contents: [
        {
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
        },
      ];
    };
    type: string;
  };
  name: string;
  owner: string;
  pending_rewards: {
    fields: {
      contents: [
        {
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
        },
      ];
    };
    type: string;
  };
  pool_id: string;
  xTokenBalance: string;
};

export type GetHoldersParams = {
  poolNames?: string[];
  startTime?: number;
  endTime?: number;
};

export type GetTokenHoldingsParams = {
  poolNames?: PoolName[];
  startTime?: number;
  endTime?: number;
};

export type LiquidityToUsdParams = {
  liquidity: string;
  poolName: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
  tokenPriceMap: Map<CoinName, string>;
};

export type LiquidityToTokensParams = {
  liquidity: string;
  poolName: string;
  ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
  sqrtPriceCetusMap: Map<PoolName, string>;
};

export type UserUsdHoldings = {
  user: string;
  poolName: PoolName;
  usdHoldings: string;
};

export type UserPoolLiquidity = {
  user: string;
  poolName: string;
  liquidity: string;
};

export type UserPoolTokenHoldings =
  | SingleAssetTokenHoldings
  | DoubleAssetTokenHoldings;

export type SingleAssetTokenHoldings = {
  user: string;
  poolName: SingleAssetPoolNames;
  tokens: string;
};

export type DoubleAssetTokenHoldings = {
  user: string;
  poolName: DoubleAssetPoolNames;
  tokenAmountA: string;
  tokenAmountB: string;
};

export type MultiGetVaultBalancesParams = {
  poolNames?: PoolName[];
  startTime?: number;
  endTime?: number;
};
export type SingleGetVaultBalancesParams = {
  address?: string;
  poolName?: PoolName;
};
export type GetVaultBalanceParams =
  | SingleGetVaultBalancesParams
  | MultiGetVaultBalancesParams;

export type HoldingsObj = {
  owner: string;
  poolName: PoolName;
  holding: string;
};

export type VaultBalance =
  | AlphaFiVaultBalance
  | undefined
  | AlphaFiMultiVaultBalance[];

export type AlphaFiMultiVaultBalance =
  | SingleAssetMultiVaultBalance
  | DoubleAssetMultiVaultBalance;

export type SingleAssetMultiVaultBalance = {
  owner: string;
  poolName: PoolName;
  tokens: string;
  tokensInUsd: string;
};
export type DoubleAssetMultiVaultBalance = {
  owner: string;
  poolName: PoolName;
  tokenA: string;
  tokenB: string;
  tokensInUsd: string;
};

export type GetVaultBalanceForActiveUsersParams = {
  poolName?: PoolName[];
  startTime?: bigint;
  endTime?: bigint;
};
