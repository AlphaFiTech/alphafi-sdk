import { CoinName, PoolName } from "./common/types";

export type GetUserTokensParams = {
    poolNames?: string[];
    startTime?: number;
    endTime?: number;
    owners?: string[];
}

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

export type GetUserHoldingsInUsdParams = {
    pools?: string[];
    startTime?: number;
    endTime?: number;
    owners?: string[];
    userTokensHoldings?: [string, string, string][];
}

export type LiquidityToUsdParams = {
    liquidity: string;
    pool: string;
    ticksCetusMap: { [pool: string]: { lower: string; upper: string } };
    sqrtPriceCetusMap: Map<PoolName, string>;
    tokenPriceMap: Map<CoinName, string>;
}