import { PoolAmounts, PoolName } from "../../common/types"

export type FetchUserDepositsParams = {
    poolNames: PoolName[],
    owners: string[],
    startTime: number,
    endTime: number,
}

export type UsersInvestmentsInPools = {
    [owner: string]: PoolAmounts,
}

export type UsersCollectedAlphaRewards = {
    [owner: string]: {[poolName in Exclude<PoolName, "ALPHA">]: string}
}

export type FetchUserDepositsResponse = {
    usersInvestments?: UsersInvestmentsInPools,
    usersCollectedRewards?: UsersCollectedAlphaRewards,
}
    // | UsersInvestmentsToPools
    // | UsersCollectedAlphaRewards 
    // | (UsersInvestmentsToPools & UsersCollectedAlphaRewards)
