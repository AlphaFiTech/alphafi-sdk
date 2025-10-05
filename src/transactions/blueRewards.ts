import { Decimal } from "decimal.js";
import {
  getConf,
  poolInfo,
  coinsList,
  PoolName,
  doubleAssetPoolCoinMap,
  getParentPool,
  BluefinPoolType,
  AUTOBALANCE_TYPE_1_POOLS,
  getSuiClient,
} from "../index.js";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { UserAutoBalanceRewardAmounts } from "./types.js";
import {
  AUTOBALANCE_SUI_FIRST_POOLS,
  AUTOBALANCE_SUI_SECOND_POOLS,
  coinTypeMap,
} from "../common/maps.js";
import { bcs, fromBase64 } from "@mysten/bcs";
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
    const rewardsList = bluefinPool.content.fields.reward_infos.map((ele) => {
      return "0x" + ele.fields.reward_coin_type;
    });
    rewardsList.push(coinsList[coin1].type.substring(2));
    rewardsList.push(coinsList[coin2].type.substring(2));
    console.log(rewardsList);

    if (AUTOBALANCE_SUI_FIRST_POOLS.includes(poolName)) {
      for (const rewardType of [...new Set(rewardsList)]) {
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
    } else if (AUTOBALANCE_SUI_SECOND_POOLS.includes(poolName)) {
      for (const rewardType of [...new Set(rewardsList)]) {
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
    } else if (AUTOBALANCE_TYPE_1_POOLS.includes(poolName)) {
      for (const rewardType of [...new Set(rewardsList)]) {
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
    }
    return { txb: txb, coinOut: rewards };
  } catch (e) {
    console.error("error in claim blue rewards", e);
  }
}
// TypeName struct from stdlib
const TypeName = bcs.struct("0x1::type_name::TypeName", {
  name: bcs.vector(bcs.u8()),
});

// VecMapEntry<K, V>
function VecMapEntry(KType: any, VType: any) {
  return bcs.struct(`Entry<${KType.name},${VType.name}>`, {
    key: KType,
    value: VType,
  });
}

// VecMap<K, V> (contents: vector<Entry<K, V>>)
function VecMap(KType: any, VType: any) {
  return bcs.struct(`VecMap<${KType.name},${VType.name}>`, {
    contents: bcs.vector(VecMapEntry(KType, VType)),
  });
}

// Specialization for TypeName → u256
const VecMap_TypeName_U256 = VecMap(TypeName, bcs.u256());

function parseReturnValue(rv: [Uint8Array | number[] | string, string]) {
  let [rawBytes, typeTag] = rv;

  let bytes: Uint8Array;
  if (typeof rawBytes === "string") {
    bytes = fromBase64(rawBytes);
  } else if (Array.isArray(rawBytes)) {
    bytes = Uint8Array.from(rawBytes);
  } else {
    bytes = rawBytes;
  }

  if (typeTag === "0x2::vec_map::VecMap<0x1::type_name::TypeName, u256>") {
    const parsed = VecMap_TypeName_U256.parse(bytes);
    // parsed.contents is an array of { key: { name: Uint8Array }, value: string }
    return parsed.contents.map((entry: any) => {
      // Ensure we normalize to Uint8Array
      const keyBytes =
        entry.key.name instanceof Uint8Array
          ? entry.key.name
          : Uint8Array.from(entry.key.name);

      const keyStr = new TextDecoder().decode(keyBytes);
      const valStr = entry.value.toString(); // u256 → string

      return { key: keyStr, value: valStr };
    });
  }

  return undefined; // fallback
}

export async function pendingRewardAmount(
  userAddress: string,
  poolName: PoolName,
): Promise<UserAutoBalanceRewardAmounts> {
  const { getReceipts } = await import("../index.js");
  try {
    const txb = new Transaction();
    let poolInf = poolInfo[poolName];
    let coin1Type = coinsList[doubleAssetPoolCoinMap[poolName].coin1].type;
    let coin2Type = coinsList[doubleAssetPoolCoinMap[poolName].coin2].type;
    await collectRewardTxb(poolName, true, txb);

    if (AUTOBALANCE_SUI_FIRST_POOLS.includes(poolName)) {
      txb.moveCall({
        target: `${poolInf.packageId}::alphafi_bluefin_sui_first_pool::update_pool_v4`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(poolInf.poolId),
          txb.object(poolInf.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(poolInf.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${getConf().ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID}::alphafi_bluefin_sui_first_pool::get_cur_acc_per_xtoken`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [txb.object(poolInfo[poolName].poolId)],
      });
    } else if (AUTOBALANCE_SUI_SECOND_POOLS.includes(poolName)) {
      txb.moveCall({
        target: `${poolInf.packageId}::alphafi_bluefin_sui_second_pool::update_pool_v3`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(poolInf.poolId),
          txb.object(poolInf.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(poolInf.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${getConf().ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID}::alphafi_bluefin_sui_second_pool::get_cur_acc_per_xtoken`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [txb.object(poolInfo[poolName].poolId)],
      });
    } else {
      txb.moveCall({
        target: `${poolInf.packageId}::alphafi_bluefin_type_1_pool::update_pool_v3`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(poolInf.poolId),
          txb.object(poolInf.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(poolInf.parentPoolId),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${getConf().ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID}::alphafi_bluefin_type_1_pool::get_cur_acc_per_xtoken`,
        typeArguments: [coin1Type, coin2Type],
        arguments: [txb.object(poolInfo[poolName].poolId)],
      });
    }
    let res = await getSuiClient().devInspectTransactionBlock({
      sender: userAddress,
      transactionBlock: txb,
    });

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
    const currAccForAllRewards = parseReturnValue(
      res.results![res.results!.length - 1].returnValues![0],
    );
    currAccForAllRewards?.forEach((reward) => {
      curAcc["0x" + reward.key] = reward.value;
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
