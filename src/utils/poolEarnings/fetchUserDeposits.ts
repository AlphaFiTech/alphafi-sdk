import { fetchDepositEvents } from "../../sui-sdk/events/fetchDepositEvents"
import { parseAlphaRewardsFromDepositEvents, parseInvestmentsfromDepositEvents } from "../../sui-sdk/events/toMergeWithParseData";
import { FetchUserDepositsParams, FetchUserDepositsResponse, UsersCollectedAlphaRewards, UsersInvestmentsInPools } from "./types"
import fs from "fs"
import { lastAlphaPoolDepositEventTime } from "../../common/constants";

// This function has the code for splitting the timestamp and calling the appropriate functions
export async function fetchUserDeposits(params: FetchUserDepositsParams)
// : Promise<FetchUserDepositsResponse> 
{
    // let 

    if (params.poolNames.some(pool => pool !== "ALPHA")) {
        throw new Error("fetchUserDeposits available only for ALPHA yet");
    }

    if (params.endTime < lastAlphaPoolDepositEventTime) {
        // const events = await fetchDepositEvents({ startTime: 1719499980000 }); // inception; the script that runs getPoolEarnings passes inception to it
        const events = await fetchDepositEvents({ startTime:params.startTime, endTime:params.endTime, poolNames: params.poolNames });
        const investments: UsersInvestmentsInPools = parseInvestmentsfromDepositEvents({ 
            events: events, 
            owners: params.owners, 
            poolNames: params.poolNames 
        });
        const collectedRewards: UsersCollectedAlphaRewards = parseAlphaRewardsFromDepositEvents({
            events: events,
            owners: params.owners,
            poolNames: params.poolNames,
        })

        const response: FetchUserDepositsResponse = {
            usersInvestments: investments,
            usersCollectedRewards: collectedRewards,
        }
        return response;
    }
    else if (params.startTime > lastAlphaPoolDepositEventTime) {
        // use the liquidityChangeEvent
    }
    else {
        const ancientEventsStartTime = params.startTime;
        const ancientEventsEndTime = lastAlphaPoolDepositEventTime;
        const modernEventsStartTime = lastAlphaPoolDepositEventTime + 1;
        const modernEventsEndTime = params.endTime;
        // use both the depositEvent and liquidityChangeEvent, format them, add them 
    }


}

async function useDepositEvents()

async function main() {
    // const events = await fetchDepositEvents({startTime: 1719499980000});
    // fs.writeFileSync("./test.json", JSON.stringify(events))
    const events = JSON.parse(fs.readFileSync("./test.json", "utf-8"));
    const investments = parseInvestmentsfromDepositEvents({ events: events, owners: [], poolNames: [] });
    fs.writeFileSync("./test.json", JSON.stringify(investments))
}
main();