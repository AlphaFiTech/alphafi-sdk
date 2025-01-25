import { Decimal } from "decimal.js";
import {
  getConf,
  poolInfo,
  coinsList,
  PoolName,
  cetusPoolMap,
  getPool,
} from "../index.js";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
export interface ClaimRewardResponse {
  txb: Transaction;
  coinOut: TransactionResult;
}
export async function claimBlueRewardTxb(
  userAddress: string,
  poolName: PoolName,
): Promise<ClaimRewardResponse | undefined> {
  const { getReceipts } = await import("../index.js");
  try {
    const receipts = await getReceipts(poolName, userAddress, true);
    const txb = new Transaction();
    const pool = poolInfo[poolName];
    let blueBalance: TransactionResult;
    if (poolName === "BLUEFIN-AUTOBALANCE-USDT-USDC") {
      blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["USDT"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-USDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC") {
      blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
      blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["SUIUSDT"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-SUIUSDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-BLUE") {
      blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["DEEP"].type,
          coinsList["BLUE"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_DEEP_BLUE_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["BLUE-DEEP"]),
          txb.object(cetusPoolMap["BLUE-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-SUI") {
      blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["DEEP"].type,
          coinsList["SUI"].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["DEEP-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI") {
      blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
          coinsList["DEEP"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
          txb.object(cetusPoolMap["BLUE-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }

    const blueCoin = txb.moveCall({
      target: "0x2::coin::from_balance",
      typeArguments: [coinsList["BLUE"].type],
      arguments: [blueBalance!],
    });
    return { txb: txb, coinOut: blueCoin };
  } catch (e) {
    console.error("error in claim blue rewards", e);
  }
}

export async function pendingBlueRewardAmount(
  userAddress: string,
  poolName: PoolName,
): Promise<string> {
  const { getReceipts } = await import("../index.js");
  try {
    const receipts = await getReceipts(poolName, userAddress, true);
    const receipt = receipts[0];
    const userXtokenBalance = receipt.content.fields.xTokenBalance;
    let userBluePendingReward = new Decimal(0);
    let curAcc = new Decimal(0);
    let lastAcc = new Decimal(0);
    const userPendingRewardsAll =
      receipt.content.fields.pending_rewards.fields.contents;
    for (let i = 0; i < userPendingRewardsAll.length; i++) {
      if (
        userPendingRewardsAll[i].fields.key.fields.name ==
        coinsList["BLUE"].type.substring(2)
      ) {
        userBluePendingReward = new Decimal(
          userPendingRewardsAll[i].fields.value,
        );
        break;
      }
    }
    const pool = await getPool(poolName, false);
    const currAccForAllRewards =
      pool!.content.fields.acc_rewards_per_xtoken.fields.contents;
    currAccForAllRewards?.forEach((reward) => {
      if (
        reward.fields.key.fields.name == coinsList["BLUE"].type.substring(2)
      ) {
        curAcc = new Decimal(reward.fields.value);
      }
    });
    const lastAccAll =
      receipt.content.fields.last_acc_reward_per_xtoken.fields.contents;
    lastAccAll.forEach((reward) => {
      if (
        reward.fields.key.fields.name == coinsList["BLUE"].type.substring(2)
      ) {
        lastAcc = new Decimal(reward.fields.value);
      }
    });

    return curAcc
      .minus(lastAcc)
      .mul(userXtokenBalance)
      .div(1e36)
      .plus(userBluePendingReward)
      .div(Math.pow(10, coinsList["BLUE"].expo))
      .toString();
  } catch (e) {
    console.error("error in calculate pending blue rewards", e);
    return "0";
  }
}
