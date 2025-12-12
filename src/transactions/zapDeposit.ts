import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  CetusInvestor,
  CommonInvestorFields,
  PoolName,
} from "../common/types.js";
import {
  AUTOBALANCE_SUI_FIRST_POOLS,
  AUTOBALANCE_SUI_SECOND_POOLS,
  bluefinPoolMap,
  cetusPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../common/maps.js";
import { coinsList } from "../common/coins.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { getAmounts } from "./deposit.js";
import { SevenKGateway } from "./7k.js";
import { Decimal } from "decimal.js";
import { getSuiClient } from "../sui-sdk/client.js";
import { getConf } from "../common/constants.js";
import {
  getInvestor,
  getParentPool,
  getReceipts,
} from "../sui-sdk/functions/getReceipts.js";
import { collectRewardTxb } from "./blueRewards.js";
import { alphalendClient } from "./alphalend.js";
import {
  AUTOBALANCE_TYPE_1_POOLS,
  collectAndSwapRewardsLyf,
} from "../index.js";

export async function zapDepositTxb(
  inputCoinAmount: bigint,
  isInputA: boolean,
  poolName: PoolName,
  slippage: number, // 1% --> 0.01
  address: string,
): Promise<Transaction | undefined> {
  const tx = new Transaction();
  const suiClient = getSuiClient();
  const swapGateway = new SevenKGateway();
  const [coinTypeA, coinTypeB] = poolInfo[poolName].assetTypes;

  const coinObject = await getCoinObject(
    isInputA ? coinTypeA : coinTypeB,
    tx,
    suiClient,
    address,
  );

  const investor = (await getInvestor(poolName, true)) as CetusInvestor &
    CommonInvestorFields;
  const parentPool = await getParentPool(poolName, true);

  // get lower_tick, upper_tick, current_tick_index without 2's complement
  const upper_bound = 443636;
  let lower_tick = Number(investor.content.fields.lower_tick);
  let upper_tick = Number(investor.content.fields.upper_tick);
  let current_tick_index = Number(
    parentPool.content.fields.current_tick_index.fields.bits,
  );
  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }
  if (current_tick_index > upper_bound) {
    current_tick_index = -~(current_tick_index - 1);
  }

  if (current_tick_index >= upper_tick) {
    await handleFirstAmountZero({
      tx,
      address,
      poolName,
      inputCoinAmount,
      isInputA,
      slippage,
      coinTypeA: coinTypeA,
      coinTypeB: coinTypeB,
      coinObject,
    });
    return tx;
  } else if (current_tick_index < lower_tick) {
    await handleSecondAmountZero({
      tx,
      address,
      poolName,
      inputCoinAmount,
      isInputA,
      slippage,
      coinTypeA: coinTypeA,
      coinTypeB: coinTypeB,
      coinObject,
    });
    return tx;
  }

  // get inital ratio in terms of 2 coins
  let [amountA, amountB] = (
    await getAmounts(poolName, isInputA, inputCoinAmount.toString())
  ).map((a) => new Decimal(a));

  // convert coinA of the initial ratio to coinB to get the ratio in terms of 1 coin i.e. coinB
  if (isInputA) {
    const quoteResponse = await swapGateway.getQuote(
      coinTypeA,
      coinTypeB,
      amountA.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountA = new Decimal(quoteResponse.returnAmountWithDecimal);
  } else {
    const quoteResponse = await swapGateway.getQuote(
      coinTypeB,
      coinTypeA,
      amountB.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountB = new Decimal(quoteResponse.returnAmountWithDecimal);
  }

  // get input coin and handle how much of input coin needs to be swapped
  const totalAmount = amountA.add(amountB);
  let [inputCoinToType1, inputCoinToType2] = [new Decimal(0), new Decimal(0)];

  if (isInputA) {
    inputCoinToType2 = new Decimal(inputCoinAmount.toString())
      .mul(amountB)
      .div(totalAmount)
      // .mul(amountA.mul(slippage).div(totalAmount).add(1))
      .floor();

    const [coinIn] = tx.splitCoins(coinObject, [
      inputCoinToType2.floor().toString(),
    ]);

    const { coinOut: coinOutB, amountOut } = await zapSwap({
      tx,
      address,
      poolName,
      slippage,
      tokenIn: coinTypeA,
      tokenOut: coinTypeB,
      amountIn: inputCoinToType2.toString(),
      coinIn,
    });

    [inputCoinToType1, inputCoinToType2] = (
      await getAmounts(poolName, false, amountOut.toString(), false)
    ).map((a) => new Decimal(a));

    const [coinOutA] = tx.splitCoins(coinObject, [
      inputCoinToType1.floor().toString(),
    ]);
    await deposit({
      tx,
      coinA: coinOutA,
      coinB: coinOutB,
      amountA: inputCoinToType1.floor(),
      amountB: inputCoinToType2.floor(),
      address,
      poolName,
    });
  } else {
    // calculate amount of coinB to swap to Type A
    inputCoinToType1 = new Decimal(inputCoinAmount.toString())
      .mul(amountA)
      .div(totalAmount)
      // .mul(amountB.mul(slippage).div(totalAmount).add(1))
      .floor();
    const [coinIn] = tx.splitCoins(coinObject, [
      inputCoinToType1.floor().toString(),
    ]);

    // swap coinB to coinA
    const { coinOut: coinOutA, amountOut } = await zapSwap({
      tx,
      address,
      poolName,
      slippage,
      tokenIn: coinTypeB,
      tokenOut: coinTypeA,
      amountIn: inputCoinToType1.toString(),
      coinIn,
    });

    // calculate amount of coinB needed corresponding to the coinA swapped amount
    [inputCoinToType1, inputCoinToType2] = (
      await getAmounts(poolName, true, amountOut.toString(), false)
    ).map((a) => new Decimal(a));

    const [coinOutB] = tx.splitCoins(coinObject, [
      inputCoinToType2.floor().toString(),
    ]);
    await deposit({
      tx,
      coinA: coinOutA,
      coinB: coinOutB,
      amountA: inputCoinToType1.floor(),
      amountB: inputCoinToType2.floor(),
      address,
      poolName,
    });
  }
  tx.transferObjects([coinObject], address);
  return tx;
}

export async function zapDepositQuoteTxb(
  inputCoinAmount: bigint,
  isInputA: boolean,
  poolName: PoolName,
  slippage: number, // 1% --> 0.01
): Promise<[string, string] | undefined> {
  const swapGateway = new SevenKGateway();
  const [coinTypeA, coinTypeB] = poolInfo[poolName].assetTypes;

  const investor = (await getInvestor(poolName, true)) as CetusInvestor &
    CommonInvestorFields;
  const parentPool = await getParentPool(poolName, true);

  // get lower_tick, upper_tick, current_tick_index without 2's complement
  const upper_bound = 443636;
  let lower_tick = Number(investor.content.fields.lower_tick);
  let upper_tick = Number(investor.content.fields.upper_tick);
  let current_tick_index = Number(
    parentPool.content.fields.current_tick_index.fields.bits,
  );
  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }
  if (current_tick_index > upper_bound) {
    current_tick_index = -~(current_tick_index - 1);
  }

  if (current_tick_index >= upper_tick) {
    if (isInputA) {
      const quoteResponse = await swapGateway.getQuote(
        coinTypeA,
        coinTypeB,
        inputCoinAmount.toString(),
        [poolInfo[poolName].parentPoolId],
      );
      if (!quoteResponse) {
        throw new Error("Error fetching quote for zap");
      }
      return ["0", quoteResponse.returnAmountWithDecimal];
    } else {
      return ["0", inputCoinAmount.toString()];
    }
  } else if (current_tick_index < lower_tick) {
    if (isInputA) {
      return [inputCoinAmount.toString(), "0"];
    } else {
      const quoteResponse = await swapGateway.getQuote(
        coinTypeB,
        coinTypeA,
        inputCoinAmount.toString(),
        [poolInfo[poolName].parentPoolId],
      );
      if (!quoteResponse) {
        throw new Error("Error fetching quote for zap");
      }
      return [quoteResponse.returnAmountWithDecimal, "0"];
    }
  }

  // get inital ratio in terms of 2 coins
  let [amountA, amountB] = (
    await getAmounts(poolName, isInputA, inputCoinAmount.toString())
  ).map((a) => new Decimal(a));

  // convert coinA of the initial ratio to coinB to get the ratio in terms of 1 coin i.e. coinB
  if (isInputA) {
    const quoteResponse = await swapGateway.getQuote(
      coinTypeA,
      coinTypeB,
      amountA.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountA = new Decimal(quoteResponse.returnAmountWithDecimal);
  } else {
    const quoteResponse = await swapGateway.getQuote(
      coinTypeB,
      coinTypeA,
      amountB.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountB = new Decimal(quoteResponse.returnAmountWithDecimal);
  }

  // get input coin and handle how much of input coin needs to be swapped
  const totalAmount = amountA.add(amountB);
  let [inputCoinToType1, inputCoinToType2] = [new Decimal(0), new Decimal(0)];

  if (isInputA) {
    inputCoinToType2 = new Decimal(inputCoinAmount.toString())
      .mul(amountB)
      .div(totalAmount)
      // .mul(amountA.mul(slippage).div(totalAmount).add(1))
      .floor();

    const quoteResponse = await swapGateway.getQuote(
      coinTypeA,
      coinTypeB,
      inputCoinToType2.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      throw new Error("Error fetching quote for zap");
    }
    const slippageReducedAmount = new Decimal(
      quoteResponse.returnAmountWithDecimal,
    )
      .mul(new Decimal(1).sub(slippage))
      .floor();

    [inputCoinToType1, inputCoinToType2] = (
      await getAmounts(poolName, false, slippageReducedAmount.toString(), false)
    ).map((a) => new Decimal(a));
  } else {
    inputCoinToType1 = new Decimal(inputCoinAmount.toString())
      .mul(amountA)
      .div(totalAmount)
      // .mul(amountB.mul(slippage).div(totalAmount).add(1))
      .floor();

    const quoteResponse = await swapGateway.getQuote(
      coinTypeB,
      coinTypeA,
      inputCoinToType1.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      throw new Error("Error fetching quote for zap");
    }
    const slippageReducedAmount = new Decimal(
      quoteResponse.returnAmountWithDecimal,
    )
      .mul(new Decimal(1).sub(slippage))
      .floor();

    [inputCoinToType1, inputCoinToType2] = (
      await getAmounts(poolName, true, slippageReducedAmount.toString(), false)
    ).map((a) => new Decimal(a));
  }

  return [
    inputCoinToType1.mul(0.9995).floor().toString(),
    inputCoinToType2.mul(0.9995).floor().toString(),
  ];
}

async function getCoinObject(
  coinType: string,
  tx: Transaction,
  suiClient: SuiClient,
  address: string,
): Promise<TransactionObjectArgument> {
  if (
    coinType === "0x2::sui::SUI" ||
    coinType ===
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
  ) {
    return tx.gas;
  }
  let currentCursor: string | null | undefined = null;
  let coins1: CoinStruct[] = [];
  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType,
      cursor: currentCursor,
    });
    coins1 = coins1.concat(response.data);
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else break;
  } while (true);

  if (coins1.length === 0) {
    throw new Error(`No coins found for ${coinType} for owner ${address}`);
  }

  const [coin] = tx.splitCoins(tx.object(coins1[0].coinObjectId), [0]);
  tx.mergeCoins(
    coin,
    coins1.map((c) => c.coinObjectId),
  );
  return coin;
}

