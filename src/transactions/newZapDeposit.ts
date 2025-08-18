import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { PoolName, SwapOptions } from "../common/types.js";
import {
  bluefinPoolMap,
  cetusPoolMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../common/maps.js";
import { coinsList } from "../common/coins.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { getAmounts } from "./deposit.js";
import { SevenKGateway } from "./7k.js";
import { BN } from "bn.js";
import { Decimal } from "decimal.js";
import { getSuiClient } from "../sui-sdk/client.js";
import { getConf } from "../common/constants.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";

// async function _provideLiquidityFixedAmountInternalForAutoSwap(
//     pool: Pool,
//     position: ID | TransactionObjectArgument,
//     liquidityInput: LiquidityInput,
//     options?: IOnChainCallOptionalParamsWithCoinObjects
// ): Promise<TransactionBlock> {
//     const txb = options?.txb || new TransactionBlock();

//     const sender = options?.sender || this.signerConfig.address;

//     // Use the input amount of the fixed token rather than max amount
//     // else you may run into issues like user might not have more fixed tokens
//     // in their wallet for instance when a user provides the max coin A or max coin B
//     // liquidity.
//     let amountAMax;
//     let amountBMax;
//     if (options?.maxAmounts) {
//         [amountAMax, amountBMax] = options.maxAmounts;
//     } else {
//         [amountAMax, amountBMax] = liquidityInput.fix_amount_a
//             ? [liquidityInput.coinAmount, liquidityInput.tokenMaxB]
//             : [liquidityInput.tokenMaxA, liquidityInput.coinAmount];
//     }

//     const amount = liquidityInput.coinAmount;

//     const coinAObject = options?.coinAObject;
//     const coinBObject = options?.coinBObject;
//     let splitCoinA;
//     let mergeCoinA;
//     let splitCoinB;
//     let mergeCoinB;
//     if (coinAObject) {
//         [splitCoinB, mergeCoinB] = await CoinUtils.createCoinWithBalance(
//             this.suiClient,
//             txb,
//             amountBMax.toString(),
// txb.pure.bool(liquidityInput.fix_amount_a)
//         ],
//         target: `${this.config.CurrentPackage}::gateway::provide_liquidity_with_fixed_amount`,
//         typeArguments: [pool.coin_a.address, pool.coin_b.address]
//     });

//     // merge the remaining coins and send them all back to user
//     const coins: TransactionObjectArgument[] = [];

//     if (mergeCoinA) {
//         [mergeCoinA].forEach(item => {
//             if (item) {
//                 coins.push(item);

// }
//         });
//     }
//     if (mergeCoinB) {
//         [mergeCoinB].forEach(item => {
//             if (item) {
//                 coins.push(item);
//             }
//         });
//     }
//     if (coins.length > 0) {
//         txb.transferObjects(coins, sender);
//     }

//     return txb;
// }

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

  const [coin] = tx.splitCoins(tx.object(coins1[0].coinObjectId), [0]);
  tx.mergeCoins(
    coin,
    coins1.map((c) => c.coinObjectId),
  );
  return coin;
}

async function zapSwap(
  swapOptions: SwapOptions,
  tx: Transaction,
  poolName: PoolName,
  coinIn?: TransactionObjectArgument,
): Promise<
  | {
      coinOut: TransactionObjectArgument;
      amountOut: Decimal;
    }
  | undefined
> {
  const swapGateway = new SevenKGateway();
  const quoteResponse = await swapGateway.getQuote(swapOptions, [
    poolInfo[poolName].parentPoolId,
  ]);
  if (!quoteResponse) {
    console.error("Error fetching quote for zap");
    return undefined;
  }
  console.log("swapOptions", swapOptions, swapOptions.inAmount?.toString());
  console.log("quoteResponse", quoteResponse);
  const slippageReducedAmount = new Decimal(
    quoteResponse.returnAmountWithDecimal,
  )
    .mul(new Decimal(1).sub(swapOptions.slippage))
    .floor();
  const coinOut = await swapGateway.getTransactionBlock(
    swapOptions,
    quoteResponse,
    tx,
    coinIn,
  );
  if (!coinOut) {
    console.error("Error getting transaction block for zap");
    return undefined;
  }

  const returnCoinOut = tx.splitCoins(coinOut, [
    slippageReducedAmount.toString(),
  ]);
  tx.transferObjects([coinOut], swapOptions.senderAddress);
  return {
    coinOut: returnCoinOut,
    amountOut: slippageReducedAmount,
  };
}

