import { PoolAmounts, PoolName } from "../../common/types";

export type FetchUserDepositsParams = {
  poolNames: PoolName[];
  owners: string[];
  startTime: number;
  endTime: number;
  options?: {
    deposits: boolean,
    withdrawls: boolean,
  }
};

export type UsersInvestmentsInPools = {
  [owner: string]: PoolAmounts;
};

export type UsersWithdrawlsFromPools = {
  [owner: string]: PoolAmounts;
}

export type UsersCollectedAlphaRewards = {
  [owner: string]: { [poolName in PoolName]: string };
};

export type FetchUserDepositsAndWithdrawlsResponse = {
  usersInvestments?: UsersInvestmentsInPools;
  usersCollectedRewards?: UsersCollectedAlphaRewards;
  usersWithdrawls?: UsersWithdrawlsFromPools;
};
// | UsersInvestmentsToPools
// | UsersCollectedAlphaRewards
// | (UsersInvestmentsToPools & UsersCollectedAlphaRewards)