async function zapSwap(params: {
  tx: Transaction;
  address: string;
  poolName: PoolName;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number;
  coinIn: TransactionObjectArgument;
}): Promise<{
  coinOut: TransactionObjectArgument;
  amountOut: Decimal;
}> {
  const swapGateway = new SevenKGateway();
  const quoteResponse = await swapGateway.getQuote(
    params.tokenIn,
    params.tokenOut,
    params.amountIn,
    [poolInfo[params.poolName].parentPoolId],
  );
  if (!quoteResponse) {
    throw new Error("Error fetching quote for zap");
  }
  const coinOut = await swapGateway.getTransactionBlock(
    params.tx,
    params.address,
    quoteResponse,
    params.slippage,
    params.coinIn,
  );
  if (!coinOut) {
    throw new Error("Error getting transaction block for zap");
  }

  const slippageReducedAmount = new Decimal(
    quoteResponse.returnAmountWithDecimal,
  )
    .mul(new Decimal(1).sub(params.slippage))
    .floor();
  const [returnCoinOut] = params.tx.splitCoins(coinOut, [
    slippageReducedAmount.toString(),
  ]);
  params.tx.transferObjects([coinOut], params.address);
  return {
    coinOut: returnCoinOut,
    amountOut: slippageReducedAmount,
  };
}