export async function zapDepositTxb1(
  inputCoinAmount: bigint,
  isInputA: boolean,
  poolName: PoolName,
  slippage: number, // 1% --> 0.01
  address: string,
): Promise<Transaction | undefined> {
  const tx = new Transaction();
  const suiClient = getSuiClient();
  const coinA = coinsList[doubleAssetPoolCoinMap[poolName].coin1];
  const coinB = coinsList[doubleAssetPoolCoinMap[poolName].coin2];

  // get inital ratio in terms of 2 coins
  let [amountA, amountB] = (
    await getAmounts(poolName, isInputA, inputCoinAmount.toString())
  ).map((a) => new Decimal(a));

  console.log("amountA", amountA.toString());
  console.log("amountB", amountB.toString());
  // convert coinA of the initial ratio to coinB to get the ratio in terms of 1 coin i.e. coinB
  const swapGateway = new SevenKGateway();
  if (isInputA) {
    const swapOptions: SwapOptions = {
      pair: {
        coinA: coinA,
        coinB: coinB,
      },
      senderAddress: address,
      slippage,
      inAmount: new BN(amountA.toString()),
    };
    const quoteResponse = await swapGateway.getQuote(swapOptions, [
      poolInfo[poolName].parentPoolId,
    ]);
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountA = new Decimal(quoteResponse.returnAmountWithDecimal);
  } else {
    const swapOptions: SwapOptions = {
      pair: {
        coinA: coinB,
        coinB: coinA,
      },
      senderAddress: address,
      slippage,
      inAmount: new BN(amountB.toString()),
    };
    const quoteResponse = await swapGateway.getQuote(swapOptions, [
      poolInfo[poolName].parentPoolId,
    ]);
    if (!quoteResponse) {
      console.error("Error fetching quote for zap");
      return undefined;
    }
    amountB = new Decimal(quoteResponse.returnAmountWithDecimal);
  }

  // get input coin and handle how much of input coin needs to be swapped
  const totalAmount = amountA.add(amountB);
  let [inputCoinToType1, inputCoinToType2] = [new Decimal(0), new Decimal(0)];
  const coinObject = await getCoinObject(
    isInputA ? coinA.type : coinB.type,
    tx,
    suiClient,
    address,
  );
  console.log("amountA after swap", amountA.toString());
  console.log("amountB after swap", amountB.toString());
  console.log("totalAmount after swap", totalAmount.toString());

  if (isInputA) {
    inputCoinToType2 = new Decimal(inputCoinAmount.toString())
      .mul(amountB)
      .div(totalAmount)
      // .mul(amountA.mul(slippage).div(totalAmount).add(1))
      .floor();

    const coinIn = tx.splitCoins(coinObject, [
      inputCoinToType2.floor().toString(),
    ]);
    const swapOptions: SwapOptions = {
      pair: {
        coinA: coinA,
        coinB: coinB,
      },
      senderAddress: address,
      slippage,
      inAmount: new BN(inputCoinToType2.floor().toString()),
    };

    const swapResult = await zapSwap(swapOptions, tx, poolName, coinIn);
    if (!swapResult) {
      console.error("Error swapping for zap");
      return undefined;
    }
    const { coinOut: coinOutB, amountOut } = swapResult;
    inputCoinToType1 = new Decimal(
      (await getAmounts(poolName, false, amountOut.toString(), false))[0],
    );
    const coinOutA = tx.splitCoins(coinObject, [
      inputCoinToType1.floor().toString(),
    ]);
    deposit({
      tx,
      coinA: coinOutA,
      coinB: coinOutB,
      amountA: inputCoinToType1.floor(),
      amountB: amountOut.floor(),
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
    const coinIn = tx.splitCoins(coinObject, [inputCoinToType1.toString()]);

    // swap coinB to coinA
    const swapOptions: SwapOptions = {
      pair: {
        coinA: coinB,
        coinB: coinA,
      },
      senderAddress: address,
      slippage,
      inAmount: new BN(inputCoinToType1.toString()),
    };
    const swapResult = await zapSwap(swapOptions, tx, poolName, coinIn);
    if (!swapResult) {
      console.error("Error swapping for zap");
      return undefined;
    }
    const { coinOut: coinOutA, amountOut } = swapResult;

    // calculate amount of coinB needed corresponding to the coinA swapped amount
    inputCoinToType2 = new Decimal(
      (await getAmounts(poolName, true, amountOut.toString(), false))[1],
    );
    console.log("inputCoinToType1", inputCoinToType1.toString());
    console.log("amountOut", amountOut.toString());
    console.log("inputCoinToType2", inputCoinToType2.toString());

    const coinOutB = tx.splitCoins(coinObject, [
      inputCoinToType2.floor().toString(),
    ]);
    deposit({
      tx,
      coinA: coinOutA,
      coinB: coinOutB,
      amountA: amountOut.floor(),
      amountB: inputCoinToType2.floor(),
      address,
      poolName,
    });
  }
  tx.transferObjects([coinObject], address);
  tx.setGasBudget(1_000_000_000n);
  return tx;
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
  const feePercentage = 0.05;
  const amountAFee = ((Number(params.amountA) * feePercentage) / 100).toFixed(
    0,
  );
  const amountBFee = ((Number(params.amountB) * feePercentage) / 100).toFixed(
    0,
  );
  const [feeCoinA] = params.tx.splitCoins(params.coinA, [amountAFee]);
  const [feeCoinB] = params.tx.splitCoins(params.coinB, [amountBFee]);
  params.tx.transferObjects([feeCoinA, feeCoinB], getConf().FEE_ADDRESS);

  // Removing fee amounts from amounts and some slippage
  const pool1 = doubleAssetPoolCoinMap[params.poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[params.poolName].coin2;
  params.amountA = params.amountA.mul(0.995);
  params.amountB = params.amountB.mul(0.995);

  // Conditional deposit calls based on pool and protocol
  const receipt = await getReceipts(params.poolName, params.address, false);
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
  const [depositCoinA] = params.tx.splitCoins(params.coinA, [amounts[0]]);
  const [depositCoinB] = params.tx.splitCoins(params.coinB, [amounts[1]]);

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
    if (
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
  params.tx.transferObjects([params.coinA, params.coinB], params.address);
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
