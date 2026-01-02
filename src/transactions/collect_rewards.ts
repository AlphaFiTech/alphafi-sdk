import { Transaction } from "@mysten/sui/transactions";
import {
  bluefinPoolMap,
  coinsList,
  doubleAssetPoolCoinMap,
  getConf,
  getMultiReceipts,
  getReceipts,
  poolInfo,
  PoolName,
  singleAssetPoolCoinMap,
} from "../index.js";

export async function claimRewardTxb(address: string) {
  const txb = new Transaction();
  await getMultiReceipts(address);
  let alpha_receipt: any;
  [alpha_receipt] = txb.moveCall({
    target: `0x1::option::none`,
    typeArguments: [getConf().ALPHA_POOL_RECEIPT],
    arguments: [],
  });
  const keys = Object.keys(poolInfo);
  for (const poolName of keys) {
    if (poolInfo[poolName].poolId == "") {
      continue;
    }
    const receipts = await getReceipts(poolName as PoolName, address, false);
    if (poolName !== "ALPHA") {
      if (poolInfo[poolName].packageNumber === 9) {
        if (poolName === "NAVI-SUIBTC") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_pool_v2::get_user_rewards_all`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(getConf().ALPHA_NAVI_V2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      } else if (poolInfo[poolName].packageNumber == 8) {
        if (
          poolName === "BLUEFIN-SUIBTC-USDC" ||
          poolName === "BLUEFIN-LBTC-SUIBTC"
        ) {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_all`,
              typeArguments: [
                coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
                coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
              ],
              arguments: [
                txb.object(getConf().ALPHA_BLUEFIN_V2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      } else if (poolInfo[poolName].packageNumber == 5) {
        if (poolName == "NAVI-LOOP-USDT-USDC") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_usdt_usdc_pool::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_5_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolName == "ALPHALEND-LOOP-SUI-STSUI") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_sui_stsui_pool::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_5_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      } else if (
        poolInfo[poolName].packageNumber == 4 ||
        poolInfo[poolName].packageNumber == 6
      ) {
        if (poolInfo[poolName].parentProtocolName == "BLUEFIN") {
          const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
          const coinA = coinsList[coinAName];
          const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
          const coinB = coinsList[coinBName];
          if (
            poolName == "BLUEFIN-SUI-USDC" ||
            poolName === "BLUEFIN-SUI-BUCK" ||
            poolName === "BLUEFIN-SUI-AUSD"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_sui_first_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_4_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName == "BLUEFIN-USDT-USDC" ||
            poolName === "BLUEFIN-AUSD-USDC" ||
            poolName === "BLUEFIN-WBTC-USDC" ||
            poolName === "BLUEFIN-SEND-USDC" ||
            poolName === "BLUEFIN-SUIUSDT-USDC" ||
            poolName === "BLUEFIN-WAL-USDC"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_1_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_4_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName === "BLUEFIN-ALPHA-USDC" ||
            poolName === "BLUEFIN-NAVX-VSUI" ||
            poolName === "BLUEFIN-BLUE-USDC"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_type_2_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_4_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName === "BLUEFIN-BLUE-SUI" ||
            poolName === "BLUEFIN-WBTC-SUI" ||
            poolName === "BLUEFIN-DEEP-SUI"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_sui_second_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_4_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (poolName === "BLUEFIN-STSUI-SUI") {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_stsui_sui_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_4_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName === "BLUEFIN-STSUI-USDC" ||
            poolName === "BLUEFIN-STSUI-WSOL" ||
            poolName === "BLUEFIN-STSUI-ETH" ||
            poolName === "BLUEFIN-STSUI-BUCK" ||
            poolName === "BLUEFIN-STSUI-MUSD"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_stsui_first_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_STSUI_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName === "BLUEFIN-ALPHA-STSUI" ||
            poolName === "BLUEFIN-WAL-STSUI"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_bluefin_stsui_second_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().ALPHA_STSUI_VERSION),
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          }
        }
      } else if (poolInfo[poolName].packageNumber == 3) {
        if (poolInfo[poolName].parentProtocolName == "NAVI") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_pool_v2::get_user_rewards_all`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(getConf().ALPHA_3_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolName == "BUCKET-BUCK") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_bucket_pool_v1::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_3_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      } else if (poolInfo[poolName].packageNumber == 2) {
        if (poolName == "CETUS-SUI") {
          const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
          const coinA = coinsList[coinAName];
          const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
          const coinB = coinsList[coinBName];
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_cetus_sui_pool::get_user_rewards_all`,
              typeArguments: [coinA.type, coinB.type],
              arguments: [
                txb.object(getConf().ALPHA_2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolName == "NAVI-LOOP-SUI-VSUI") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_sui_vsui_pool::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolName == "NAVI-LOOP-USDC-USDT") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_native_usdc_usdt_pool::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolName == "NAVI-LOOP-HASUI-SUI") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_hasui_sui_pool::get_user_rewards_all`,
              arguments: [
                txb.object(getConf().ALPHA_2_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      } else {
        if (poolInfo[poolName].parentProtocolName == "CETUS") {
          const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
          const coinA = coinsList[coinAName];
          const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
          const coinB = coinsList[coinBName];

          if (coinBName == "SUI") {
            // txb.moveCall({
            //   target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_sui_pool::update_pool`,
            //   typeArguments: [coinA.type, coinB.type],
            //   arguments: [
            //     txb.object(getConf().VERSION),
            //     txb.object(poolInfo[poolName].poolId),
            //     txb.object(poolInfo[poolName].investorId),
            //     txb.object(getConf().ALPHA_DISTRIBUTOR),
            //     txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            //     txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
            //     txb.object(cetusPoolMap["CETUS-SUI"]),
            //     txb.object(cetusPoolMap[poolName]),
            //     txb.object(getConf().CLOCK_PACKAGE_ID),
            //   ],
            // });
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_cetus_sui_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (
            poolName == "WUSDC-WBTC" ||
            poolName == "USDC-USDT" ||
            poolName == "USDC-WUSDC" ||
            poolName == "USDC-ETH"
          ) {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_cetus_pool_base_a::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else {
            receipts.forEach((receipt) => {
              alpha_receipt = txb.moveCall({
                target: `${poolInfo[poolName].packageId}::alphafi_cetus_pool::get_user_rewards_all`,
                typeArguments: [coinA.type, coinB.type],
                arguments: [
                  txb.object(getConf().VERSION),
                  txb.object(receipt.objectId),
                  alpha_receipt,
                  txb.object(poolInfo[poolName].poolId),
                  txb.object(getConf().ALPHA_POOL),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
            // txb.moveCall({
            //   target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_pool::update_pool`,
            //   typeArguments: [coinA.type, coinB.type],
            //   arguments: [
            //     txb.object(getConf().VERSION),
            //     txb.object(poolInfo[poolName].poolId),
            //     txb.object(poolInfo[poolName].investorId),
            //     txb.object(getConf().ALPHA_DISTRIBUTOR),
            //     txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            //     txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
            //     txb.object(cetusPoolMap[`${coinBName}-SUI`]),
            //     txb.object(cetusPoolMap["CETUS-SUI"]),
            //     txb.object(cetusPoolMap[poolName]),
            //     txb.object(getConf().CLOCK_PACKAGE_ID),
            //   ],
            // });
          }
        } else if (poolInfo[poolName].parentProtocolName == "NAVI") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_navi_pool::get_user_rewards_all`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (poolInfo[poolName].parentProtocolName == "ALPHALEND") {
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_alphalend_single_loop_pool::get_user_rewards_all`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(getConf().ALPHA_ALPHALEND_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        } else if (
          poolInfo[poolName].strategyType === "LEVERAGE-YIELD-FARMING"
        ) {
          const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
          const coinA = coinsList[coinAName];
          const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
          const coinB = coinsList[coinBName];
          receipts.forEach((receipt) => {
            alpha_receipt = txb.moveCall({
              target: `${poolInfo[poolName].packageId}::alphafi_lyf_pool::get_user_rewards_all`,
              typeArguments: [coinA.type, coinB.type],
              arguments: [
                txb.object(getConf().ALPHA_LYF_VERSION),
                txb.object(getConf().VERSION),
                txb.object(receipt.objectId),
                alpha_receipt,
                txb.object(poolInfo[poolName].poolId),
                txb.object(getConf().ALPHA_POOL),
                txb.object(getConf().ALPHA_DISTRIBUTOR),
                txb.object(getConf().CLOCK_PACKAGE_ID),
              ],
            });
          });
        }
      }
    }
  }

  txb.moveCall({
    target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphapool::transfer_receipt_option`,
    arguments: [txb.object(getConf().VERSION), alpha_receipt],
  });

  return txb;
}

export async function collectAndSwapRewardsSingleLoop(
  poolName: PoolName,
  tx?: Transaction,
): Promise<Transaction> {
  const txb = tx ? tx : new Transaction();
  const C = getConf();
  const poolData = poolInfo[poolName];
  if (poolName === "ALPHALEND-SINGLE-LOOP-TBTC") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["ALPHA"].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(false),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["STSUI"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`STSUI-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["SUI"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-USDC-175`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["TBTC"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`TBTC-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-SUIBTC") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["ALPHA"].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(false),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI-175`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["SUI"].type,
        coinsList["SUIBTC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-SUIBTC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-XAUM") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["ALPHA"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["SUI"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-USDC-175`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_mmt`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["XAUM"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.MMT_XAUM_USDC_POOL),
        txb.object(C.MMT_VERSION),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.pure.u64(10),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-WBTC") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["WBTC-LayerZero"].type,
        coinsList["DEEP"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["WBTC-LayerZero"].type,
        coinsList["WBTC-LayerZero"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`WBTC-LayerZero-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-DEEP") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["DEEP"].type,
        coinsList["STSUI"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`STSUI-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["DEEP"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI-175`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-WAL") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["WAL"].type,
        coinsList["STSUI"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`STSUI-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["WAL"].type,
        coinsList["WAL"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`WAL-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
}

export async function collectAndSwapRewardsLyf(
  poolname: PoolName,
  tx?: Transaction,
): Promise<Transaction> {
  const txb = tx ? tx : new Transaction();
  const pool = poolInfo[poolname];
  const coin1 = doubleAssetPoolCoinMap[poolname].coin1;
  const coin2 = doubleAssetPoolCoinMap[poolname].coin2;
  if (pool.strategyType === "LEVERAGE-YIELD-FARMING") {
    if (poolname === "BLUEFIN-LYF-STSUI-SUI") {
      txb.moveCall({
        target: `${pool.packageId}::alphafi_lyf_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_LYF_VERSION),
          txb.object(pool.poolId),
          txb.object(getConf().LENDING_PROTOCOL_ID),
          txb.object(pool.parentPoolId),
          txb.object(bluefinPoolMap["BLUE-SUI"]),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(true),
          txb.pure.bool(true),
          txb.pure.bool(true),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_lyf_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_LYF_VERSION),
          txb.object(pool.poolId),
          txb.object(getConf().LENDING_PROTOCOL_ID),
          txb.object(pool.parentPoolId),
          txb.object(bluefinPoolMap["BLUE-SUI"]),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(true),
          txb.pure.bool(true),
          txb.pure.bool(false),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${pool.packageId}::alphafi_lyf_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [
          coinsList[coin1].type,
          coinsList[coin2].type,
          coinsList["ALPHA"].type,
          coinsList["STSUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_LYF_VERSION),
          txb.object(pool.poolId),
          txb.object(getConf().LENDING_PROTOCOL_ID),
          txb.object(pool.parentPoolId),
          txb.object(bluefinPoolMap["ALPHA-STSUI"]),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(true),
          txb.pure.bool(true),
          txb.pure.bool(false),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  }
  return txb;
}
export async function collectRewardsAndSwapSlush(
  poolName: PoolName,
  tx?: Transaction,
) {
  const txb = tx ? tx : new Transaction();
  const C = getConf();
  const poolData = poolInfo[poolName];
  const coinName = singleAssetPoolCoinMap[poolName].coin;
  const coinType = coinsList[coinName].type;
  if (poolName === "ALPHALEND-SLUSH-STSUI-LOOP") {
    txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphafi_slush_stsui_sui_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [coinsList["BLUE"].type, coinsList["SUI"].type],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(poolData.poolId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap["BLUE-SUI"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphafi_slush_stsui_sui_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [coinsList["STSUI"].type, coinsList["SUI"].type],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(poolData.poolId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap["STSUI-SUI-ZERO-ZERO"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(false),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else {
    txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinType,
        coinsList["ALPHA"].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(poolData.poolId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap["ALPHA-STSUI"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [coinType, coinsList["STSUI"].type, coinsList["SUI"].type],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(poolData.poolId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap["STSUI-SUI"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [coinType, coinsList["BLUE"].type, coinsList["SUI"].type],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(poolData.poolId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap["BLUE-SUI"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });

    if (coinType !== coinsList["DEEP"].type) {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [
          coinType,
          coinsList["DEEP"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(poolData.poolId),
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(bluefinPoolMap["DEEP-SUI"]),
          txb.object(C.BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(true),
          txb.pure.bool(true),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    }

    if (coinType === coinsList["USDC"].type) {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [coinType, coinsList["SUI"].type, coinType],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(poolData.poolId),
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(bluefinPoolMap["SUI-USDC"]),
          txb.object(C.BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(true),
          txb.pure.bool(false),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (coinType === coinsList["WAL"].type) {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [coinType, coinsList["WAL"].type, coinsList["SUI"].type],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(poolData.poolId),
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(bluefinPoolMap["WAL-SUI"]),
          txb.object(C.BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(false),
          txb.pure.bool(true),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (coinType === coinsList["DEEP"].type) {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::collect_reward_and_swap_bluefin`,
        typeArguments: [
          coinType,
          coinsList["DEEP"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(poolData.poolId),
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(bluefinPoolMap["DEEP-SUI"]),
          txb.object(C.BLUEFIN_GLOBAL_CONFIG),
          txb.pure.bool(false),
          txb.pure.bool(true),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    }
  }

  return txb;
}
