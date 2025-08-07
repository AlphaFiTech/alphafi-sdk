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
    const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
    const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
    const rewards: TransactionResult[] = [];
    if (poolName === "BLUEFIN-AUTOBALANCE-USDT-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
        typeArguments: [
          coinsList["USDT"].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-USDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const stsuiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["USDC"].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const suiBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const usdcBalance = txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_v4`,
        typeArguments: [
          coinsList["SUI"].type,
          coinsList["USDC"].type,
          coinsList["USDC"].type,
        ],
        arguments: [
          txb.object(receipts[0].objectId),
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
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
      const usdcCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["USDC"].type],
        arguments: [usdcBalance!],
      });
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(suiCoin);
      rewards.push(usdcCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
        typeArguments: [
          coinsList["SUIUSDT"].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SUIUSDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-BLUE") {
      const blueBalance = txb.moveCall({
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["BLUE-DEEP"]),
          txb.object(cetusPoolMap["BLUE-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-SUI") {
      const blueBalance = txb.moveCall({
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI") {
      const blueBalance = txb.moveCall({
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
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-LBTC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.poolId),
          txb.object(pool.investorId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
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
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
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
        typeArguments: [coinsList["USDC"].type],
        arguments: [lbtcBalance!],
      });
      rewards.push(blueCoin);
      rewards.push(stsuiCoin);
      rewards.push(suiCoin);
      rewards.push(lbtcCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-WAL-USDC") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
        typeArguments: [
          coinsList["WAL"].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
        target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_v2`,
        typeArguments: [
          coinsList["WAL"].type,
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
          txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-WAL"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC-ZERO-ZERO") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
        typeArguments: [
          coinsList["SUIUSDT"].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          txb.object(pool.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_ZERO_ZERO_POOL),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueBalance = txb.moveCall({
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
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_ZERO_ZERO_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SUIUSDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      const blueCoin = txb.moveCall({
        target: "0x2::coin::from_balance",
        typeArguments: [coinsList["BLUE"].type],
        arguments: [blueBalance!],
      });
      rewards.push(blueCoin);
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