async function handleFirstAmountZero(params: {
  tx: Transaction;
  address: string;
  poolName: PoolName;
  inputCoinAmount: bigint;
  isInputA: boolean;
  slippage: number;
  coinTypeA: string;
  coinTypeB: string;
  coinObject: TransactionObjectArgument;
}) {
  if (params.isInputA) {
    const [toSwap] = params.tx.splitCoins(params.coinObject, [
      params.inputCoinAmount.toString(),
    ]);
    const swapResult = await zapSwap({
      tx: params.tx,
      address: params.address,
      poolName: params.poolName,
      slippage: params.slippage,
      tokenIn: params.coinTypeA,
      tokenOut: params.coinTypeB,
      amountIn: params.inputCoinAmount.toString(),
      coinIn: toSwap,
    });

    await deposit({
      tx: params.tx,
      coinA: params.tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [params.coinTypeA],
        arguments: [],
      }),
      coinB: swapResult.coinOut,
      amountA: new Decimal(0),
      amountB: new Decimal(swapResult.amountOut.toString()),
      address: params.address,
      poolName: params.poolName,
    });
  } else {
    const [coinB] = params.tx.splitCoins(params.coinObject, [
      params.inputCoinAmount.toString(),
    ]);

    await deposit({
      tx: params.tx,
      coinA: params.tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [params.coinTypeA],
        arguments: [],
      }),
      coinB: coinB,
      amountA: new Decimal(0),
      amountB: new Decimal(params.inputCoinAmount.toString()),
      address: params.address,
      poolName: params.poolName,
    });
  }
  params.tx.transferObjects([params.coinObject], params.address);
}

