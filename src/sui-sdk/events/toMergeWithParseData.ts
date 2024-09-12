import { DepositEventNode, ParseInvestmentsfromDepositEventsParams, ParseAlphaRewardsFromDepositEventsParams } from "./types";
import { UsersInvestmentsInPools, UsersCollectedAlphaRewards } from "../../utils/poolEarnings/types";
import Decimal from "decimal.js";
import { PoolAmounts, SingleTokenAmounts } from "../../common/types";

export function parseInvestmentsfromDepositEvents(params: ParseInvestmentsfromDepositEventsParams): UsersInvestmentsInPools {
    let usersInvestmentsInPools: UsersInvestmentsInPools = {};

    if (params.poolNames.some(poolName => poolName !== "ALPHA")) {
        console.warn("Investments from Deposit Events only supported for ALPHA yet");
    }

    for (const node of params.events) {
        if (node.txModule !== "alphapool") {
            continue;
        }
        const owner = node.sender;
        const investment = (new Decimal(node.amount_deposited)).div(1e9);
        if (owner in usersInvestmentsInPools) {
            const prevInvestment = usersInvestmentsInPools[owner].ALPHA as SingleTokenAmounts;
            const newInvestment = (new Decimal(prevInvestment.tokens)).add(investment).toFixed(5).toString();
            usersInvestmentsInPools[owner].ALPHA = { tokens: newInvestment } as SingleTokenAmounts;
        }
        else {
            usersInvestmentsInPools[owner] = { "ALPHA": { "tokens": investment.toFixed(5).toString() } } as PoolAmounts
        }
    }

    if (params.owners.length === 0) {
        return usersInvestmentsInPools;
    }
    usersInvestmentsInPools = Object.fromEntries(
        params.owners.filter((owner) => owner in usersInvestmentsInPools)
            .map((owner) => [owner, usersInvestmentsInPools[owner]])
    );
    return usersInvestmentsInPools;
}


export function parseAlphaRewardsFromDepositEvents(params: ParseAlphaRewardsFromDepositEventsParams): UsersCollectedAlphaRewards {
    let usersCollectedAlphaRewards: UsersCollectedAlphaRewards = {};

    // this function takes the deposits coming from other modules
    // checks the transaction digests for each of the event
    // finds out the pool that it came from using the input objects from the transactions
    // uses that to create the mapping
    // returs each users collected rewards from each pool

    for (const node of params.events) {
        if (node.txModule === "alphapool") {
            continue;
        }
        const owner = node.sender;
        const investment = (new Decimal(node.amount_deposited)).div(1e9);

        if (owner in usersCollectedAlphaRewards) {
        }
        else {
        }
    }

    return usersCollectedAlphaRewards;
}