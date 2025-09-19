import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import BN from "bn.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { Coin, CoinName, PoolName, SwapOptions } from "../common/types.js";
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
import { AggregatorTx, isSuiTransaction } from "@7kprotocol/sdk-ts";
import { getConf } from "../common/constants.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { getLatestPrices } from "../utils/prices.js";
import { PythPriceIdPair } from "../common/pyth.js";
import {
  mintTx,
  redeemTx,
  stSuiExchangeRate,
  getConf as getStSuiConf,
} from "@alphafi/stsui-sdk";
import { Decimal } from "decimal.js";

type ZapDepositParams = {
  txb: Transaction;
  coinA: TransactionObjectArgument | undefined;
  amountA: string | undefined;
  coinB: TransactionObjectArgument | undefined;
  amountB: string | undefined;
};

type CoinDetails = {
  swapGateway: SevenKGateway;
  inputObject: Coin;
  inputCoinAmount: number;
  swapObjectA: Coin;
  swapObjectB: Coin;
  slippage: number;
  address: string;
  poolName: PoolName;
};

// Case 1: When the first amount is zero
async function handleFirstAmountZero(
  params: ZapDepositParams,
  coinDetails: CoinDetails,
  suiClient: SuiClient,
): Promise<ZapDepositParams> {
  params.amountA = "0";
  params.coinA = params.txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [coinDetails.swapObjectA.type],
    arguments: [],
  });

  if (coinDetails.inputObject.type === coinDetails.swapObjectB.type) {
    params.amountB = coinDetails.inputCoinAmount.toString();
    const res = await splitFromExisting(
      coinDetails.swapObjectB.name,
      params.amountB ?? "0",
      params.txb,
      suiClient,
      coinDetails.address,
    );
    params.txb = res.tx;
    params.coinB = res.coinOut;
  } else {
    const swapOptionsI2B: SwapOptions = {
      pair: { coinA: coinDetails.inputObject, coinB: coinDetails.swapObjectB },
      senderAddress: coinDetails.address,
      inAmount: new BN(coinDetails.inputCoinAmount),
      slippage: coinDetails.slippage,
    };
    const result = await zapSwap(
      swapOptionsI2B,
      params.txb,
      coinDetails.poolName,
    );
    if (result) {
      params.amountB = result.amountOut;
      if (isSuiTransaction(result.tx)) {
        params.txb = result.tx;
      }
      if (result.coinOut) params.coinB = result.coinOut;
    }
  }
  return params;
}

// Case 2: When the second amount is zero
async function handleSecondAmountZero(
  params: ZapDepositParams,
  coinDetails: CoinDetails,
  suiClient: SuiClient,
): Promise<ZapDepositParams> {
  params.amountB = "0";
  params.coinB = params.txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [coinDetails.swapObjectB.type],
    arguments: [],
  });
  if (coinDetails.inputObject.type === coinDetails.swapObjectA.type) {
    params.amountA = coinDetails.inputCoinAmount.toString();
    const res = await splitFromExisting(
      coinDetails.swapObjectA.name,
      params.amountA,
      params.txb,
      suiClient,
      coinDetails.address,
    );
    params.txb = res.tx;
    params.coinA = res.coinOut;
  } else {
    const swapOptionsI2A: SwapOptions = {
      pair: { coinA: coinDetails.inputObject, coinB: coinDetails.swapObjectA },
      senderAddress: coinDetails.address,
      inAmount: new BN(coinDetails.inputCoinAmount),
      slippage: coinDetails.slippage,
    };
    const result = await zapSwap(
      swapOptionsI2A,
      params.txb,
      coinDetails.poolName,
    );
    if (result) {
      params.amountA = result.amountOut;
      if (isSuiTransaction(result.tx)) {
        params.txb = result.tx;
      }
      if (result.coinOut) params.coinA = result.coinOut;
    }
  }
  return params;
}

