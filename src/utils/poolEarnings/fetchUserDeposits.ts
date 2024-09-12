import { fetchDepositEvents } from "../../sui-sdk/events/fetchDepositEvents";
import {
    parseAlphaRewardsFromDepositEvents,
    parseInvestmentsfromDepositEvents,
    parseInvestmentsFromLCEvents,
    parseAlphaRewardsFromLCEvents,
} from "../../sui-sdk/events/parseData";
import {
    FetchUserDepositsParams,
    FetchUserDepositsResponse,
    UsersCollectedAlphaRewards,
    UsersInvestmentsInPools,
} from "./types";
import { lastAlphaPoolDepositEventTime } from "../../common/constants";
import { fetchLiquidityChangeEvents } from "../../sui-sdk/events/fetchLiquidityChangeEvents";
import { SingleTokenAmounts, MultiTokenAmounts, PoolName } from "../../common/types";

// This function has the code for splitting the timestamp and calling the appropriate functions
export async function fetchUserDeposits(params: FetchUserDepositsParams): Promise<FetchUserDepositsResponse> {

    if (params.poolNames.some((pool) => pool !== "ALPHA")) {
        throw new Error("fetchUserDeposits available only for ALPHA yet");
    }

    if (params.endTime < lastAlphaPoolDepositEventTime) {
        const events = await fetchDepositEvents({
            startTime: params.startTime,
            endTime: params.endTime,
            poolNames: params.poolNames,
        });
        const investments: UsersInvestmentsInPools =
            parseInvestmentsfromDepositEvents({
                events: events,
                owners: params.owners,
                poolNames: params.poolNames,
            });
        const collectedRewards: UsersCollectedAlphaRewards =
            parseAlphaRewardsFromDepositEvents({
                events: events,
                owners: params.owners,
                poolNames: params.poolNames,
            });

        const response: FetchUserDepositsResponse = {
            usersInvestments: investments,
            usersCollectedRewards: collectedRewards,
        };
        return response;

    } else if (params.startTime > lastAlphaPoolDepositEventTime) {
        const events = await fetchLiquidityChangeEvents({
            startTime: params.startTime,
            endTime: params.endTime,
            poolNames: params.poolNames,
        });
        const investments: UsersInvestmentsInPools = parseInvestmentsFromLCEvents({
            events: events,
            owners: params.owners,
            poolNames: params.poolNames,
        })
        const collectedRewards: UsersCollectedAlphaRewards = parseAlphaRewardsFromLCEvents({
            events: events,
            owners: params.owners,
            poolNames: params.poolNames,
        })
        const response: FetchUserDepositsResponse = {
            usersInvestments: investments,
            usersCollectedRewards: collectedRewards,
        }
        return response;

    } else {
        const ancientEventsStartTime = params.startTime;
        const ancientEventsEndTime = lastAlphaPoolDepositEventTime;
        const modernEventsStartTime = lastAlphaPoolDepositEventTime + 1;
        const modernEventsEndTime = params.endTime;

        const ancientEvents = await fetchDepositEvents({
            startTime: ancientEventsStartTime,
            endTime: ancientEventsEndTime,
            poolNames: params.poolNames,
        });
        const modernEvents = await fetchLiquidityChangeEvents({
            startTime: modernEventsStartTime,
            endTime: modernEventsEndTime,
            poolNames: params.poolNames,
        });

        const oldInvestments: UsersInvestmentsInPools =
            parseInvestmentsfromDepositEvents({
                events: ancientEvents,
                owners: params.owners,
                poolNames: params.poolNames,
            });
        const newInvestments: UsersInvestmentsInPools =
            parseInvestmentsFromLCEvents({
                events: modernEvents,
                owners: params.owners,
                poolNames: params.poolNames,
            });
        const totalInvestments: UsersInvestmentsInPools = mergeInvestments(oldInvestments, newInvestments);

        const ancientCollectedRewards: UsersCollectedAlphaRewards =
            parseAlphaRewardsFromDepositEvents({
                events: ancientEvents,
                owners: params.owners,
                poolNames: params.poolNames,
            });
        const modernCollectedRewards: UsersCollectedAlphaRewards =
            parseAlphaRewardsFromLCEvents({
                events: modernEvents,
                owners: params.owners,
                poolNames: params.poolNames,
            });
        const totalCollectedRewards: UsersCollectedAlphaRewards = mergeCollectedRewards(ancientCollectedRewards, modernCollectedRewards);

        const response: FetchUserDepositsResponse = {
            usersInvestments: totalInvestments,
            usersCollectedRewards: totalCollectedRewards,
        }
        return response;
    }
}


