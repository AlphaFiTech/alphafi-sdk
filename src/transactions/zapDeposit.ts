import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import BN from "bn.js";
import { CoinStruct } from "@mysten/sui/client";
import { CoinName, PoolName, SwapOptions } from "../common/types.js";
import { getSuiClient } from "../sui-sdk/client.js";
import {
  cetusPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../common/maps.js";
import { coinsList } from "../common/coins.js";
import { getAmounts } from "./deposit.js";
import { SevenKGateway } from "./7k.js";
import { getConf } from "../common/constants.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { getLatestPrices } from "../utils/prices.js";
import { PythPriceIdPair } from "../common/pyth.js";

export async function zapDepositTxb(
  inputCoinName: CoinName,
  inputCoinAmount: number,
  poolName: PoolName,
  slippage: number, // 0.01 --> 1%, 0.001 --> 0.1%
  options: { address: string },
): Promise<Transaction | undefined> {
  let txb = new Transaction();
  const suiClient = getSuiClient();
  const address = options.address;
  const coinTypeA = doubleAssetPoolCoinMap[poolName].coin1;
  const coinTypeB = doubleAssetPoolCoinMap[poolName].coin2;
  const swapObjectA = coinsList[coinTypeA];
  const swapObjectB = coinsList[coinTypeB];
  const inputObject = coinsList[inputCoinName];

  let coin1, coin2;

  const amounts = await getAmounts(poolName, true, "100000001");
  if (amounts) {
    const amount1 = Number(amounts[0]);
    const amount2 = Number(amounts[1]);

    const swapGateway = new SevenKGateway();
    const swapOptions: SwapOptions = {
      pair: {
        coinA: swapObjectA,
        coinB: swapObjectB,
      },
      senderAddress: address,
      inAmount: new BN(amount1),
      slippage: slippage,
    };

    const ratioQuote = await swapGateway.getQuote(swapOptions);
    if (ratioQuote) {
      const amount1InCoinType2 = Number(ratioQuote.returnAmountWithDecimal);
      const totalAmount = amount2 + amount1InCoinType2;

      const inputAmountToType1 = Math.floor(
        (inputCoinAmount * amount1InCoinType2) / totalAmount,
      );
      const inputAmountToType2 = Math.floor(
        (inputCoinAmount * amount2) / totalAmount,
      );

      let amountA, amountB;
      const swapOptionsI2A = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectA,
        },
        senderAddress: address,
        inAmount: new BN(inputAmountToType1),
        slippage: slippage,
      };
      const swapOptionsI2B = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectB,
        },
        senderAddress: address,
        inAmount: new BN(inputAmountToType2),
        slippage: slippage,
      };
      if (inputCoinName === coinTypeA) {
        const quoteResponse = await swapGateway.getQuote(swapOptionsI2B);
        if (quoteResponse) {
          amountB = quoteResponse.returnAmountWithDecimal;
          const result = await swapGateway.getTransactionBlock(
            swapOptionsI2B,
            quoteResponse,
            txb,
          );
          txb = result.tx;
          if (result.coinOut) {
            coin2 = result.coinOut;
          }
        }
        amountA = inputAmountToType1.toString();
        if (coinTypeA === "SUI") {
          [coin1] = txb.splitCoins(txb.gas, [amountA]);
        } else {
          let currentCursor: string | null | undefined = null;
          let coins1: CoinStruct[] = [];
          do {
            const response = await suiClient.getCoins({
              owner: address,
              coinType: coinsList[coinTypeA].type,
              cursor: currentCursor,
            });
            coins1 = coins1.concat(response.data);
            if (response.hasNextPage && response.nextCursor) {
              currentCursor = response.nextCursor;
            } else break;
          } while (true);
          [coin1] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
          txb.mergeCoins(
            coin1,
            coins1.map((c) => c.coinObjectId),
          );
        }
      } else if (inputCoinName === coinTypeB) {
        const quoteResponse = await swapGateway.getQuote(swapOptionsI2A);
        if (quoteResponse) {
          amountA = quoteResponse.returnAmountWithDecimal;
          const result = await swapGateway.getTransactionBlock(
            swapOptionsI2A,
            quoteResponse,
            txb,
          );
          txb = result.tx;
          if (result.coinOut) {
            coin1 = result.coinOut;
          }
        }
        amountB = inputAmountToType2.toString();
        if (coinTypeB === "SUI") {
          [coin2] = txb.splitCoins(txb.gas, [amountB]);
        } else {
          let currentCursor: string | null | undefined = null;
          let coins2: CoinStruct[] = [];
          do {
            const response = await suiClient.getCoins({
              owner: address,
              coinType: coinsList[coinTypeB].type,
              cursor: currentCursor,
            });
            coins2 = coins2.concat(response.data);
            if (response.hasNextPage && response.nextCursor) {
              currentCursor = response.nextCursor;
            } else break;
          } while (true);
          [coin2] = txb.splitCoins(txb.object(coins2[0].coinObjectId), [0]);
          txb.mergeCoins(
            coin2,
            coins2.map((c) => c.coinObjectId),
          );
        }
      } else {
        let quoteResponse = await swapGateway.getQuote(swapOptionsI2A);
        if (quoteResponse) {
          amountA = quoteResponse.returnAmountWithDecimal;
          const result = await swapGateway.getTransactionBlock(
            swapOptionsI2A,
            quoteResponse,
            txb,
          );
          txb = result.tx;
          if (result.coinOut) {
            coin1 = result.coinOut;
          }
        }
        quoteResponse = await swapGateway.getQuote(swapOptionsI2B);
        if (quoteResponse) {
          amountB = quoteResponse.returnAmountWithDecimal;
          const result = await swapGateway.getTransactionBlock(
            swapOptionsI2B,
            quoteResponse,
            txb,
          );
          txb = result.tx;
          if (result.coinOut) {
            coin2 = result.coinOut;
          }
        }
      }

      if (amountA && amountB) {
        if (coin1 && coin2) {
          // fee charge
          const fee_address = getConf().FEE_ADDRESS;
          const feePercentage = 0.05;
          const amountAFee = ((Number(amountA) * feePercentage) / 100).toFixed(
            0,
          );
          const amountBFee = ((Number(amountB) * feePercentage) / 100).toFixed(
            0,
          );
          const [feeCoinA] = txb.splitCoins(coin1, [amountAFee]);
          const [feeCoinB] = txb.splitCoins(coin2, [amountBFee]);
          txb.transferObjects([feeCoinA, feeCoinB], fee_address);

          const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
          const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
          if (poolInfo[poolName].parentProtocolName === "CETUS") {
            if (pool1 === "CETUS" && pool2 === "SUI") {
              txb = await depositCetusSuiTxb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            } else if (pool2 === "SUI") {
              txb = await depositCetusAlphaSuiTxb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            } else {
              txb = await depositCetus(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            }
          } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
            if (
              poolName === "BLUEFIN-NAVX-VSUI" ||
              poolName === "BLUEFIN-ALPHA-USDC" ||
              poolName === "BLUEFIN-BLUE-USDC"
            ) {
              txb = await depositBluefinType2Txb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            } else if (pool1 === "SUI") {
              txb = await depositBluefinSuiFirstTxb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            } else if (pool2 === "SUI") {
              txb = await depositBluefinSuiSecondTxb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            } else {
              txb = await depositBluefinType1Txb(
                amountA,
                amountB,
                poolName,
                { address },
                txb,
                coin1,
                coin2,
              );
            }
          }
        }
      }
      txb.setGasBudget(100000000);
      return txb;
    }
  }
  return undefined;
}