// Case 3: When both amounts are nonzero
async function handleNonZeroAmounts(
  params: ZapDepositParams,
  coinDetails: CoinDetails,
  amounts: [string, string],
  suiClient: SuiClient,
): Promise<ZapDepositParams | undefined> {
  const amount1 = Number(amounts[0]);
  const amount2 = Number(amounts[1]);
  const swapOptions: SwapOptions = {
    pair: { coinA: coinDetails.swapObjectA, coinB: coinDetails.swapObjectB },
    senderAddress: coinDetails.address,
    inAmount: new BN(amount1),
    slippage: coinDetails.slippage,
  };

  const ratioQuote = await zapGetQuote(
    coinDetails.swapGateway,
    swapOptions,
    coinDetails.poolName,
  );
  if (ratioQuote === undefined) {
    console.error("Error fetching ratioQuote for Zap");
    return undefined;
  }
  const amount1InCoinType2 = Number(ratioQuote);
  const totalAmount = amount2 + amount1InCoinType2;
  const inputAmountToType1 = Math.floor(
    (coinDetails.inputCoinAmount * amount1InCoinType2) / totalAmount,
  );
  const inputAmountToType2 = Math.floor(
    (coinDetails.inputCoinAmount * amount2) / totalAmount,
  );

  const swapOptionsI2A: SwapOptions = {
    pair: { coinA: coinDetails.inputObject, coinB: coinDetails.swapObjectA },
    senderAddress: coinDetails.address,
    inAmount: new BN(inputAmountToType1),
    slippage: coinDetails.slippage,
  };
  const swapOptionsI2B: SwapOptions = {
    pair: { coinA: coinDetails.inputObject, coinB: coinDetails.swapObjectB },
    senderAddress: coinDetails.address,
    inAmount: new BN(inputAmountToType2),
    slippage: coinDetails.slippage,
  };

  let swapResult;
  if (coinDetails.inputObject.type === coinDetails.swapObjectA.type) {
    swapResult = await zapSwap(
      swapOptionsI2B,
      params.txb,
      coinDetails.poolName,
    );
    if (swapResult) {
      params.amountB = swapResult.amountOut;
      if (isSuiTransaction(swapResult.tx)) {
        params.txb = swapResult.tx;
      }
      if (swapResult.coinOut) params.coinB = swapResult.coinOut;
    }
    params.amountA = inputAmountToType1.toString();
    if (swapResult && swapResult.remainingLSTCoin) {
      params.coinA = swapResult.remainingLSTCoin;
    } else {
      const res = await splitFromExisting(
        coinDetails.swapObjectA.name,
        params.amountA,
        params.txb,
        suiClient,
        coinDetails.address,
      );
      params.txb = res.tx;
      params.coinA = res.coinOut;
    }
  } else if (coinDetails.inputObject.type === coinDetails.swapObjectB.type) {
    swapResult = await zapSwap(
      swapOptionsI2A,
      params.txb,
      coinDetails.poolName,
    );
    if (swapResult) {
      params.amountA = swapResult.amountOut;
      if (isSuiTransaction(swapResult.tx)) {
        params.txb = swapResult.tx;
      }
      if (swapResult.coinOut) params.coinA = swapResult.coinOut;
    }
    if (swapResult && swapResult.remainingLSTCoin) {
      params.coinB = swapResult.remainingLSTCoin;
    } else {
      params.amountB = inputAmountToType2.toString();
      const res = await splitFromExisting(
        coinDetails.swapObjectB.name,
        params.amountB,
        params.txb,
        suiClient,
        coinDetails.address,
      );
      params.txb = res.tx;
      params.coinB = res.coinOut;
    }
  } else {
    swapResult = await zapSwap(
      swapOptionsI2A,
      params.txb,
      coinDetails.poolName,
    );
    if (swapResult) {
      params.amountA = swapResult.amountOut;
      if (isSuiTransaction(swapResult.tx)) {
        params.txb = swapResult.tx;
      }
      if (swapResult.coinOut) params.coinA = swapResult.coinOut;
    }
    swapResult = await zapSwap(
      swapOptionsI2B,
      params.txb,
      coinDetails.poolName,
    );
    if (swapResult) {
      params.amountB = swapResult.amountOut;
      if (isSuiTransaction(swapResult.tx)) {
        params.txb = swapResult.tx;
      }
      if (swapResult.coinOut) params.coinB = swapResult.coinOut;
    }
  }
  return params;
}

