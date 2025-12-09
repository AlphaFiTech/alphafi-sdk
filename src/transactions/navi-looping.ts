import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { getConf } from "../common/constants.js";
import { getSuiClient } from "../sui-sdk/client.js";
import {
  bluefinPoolMap,
  cetusPoolMap,
  loopingAccountAddresses,
  loopingPoolCoinMap,
  naviPriceFeedMap,
  poolInfo,
  singleAssetPoolCoinMap,
} from "../common/maps.js";
import { PoolName, Receipt } from "../common/types.js";
import { coinsList } from "../common/coins.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { updateSingleTokenPrice } from "./naviOracle.js";
import { AlphalendClient } from "@alphafi/alphalend-sdk";
import { alphalendClient } from "./alphalend.js";
import { getAvailableRewards } from "./get_navi_rewards.js";

export async function loopingDeposit(
  poolName: PoolName,
  amount: string,
  options: { address: string },
) {
  let txb = new Transaction();

  await updateSingleTokenPrice(
    getSuiClient(),
    naviPriceFeedMap[loopingPoolCoinMap[poolName].supplyCoin].pythPriceInfo,
    naviPriceFeedMap[loopingPoolCoinMap[poolName].supplyCoin].feedId,
    txb,
  );
  await updateSingleTokenPrice(
    getSuiClient(),
    naviPriceFeedMap[loopingPoolCoinMap[poolName].borrowCoin].pythPriceInfo,
    naviPriceFeedMap[loopingPoolCoinMap[poolName].borrowCoin].feedId,
    txb,
  );

  if (poolName === "NAVI-LOOP-HASUI-SUI") {
    txb = await naviHasuiSuiLoopDepositTx(txb, amount, options);
  } else if (poolName === "NAVI-LOOP-SUI-VSUI") {
    txb = await naviSuiVsuiLoopDepositTx(txb, amount, options);
  } else if (poolName === "NAVI-LOOP-USDC-USDT") {
    txb = await naviUsdcUsdtLoopDepositTx(txb, amount, options);
  } else if (poolName === "NAVI-LOOP-USDT-USDC") {
    txb = await naviUsdtUsdcLoopDepositTx(txb, amount, options);
  }
  return txb;
}

export async function loopingWithdraw(
  poolName: PoolName,
  xTokens: string,
  options: { address: string },
) {
  let txb = new Transaction();

  await updateSingleTokenPrice(
    getSuiClient(),
    naviPriceFeedMap[loopingPoolCoinMap[poolName].supplyCoin].pythPriceInfo,
    naviPriceFeedMap[loopingPoolCoinMap[poolName].supplyCoin].feedId,
    txb,
  );
  await updateSingleTokenPrice(
    getSuiClient(),
    naviPriceFeedMap[loopingPoolCoinMap[poolName].borrowCoin].pythPriceInfo,
    naviPriceFeedMap[loopingPoolCoinMap[poolName].borrowCoin].feedId,
    txb,
  );

  if (poolName === "NAVI-LOOP-HASUI-SUI") {
    txb = await naviHasuiSuiLoopWithdrawTx(txb, xTokens, options);
  } else if (poolName === "NAVI-LOOP-SUI-VSUI") {
    txb = await naviSuiVsuiLoopWithdrawTx(txb, xTokens, options);
  } else if (poolName === "NAVI-LOOP-USDC-USDT") {
    txb = await naviUsdcUsdtLoopWithdrawTx(txb, xTokens, options);
  } else if (poolName === "NAVI-LOOP-USDT-USDC") {
    txb = await naviUsdtUsdcLoopWithdrawTx(txb, xTokens, options);
  }
  return txb;
}