async function handleSecondAmountZero(params: {
  tx: Transaction;
  address: string;
  poolName: PoolName;
  inputCoinAmount: bigint;
  isInputA: boolean;
  slippage: number;
  coinTypeA: string;
  coinTypeB: string;
  coinObject: TransactionObjectArgument;
}) {
  if (params.isInputA) {
    const [coinA] = params.tx.splitCoins(params.coinObject, [
      params.inputCoinAmount.toString(),
    ]);

    await deposit({
      tx: params.tx,
      coinA,
      coinB: params.tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [params.coinTypeB],
        arguments: [],
      }),
      amountA: new Decimal(params.inputCoinAmount.toString()),
      amountB: new Decimal(0),
      address: params.address,
      poolName: params.poolName,
    });
  } else {
    const [toSwap] = params.tx.splitCoins(params.coinObject, [
      params.inputCoinAmount.toString(),
    ]);
    const swapResult = await zapSwap({
      tx: params.tx,
      address: params.address,
      poolName: params.poolName,
      slippage: params.slippage,
      tokenIn: params.coinTypeB,
      tokenOut: params.coinTypeA,
      amountIn: params.inputCoinAmount.toString(),
      coinIn: toSwap,
    });

    await deposit({
      tx: params.tx,
      coinA: swapResult.coinOut,
      coinB: params.tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [params.coinTypeB],
        arguments: [],
      }),
      amountA: new Decimal(swapResult.amountOut.toString()),
      amountB: new Decimal(0),
      address: params.address,
      poolName: params.poolName,
    });
  }
  params.tx.transferObjects([params.coinObject], params.address);
}