export async function zapDepositTxb(
  inputCoinName: CoinName,
  inputCoinAmount: number,
  poolName: PoolName,
  slippage: number, // 0.01 --> 1%, 0.001 --> 0.1%
  address: string,
): Promise<Transaction | undefined> {
  const suiClient = getSuiClient();
  let params: ZapDepositParams = {
    txb: new Transaction(),
    coinA: undefined,
    amountA: undefined,
    coinB: undefined,
    amountB: undefined,
  };
  const coinDetails: CoinDetails = {
    swapGateway: new SevenKGateway(),
    inputObject: coinsList[inputCoinName],
    inputCoinAmount: inputCoinAmount,
    swapObjectA: coinsList[doubleAssetPoolCoinMap[poolName].coin1],
    swapObjectB: coinsList[doubleAssetPoolCoinMap[poolName].coin2],
    address: address,
    slippage: slippage,
    poolName: poolName,
  };

  const amounts = await getAmounts(poolName, true, "100000001", true);
  if (Number(amounts[0]) === 0) {
    params = await handleFirstAmountZero(params, coinDetails, suiClient);
  } else if (Number(amounts[1]) === 0) {
    params = await handleSecondAmountZero(params, coinDetails, suiClient);
  } else {
    const result = await handleNonZeroAmounts(
      params,
      coinDetails,
      amounts,
      suiClient,
    );
    if (!result) return undefined;
    params = result;
  }

  if (params.amountA && params.amountB && params.coinA && params.coinB) {
    // fee charge
    const feePercentage = 0.05;
    const amountAFee = ((Number(params.amountA) * feePercentage) / 100).toFixed(
      0,
    );
    const amountBFee = ((Number(params.amountB) * feePercentage) / 100).toFixed(
      0,
    );
    const [feeCoinA] = params.txb.splitCoins(params.coinA, [amountAFee]);
    const [feeCoinB] = params.txb.splitCoins(params.coinB, [amountBFee]);
    params.txb.transferObjects([feeCoinA, feeCoinB], getConf().FEE_ADDRESS);

    // Removing fee amounts from amounts and some slippage
    const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
    const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
    params.amountA = (Number(params.amountA) * 0.995).toString();
    params.amountB = (Number(params.amountB) * 0.995).toString();

    // Conditional deposit calls based on pool and protocol
    const receipt = await getReceipts(poolName, address, true);
    let amounts = await getAmounts(poolName, true, params.amountA, false);
    if (amounts[0] > params.amountA || amounts[1] > params.amountB) {
      amounts = await getAmounts(poolName, false, params.amountB, false);
    }
    const [depositCoinA] = params.txb.splitCoins(params.coinA, [amounts[0]]);
    const [depositCoinB] = params.txb.splitCoins(params.coinB, [amounts[1]]);

    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = params.txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolInfo[poolName].receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = params.txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [params.txb.object(receipt[0].objectId)],
      });
    }

    if (poolInfo[poolName].parentProtocolName === "CETUS") {
      if (pool1 === "CETUS" && pool2 === "SUI") {
        params.txb = await depositCetusSuiTxb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      } else if (pool2 === "SUI") {
        params.txb = await depositCetusAlphaSuiTxb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      } else {
        params.txb = await depositCetusTxb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      }
    } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
      if (
        poolName === "BLUEFIN-NAVX-VSUI" ||
        poolName === "BLUEFIN-ALPHA-USDC" ||
        poolName === "BLUEFIN-BLUE-USDC"
      ) {
        params.txb = await depositBluefinType2Txb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      } else if (pool1 === "SUI") {
        params.txb = await depositBluefinSuiFirstTxb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      } else if (pool2 === "SUI") {
        params.txb = await depositBluefinSuiSecondTxb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      } else if (pool1 === "STSUI" || pool2 === "STSUI") {
        params.txb = await depositBluefinStsuiTxb(
          params.txb,
          someReceipt,
          poolName,
          depositCoinA,
          depositCoinB,
        );
      } else {
        params.txb = await depositBluefinType1Txb(
          params.txb,
          someReceipt,
          coinDetails.poolName,
          depositCoinA,
          depositCoinB,
        );
      }
    }
    params.txb.transferObjects([params.coinA, params.coinB], address);
  }
  params.txb.setGasBudget(100000000);
  return params.txb;
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
    const exchangeRate = new Decimal(
      await stSuiExchangeRate(getStSuiConf().LST_INFO, true),
    );
    const amount = new Decimal(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
    );
    return amount.div(exchangeRate).toString();
  } else if (
    swapOptions.pair.coinA.name === "STSUI" &&
    swapOptions.pair.coinB.name === "SUI"
  ) {
    const exchangeRate = new Decimal(
      await stSuiExchangeRate(getStSuiConf().LST_INFO, true),
    );
    const amount = new Decimal(
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
    );
    return amount.mul(exchangeRate).toString();
  } else {
    const quoteResponse = await swapGateway.getQuote(
      swapOptions.pair.coinA.type,
      swapOptions.pair.coinB.type,
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
      [poolInfo[poolName].parentPoolId],
    );
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
      tx: AggregatorTx;
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
    const quoteResponse = await swapGateway.getQuote(
      swapOptions.pair.coinA.type,
      swapOptions.pair.coinB.type,
      swapOptions.inAmount ? swapOptions.inAmount.toString() : "0",
      [poolInfo[poolName].parentPoolId],
    );
    if (quoteResponse) {
      const result = await swapGateway.getTransactionBlock(
        txb,
        swapOptions.senderAddress,
        quoteResponse,
        swapOptions.slippage,
      );
      return {
        tx: txb,
        coinOut: result,
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

const depositCetusTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
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
  return txb;
};

const depositCetusAlphaSuiTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
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
  return txb;
};

const depositCetusSuiTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
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
  return txb;
};

const depositBluefinSuiFirstTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolName === "BLUEFIN-SUI-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-SUI-BUCK") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-SUI-AUSD") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
};

const depositBluefinType1Txb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolName === "BLUEFIN-USDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUSD-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-WBTC-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-SEND-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
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
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-SUIUSDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUTOBALANCE-DEEP-BLUE") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
};

const depositBluefinType2Txb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolName === "BLUEFIN-ALPHA-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-NAVX-VSUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-BLUE-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_2_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
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
  return txb;
};

const depositBluefinSuiSecondTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolName === "BLUEFIN-BLUE-SUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-WBTC-SUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-DEEP-SUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
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
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUTOBALANCE-BLUE-SUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v2`,
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
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
};

const depositBluefinStsuiTxb = async (
  txb: Transaction,
  someReceipt: any,
  poolName: PoolName,
  depositCoinA: {
    $kind: "NestedResult";
    NestedResult: [number, number];
  },
  depositCoinB: {
    $kind: "NestedResult";
    NestedResult: [number, number];
  },
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

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
  } else if (poolName === "BLUEFIN-STSUI-WSOL") {
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
        txb.object(getConf().BLUEFIN_STSUI_WSOL_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["WSOL-SUI"]),
        txb.object(bluefinPoolMap["SUI-WSOL"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.pure.bool(false),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-STSUI-ETH") {
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
        txb.object(getConf().BLUEFIN_STSUI_ETH_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["ETH-SUI"]),
        txb.object(bluefinPoolMap["SUI-ETH"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.pure.bool(false),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-STSUI-BUCK") {
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
        txb.object(getConf().BLUEFIN_STSUI_BUCK_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["BUCK-SUI"]),
        txb.object(bluefinPoolMap["SUI-BUCK"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.pure.bool(false),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-STSUI-MUSD") {
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
        txb.object(getConf().BLUEFIN_STSUI_MUSD_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["MUSD-SUI"]),
        txb.object(bluefinPoolMap["SUI-MUSD"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.pure.bool(true),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
};

export async function getZapAmounts(
  inputCoinAmount: number,
  inputCoinName: CoinName,
  poolName: PoolName,
  slippage: number,
  address: string,
  ignoreCache: boolean,
): Promise<[string, string, string, string] | undefined> {
  const coinTypeA = doubleAssetPoolCoinMap[poolName].coin1;
  const coinTypeB = doubleAssetPoolCoinMap[poolName].coin2;
  const swapObjectA = coinsList[coinTypeA];
  const swapObjectB = coinsList[coinTypeB];
  const inputObject = coinsList[inputCoinName];

  const amounts = await getAmounts(poolName, true, "100000001");
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
  if (!ratioQuote) {
    console.error(`Error geting quote for zap`);
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
    amountA = inputAmountToType1.toString();
    amountB = await zapGetQuote(swapGateway, swapOptionsI2B, poolName);
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