export async function naviHasuiSuiLoopDepositTx(
  txb: Transaction,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const poolName = "NAVI-LOOP-HASUI-SUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-HASUI-SUI" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-HASUI-SUI"].coin].type,
      cursor: currentCursor,
    });

    coins = coins.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  if (coins.length >= 1) {
    const [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins.map((c) => c.coinObjectId),
    );
    const [depositCoin] = txb.splitCoins(coin, [amount]);
    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolData.receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
        ? claimableRewards[
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_hasui_sui_pool::user_deposit_v2`, // change package id for testing
      arguments: [
        txb.object(C.ALPHA_2_VERSION), // change version object id for testing
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_HASUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["HASUI-SUI"]),
        txb.object(C.HAEDEL_STAKING),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviSuiVsuiLoopDepositTx(
  txb: Transaction,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-SUI-VSUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  let someReceipt: any;
  if (receipt.length == 0) {
    [someReceipt] = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [poolData.receiptType],
      arguments: [],
    });
  } else {
    [someReceipt] = txb.moveCall({
      target: `0x1::option::some`,
      typeArguments: [receipt[0].content.type],
      arguments: [txb.object(receipt[0].objectId)],
    });
  }
  const [depositCoin] = txb.splitCoins(txb.gas, [amount]);
  const claimableRewards = await getAvailableRewards(
    loopingAccountAddresses[poolName],
  );

  const rewardCoinSet = new Set();
  if (claimableRewards) {
    for (const reward of claimableRewards[
      coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
    ]
      ? claimableRewards[
          coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
        ]
      : []) {
      if (rewardCoinSet.has(reward.reward_coin_type) === false) {
        if (reward.rewardCoinType === coinsList["NAVX"].type) {
          rewardCoinSet.add(reward.reward_coin_type);
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
            typeArguments: [coinsList["NAVX"].type],
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.ALPHA_2_VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_NAVX_REWARDS_POOL),
              txb.object(C.VOLO_STAKE_POOL),
              txb.object(C.VOLO_METADATA),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(cetusPoolMap[`NAVX-SUI`]),
              txb.object(cetusPoolMap[`VSUI-SUI`]),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            ],
          });
        } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.ALPHA_2_VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_VSUI_REWARDS_POOL),
            ],
          });
        }
        rewardCoinSet.add(reward.reward_coin_type);
      }
    }
    for (const reward of claimableRewards[
      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    ]
      ? claimableRewards[
          "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
        ]
      : []) {
      if (rewardCoinSet.has(reward.reward_coin_type) === false) {
        if (reward.rewardCoinType === coinsList["NAVX"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
            typeArguments: [coinsList["NAVX"].type],
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.ALPHA_2_VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_NAVX_REWARDS_POOL),
              txb.object(C.VOLO_STAKE_POOL),
              txb.object(C.VOLO_METADATA),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(cetusPoolMap[`NAVX-SUI`]),
              txb.object(cetusPoolMap[`VSUI-SUI`]),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            ],
          });
        } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.ALPHA_2_VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_VSUI_REWARDS_POOL),
            ],
          });
        }
        rewardCoinSet.add(reward.reward_coin_type);
      }
    }
  }
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_vsui_pool::user_deposit_v3`,
    arguments: [
      txb.object(C.ALPHA_2_VERSION),
      txb.object(C.VERSION),
      someReceipt,
      txb.object(poolData.poolId),
      depositCoin,
      txb.object(poolData.investorId),
      txb.object(C.ALPHA_DISTRIBUTOR),
      txb.object(C.PRICE_ORACLE),
      txb.object(C.NAVI_STORAGE),
      txb.object(C.NAVI_VSUI_POOL),
      txb.object(C.NAVI_SUI_POOL),
      txb.object(C.NAVI_INCENTIVE_V3),
      txb.object(C.NAVI_INCENTIVE_V2),
      txb.object(C.CETUS_GLOBAL_CONFIG_ID),
      txb.object(cetusPoolMap["VSUI-SUI"]),
      txb.object(C.VOLO_STAKE_POOL),
      txb.object(C.VOLO_METADATA),
      txb.object(C.SUI_SYSTEM_STATE),
      txb.object(C.KRIYA_VSUI_SUI_POOL),
      txb.object(C.KRIYA_VERSION),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });

  return txb;
}

