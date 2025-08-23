import { Decimal } from "decimal.js";
import {
  getConf,
  poolInfo,
  coinsList,
  PoolName,
  cetusPoolMap,
  getPool,
  doubleAssetPoolCoinMap,
} from "../index.js";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { UserAutoBalanceRewardAmounts } from "./types.js";
import { coinTypeMap } from "../common/maps.js";
export interface ClaimRewardResponse {
  txb: Transaction;
  coinOut: TransactionResult[];
}
export async function claimRewardsTxb(
  userAddress: string,
  poolName: PoolName,
): Promise<ClaimRewardResponse | undefined> {
  const { getReceipts } = await import("../index.js");
  try {
    const receipts = await getReceipts(poolName, userAddress, true);
    const txb = new Transaction();
    const pool = poolInfo[poolName];
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
    const rewards: TransactionResult[] = [];
    if (poolName === "BLUEFIN-AUTOBALANCE-USDT-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-BLUE") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-SUI") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-LBTC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["DEEP"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["LBTC"].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["LBTC"].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const suiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["LBTC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const lbtcBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["LBTC"].type,
          coinsList["LBTC"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const deepBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["LBTC"].type,
          coinsList["DEEP"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
      });
      const suiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["SUI"].type],
        arguments: [suiBalance!],
      });
      const lbtcCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["LBTC"].type],
        arguments: [lbtcBalance!],
      });
      const deepCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["DEEP"].type],
        arguments: [deepBalance!],
      });
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(suiCoin);
      rewards.push(lbtcCoin);
      rewards.push(deepCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-WAL-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["WAL"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(tCoin);
      rewards.push(sCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC-ZERO-ZERO") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_reward`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
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
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v3`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["STSUI"].type,
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      const stsuiCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["STSUI"].type],
        arguments: [stsuiBalance!],
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
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
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
