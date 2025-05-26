import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { coinsList } from "../common/coins.js";
import {
  bluefinPoolMap,
  cetusPoolMap,
  loopingAccountAddresses,
  naviAssetMap,
  naviPriceFeedMap,
  poolInfo,
  singleAssetPoolCoinMap,
} from "../common/maps.js";
import { PoolName, Receipt } from "../common/types.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { getConf } from "../common/constants.js";
import { getSuiClient } from "../sui-sdk/client.js";
import { updateSingleTokenPrice } from "./naviOracle.js";
import { getAvailableRewards } from "navi-sdk/dist/libs/PTB/V3.js";
// import { getAvailableRewards } from "navi-sdk";

export async function naviDepositTx(
  amount: string,
  poolName: PoolName,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  updateSingleTokenPrice(
    naviPriceFeedMap[singleAssetPoolCoinMap[poolName].coin].pythPriceInfo,
    naviPriceFeedMap[singleAssetPoolCoinMap[poolName].coin].feedId,
    txb,
  );
  if (singleAssetPoolCoinMap[poolName].coin == "SUI") {
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
      getSuiClient(),
      getConf().NAVI_SUI_ACCOUNT_ADDRESS,
    );
    if (claimableRewards) {
      for (const reward of claimableRewards[
        coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
      ]
        ? claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
        : []) {
        if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
          txb.moveCall({
            target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_one_swap`,
            typeArguments: [
              coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              coinsList["NAVX"].type,
            ],
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.pure.u8(
                Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
              ),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_NAVX_REWARDS_POOL),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              txb.object(cetusPoolMap["NAVX-SUI"]),
            ],
          });
        } else if (
          reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
        ) {
          txb.moveCall({
            target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_one_swap`,
            typeArguments: [
              coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              coinsList["VSUI"].type,
            ],
            arguments: [
              txb.object(poolData.investorId),
              txb.object(C.VERSION),
              txb.object(C.CLOCK_PACKAGE_ID),
              txb.object(C.NAVI_STORAGE),
              txb.pure.u8(
                Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
              ),
              txb.object(C.NAVI_INCENTIVE_V3),
              txb.object(C.NAVI_VSUI_REWARDS_POOL),
              txb.object(cetusPoolMap["VSUI-SUI"]),
              txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            ],
          });
        }
      }
    }
    txb.moveCall({
      target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
      typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
      arguments: [
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(poolData.parentPoolId),
        txb.pure.u8(
          Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
        ),
        txb.object(C.NAVI_INCENTIVE_V3),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else {
    let coins: CoinStruct[] = [];

    let currentCursor: string | null | undefined = null;

    do {
      const response = await suiClient.getCoins({
        owner: address,
        coinType: coinsList[singleAssetPoolCoinMap[poolName].coin].type,
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

      if (singleAssetPoolCoinMap[poolName].coin == "VSUI") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_VSUI_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : []) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (
        singleAssetPoolCoinMap[poolName].coin == "WETH" ||
        singleAssetPoolCoinMap[poolName].coin == "USDT"
      ) {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : []) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["WUSDC"].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(cetusPoolMap["WUSDC-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["WUSDC"].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(cetusPoolMap["WUSDC-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (singleAssetPoolCoinMap[poolName].coin == "WUSDC") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : []) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["CETUS"].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(cetusPoolMap["CETUS-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-CETUS`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["CETUS"].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(cetusPoolMap["CETUS-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-CETUS`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (singleAssetPoolCoinMap[poolName].coin == "USDC") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : []) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["BUCK"].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(cetusPoolMap["BUCK-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-BUCK`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["BUCK"].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(cetusPoolMap["BUCK-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-BUCK`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (singleAssetPoolCoinMap[poolName].coin == "USDY") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : []) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["WUSDC"].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(cetusPoolMap["WUSDC-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["WUSDC"].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(poolData.investorId),
                  txb.object(C.VERSION),
                  txb.object(C.CLOCK_PACKAGE_ID),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(cetusPoolMap["WUSDC-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                    ],
                  ),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (
        singleAssetPoolCoinMap[poolName].coin == "AUSD" ||
        singleAssetPoolCoinMap[poolName].coin == "ETH"
      ) {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_three_swaps`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["USDC"].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(
              cetusPoolMap[`USDC-${singleAssetPoolCoinMap[poolName].coin}`],
            ),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "NAVI-NS") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_NS_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["NAVX-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["DEEP"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["DEEP"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_DEEP_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["DEEP-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["NS"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NS_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.NAVI_NS_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["NS-SUI"]),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "NAVI-NAVX") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_NAVX_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.NAVI_NAVX_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["NAVX-SUI"]),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "NAVI-STSUI") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_STSUI_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["STSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${poolData.packageId}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [coinsList["STSUI"].type],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_STSUI_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.NAVI_STSUI_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["STSUI-SUI"]),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "NAVI-SUIBTC") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_SUIBTC_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["NAVX"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_NAVI_V2_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                  txb.object(bluefinPoolMap["NAVX-SUI"]),
                  txb.object(
                    bluefinPoolMap[
                      `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["DEEP"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["DEEP"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_NAVI_V2_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_DEEP_REWARDS_POOL),
                  txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                  txb.object(bluefinPoolMap["DEEP-SUI"]),
                  txb.object(
                    bluefinPoolMap[
                      `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_NAVI_V2_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                  txb.object(bluefinPoolMap["VSUI-SUI"]),
                  txb.object(
                    bluefinPoolMap[
                      `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["VSUI"].type,
            coinsList["NAVX"].type,
            coinsList["DEEP"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_NAVI_V2_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.CLOCK_PACKAGE_ID),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.NAVI_NAVX_FUNDS_POOL),
            txb.object(C.NAVI_DEEP_FUNDS_POOL),
            txb.object(bluefinPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["NAVX-SUI"]),
            txb.object(bluefinPoolMap["DEEP-SUI"]),
            txb.object(bluefinPoolMap["SUI-SUIBTC"]),
            txb.object(C.BLUEFIN_GLOBAL_CONFIG),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit_v2`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_NAVI_V2_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "NAVI-SUIUSDT") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          getConf().NAVI_SUIUSDT_ACCOUNT_ADDRESS,
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["NAVX"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_NAVX_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                  txb.object(cetusPoolMap["VSUI-SUI"]),
                  txb.object(
                    cetusPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_three_swaps`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["USDC"].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(poolData.poolId),
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(
              cetusPoolMap[`USDC-${singleAssetPoolCoinMap[poolName].coin}`],
            ),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (singleAssetPoolCoinMap[poolName].coin == "WAL") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]
            ? claimableRewards[
                coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(
                  2,
                )
              ]
            : [
                { reward_coin_type: coinsList["WAL"].type.substring(2) },
                { reward_coin_type: coinsList["VSUI"].type.substring(2) },
              ]) {
            if (
              reward.reward_coin_type === coinsList["WAL"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_WAL_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                  txb.object(bluefinPoolMap["VSUI-SUI"]),
                  txb.object(
                    bluefinPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else if (singleAssetPoolCoinMap[poolName].coin == "DEEP") {
        const claimableRewards = await getAvailableRewards(
          getSuiClient(),
          loopingAccountAddresses[poolName],
        );
        if (claimableRewards) {
          for (const reward of claimableRewards[
            coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
          ]) {
            if (
              reward.reward_coin_type === coinsList["DEEP"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_DEEP_REWARDS_POOL),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            } else if (
              reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
            ) {
              txb.moveCall({
                target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
                typeArguments: [
                  coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                  coinsList["SUI"].type,
                  coinsList["VSUI"].type,
                ],
                arguments: [
                  txb.object(C.ALPHA_3_VERSION),
                  txb.object(poolData.investorId),
                  txb.object(C.NAVI_STORAGE),
                  txb.pure.u8(
                    Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                  ),
                  txb.object(C.NAVI_INCENTIVE_V3),
                  txb.object(C.NAVI_VSUI_REWARDS_POOL),
                  txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                  txb.object(bluefinPoolMap["VSUI-SUI"]),
                  txb.object(
                    bluefinPoolMap[
                      `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                    ],
                  ),
                  txb.object(C.CLOCK_PACKAGE_ID),
                ],
              });
            }
          }
        }
        txb.moveCall({
          target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_deposit`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          ],
          arguments: [
            txb.object(C.ALPHA_3_VERSION),
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V3),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      } else {
        txb.moveCall({
          target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_deposit_with_two_swaps`,
          typeArguments: [
            coinsList[singleAssetPoolCoinMap[poolName].coin].type,
            coinsList["SUI"].type,
            coinsList["VSUI"].type,
          ],
          arguments: [
            txb.object(C.VERSION),
            someReceipt,
            txb.object(poolData.poolId),
            depositCoin,
            txb.object(poolData.investorId),
            txb.object(C.ALPHA_DISTRIBUTOR),
            txb.object(C.PRICE_ORACLE),
            txb.object(C.NAVI_STORAGE),
            txb.object(poolData.parentPoolId),
            txb.pure.u8(
              Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
            ),
            txb.object(C.NAVI_INCENTIVE_V1),
            txb.object(C.NAVI_INCENTIVE_V2),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.NAVI_VSUI_FUNDS_POOL),
            txb.object(C.CETUS_GLOBAL_CONFIG_ID),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(
              cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
            ),
            txb.object(C.CLOCK_PACKAGE_ID),
          ],
        });
      }
      txb.transferObjects([coin], address);
    } else {
      throw new Error(`No ${singleAssetPoolCoinMap[poolName].coin} Coins`);
    }
  }

  return txb;
}

export async function naviWithdrawTx(
  xTokens: string,
  poolName: PoolName,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(poolName, address, true);

  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  if (receipt.length > 0) {
    let alpha_receipt: any;
    if (alphaReceipt.length == 0) {
      [alpha_receipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [C.ALPHA_POOL_RECEIPT],
        arguments: [],
      });
    } else {
      [alpha_receipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [alphaReceipt[0].content.type],
        arguments: [txb.object(alphaReceipt[0].objectId)],
      });
    }

    updateSingleTokenPrice(
      naviPriceFeedMap[singleAssetPoolCoinMap[poolName].coin].pythPriceInfo,
      naviPriceFeedMap[singleAssetPoolCoinMap[poolName].coin].feedId,
      txb,
    );
    if (singleAssetPoolCoinMap[poolName].coin == "SUI") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_SUI_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]
          ? claimableRewards[
              coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
            ]
          : []) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_one_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_one_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "VSUI") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_VSUI_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]
          ? claimableRewards[
              coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
            ]
          : []) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (
      singleAssetPoolCoinMap[poolName].coin == "WETH" ||
      singleAssetPoolCoinMap[poolName].coin == "USDT"
    ) {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["WUSDC"].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(cetusPoolMap["WUSDC-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["WUSDC"].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(cetusPoolMap["WUSDC-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "WUSDC") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]
          ? claimableRewards[
              coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
            ]
          : []) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["CETUS"].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(cetusPoolMap["CETUS-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-CETUS`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["CETUS"].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(cetusPoolMap["CETUS-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-CETUS`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "USDC") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]
          ? claimableRewards[
              coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
            ]
          : []) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["BUCK"].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(cetusPoolMap["BUCK-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-BUCK`],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["BUCK"].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(cetusPoolMap["BUCK-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-BUCK`],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "USDY") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["WUSDC"].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(cetusPoolMap["WUSDC-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_investor::collect_v3_rewards_with_three_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["WUSDC"].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(poolData.investorId),
                txb.object(C.VERSION),
                txb.object(C.CLOCK_PACKAGE_ID),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(cetusPoolMap["WUSDC-SUI"]),
                txb.object(
                  cetusPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-WUSDC`
                  ],
                ),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (
      singleAssetPoolCoinMap[poolName].coin == "AUSD" ||
      singleAssetPoolCoinMap[poolName].coin == "ETH"
    ) {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_three_swaps`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(
            cetusPoolMap[`USDC-${singleAssetPoolCoinMap[poolName].coin}`],
          ),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "NAVI-NS") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_NS_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["NAVX-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["DEEP"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["DEEP"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_DEEP_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["DEEP-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["NS"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NS_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.NAVI_NS_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["NS-SUI"]),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "NAVI-NAVX") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_NAVX_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.NAVI_NAVX_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["NAVX-SUI"]),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "NAVI-STSUI") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_STSUI_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["STSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${poolData.packageId}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [coinsList["STSUI"].type],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_STSUI_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_two_swaps_v2`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.NAVI_STSUI_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["STSUI-SUI"]),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "NAVI-SUIBTC") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_SUIBTC_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["NAVX"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_NAVI_V2_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(bluefinPoolMap["NAVX-SUI"]),
                txb.object(
                  bluefinPoolMap[
                    `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                  ],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["DEEP"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["DEEP"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_NAVI_V2_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_DEEP_REWARDS_POOL),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(bluefinPoolMap["DEEP-SUI"]),
                txb.object(
                  bluefinPoolMap[
                    `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                  ],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_NAVI_V2_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(bluefinPoolMap["VSUI-SUI"]),
                txb.object(
                  bluefinPoolMap[
                    `SUI-${singleAssetPoolCoinMap[poolName].coin}`
                  ],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["VSUI"].type,
          coinsList["NAVX"].type,
          coinsList["DEEP"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_NAVI_V2_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.CLOCK_PACKAGE_ID),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.NAVI_NAVX_FUNDS_POOL),
          txb.object(C.NAVI_DEEP_FUNDS_POOL),
          txb.object(bluefinPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["NAVX-SUI"]),
          txb.object(bluefinPoolMap["DEEP-SUI"]),
          txb.object(bluefinPoolMap["SUI-SUIBTC"]),
          txb.object(C.BLUEFIN_GLOBAL_CONFIG),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        ],
      });
      txb.moveCall({
        target: `${C.ALPHA_NAVI_V2_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw_v2`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_NAVI_V2_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "NAVI-SUIUSDT") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        getConf().NAVI_SUIUSDT_ACCOUNT_ADDRESS,
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["NAVX"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_NAVX_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.CETUS_GLOBAL_CONFIG_ID),
                txb.object(cetusPoolMap["VSUI-SUI"]),
                txb.object(
                  cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::update_pool_with_three_swaps`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["USDC"].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
          txb.object(poolData.poolId),
          txb.object(poolData.investorId),
          txb.object(C.ALPHA_DISTRIBUTOR),
          txb.object(C.PRICE_ORACLE),
          txb.object(C.NAVI_STORAGE),
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(
            cetusPoolMap[`USDC-${singleAssetPoolCoinMap[poolName].coin}`],
          ),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });

      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "WAL") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]
          ? claimableRewards[
              coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
            ]
          : [
              { reward_coin_type: coinsList["WAL"].type.substring(2) },
              { reward_coin_type: coinsList["VSUI"].type.substring(2) },
            ]) {
          if (reward.reward_coin_type === coinsList["WAL"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_WAL_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(bluefinPoolMap["VSUI-SUI"]),
                txb.object(
                  bluefinPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                  ],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else if (singleAssetPoolCoinMap[poolName].coin == "DEEP") {
      const claimableRewards = await getAvailableRewards(
        getSuiClient(),
        loopingAccountAddresses[poolName],
      );
      if (claimableRewards) {
        for (const reward of claimableRewards[
          coinsList[singleAssetPoolCoinMap[poolName].coin].type.substring(2)
        ]) {
          if (reward.reward_coin_type === coinsList["DEEP"].type.substring(2)) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_no_swap`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_DEEP_REWARDS_POOL),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          } else if (
            reward.reward_coin_type === coinsList["VSUI"].type.substring(2)
          ) {
            txb.moveCall({
              target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::collect_reward_with_two_swaps_bluefin`,
              typeArguments: [
                coinsList[singleAssetPoolCoinMap[poolName].coin].type,
                coinsList["SUI"].type,
                coinsList["VSUI"].type,
              ],
              arguments: [
                txb.object(C.ALPHA_3_VERSION),
                txb.object(poolData.investorId),
                txb.object(C.NAVI_STORAGE),
                txb.pure.u8(
                  Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
                ),
                txb.object(C.NAVI_INCENTIVE_V3),
                txb.object(C.NAVI_VSUI_REWARDS_POOL),
                txb.object(C.BLUEFIN_GLOBAL_CONFIG),
                txb.object(bluefinPoolMap["VSUI-SUI"]),
                txb.object(
                  bluefinPoolMap[
                    `${singleAssetPoolCoinMap[poolName].coin}-SUI`
                  ],
                ),
                txb.object(C.CLOCK_PACKAGE_ID),
              ],
            });
          }
        }
      }
      txb.moveCall({
        target: `${C.ALPHA_3_LATEST_PACKAGE_ID}::alphafi_navi_pool_v2::user_withdraw`,
        typeArguments: [coinsList[singleAssetPoolCoinMap[poolName].coin].type],
        arguments: [
          txb.object(C.ALPHA_3_VERSION),
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V3),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    } else {
      txb.moveCall({
        target: `${C.ALPHA_LATEST_PACKAGE_ID}::alphafi_navi_pool::user_withdraw_with_two_swaps`,
        typeArguments: [
          coinsList[singleAssetPoolCoinMap[poolName].coin].type,
          coinsList["SUI"].type,
          coinsList["VSUI"].type,
        ],
        arguments: [
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
          txb.object(poolData.parentPoolId),
          txb.pure.u8(
            Number(naviAssetMap[singleAssetPoolCoinMap[poolName].coin]),
          ),
          txb.object(C.NAVI_INCENTIVE_V1),
          txb.object(C.NAVI_INCENTIVE_V2),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.NAVI_VSUI_FUNDS_POOL),
          txb.object(C.CETUS_GLOBAL_CONFIG_ID),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(
            cetusPoolMap[`${singleAssetPoolCoinMap[poolName].coin}-SUI`],
          ),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error(`No ${poolName} Receipt`);
  }

  return txb;
}
