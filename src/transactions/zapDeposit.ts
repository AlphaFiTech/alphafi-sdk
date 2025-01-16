import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import BN from "bn.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { CoinName, PoolName, SwapOptions } from "../common/types.js";
import { getSuiClient } from "../sui-sdk/client.js";
import {
  bluefinPoolMap,
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
import { mintTx, redeemTx, stSuiExchangeRate } from "@alphafi/stsui-sdk";
import { Decimal } from "decimal.js";

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

  const swapGateway = new SevenKGateway();
  let coin1, coin2;
  let amountA: string | undefined, amountB: string | undefined;

  const amounts = await getAmounts(poolName, true, "100000001");
  if (!amounts) {
    console.error("Error fetching amounts for zap");
    return undefined;
  }

  if (Number(amounts[0]) === 0) {
    amountA = "0";
    coin1 = txb.moveCall({
      target: "0x2::coin::zero",
      typeArguments: [swapObjectA.type],
      arguments: [],
    });
    if (inputCoinName === coinTypeB) {
      amountB = inputCoinAmount.toString();
      const res = await splitFromExisting(
        coinTypeB,
        amountB,
        txb,
        suiClient,
        address,
      );
      txb = res.tx;
      coin2 = res.coinOut;
    } else {
      const swapOptionsI2B = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectB,
        },
        senderAddress: address,
        inAmount: new BN(inputCoinAmount),
        slippage: slippage,
      };
      const result = await zapSwap(swapOptionsI2B, txb, poolName);
      if (result) {
        amountB = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin2 = result.coinOut;
        }
      }
    }
  } else if (Number(amounts[1]) === 0) {
    amountB = "0";
    coin2 = txb.moveCall({
      target: "0x2::coin::zero",
      typeArguments: [swapObjectB.type],
      arguments: [],
    });
    if (inputCoinName === coinTypeA) {
      amountA = inputCoinAmount.toString();
      const res = await splitFromExisting(
        coinTypeA,
        amountA,
        txb,
        suiClient,
        address,
      );
      txb = res.tx;
      coin1 = res.coinOut;
    } else {
      const swapOptionsI2A = {
        pair: {
          coinA: inputObject,
          coinB: swapObjectA,
        },
        senderAddress: address,
        inAmount: new BN(inputCoinAmount),
        slippage: slippage,
      };
      const result = await zapSwap(swapOptionsI2A, txb, poolName);
      if (result) {
        amountA = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin1 = result.coinOut;
        }
      }
    }
  } else {
    const amount1 = Number(amounts[0]);
    const amount2 = Number(amounts[1]);
    const swapOptions: SwapOptions = {
      pair: {
        coinA: swapObjectA,
        coinB: swapObjectB,
      },
      senderAddress: address,
      inAmount: new BN(amount1),
      slippage: slippage,
    };

    const ratioQuote = await zapGetQuote(swapGateway, swapOptions, poolName);
    if (ratioQuote === undefined) {
      console.error("Error fetching ratioQuote for zap");
      return undefined;
    }

    const amount1InCoinType2 = Number(ratioQuote);
    const totalAmount = amount2 + amount1InCoinType2;

    const inputAmountToType1 = Math.floor(
      (inputCoinAmount * amount1InCoinType2) / totalAmount,
    );
    const inputAmountToType2 = Math.floor(
      (inputCoinAmount * amount2) / totalAmount,
    );

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
      const result = await zapSwap(swapOptionsI2B, txb, poolName);
      if (result) {
        amountB = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin2 = result.coinOut;
        }
      }

      amountA = inputAmountToType1.toString();
      if (result && result.remainingLSTCoin) {
        coin1 = result.remainingLSTCoin;
      } else {
        const res = await splitFromExisting(
          coinTypeA,
          amountA,
          txb,
          suiClient,
          address,
        );
        txb = res.tx;
        coin1 = res.coinOut;
      }
    } else if (inputCoinName === coinTypeB) {
      const result = await zapSwap(swapOptionsI2A, txb, poolName);
      if (result) {
        amountA = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin1 = result.coinOut;
        }
      }

      if (result && result.remainingLSTCoin) {
        coin2 = result.remainingLSTCoin;
      } else {
        amountB = inputAmountToType2.toString();
        const res = await splitFromExisting(
          coinTypeB,
          amountB,
          txb,
          suiClient,
          address,
        );
        txb = res.tx;
        coin2 = res.coinOut;
      }
    } else {
      let result = await zapSwap(swapOptionsI2A, txb, poolName);
      if (result) {
        amountA = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin1 = result.coinOut;
        }
      }

      result = await zapSwap(swapOptionsI2B, txb, poolName);
      if (result) {
        amountB = result.amountOut;
        txb = result.tx;
        if (result.coinOut) {
          coin2 = result.coinOut;
        }
      }
    }
  }

  if (amountA && amountB && coin1 && coin2) {
    // fee charge
    const fee_address = getConf().FEE_ADDRESS;
    const feePercentage = 0.05;
    const amountAFee = ((Number(amountA) * feePercentage) / 100).toFixed(0);
    const amountBFee = ((Number(amountB) * feePercentage) / 100).toFixed(0);
    const [feeCoinA] = txb.splitCoins(coin1, [amountAFee]);
    const [feeCoinB] = txb.splitCoins(coin2, [amountBFee]);
    txb.transferObjects([feeCoinA, feeCoinB], fee_address);

    const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
    const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

    amountA = (Number(amountA) * 0.995).toString();
    amountB = (Number(amountB) * 0.995).toString();

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
      } else if (pool1 === "STSUI" || pool2 === "STSUI") {
        txb = await depositBluefinStsuiTxb(
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
  txb.setGasBudget(100000000);
  return txb;
}

async function zapGetQuote(
  swapGateway: SevenKGateway,
  swapOptions: SwapOptions,
  poolName: PoolName,
): Promise<string | undefined> {
  if (
    swapOptions.pair.coinA.name === "SUI" &&
    swapOptions.pair.coinB.name === "STSUI"
  ) {
    const exchangeRate = new Decimal(await stSuiExchangeRate());
    const amount = new Decimal(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
    );
    return amount.div(exchangeRate).toString();
  } else if (
    swapOptions.pair.coinA.name === "STSUI" &&
    swapOptions.pair.coinB.name === "SUI"
  ) {
    const exchangeRate = new Decimal(await stSuiExchangeRate());
    const amount = new Decimal(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
    );
    return amount.mul(exchangeRate).toString();
  } else {
    const quoteResponse = await swapGateway.getQuote(swapOptions, [
      poolInfo[poolName].parentPoolId,
    ]);
    if (quoteResponse) {
      return quoteResponse.returnAmountWithDecimal
        ? quoteResponse.returnAmountWithDecimal
        : "0";
    }
  }
}

async function zapSwap(
  swapOptions: SwapOptions,
  txb: Transaction,
  poolName: PoolName,
): Promise<
  | {
      tx: Transaction;
      coinOut: TransactionObjectArgument | undefined;
      remainingLSTCoin: TransactionObjectArgument | undefined;
      amountOut: string;
    }
  | undefined
> {
  if (
    swapOptions.pair.coinA.name === "SUI" &&
    swapOptions.pair.coinB.name === "STSUI"
  ) {
    const result = await mintTx(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
      txb,
    );
    return {
      tx: result.tx,
      coinOut: result.coinOut,
      amountOut: result.amountOut,
      remainingLSTCoin: undefined,
    };
  } else if (
    swapOptions.pair.coinA.name === "STSUI" &&
    swapOptions.pair.coinB.name === "SUI"
  ) {
    const result = await redeemTx(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
      txb,
      { address: swapOptions.senderAddress },
    );
    return result;
  } else {
    const swapGateway = new SevenKGateway();
    const quoteResponse = await swapGateway.getQuote(swapOptions, [
      poolInfo[poolName].parentPoolId,
    ]);
    if (quoteResponse) {
      const result = await swapGateway.getTransactionBlock(
        swapOptions,
        quoteResponse,
        txb,
      );
      return {
        tx: result.tx,
        coinOut: result.coinOut,
        amountOut: quoteResponse.returnAmountWithDecimal
          ? quoteResponse.returnAmountWithDecimal
          : "0",
        remainingLSTCoin: undefined,
      };
    }
  }
}

async function splitFromExisting(
  coinType: CoinName,
  amount: string,
  txb: Transaction,
  suiClient: SuiClient,
  address: string,
): Promise<{
  tx: Transaction;
  coinOut: TransactionObjectArgument;
}> {
  let coin: TransactionObjectArgument;
  if (coinType === "SUI") {
    [coin] = txb.splitCoins(txb.gas, [amount]);
  } else {
    let currentCursor: string | null | undefined = null;
    let coins1: CoinStruct[] = [];
    do {
      const response = await suiClient.getCoins({
        owner: address,
        coinType: coinsList[coinType].type,
        cursor: currentCursor,
      });
      coins1 = coins1.concat(response.data);
      if (response.hasNextPage && response.nextCursor) {
        currentCursor = response.nextCursor;
      } else break;
    } while (true);
    [coin] = txb.splitCoins(txb.object(coins1[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins1.map((c) => c.coinObjectId),
    );
  }
  return {
    tx: txb,
    coinOut: coin,
  };
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
      target: `${poolinfo.packageId}::alphafi_cetus_sui_pool::user_deposit`,
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["AUSD-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SEND"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-STSUI-USDC") {
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
          txb.object(getConf().BLUEFIN_STSUI_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-STSUI"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-USDT-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
        typeArguments: [
          coinsList["USDT"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-USDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-SUIUSDT-USDC") {
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
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SUIUSDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
        typeArguments: [
          coinsList["SUIUSDT"].type,
          coinsList["USDC"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SUIUSDT"]),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-BLUE") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
        typeArguments: [
          coinsList["DEEP"].type,
          coinsList["BLUE"].type,
          coinsList["BLUE"].type,
          coinsList["SUI"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_DEEP_BLUE_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["BLUE-DEEP"]),
          txb.object(cetusPoolMap["BLUE-SUI"]),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
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
    } else if (poolName === "BLUEFIN-STSUI-ETH") {
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
          txb.object(getConf().BLUEFIN_STSUI_ETH_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["STSUI-ETH"]),
          txb.object(cetusPoolMap["ETH-SUI"]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-STSUI-WSOL") {
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
          txb.object(getConf().BLUEFIN_STSUI_WSOL_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["STSUI-WSOL"]),
          txb.object(cetusPoolMap["WSOL-SUI"]),
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
    } else if (poolName === "BLUEFIN-STSUI-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_stsui_sui_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
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
          txb.object(getConf().BLUEFIN_STSUI_SUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
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
    } else if (poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["DEEP"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
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
    }

    txb.transferObjects([coin1Arg, coin2Arg], address);
  } else {
    throw new Error(`No ${pool1} or ${pool2} Coins`);
  }
  return txb;
};

const depositBluefinStsuiTxb = async (
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

    if (poolName === "BLUEFIN-STSUI-USDC") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_stsui_first_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_STSUI_VERSION),
          txb.object(getConf().VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_STSUI_USDC_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["USDC-SUI"]),
          txb.object(bluefinPoolMap["SUI-USDC"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.pure.bool(true),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else if (poolName === "BLUEFIN-ALPHA-STSUI") {
      txb.moveCall({
        target: `${poolinfo.packageId}::alphafi_bluefin_stsui_second_pool::user_deposit`,
        typeArguments: [
          coinsList[pool1].type,
          coinsList[pool2].type,
          coinsList["BLUE"].type,
        ],
        arguments: [
          txb.object(getConf().ALPHA_STSUI_VERSION),
          txb.object(getConf().VERSION),
          someReceipt,
          txb.object(poolinfo.poolId),
          depositCoinA,
          depositCoinB,
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().BLUEFIN_ALPHA_STSUI_POOL),
          txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
          txb.object(cetusPoolMap["ALPHA-SUI"]),
          txb.object(bluefinPoolMap["SUI-ALPHA"]),
          txb.object(getConf().LST_INFO),
          txb.object(getConf().SUI_SYSTEM_STATE),
          txb.pure.bool(false),
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

    const ratioQuote = await zapGetQuote(swapGateway, swapOptions, poolName);
    if (ratioQuote) {
      const amount1InCoinType2 = Number(ratioQuote);
      const totalAmount = amount2 + amount1InCoinType2;

      const inputAmountToType1 = Math.floor(
        (inputCoinAmount * amount1InCoinType2) / totalAmount,
      );
      const inputAmountToType2 = Math.floor(
        (inputCoinAmount * amount2) / totalAmount,
      );

      let amountA: string | undefined, amountB: string | undefined;
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
        amountB = await zapGetQuote(swapGateway, swapOptionsI2B, poolName);
        amountA = inputAmountToType1.toString();
      } else if (inputCoinName === coinTypeB) {
        amountA = await zapGetQuote(swapGateway, swapOptionsI2A, poolName);
        amountB = inputAmountToType2.toString();
      } else {
        amountA = await zapGetQuote(swapGateway, swapOptionsI2A, poolName);
        amountB = await zapGetQuote(swapGateway, swapOptionsI2B, poolName);
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
