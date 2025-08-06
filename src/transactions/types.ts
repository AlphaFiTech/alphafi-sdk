import { PoolName } from "../common/types.js";

// deposit params
export type DepositParams = SingleAssetDepositParams | DoubleAssetDepositParams;

export type SingleAssetDepositParams = {
  poolName: PoolName;
  address: string;
  amount: string;
};

export type DoubleAssetDepositParams = {
  poolName: PoolName;
  address: string;
  amount: string;
  isAmountA: boolean;
};

export type UserAutoBalanceRewardAmounts = {
  [key in string]: string;
};
