import { Decimal } from "decimal.js";
import {
  getConf,
  poolInfo,
  coinsList,
  PoolName,
  getPool,
  doubleAssetPoolCoinMap,
  getParentPool,
  BluefinPoolType,
  AUTOBALANCE_TYPE_1_POOLS,
} from "../index.js";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { UserAutoBalanceRewardAmounts } from "./types.js";
import {
  AUTOBALANCE_SUI_FIRST_POOLS,
  AUTOBALANCE_SUI_SECOND_POOLS,
  coinTypeMap,
} from "../common/maps.js";
export interface ClaimRewardResponse {
  txb: Transaction;
  coinOut: TransactionResult[];
}
export async function collectRewardTxb(
  poolName: PoolName,
  ignoreCache: boolean,
  tx?: Transaction,
): Promise<Transaction> {
  let txb: Transaction | PromiseLike<Transaction>;
  if (tx) {
    txb = tx;
  } else {
    txb = new Transaction();
  }
  const bluefinPool = (await getParentPool(
    poolName,
    ignoreCache,
  )) as BluefinPoolType;
  const pool = poolInfo[poolName];
  const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
  const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (AUTOBALANCE_SUI_FIRST_POOLS.includes(poolName)) {
    for (const reward of bluefinPool.content.fields.reward_infos) {
      const rewardType = "0x" + reward.fields.reward_coin_type;
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          rewardType,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else if (AUTOBALANCE_SUI_SECOND_POOLS.includes(poolName)) {
    for (const reward of bluefinPool.content.fields.reward_infos) {
      const rewardType = "0x" + reward.fields.reward_coin_type;
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          rewardType,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else if (AUTOBALANCE_TYPE_1_POOLS.includes(poolName)) {
    for (const reward of bluefinPool.content.fields.reward_infos) {
      const rewardType = "0x" + reward.fields.reward_coin_type;
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          rewardType,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  }
  return txb;
}
export async function claimRewardsTxb(
  userAddress: string,
  poolName: PoolName,
): Promise<ClaimRewardResponse | undefined> {
  const { getReceipts } = await import("../index.js");
  try {
    const receipts = await getReceipts(poolName, userAddress, true);
    const txb = await collectRewardTxb(poolName, true); //false for now
    const bluefinPool = (await getParentPool(
      poolName,
      false,
    )) as BluefinPoolType;
    const pool = poolInfo[poolName];
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
    const rewards: TransactionResult[] = [];
    if (
      poolName === "BLUEFIN-AUTOBALANCE-SUI-LBTC" ||
      poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC"
    ) {
      for (const reward of bluefinPool.content.fields.reward_infos) {
        const rewardType = "0x" + reward.fields.reward_coin_type;
        const balance = txb.moveCall({
          target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
          typeArguments: [
            coinsList[coin1].type,
            coinsList[coin2].type,
            rewardType,
          ],
          arguments: [
            txb.object(receipts[0].objectId),
            txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
            txb.object(pool.poolId),
            txb.object(pool.investorId),
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(pool.parentPoolId),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
        const coin = txb.moveCall({
          target: "0x2::coin::from_balance",
          typeArguments: [rewardType],
          arguments: [balance!],
        });
        rewards.push(coin);
      }
      const tBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin1].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const sBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin2].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const tCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin1].type],
        arguments: [tBalance!],
      });
      const sCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin2].type],
        arguments: [sBalance!],
      });
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (
      poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI" ||
      poolName === "BLUEFIN-AUTOBALANCE-DEEP-SUI"
    ) {
      for (const reward of bluefinPool.content.fields.reward_infos) {
        const rewardType = "0x" + reward.fields.reward_coin_type;
        const balance = txb.moveCall({
          target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
          typeArguments: [
            coinsList[coin1].type,
            coinsList[coin2].type,
            rewardType,
          ],
          arguments: [
            txb.object(receipts[0].objectId),
            txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
            txb.object(pool.poolId),
            txb.object(pool.investorId),
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(pool.parentPoolId),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
        const coin = txb.moveCall({
          target: "0x2::coin::from_balance",
          typeArguments: [rewardType],
          arguments: [balance!],
        });
        rewards.push(coin);
      }
      const tBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin1].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const sBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin2].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const tCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin1].type],
        arguments: [tBalance!],
      });
      const sCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin2].type],
        arguments: [sBalance!],
      });
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else {
      for (const reward of bluefinPool.content.fields.reward_infos) {
        const rewardType = "0x" + reward.fields.reward_coin_type;
        const balance = txb.moveCall({
          target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
          typeArguments: [
            coinsList[coin1].type,
            coinsList[coin2].type,
            rewardType,
          ],
          arguments: [
            txb.object(receipts[0].objectId),
            txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
            txb.object(pool.poolId),
            txb.object(pool.investorId),
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(pool.parentPoolId),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
        const coin = txb.moveCall({
          target: "0x2::coin::from_balance",
          typeArguments: [rewardType],
          arguments: [balance!],
        });
        rewards.push(coin);
      }
      const tBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin1].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const sBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList[coin2].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(pool.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const tCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin1].type],
        arguments: [tBalance!],
      });
      const sCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList[coin2].type],
        arguments: [sBalance!],
      });
      rewards.push(tCoin);
      rewards.push(sCoin);
    }
    return { txb: txb, coinOut: rewards };
  } catch (e) {
    console.error("error in claim blue rewards", e);
  }
}