function mergeAmounts(
    amount1: SingleTokenAmounts | MultiTokenAmounts,
    amount2: SingleTokenAmounts | MultiTokenAmounts
): SingleTokenAmounts | MultiTokenAmounts {
    if ('tokens' in amount1 && 'tokens' in amount2) {
        // Handle SingleTokenAmounts
        return {
            tokens: (parseFloat(amount1.tokens) + parseFloat(amount2.tokens)).toString()
        };
    } else if ('tokensA' in amount1 && 'tokensB' in amount1 && 'tokensA' in amount2 && 'tokensB' in amount2) {
        // Handle MultiTokenAmounts
        return {
            tokensA: (parseFloat(amount1.tokensA) + parseFloat(amount2.tokensA)).toFixed(5).toString(),
            tokensB: (parseFloat(amount1.tokensB) + parseFloat(amount2.tokensB)).toFixed(5).toString()
        };
    } else {
        throw new Error("Mismatched types for PoolAmounts");
    }
}
function mergeInvestments(
    investments1: UsersInvestmentsInPools,
    investments2: UsersInvestmentsInPools
): UsersInvestmentsInPools {
    const mergedInvestments: UsersInvestmentsInPools = { ...investments1 };

    for (const owner in investments2) {
        if (owner in mergedInvestments) {
            // Owner exists in both objects, merge their PoolAmounts
            for (const pool in investments2[owner]) {
                if (pool in mergedInvestments[owner]) {
                    // Pool exists in both, merge the amounts
                    const poolName = pool as PoolName
                    mergedInvestments[owner][poolName] = mergeAmounts(
                        mergedInvestments[owner][poolName],
                        investments2[owner][poolName]
                    );
                } else {
                    // Pool only exists in the second object, just copy it
                    const poolName = pool as PoolName
                    mergedInvestments[owner][poolName] = investments2[owner][poolName];
                }
            }
        } else {
            // Owner only exists in the second object, just copy it
            mergedInvestments[owner] = investments2[owner];
        }
    }

    return mergedInvestments;
}

function mergeRewards(reward1: string, reward2: string): string {
    return (parseFloat(reward1) + parseFloat(reward2)).toFixed(5).toString();
}
function mergeCollectedRewards(
    rewards1: UsersCollectedAlphaRewards,
    rewards2: UsersCollectedAlphaRewards
): UsersCollectedAlphaRewards {
    const mergedRewards: UsersCollectedAlphaRewards = { ...rewards1 };

    for (const owner in rewards2) {
        if (owner in mergedRewards) {
            // Owner exists in both, merge their pools
            for (const pool in rewards2[owner]) {
                if (pool in mergedRewards[owner]) {
                    // Pool exists in both, merge the rewards
                    const poolName = pool as PoolName;
                    mergedRewards[owner][poolName] = mergeRewards(
                        mergedRewards[owner][poolName],
                        rewards2[owner][poolName]);
                } else {
                    // Pool only exists in rewards2, just copy it
                    const poolName = pool as PoolName;
                    mergedRewards[owner][poolName] = rewards2[owner][poolName];
                }
            }
        } else {
            // Owner only exists in rewards2, just copy the entire entry
            mergedRewards[owner] = rewards2[owner];
        }
    }

    return mergedRewards;
}




// async function main() {
//     // const events = await fetchDepositEvents({startTime: 1719499980000});
//     // fs.writeFileSync("./test.json", JSON.stringify(events))
//     const events = JSON.parse(fs.readFileSync("./test.json", "utf-8"));
//     const investments = parseInvestmentsfromDepositEvents({
//         events: events,
//         owners: [],
//         poolNames: [],
//     });
//     fs.writeFileSync("./test.json", JSON.stringify(investments));
// }
// main();