const depositCetus = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }

  if (amounts && coin1Arg !== undefined && coin2Arg !== undefined) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

    let someReceipt: any;

    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolInfo[poolName].receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }

    if (
      poolName == "WUSDC-WBTC" ||
      poolName == "USDC-USDT" ||
      poolName == "USDC-WUSDC" ||
      poolName == "USDC-ETH"
    ) {
      txb.moveCall({
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_pool_base_a::user_deposit`,
        typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
        arguments: [
          txb.object(getConf().VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
          txb.object(cetusPoolMap[`${pool1}-SUI`]),
          txb.object(cetusPoolMap["CETUS-SUI"]),
          txb.object(cetusPoolMap[poolName]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else {
      txb.moveCall({
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_pool::user_deposit`,
        typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
        arguments: [
          txb.object(getConf().VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
          txb.object(cetusPoolMap[`${pool2}-SUI`]),
          txb.object(cetusPoolMap["CETUS-SUI"]),
          txb.object(cetusPoolMap[poolName]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }
  return txb;
};

const depositCetusAlphaSuiTxb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }

  if (amounts && coin1Arg != undefined && coin2Arg !== undefined) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

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

    txb.moveCall({
      target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_sui_pool::user_deposit`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
        txb.object(cetusPoolMap["CETUS-SUI"]),
        txb.object(poolinfo.parentPoolId),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }

  return txb;
};

const depositCetusSuiTxb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }

  if (amounts && coin1Arg && coin2Arg) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);
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

    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_cetus_sui_pool::user_deposit`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_2_VERSION),
        txb.object(getConf().VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
        txb.object(cetusPoolMap[poolName]),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }

  return txb;
};

const depositBluefinSuiFirstTxb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }

  if (amounts && coin1Arg && coin2Arg) {
    const [depositCoinA] = txb.splitCoins(txb.gas, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

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

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }

  return txb;
};

const depositBluefinType1Txb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }

  if (amounts && coin1Arg && coin2Arg) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

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

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }

  return txb;
};

const depositBluefinType2Txb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }
  if (amounts && coin1Arg && coin2Arg) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

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

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }

  return txb;
};

