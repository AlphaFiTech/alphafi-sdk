import { Transaction } from "@mysten/sui/transactions";
import {
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
  const alphaReceipt = await getReceipts("ALPHA", address, false);
  let alpha_receipt: any;
  if (alphaReceipt.length == 0) {
    [alpha_receipt] = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [getConf().ALPHA_POOL_RECEIPT],
      arguments: [],
    });
  } else {
    [alpha_receipt] = txb.moveCall({
      target: `0x1::option::some`,
      typeArguments: [alphaReceipt[0].content.type],
      arguments: [txb.object(alphaReceipt[0].objectId)],
    });
  }
  const keys = Object.keys(poolInfo);
  for (const poolName of keys) {
    if (poolInfo[poolName].poolId == "") {
      continue;
    }
    const receipts = await getReceipts(poolName as PoolName, address, false);
    if (poolName == "ALPHA") {
    } else {
      if (poolInfo[poolName].packageNumber == 5) {
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
            poolName === "BLUEFIN-SUIUSDT-USDC"
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
                  txb.object(getConf().ALPHA_DISTRIBUTOR),
                  txb.object(getConf().CLOCK_PACKAGE_ID),
                ],
              });
            });
          } else if (poolName === "BLUEFIN-ALPHA-STSUI") {
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                  txb.object(poolInfo["ALPHA"].poolId),
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
                txb.object(poolInfo["ALPHA"].poolId),
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