async function deposit(params: {
  tx: Transaction;
  coinA: TransactionObjectArgument;
  coinB: TransactionObjectArgument;
  amountA: Decimal;
  amountB: Decimal;
  address: string;
  poolName: PoolName;
}) {
  // fee charge
  const feePercentage = 0;
  if (feePercentage > 0) {
    const amountAFee = ((Number(params.amountA) * feePercentage) / 100).toFixed(
      0,
    );
    const amountBFee = ((Number(params.amountB) * feePercentage) / 100).toFixed(
      0,
    );
    const [feeCoinA] = params.tx.splitCoins(params.coinA, [amountAFee]);
    const [feeCoinB] = params.tx.splitCoins(params.coinB, [amountBFee]);
    params.tx.transferObjects([feeCoinA, feeCoinB], getConf().FEE_ADDRESS);

    // Removing fee amounts from amounts
    params.amountA = params.amountA.sub(amountAFee);
    params.amountB = params.amountB.sub(amountBFee);
  }

  const pool1 = doubleAssetPoolCoinMap[params.poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[params.poolName].coin2;
  const receipt = await getReceipts(params.poolName, params.address, true);
  let depositCoinA: TransactionObjectArgument;
  let depositCoinB: TransactionObjectArgument;

  if (!params.amountA.eq(0) && !params.amountB.eq(0)) {
    // Conditional deposit calls based on pool and protocol
    let amounts = await getAmounts(
      params.poolName,
      true,
      params.amountA.toString(),
      false,
    );
    if (
      amounts[0] > params.amountA.toString() ||
      amounts[1] > params.amountB.toString()
    ) {
      amounts = await getAmounts(
        params.poolName,
        false,
        params.amountB.toString(),
        false,
      );
    }
    [depositCoinA] = params.tx.splitCoins(params.coinA, [amounts[0]]);
    [depositCoinB] = params.tx.splitCoins(params.coinB, [amounts[1]]);
    params.tx.transferObjects([params.coinA, params.coinB], params.address);
  } else {
    [depositCoinA, depositCoinB] = [params.coinA, params.coinB];
  }

  let someReceipt: any;
  if (receipt.length == 0) {
    [someReceipt] = params.tx.moveCall({
      target: `0x1::option::none`,
      typeArguments: [poolInfo[params.poolName].receiptType],
      arguments: [],
    });
  } else {
    [someReceipt] = params.tx.moveCall({
      target: `0x1::option::some`,
      typeArguments: [receipt[0].content.type],
      arguments: [params.tx.object(receipt[0].objectId)],
    });
  }

  if (poolInfo[params.poolName].parentProtocolName === "CETUS") {
    if (pool1 === "CETUS" && pool2 === "SUI") {
      params.tx = await depositCetusSuiTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else if (pool2 === "SUI") {
      params.tx = await depositCetusAlphaSuiTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else {
      params.tx = await depositCetusTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    }
  } else if (poolInfo[params.poolName].parentProtocolName === "BLUEFIN") {
    if (params.poolName === "BLUEFIN-FUNGIBLE-STSUI-SUI") {
      params.tx = await depositBluefinFungibleTxb(
        params.tx,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else if (
      params.poolName === "BLUEFIN-NAVX-VSUI" ||
      params.poolName === "BLUEFIN-ALPHA-USDC" ||
      params.poolName === "BLUEFIN-BLUE-USDC"
    ) {
      params.tx = await depositBluefinType2Txb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else if (pool1 === "SUI") {
      params.tx = await depositBluefinSuiFirstTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else if (pool2 === "SUI") {
      params.tx = await depositBluefinSuiSecondTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else if (pool1 === "STSUI" || pool2 === "STSUI") {
      params.tx = await depositBluefinStsuiTxb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    } else {
      params.tx = await depositBluefinType1Txb(
        params.tx,
        someReceipt,
        params.poolName,
        depositCoinA,
        depositCoinB,
      );
    }
  }
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
  if (poolinfo.strategyType === "AUTOBALANCE-LIQUIDITY-POOL") {
    await collectRewardTxb(poolName, true, txb);
  }
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
  } else if (AUTOBALANCE_SUI_FIRST_POOLS.includes(poolName)) {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::user_deposit_v4`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(poolinfo.parentPoolId),
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
  if (poolinfo.strategyType === "AUTOBALANCE-LIQUIDITY-POOL") {
    await collectRewardTxb(poolName, true, txb);
  }
  if (poolName === "BLUEFIN-USDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_AUSD_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_WBTC_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SEND_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
  } else if (AUTOBALANCE_TYPE_1_POOLS.includes(poolName)) {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v3`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(poolinfo.parentPoolId),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-SUIUSDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
  } else if (poolName === "BLUEFIN-SUIBTC-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
        coinsList["DEEP"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_V2_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUIBTC_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
        coinsList["DEEP"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_V2_VERSION),
        txb.object(getConf().VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().BLUEFIN_SUIBTC_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
        txb.object(cetusPoolMap["USDC-SUIBTC"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-LBTC-SUIBTC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
        coinsList["DEEP"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_V2_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_LBTC_SUIBTC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-SUIBTC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
        coinsList["DEEP"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_V2_VERSION),
        txb.object(getConf().VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().BLUEFIN_LBTC_SUIBTC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(getConf().BLUEFIN_DEEP_SUI_POOL),
        txb.object(cetusPoolMap["SUIBTC-LBTC"]),
        txb.object(cetusPoolMap["SUIBTC-SUI"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-WAL-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_investor::collect_and_swap_rewards_to_token_b_bluefin`,
      typeArguments: [
        coinsList[doubleAssetPoolCoinMap[poolName].coin1].type,
        coinsList[doubleAssetPoolCoinMap[poolName].coin2].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_4_VERSION),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
        txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["USDC-WAL"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
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
  if (poolinfo.strategyType === "AUTOBALANCE-LIQUIDITY-POOL") {
    await collectRewardTxb(poolName, true, txb);
  }
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
        txb.object(poolinfo.parentPoolId),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (AUTOBALANCE_SUI_SECOND_POOLS.includes(poolName)) {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_second_pool::user_deposit_v3`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(poolinfo.parentPoolId),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolinfo.strategyType === "LEVERAGE-YIELD-FARMING") {
    const coinAType = pool1 === "SUI" ? "0x2::sui::SUI" : coinsList[pool1].type;
    const coinBType = pool2 === "SUI" ? "0x2::sui::SUI" : coinsList[pool2].type;
    await alphalendClient.updatePrices(txb, [coinAType, coinBType]);

    await collectAndSwapRewardsLyf(poolName, txb);

    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_lyf_pool::user_deposit`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_LYF_VERSION),
        txb.object(getConf().VERSION),
        someReceipt,
        txb.object(poolinfo.poolId),
        depositCoinA,
        depositCoinB,
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(getConf().LENDING_PROTOCOL_ID),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(poolinfo.parentPoolId),
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
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
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
        txb.object(getConf().BLUEFIN_STSUI_USDC_ZERO_ONE_POOL),
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
        txb.pure.bool(true),
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
        txb.pure.bool(true),
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
        txb.pure.bool(true),
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
        txb.pure.bool(true),
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
  } else if (poolName === "BLUEFIN-WAL-STSUI") {
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
        txb.object(getConf().BLUEFIN_WAL_STSUI_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["WAL-SUI"]),
        txb.object(bluefinPoolMap["SUI-WAL"]),
        txb.object(getConf().LST_INFO),
        txb.object(getConf().SUI_SYSTEM_STATE),
        txb.pure.bool(true),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
};

const depositBluefinFungibleTxb = async (
  txb: Transaction,
  poolName: PoolName,
  depositCoinA: TransactionObjectArgument,
  depositCoinB: TransactionObjectArgument,
): Promise<Transaction> => {
  const poolinfo = poolInfo[poolName];
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolName === "BLUEFIN-FUNGIBLE-STSUI-SUI") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_stsui_sui_ft_pool::user_deposit`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        poolinfo.receiptType,
        coinsList["BLUE"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_FUNGIBLE_VERSION),
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
  }
  return txb;
};