export async function naviSuiStsuiLoopDepositTx(
  txb: Transaction,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-SUI-STSUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  let someReceipt: any;
  if (receipt.length == 0) {
    [someReceipt] = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [poolData.receiptType],
      arguments: [],
    });
  } else {
    [someReceipt] = txb.moveCall({
      target: `0x1::option::some`,
      typeArguments: [receipt[0].content.type],
      arguments: [txb.object(receipt[0].objectId)],
    });
  }
  const [depositCoin] = txb.splitCoins(txb.gas, [amount]);
  const claimableRewards = await getAvailableRewards(
    loopingAccountAddresses[poolName],
  );
  const rewardCoinSet = new Set();
  if (claimableRewards) {
    for (const reward of claimableRewards[
      coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
    ]
      ? claimableRewards[
          coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
        ]
      : []) {
      if (rewardCoinSet.has(reward.reward_coin_type) === false) {
        if (reward.rewardCoinType === coinsList["NAVX"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_bluefin`,
            typeArguments: [coinsList["NAVX"].type],
            arguments: [
              txb.object(C.ALPHA_5_VERSION),
              txb.object(poolData.investorId),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_NAVX_REWARDS_POOL),
              txb.object(C.LST_INFO),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(bluefinPoolMap[`NAVX-SUI`]),
              txb.object(C.BLUEFIN_GLOBAL_CONFIG),
              txb.object(C.CLOCK_PACKAGE_ID),
            ],
          });
        } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps`,
            typeArguments: [coinsList["VSUI"].type],
            arguments: [
              txb.object(C.ALPHA_5_VERSION),
              txb.object(poolData.investorId),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_VSUI_REWARDS_POOL),
              txb.object(C.LST_INFO),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(cetusPoolMap[`VSUI-SUI`]),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              txb.object(C.CLOCK_PACKAGE_ID),
            ],
          });
        } else if (reward.rewardCoinType === coinsList["STSUI"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap`,
            arguments: [
              txb.object(C.ALPHA_5_VERSION),
              txb.object(poolData.investorId),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_STSUI_REWARDS_POOL),
              txb.object(C.CLOCK_PACKAGE_ID),
            ],
          });
        }
        rewardCoinSet.add(reward.reward_coin_type);
      }
    }
    for (const reward of claimableRewards[
      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    ]
      ? claimableRewards[
          "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
        ]
      : []) {
      if (rewardCoinSet.has(reward.reward_coin_type) === false) {
        if (reward.rewardCoinType === coinsList["NAVX"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_bluefin`,
            typeArguments: [coinsList["NAVX"].type],
            arguments: [
              txb.object(C.ALPHA_5_VERSION),
              txb.object(poolData.investorId),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_NAVX_REWARDS_POOL),
              txb.object(C.LST_INFO),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(bluefinPoolMap[`NAVX-SUI`]),
              txb.object(C.BLUEFIN_GLOBAL_CONFIG),
              txb.object(C.CLOCK_PACKAGE_ID),
            ],
          });
        } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
          txb.moveCall({
            target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps`,
            typeArguments: [coinsList["VSUI"].type],
            arguments: [
              txb.object(C.ALPHA_5_VERSION),
              txb.object(poolData.investorId),
              txb.object(C.NAVI_STORAGE),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_VSUI_REWARDS_POOL),
              txb.object(C.LST_INFO),
              txb.object(C.SUI_SYSTEM_STATE),
              txb.object(cetusPoolMap[`VSUI-SUI`]),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              txb.object(C.CLOCK_PACKAGE_ID),
            ],
          });
        }
        rewardCoinSet.add(reward.reward_coin_type);
      }
    }
  }
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_one_swap`,
    typeArguments: [coinsList["ALPHA"].type],
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(poolData.investorId),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
      txb.object(C.BLUEFIN_GLOBAL_CONFIG),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap_v2`,
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(poolData.investorId),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::user_deposit_v3`,
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(C.VERSION),
      someReceipt,
      txb.object(poolData.poolId),
      depositCoin,
      txb.object(poolData.investorId),
      txb.object(C.ALPHA_DISTRIBUTOR),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.LST_INFO),
      txb.object(C.SUI_SYSTEM_STATE),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });

  return txb;
}

