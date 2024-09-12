import { PoolName, PoolAmounts } from "./common/types";

export type GetPoolEarningsParams = {
    owners?: string | string[],
    poolNames?: PoolName | PoolName[],
    startTime?: number,
    endTime?: number,
}

export type GetPoolEarningsResponse = {
    [owner: string]: PoolAmounts
} 