export async function pendingRewardAmount(
  userAddress: string,
  poolName: PoolName,
): Promise<UserAutoBalanceRewardAmounts> {
  const { getReceipts } = await import("../index.js");
  try {
    const receipts = await getReceipts(poolName, userAddress, true);
    const receipt = receipts[0];
    const userXtokenBalance = receipt.content.fields.xTokenBalance;
    const totalPendingRewardAmounts: UserAutoBalanceRewardAmounts = {};
    const userPendingReward: { [key in string]: string } = {};
    const curAcc: { [key in string]: string } = {};
    const lastAcc: { [key in string]: string } = {};
    const userPendingRewardsAll =
      receipt.content.fields.pending_rewards.fields.contents;
    for (let i = 0; i < userPendingRewardsAll.length; i++) {
      userPendingReward[
        "0x" + userPendingRewardsAll[i].fields.key.fields.name
      ] = userPendingRewardsAll[i].fields.value;
    }
    const pool = await getPool(poolName, false);
    const currAccForAllRewards =
      pool!.content.fields.acc_rewards_per_xtoken.fields.contents;
    currAccForAllRewards?.forEach((reward) => {
      curAcc["0x" + reward.fields.key.fields.name] = reward.fields.value;
    });
    const lastAccAll =
      receipt.content.fields.last_acc_reward_per_xtoken.fields.contents;
    lastAccAll.forEach((reward) => {
      lastAcc["0x" + reward.fields.key.fields.name] = reward.fields.value;
    });
    const coinTypeToCoin = coinTypeMap;
    Object.keys(curAcc).forEach((type) => {
      if (!coinTypeToCoin[type]) {
        console.error("coin not present", type);
        return;
      }
      const cur = new Decimal(curAcc[type]);
      const last = new Decimal(type in lastAcc ? lastAcc[type] : "0");
      const pending = new Decimal(
        type in userPendingReward ? userPendingReward[type] : "0",
      );

      const totalPending = cur
        .minus(last)
        .mul(userXtokenBalance)
        .div(1e36)
        .plus(pending)
        .div(Math.pow(10, coinsList[coinTypeToCoin[type]].expo))
        .toString();
      totalPendingRewardAmounts[type] = totalPending.toString();
    });
    return totalPendingRewardAmounts;
  } catch (e) {
    console.error("error in calculate pending blue rewards", e);
    return {};
  }
}
