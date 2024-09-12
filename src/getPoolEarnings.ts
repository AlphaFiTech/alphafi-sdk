import { GetPoolEarningsParams, GetPoolEarningsResponse } from "./types"
import { PoolName, SingleAssetPoolNames, DoubleAssetPoolNames } from "./common/types";
import { alphafiInceptionTime } from "./common/constants";

export async function getPoolEarnings(params: GetPoolEarningsParams): Promise<GetPoolEarningsResponse> {
    let getPoolEarningsResponse: GetPoolEarningsResponse = {};

    const now = Date.now();
    const inception = alphafiInceptionTime;
    const startTime = params.startTime ? params.startTime : inception;
    const endTime = params.endTime ? params.endTime : now;
    if(endTime < startTime) {
        throw new Error("startTime must be less than endTime");
    }

    const owners: string[] = params.owners ? (Array.isArray(params.owners) ? params.owners : [params.owners]) : [];

    const poolNames: PoolName[] = params.poolNames ? (Array.isArray(params.poolNames) ? params.poolNames : [params.poolNames]) : [];
    let pools: { alpha?: "ALPHA", navi?: Exclude<SingleAssetPoolNames, "ALPHA">[], cetus?: DoubleAssetPoolNames[] } = {};
    for (const poolName of poolNames) {
        if (poolName === "ALPHA") {
            pools.alpha = "ALPHA";
        }
        else if (poolName.split("-")[0] === "NAVI") {
            let naviPools = pools.navi ? pools.navi : [];
            naviPools.push(poolName as Exclude<SingleAssetPoolNames, "ALPHA">);
            pools.navi = naviPools;
        }
        else {
            let cetusPools = pools.cetus ? pools.cetus : [];
            cetusPools.push(poolName as DoubleAssetPoolNames);
            pools.cetus = cetusPools;
        }
    }


    if(pools.alpha){
        
    }

    if(pools.cetus){
        for(const pool of pools.cetus){
            if(pool === "ALPHA-SUI"){

            }
            else {
                console.log(`${pool} earnings coming soon`)
            }
        }
    }

    if(pools.navi) {
        console.log("Navi Pool earnings coming soon");
    }

    return getPoolEarningsResponse;
}

getPoolEarnings({ owners: "o1", poolNames: "ALPHA" })