export async function naviUsdcUsdtLoopDepositTx(
  txb: Transaction,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const poolName = "NAVI-LOOP-USDC-USDT";
  const poolData = poolInfo["NAVI-LOOP-USDC-USDT"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDC-USDT" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-USDC-USDT"].coin].type,
      cursor: currentCursor,
    });

    coins = coins.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  if (coins.length >= 1) {
    const [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins.map((c) => c.coinObjectId),
    );
    const [depositCoin] = txb.splitCoins(coin, [amount]);
    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolData.receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::user_deposit_v3`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.BLUEFIN_USDT_USDC_POOL),
        txb.pure.bool(true),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviUsdtUsdcLoopDepositTx(
  txb: Transaction,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;

  const poolData = poolInfo["NAVI-LOOP-USDT-USDC"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDT-USDC" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-USDT-USDC"].coin].type,
      cursor: currentCursor,
    });

    coins = coins.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  if (coins.length >= 1) {
    const [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins.map((c) => c.coinObjectId),
    );
    const [depositCoin] = txb.splitCoins(coin, [amount]);
    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolData.receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }

    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_usdt_usdc_pool::user_deposit_v3`,
      typeArguments: [coinsList["NAVX"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviHasuiSuiLoopWithdrawTx(
  txb: Transaction,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-HASUI-SUI";
  const poolData = poolInfo["NAVI-LOOP-HASUI-SUI"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-HASUI-SUI" as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
        ? claimableRewards[
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_hasui_sui_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.HAEDEL_STAKING),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`HASUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }
    const [hasuiCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_hasui_sui_pool::user_withdraw_v2`, // change package id for testing
      arguments: [
        txb.object(C.ALPHA_2_VERSION), // change  version object id for testing
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_HASUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["HASUI-SUI"]),
        txb.object(C.HAEDEL_STAKING),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["HASUI"].type}>`],
      arguments: [hasuiCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-HASUI-SUI"} Receipt`);
  }

  return txb;
}

export async function naviSuiVsuiLoopWithdrawTx(
  txb: Transaction,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;

  const poolName = "NAVI-LOOP-SUI-VSUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });

    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.VOLO_STAKE_POOL),
                txb.object(C.VOLO_METADATA),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
        ? claimableRewards[
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.VOLO_STAKE_POOL),
                txb.object(C.VOLO_METADATA),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }

    const [vsui_coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_vsui_pool::user_withdraw_v3`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_VSUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(C.VOLO_STAKE_POOL),
        txb.object(C.VOLO_METADATA),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.KRIYA_VSUI_SUI_POOL),
        txb.object(C.KRIYA_VERSION),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["VSUI"].type}>`],
      arguments: [vsui_coin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-SUI-VSUI"} Receipt`);
  }

  return txb;
}
export async function migrateBoostedToLoop(
  txb: Transaction,
  options: {
    address: string;
  },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;

  let poolName = "NAVI-LOOP-SUI-VSUI";
  let poolData = poolInfo[poolName];

  let receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });

    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.VOLO_STAKE_POOL),
                txb.object(C.VOLO_METADATA),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
        ? claimableRewards[
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_two_swaps_v2`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.VOLO_STAKE_POOL),
                txb.object(C.VOLO_METADATA),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_vsui_investor::collect_reward_with_no_swap`,
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }

    const [vsui_coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_vsui_pool::user_withdraw_v3`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(receipt[0].content.fields.xTokenBalance),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_VSUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(C.VOLO_STAKE_POOL),
        txb.object(C.VOLO_METADATA),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.KRIYA_VSUI_SUI_POOL),
        txb.object(C.KRIYA_VERSION),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    const [suiCoin] = txb.moveCall({
      target: `${C.VOLO_PACKAGE_ID}::stake_pool::unstake`,
      arguments: [
        txb.object(C.VOLO_STAKE_POOL),
        txb.object(C.VOLO_METADATA),
        txb.object(C.SUI_SYSTEM_STATE),
        vsui_coin,
      ],
    });

    poolName = "ALPHALEND-LOOP-SUI-STSUI";
    poolData = poolInfo[poolName];

    await alphalendClient.updatePrices(txb, [
      coinsList["STSUI"].type,
      "0x2::sui::SUI",
    ]);
    receipt = await getReceipts(poolName as PoolName, address, true);

    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolData.receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_one_swap`,
      typeArguments: [coinsList["ALPHA"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap_v2`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_v2`,
      typeArguments: [coinsList["BLUE"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(cetusPoolMap[`BLUE-SUI`]),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::user_deposit_v3`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        suiCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
}
export async function naviSuiStsuiLoopWithdrawTx(
  txb: Transaction,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-SUI-STSUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  const alphalendClient = new AlphalendClient("mainnet", getSuiClient());
  await alphalendClient.updatePrices(txb, [
    coinsList["STSUI"].type,
    "0x2::sui::SUI",
  ]);
  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_bluefin`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(C.ALPHA_5_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.LST_INFO),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(bluefinPoolMap[`NAVX-SUI`]),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(C.ALPHA_5_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.LST_INFO),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["STSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap`,
              arguments: [
                txb.object(C.ALPHA_5_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_STSUI_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ]
        ? claimableRewards[
            "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_bluefin`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(C.ALPHA_5_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.LST_INFO),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(bluefinPoolMap[`NAVX-SUI`]),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(C.ALPHA_5_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.LST_INFO),
                txb.object(C.SUI_SYSTEM_STATE),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }

    const [stsui_coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::user_withdraw_v3`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["SUI"].type}>`],
      arguments: [stsui_coin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No NAVI-LOOP-SUI-STSUI Receipt`);
  }

  return txb;
}

export async function naviUsdcUsdtLoopWithdrawTx(
  txb: Transaction,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-USDC-USDT";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["NAVX"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_investor::collect_reward_with_two_swaps`,
              typeArguments: [coinsList["VSUI"].type],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_2_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }
    const [usdcCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::user_withdraw_v4`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u256(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.BLUEFIN_USDT_USDC_POOL),
        txb.pure.bool(true),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["USDC"].type}>`],
      arguments: [usdcCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-USDC-USDT"} Receipt`);
  }

  return txb;
}

export async function naviUsdtUsdcLoopWithdrawTx(
  txb: Transaction,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const poolName = "NAVI-LOOP-USDT-USDC";
  const poolData = poolInfo["NAVI-LOOP-USDT-USDC"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDT-USDC" as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });
    const claimableRewards = await getAvailableRewards(
      loopingAccountAddresses[poolName],
    );

    const rewardCoinSet = new Set();
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].supplyCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_usdt_usdc_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList["USDT"].type,
                coinsList["USDC"].type,
                coinsList["SUI"].type,
                "0x" + reward.reward_coin_type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_5_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(cetusPoolMap[`USDC-USDT`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_usdt_usdc_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList["USDT"].type,
                coinsList["USDC"].type,
                coinsList["SUI"].type,
                "0x" + reward.reward_coin_type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_5_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(cetusPoolMap[`USDC-USDT`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
      for (const reward of claimableRewards[
        coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
      ]
        ? claimableRewards[
            coinsList[loopingPoolCoinMap[poolName].borrowCoin].type
          ]
        : []) {
        if (rewardCoinSet.has(reward.reward_coin_type) === false) {
          if (reward.rewardCoinType === coinsList["NAVX"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_usdt_usdc_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList["USDT"].type,
                coinsList["USDC"].type,
                coinsList["SUI"].type,
                "0x" + reward.reward_coin_type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_5_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap[`NAVX-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(cetusPoolMap[`USDC-USDT`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (reward.rewardCoinType === coinsList["VSUI"].type) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_usdt_usdc_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList["USDT"].type,
                coinsList["USDC"].type,
                coinsList["SUI"].type,
                "0x" + reward.reward_coin_type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.ALPHA_5_VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap[`VSUI-SUI`]),
                txb.object(cetusPoolMap[`USDC-SUI`]),
                txb.object(cetusPoolMap[`USDC-USDT`]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
          rewardCoinSet.add(reward.reward_coin_type);
        }
      }
    }
    const [usdtCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_usdt_usdc_pool::user_withdraw_v3`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u256(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["USDT"].type}>`],
      arguments: [usdtCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-USDT-USDC"} Receipt`);
  }

  return txb;
}
