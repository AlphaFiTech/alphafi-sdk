import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { coinsList } from "../common/coins.js";
import { getConf } from "../common/constants.js";
import {
  cetusPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../common/maps.js";
import { PoolName, Receipt } from "../common/types.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { getAmounts } from "./cetus.js";
import { getSuiClient } from "../sui-sdk/client.js";

export const depositBluefinSuiFirstTxb = async (
  amount: string,
  poolName: PoolName,
  isAmountA: boolean,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
): Promise<Transaction> => {
  const suiClient = getSuiClient();
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  let coins1: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool2].type,
      cursor: currentCursor,
    });

    coins1 = coins1.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  const amounts = await getAmounts(poolName, isAmountA, amount);
  if (amounts) {
    const amount1 = amounts[0];
    const amount2 = amounts[1];

    let coin1: any;
    if (coins1.length >= 1) {
      //coin1
      [coin1] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin1,
        coins1.map((c) => c.coinObjectId),
      );
      const [depositCoinB] = txb.splitCoins(coin1, [amount2]);

      //coin2
      const [depositCoinA] = txb.splitCoins(txb.gas, [amount1]);
      const poolinfo = poolInfo[poolName];
      let someReceipt: any;
      if (receipt.length == 0) {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::none`,
          typeArguments: [poolinfo.receiptType],
          arguments: [],
        });
      } else {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::some`,
          typeArguments: [receipt[0].content.type],
          arguments: [txb.object(receipt[0].objectId)],
        });
      }

      if (poolName === "BLUEFIN-SUI-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-SUI-BUCK") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_SUI_BUCK_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["BUCK-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-SUI-AUSD") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_SUI_AUSD_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["AUSD-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      }

      txb.transferObjects([coin1], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const depositBluefinSuiSecondTxb = async (
  amount: string,
  poolName: PoolName,
  isAmountA: boolean,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
): Promise<Transaction> => {
  const suiClient = getSuiClient();
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  let coins1: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool1].type,
      cursor: currentCursor,
    });

    coins1 = coins1.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  const amounts = await getAmounts(poolName, isAmountA, amount);
  if (amounts) {
    const amount1 = amounts[0];
    const amount2 = amounts[1];

    let coin1: any;
    if (coins1.length >= 1) {
      //coin1
      [coin1] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin1,
        coins1.map((c) => c.coinObjectId),
      );
      const [depositCoinA] = txb.splitCoins(coin1, [amount1]);

      //coin2
      const [depositCoinB] = txb.splitCoins(txb.gas, [amount2]);
      const poolinfo = poolInfo[poolName];
      let someReceipt: any;
      if (receipt.length == 0) {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::none`,
          typeArguments: [poolinfo.receiptType],
          arguments: [],
        });
      } else {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::some`,
          typeArguments: [receipt[0].content.type],
          arguments: [txb.object(receipt[0].objectId)],
        });
      }

      if (poolName === "BLUEFIN-BLUE-SUI") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["DEEP"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
            txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
            txb.object(cetusPoolMap["BLUE-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-WBTC-SUI") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_WBTC_SUI_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
            txb.object(cetusPoolMap["WBTC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-DEEP-SUI") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
            txb.object(cetusPoolMap["DEEP-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      }

      txb.transferObjects([coin1], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const depositBluefinType1Txb = async (
  amount: string,
  poolName: PoolName,
  isAmountA: boolean,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
): Promise<Transaction> => {
  const suiClient = getSuiClient();
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  let coins1: CoinStruct[] = [];
  let coins2: CoinStruct[] = [];
  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool1].type,
      cursor: currentCursor,
    });

    coins1 = coins1.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  currentCursor = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool2].type,
      cursor: currentCursor,
    });

    coins2 = coins2.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  const amounts = await getAmounts(poolName, isAmountA, amount);
  if (amounts) {
    const amount1 = amounts[0];
    const amount2 = amounts[1];

    let coin1: any;
    let coin2: any;
    if (coins1.length >= 1 && coins2.length >= 1) {
      //coin1
      [coin1] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin1,
        coins1.map((c) => c.coinObjectId),
      );
      const [depositCoinA] = txb.splitCoins(coin1, [amount1]);

      //coin2
      [coin2] = txb.splitCoins(txb.object(coins2[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin2,
        coins2.map((c) => c.coinObjectId),
      );
      const [depositCoinB] = txb.splitCoins(coin2, [amount2]);
      const poolinfo = poolInfo[poolName];
      let someReceipt: any;
      if (receipt.length == 0) {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::none`,
          typeArguments: [poolinfo.receiptType],
          arguments: [],
        });
      } else {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::some`,
          typeArguments: [receipt[0].content.type],
          arguments: [txb.object(receipt[0].objectId)],
        });
      }

      if (poolName === "BLUEFIN-USDT-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["USDC-USDT"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-AUSD-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_AUSD_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["USDC-AUSD"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-WBTC-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_WBTC_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["USDC-WBTC"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-SEND-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_SEND_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["USDC-SEND"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      }

      txb.transferObjects([coin1], address);
      txb.transferObjects([coin2], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const depositBluefinType2Txb = async (
  amount: string,
  poolName: PoolName,
  isAmountA: boolean,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
): Promise<Transaction> => {
  const suiClient = getSuiClient();
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  let coins1: CoinStruct[] = [];
  let coins2: CoinStruct[] = [];
  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool1].type,
      cursor: currentCursor,
    });

    coins1 = coins1.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  currentCursor = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[pool2].type,
      cursor: currentCursor,
    });

    coins2 = coins2.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  const amounts = await getAmounts(poolName, isAmountA, amount);
  if (amounts) {
    const amount1 = amounts[0];
    const amount2 = amounts[1];

    let coin1: any;
    let coin2: any;
    if (coins1.length >= 1 && coins2.length >= 1) {
      //coin1
      [coin1] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin1,
        coins1.map((c) => c.coinObjectId),
      );
      const [depositCoinA] = txb.splitCoins(coin1, [amount1]);

      //coin2
      [coin2] = txb.splitCoins(txb.object(coins2[0].coinObjectId), [0]);
      txb.mergeCoins(
        coin2,
        coins2.map((c) => c.coinObjectId),
      );
      const [depositCoinB] = txb.splitCoins(coin2, [amount2]);
      const poolinfo = poolInfo[poolName];
      let someReceipt: any;
      if (receipt.length == 0) {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::none`,
          typeArguments: [poolinfo.receiptType],
          arguments: [],
        });
      } else {
        [someReceipt] = txb.moveCall({
          target: `0x1::option::some`,
          typeArguments: [receipt[0].content.type],
          arguments: [txb.object(receipt[0].objectId)],
        });
      }

      if (poolName === "BLUEFIN-ALPHA-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_ALPHA_USDC_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["ALPHA-USDC"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-NAVX-VSUI") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["BLUE"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_NAVX_VSUI_POOL),
            txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
            txb.object(cetusPoolMap["NAVX-VSUI"]),
            txb.object(cetusPoolMap["VSUI-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      } else if (poolName === "BLUEFIN-BLUE-USDC") {
        txb.moveCall({
          target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit`,
          typeArguments: [
            coinsList[pool1].type,
            coinsList[pool2].type,
            coinsList["DEEP"].type,
            coinsList["SUI"].type,
          ],
          arguments: [
            txb.object(getConf().ALPHA_4_VERSION),
            txb.object(getConf().VERSION),
            someReceipt,
            txb.object(poolinfo.poolId),
            depositCoinA,
            depositCoinB,
            txb.object(getConf().ALPHA_DISTRIBUTOR),
            txb.object(poolinfo.investorId),
            txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
            txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
            txb.object(getConf().BLUEFIN_BLUE_USDC_POOL),
            txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
            txb.object(cetusPoolMap["BLUE-USDC"]),
            txb.object(cetusPoolMap["USDC-SUI"]),
            txb.object(getConf().CLOCK_PACKAGE_ID),
          ],
        });
      }

      txb.transferObjects([coin1], address);
      txb.transferObjects([coin2], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const withdrawBluefinSuiFirstTxb = async (
  xTokens: string,
  poolName: PoolName,
  options: { address: string },
) => {
  const address = options.address;
  const txb = new Transaction();
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  if (receipt.length > 0) {
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
    const poolinfo = poolInfo[poolName];
    if (poolName === "BLUEFIN-SUI-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-SUI-BUCK") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUI_BUCK_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["BUCK-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-SUI-AUSD") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUI_AUSD_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["AUSD-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export const withdrawBluefinSuiSecondTxb = async (
  xTokens: string,
  poolName: PoolName,
  options: { address: string },
) => {
  const address = options.address;
  const txb = new Transaction();
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  if (receipt.length > 0) {
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
    const poolinfo = poolInfo[poolName];
    if (poolName === "BLUEFIN-BLUE-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["DEEP"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
          txb.object(cetusPoolMap["BLUE-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-WBTC-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_WBTC_SUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["WBTC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-DEEP-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["DEEP-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export const withdrawBluefinType1Txb = async (
  xTokens: string,
  poolName: PoolName,
  options: { address: string },
) => {
  const address = options.address;
  const txb = new Transaction();
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  if (receipt.length > 0) {
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
    const poolinfo = poolInfo[poolName];
    if (poolName === "BLUEFIN-USDT-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-USDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUSD-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_AUSD_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-AUSD"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-WBTC-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_WBTC_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-WBTC"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-SEND-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SEND_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["USDC-SEND"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export const withdrawBluefinType2Txb = async (
  xTokens: string,
  poolName: PoolName,
  options: { address: string },
) => {
  const address = options.address;
  const txb = new Transaction();
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt: Receipt[] = await getReceipts(poolName, address, true);
  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  if (receipt.length > 0) {
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
    const poolinfo = poolInfo[poolName];
    if (poolName === "BLUEFIN-ALPHA-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_ALPHA_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["ALPHA-USDC"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-NAVX-VSUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_NAVX_VSUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
          txb.object(cetusPoolMap["NAVX-VSUI"]),
          txb.object(cetusPoolMap["VSUI-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-BLUE-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_withdraw`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["DEEP"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_4_VERSION),
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_BLUE_USDC_POOL),
          txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
          txb.object(cetusPoolMap["BLUE-USDC"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};
