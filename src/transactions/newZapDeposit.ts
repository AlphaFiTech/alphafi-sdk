import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { getConf } from "../common/constants";
import { CetusInvestor, CommonInvestorFields, PoolName } from "../common/types";
import {
  getInvestor,
  getParentPool,
  getReceipts,
} from "../sui-sdk/functions/getReceipts";
import {
  bluefinPoolMap,
  cetusPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../common/maps";
import { getSuiClient } from "../sui-sdk/client";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { getAmounts } from "./deposit";
import { Decimal } from "decimal.js";
import { SevenKGateway } from "./7k";
import { coinsList } from "../common/coins";

async function getCoinObject(
  coinType: string,
  tx: Transaction,
  suiClient: SuiClient,
  address: string,
): Promise<TransactionObjectArgument> {
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

  const [coin] = tx.splitCoins(tx.object(coins1[0].coinObjectId), [0n]);
  tx.mergeCoins(
    coin,
    coins1.map((c) => c.coinObjectId),
  );
  return coin;
}

export async function zapSwap(params: {
  tx: Transaction;
  address: string;
  poolName: PoolName;
  slippage: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  coinIn: TransactionObjectArgument;
}): Promise<TransactionObjectArgument | undefined> {
  const swapGateway = new SevenKGateway();
  const quoteResponse = await swapGateway.getQuote(
    params.tokenIn,
    params.tokenOut,
    params.amountIn,
    [poolInfo[params.poolName].parentPoolId],
  );
  if (!quoteResponse) {
    console.error("Error fetching quote for zap");
    return undefined;
  }

  const coinOut = await swapGateway.getTransactionBlock(
    params.tx,
    params.address,
    quoteResponse,
    params.slippage,
    params.coinIn,
  );
  if (!coinOut) {
    console.error("Error getting transaction block for zap");
    return undefined;
  }
  return coinOut;
}

async function getCoinsInRatio(params: {
  tx: Transaction;
  poolName: PoolName;
  coinA: TransactionObjectArgument;
  coinB: TransactionObjectArgument;
}) {
  const pool_token1: string = poolInfo[params.poolName].assetTypes[0];
  const pool_token2: string = poolInfo[params.poolName].assetTypes[1];
  const investor = (await getInvestor(
    params.poolName,
    false,
  )) as CetusInvestor & CommonInvestorFields;
  const parentPool = await getParentPool(params.poolName, false);
  const lower_tick = Number(investor.content.fields.lower_tick);
  const upper_tick = Number(investor.content.fields.upper_tick);
  const current_sqrt_price = parentPool.content.fields.current_sqrt_price;
  const current_tick_index =
    parentPool.content.fields.current_tick_index.fields.bits;
  console.log("current_tick_index", current_tick_index);
  console.log("lower_tick", lower_tick);
  console.log("upper_tick", upper_tick);
  console.log("current_sqrt_price", current_sqrt_price);

  const [
    coinA,
    coinB,
    remCoinA,
    remCoinB,
    coinAVal,
    coinBVal,
    remCoinAVal,
    remCoinBVal,
  ] = params.tx.moveCall({
    target: `${getConf().ALPHAFI_SWAPPER_PACKAGE_ID}::alphafi_swapper_utils::get_total_balance_in_ratio_with_limit`,
    typeArguments: [pool_token1, pool_token2],
    arguments: [
      params.coinA,
      params.coinB,
      params.tx.pure.u32(lower_tick),
      params.tx.pure.u32(upper_tick),
      params.tx.pure.u32(current_tick_index),
      params.tx.pure.u128(current_sqrt_price),
    ],
  });
  return {
    coinA,
    coinB,
    remCoinA,
    remCoinB,
    coinAVal,
    coinBVal,
    remCoinAVal,
    remCoinBVal,
  };
}

export async function zapDepositTxb(
  inputCoinAmount: bigint,
  isInputA: boolean,
  poolName: PoolName,
  slippage: number, // 1% --> 0.01
  address: string,
) {
  const tx = new Transaction();
  const suiClient = getSuiClient();
  const sevenKGateway = new SevenKGateway();
  const coinAType = poolInfo[poolName].assetTypes[0];
  const coinBType = poolInfo[poolName].assetTypes[1];

  const coinObject = await getCoinObject(
    isInputA ? coinAType : coinBType,
    tx,
    suiClient,
    address,
  );

  let [amountA, amountB] = (
    await getAmounts(poolName, isInputA, "1000000001")
  ).map((a) => new Decimal(a));
  console.log("amountA", amountA.toString());
  console.log("amountB", amountB.toString());

  let [convertedAmountA, convertedAmountB] = [amountA, amountB];

  // convert coinA of the initial ratio to coinB to get the ratio in terms of 1 coin i.e. coinB
  if (isInputA) {
    const quoteResponse = await sevenKGateway.getQuote(
      coinAType,
      coinBType,
      amountA.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    convertedAmountA = new Decimal(quoteResponse.returnAmountWithDecimal);
  } else {
    const quoteResponse = await sevenKGateway.getQuote(
      coinBType,
      coinAType,
      amountB.toString(),
      [poolInfo[poolName].parentPoolId],
    );
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    convertedAmountB = new Decimal(quoteResponse.returnAmountWithDecimal);
  }

  const totalAmount = convertedAmountA.add(convertedAmountB);
  if (isInputA) {
    // calculate amount of coinA to swap to Type B
    const toSwap = new Decimal(inputCoinAmount.toString())
      .mul(convertedAmountB)
      .div(totalAmount)
      // .mul(amountA.mul(slippage).div(totalAmount).add(1))
      .floor();

    const coinIn = tx.splitCoins(coinObject, [toSwap.floor().toString()]);

    const coinOut = await zapSwap({
      tx,
      address,
      poolName,
      slippage,
      tokenIn: coinAType,
      tokenOut: coinBType,
      amountIn: toSwap.toString(),
      coinIn,
    });
    if (!coinOut) {
      console.error("Error swapping for zap");
      return undefined;
    }

    const {
      coinA,
      coinB,
      remCoinA,
      remCoinB,
      coinAVal,
      coinBVal,
      remCoinAVal,
      remCoinBVal,
    } = await getCoinsInRatio({
      tx,
      poolName,
      coinA: coinObject,
      coinB: coinOut,
    });
    tx.transferObjects([remCoinA, remCoinB], address);
    await deposit({
      tx,
      depositCoinA: coinA,
      depositCoinB: coinB,
      address,
      poolName,
    });
  } else {
    // calculate amount of coinB to swap to Type A
    const toSwap = new Decimal(inputCoinAmount.toString())
      .mul(convertedAmountA)
      .div(totalAmount)
      // .mul(amountA.mul(slippage).div(totalAmount).add(1))
      .floor();
    console.log("inputCoinAmount", inputCoinAmount.toString());
    console.log("convertedAmountA", convertedAmountA.toString());
    console.log("convertedAmountB", convertedAmountB.toString());
    console.log("totalAmount", totalAmount.toString());
    console.log("toSwap", toSwap.toString());

    const coinIn = tx.splitCoins(coinObject, [toSwap.floor().toString()]);

    const coinOut = await zapSwap({
      tx,
      address,
      poolName,
      slippage,
      tokenIn: coinBType,
      tokenOut: coinAType,
      amountIn: toSwap.toString(),
      coinIn,
    });
    if (!coinOut) {
      console.error("Error swapping for zap");
      return undefined;
    }

    const {
      coinA,
      coinB,
      remCoinA,
      remCoinB,
      coinAVal,
      coinBVal,
      remCoinAVal,
      remCoinBVal,
    } = await getCoinsInRatio({
      tx,
      poolName,
      coinA: coinOut,
      coinB: coinObject,
    });
    console.log("coinAVal", coinAVal.toString());
    console.log("coinBVal", coinBVal.toString());
    console.log("remCoinAVal", remCoinAVal.toString());
    console.log("remCoinBVal", remCoinBVal.toString());
    tx.transferObjects([remCoinA, remCoinB], address);
    await deposit({
      tx,
      depositCoinA: coinA,
      depositCoinB: coinB,
      address,
      poolName,
    });
  }
  return tx;
}

async function deposit(params: {
  tx: Transaction;
  depositCoinA: TransactionObjectArgument;
  depositCoinB: TransactionObjectArgument;
  address: string;
  poolName: PoolName;
}) {
  // fee charge
  //   const feePercentage = 0.05;
  //   const amountAFee = ((Number(params.amountA) * feePercentage) / 100).toFixed(
  //     0,
  //   );
  //   const amountBFee = ((Number(params.amountB) * feePercentage) / 100).toFixed(
  //     0,
  //   );
  //   const [feeCoinA] = params.tx.splitCoins(params.coinA, [amountAFee]);
  //   const [feeCoinB] = params.tx.splitCoins(params.coinB, [amountBFee]);
  //   params.tx.transferObjects([feeCoinA, feeCoinB], getConf().FEE_ADDRESS);

  //   // Removing fee amounts from amounts and some slippage
  const pool1 = doubleAssetPoolCoinMap[params.poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[params.poolName].coin2;
  //   params.amountA = params.amountA.mul(0.995);
  //   params.amountB = params.amountB.mul(0.995);

  //   // Conditional deposit calls based on pool and protocol
  const receipt = await getReceipts(params.poolName, params.address, false);
  //   let amounts = await getAmounts(
  //     params.poolName,
  //     true,
  //     params.amountA.toString(),
  //     false,
  //   );
  //   if (
  //     amounts[0] > params.amountA.toString() ||
  //     amounts[1] > params.amountB.toString()
  //   ) {
  //     amounts = await getAmounts(
  //       params.poolName,
  //       false,
  //       params.amountB.toString(),
  //       false,
  //     );
  //   }
  //   const [depositCoinA] = params.tx.splitCoins(params.coinA, [amounts[0]]);
  //   const [depositCoinB] = params.tx.splitCoins(params.coinB, [amounts[1]]);

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
        params.depositCoinA,
        params.depositCoinB,
      );
    } else if (pool2 === "SUI") {
      params.tx = await depositCetusAlphaSuiTxb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    } else {
      params.tx = await depositCetusTxb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    }
  } else if (poolInfo[params.poolName].parentProtocolName === "BLUEFIN") {
    if (
      params.poolName === "BLUEFIN-NAVX-VSUI" ||
      params.poolName === "BLUEFIN-ALPHA-USDC" ||
      params.poolName === "BLUEFIN-BLUE-USDC"
    ) {
      params.tx = await depositBluefinType2Txb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    } else if (pool1 === "SUI") {
      params.tx = await depositBluefinSuiFirstTxb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    } else if (pool2 === "SUI") {
      params.tx = await depositBluefinSuiSecondTxb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    } else if (pool1 === "STSUI" || pool2 === "STSUI") {
      params.tx = await depositBluefinStsuiTxb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    } else {
      params.tx = await depositBluefinType1Txb(
        params.tx,
        someReceipt,
        params.poolName,
        params.depositCoinA,
        params.depositCoinB,
      );
    }
  }
  //   params.tx.transferObjects([params.coinA, params.coinB], params.address);
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
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["BLUE"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.poolId),
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.poolId),
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "BLUEFIN-AUTOBALANCE-SUI-LBTC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["BLUE"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.poolId),
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_sui_first_pool::collect_reward`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.poolId),
        txb.object(poolinfo.investorId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
        txb.object(getConf().BLUEFIN_SUI_LBTC_POOL),
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
  } else if (poolName === "BLUEFIN-AUTOBALANCE-USDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_USDT_USDC_POOL),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
  } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUIUSDT_USDC_POOL),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
  } else if (poolName === "BLUEFIN-AUTOBALANCE-WAL-USDC") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::user_deposit_v2`,
      typeArguments: [
        coinsList["WAL"].type,
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
        txb.object(getConf().BLUEFIN_WAL_USDC_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL),
        txb.object(cetusPoolMap["USDC-WAL"]),
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
  } else if (poolName === "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC-ZERO-ZERO") {
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_bluefin_type_1_pool::collect_and_swap_trade_fee`,
      typeArguments: [
        coinsList[pool1].type,
        coinsList[pool2].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(getConf().ALPHA_BLUEFIN_AUTOBALANCE_VERSION),
        txb.object(poolinfo.investorId),
        txb.object(getConf().BLUEFIN_GLOBAL_CONFIG),
        txb.object(getConf().BLUEFIN_SUIUSDT_USDC_ZERO_ZERO_POOL),
        txb.object(getConf().BLUEFIN_SUI_USDC_POOL),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
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
        txb.object(getConf().BLUEFIN_SUIUSDT_USDC_ZERO_ZERO_POOL),
        txb.object(getConf().BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND),
        txb.object(cetusPoolMap["USDC-SUIUSDT"]),
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