const depositBluefinSuiSecondTxb = async (
  amountA: string,
  amountB: string,
  poolName: PoolName,
  options: { address: string },
  transaction: Transaction | undefined = undefined,
  coin1Arg: TransactionObjectArgument | undefined,
  coin2Arg: TransactionObjectArgument | undefined,
): Promise<Transaction> => {
  const address = options.address;
  let txb;
  if (transaction) txb = transaction;
  else txb = new Transaction();
  poolName = poolName.toUpperCase() as PoolName;
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const receipt = await getReceipts(poolName, address, true);

  amountA = (Number(amountA) * 0.999).toString();
  amountB = (Number(amountB) * 0.999).toString();
  let amounts = await getAmounts(poolName, true, amountA);
  if (amounts === undefined || amounts[0] > amountA || amounts[1] > amountB) {
    amounts = await getAmounts(poolName, false, amountB);
  }
  if (amounts && coin1Arg && coin2Arg) {
    const [depositCoinA] = txb.splitCoins(coin1Arg, [amounts[0]]);
    const [depositCoinB] = txb.splitCoins(coin2Arg, [amounts[1]]);

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

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }
  return txb;
};

export async function getZapAmounts(
  inputCoinAmount: number,
  inputCoinName: CoinName,
  poolName: PoolName,
  slippage: number,
  options: { address: string },
  ignoreCache: boolean,
): Promise<[string, string, string, string] | undefined> {
  const address = options.address;
  const coinTypeA = doubleAssetPoolCoinMap[poolName].coin1;
  const coinTypeB = doubleAssetPoolCoinMap[poolName].coin2;
  const swapObjectA = coinsList[coinTypeA];
  const swapObjectB = coinsList[coinTypeB];
  const inputObject = coinsList[inputCoinName];

  const amounts = await getAmounts(poolName, true, "100000001");
  if (amounts) {
    const amount1 = Number(amounts[0]);
    const amount2 = Number(amounts[1]);

    const swapGateway = new SevenKGateway();
    const swapOptions: SwapOptions = {
      pair: {
        coinA: swapObjectA,
        coinB: swapObjectB,
      },
      senderAddress: address,
      inAmount: new BN(amount1),
      slippage: slippage,
    };

    const ratioQuote = await swapGateway.getQuote(swapOptions);
    if (ratioQuote) {
      const amount1InCoinType2 = Number(ratioQuote.returnAmountWithDecimal);
      const totalAmount = amount2 + amount1InCoinType2;

      const inputAmountToType1 = Math.floor(
        (inputCoinAmount * amount1InCoinType2) / totalAmount,
      );
      const inputAmountToType2 = Math.floor(
        (inputCoinAmount * amount2) / totalAmount,
      );

      let amountA, amountB;
      const swapOptionsI2A = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectA,
        },
        senderAddress: address,
        inAmount: new BN(inputAmountToType1),
        slippage: slippage,
      };
      const swapOptionsI2B = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectB,
        },
        senderAddress: address,
        inAmount: new BN(inputAmountToType2),
        slippage: slippage,
      };
      if (inputCoinName === coinTypeA) {
        const quoteResponse = await swapGateway.getQuote(swapOptionsI2B);
        if (quoteResponse) {
          amountB = quoteResponse.returnAmountWithDecimal;
        }
        amountA = inputAmountToType1.toString();
      } else if (inputCoinName === coinTypeB) {
        const quoteResponse = await swapGateway.getQuote(swapOptionsI2A);
        if (quoteResponse) {
          amountA = quoteResponse.returnAmountWithDecimal;
        }
        amountB = inputAmountToType2.toString();
      } else {
        let quoteResponse = await swapGateway.getQuote(swapOptionsI2A);
        if (quoteResponse) {
          amountA = quoteResponse.returnAmountWithDecimal;
        }
        quoteResponse = await swapGateway.getQuote(swapOptionsI2B);
        if (quoteResponse) {
          amountB = quoteResponse.returnAmountWithDecimal;
        }
      }

      if (amountA && amountB) {
        const [coin1Price, coin2Price] = await getLatestPrices(
          [
            `${swapObjectA.name}/USD` as PythPriceIdPair,
            `${swapObjectB.name}/USD` as PythPriceIdPair,
          ],
          ignoreCache,
        );
        const coin1InUSD = Number(amountA) * Number(coin1Price);
        const coin2InUSD = Number(amountB) * Number(coin2Price);
        return [
          amountA.toString(),
          coin1InUSD.toString(),
          amountB.toString(),
          coin2InUSD.toString(),
        ];
      }
    }
  }
}

// export async function zapWithdraw(
//   amount: string,
//   poolName: PoolName,
//   outputCoinName: string,
//   options: { suiClient: SuiClient; address: string },
// ) {
//   const suiClient = options.suiClient;
//   const address = options.address;
//   const txb = new Transaction();

//   const pool1 = doubleAssetPoolCoinMap[poolName].pool1;
//   const pool2 = doubleAssetPoolCoinMap[poolName].pool2;
// }

//calculate ratio of both coins in terms of coin-type 2
//convert outputAmount in coinType2
//then calculate coinType1 and coinType2 based on previous ratio
//convert those amounts to liquidity
//pass that liquidity into cetusWithdrawTxb
//swap the amount withdrawn to outputAmountType.
