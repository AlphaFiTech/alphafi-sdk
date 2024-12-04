import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import {
  BluefinInvestor,
  CetusInvestor,
  cetusPoolMap,
  coinsList,
  CommonInvestorFields,
  doubleAssetPoolCoinMap,
  getConf,
  getInvestor,
  getParentPool,
  getReceipts,
  getSuiClient,
  poolInfo,
  PoolName,
  Receipt,
} from "../index.js";

export const depositCetusAlphaSuiTxb = async (
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
      txb.transferObjects([coin1], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const depositCetusSuiTxb = async (
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
      txb.transferObjects([coin1], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const depositCetusTxb = async (
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
  const poolinfo = poolInfo[poolName];
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

      txb.transferObjects([coin1], address);
      txb.transferObjects([coin2], address);
    } else {
      throw new Error(`No ${pool1} or ${pool2} Coins`);
    }
  }

  return txb;
};

export const withdrawCetusAlphaSuiTxb = async (
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
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_cetus_sui_pool::user_withdraw`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(getConf().ALPHA_POOL),
        txb.object(poolinfo.poolId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.pure.u128(xTokens),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
        txb.object(cetusPoolMap["CETUS-SUI"]),
        txb.object(cetusPoolMap[poolName]),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export const withdrawCetusSuiTxb = async (
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
    txb.moveCall({
      target: `${poolinfo.packageId}::alphafi_cetus_sui_pool::user_withdraw`,
      typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
      arguments: [
        txb.object(getConf().ALPHA_2_VERSION),
        txb.object(getConf().VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(getConf().ALPHA_POOL),
        txb.object(poolinfo.poolId),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.object(poolinfo.investorId),
        txb.pure.u128(xTokens),
        txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
        txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
        txb.object(cetusPoolMap[poolName]),
        txb.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export const withdrawCetusTxb = async (
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
    if (
      poolName == "WUSDC-WBTC" ||
      poolName == "USDC-USDT" ||
      poolName == "USDC-WUSDC" ||
      poolName == "USDC-ETH"
    ) {
      txb.moveCall({
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_pool_base_a::user_withdraw`,
        typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
        arguments: [
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
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
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphafi_cetus_pool::user_withdraw`,
        typeArguments: [coinsList[pool1].type, coinsList[pool2].type],
        arguments: [
          txb.object(getConf().VERSION),
          txb.object(receipt[0].objectId),
          alpha_receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(poolinfo.poolId),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          txb.object(poolinfo.investorId),
          txb.pure.u128(xTokens),
          txb.object(getConf().CETUS_GLOBAL_CONFIG_ID),
          txb.object(getConf().CETUS_REWARDER_GLOBAL_VAULT_ID),
          txb.object(cetusPoolMap[`${pool2}-SUI`]),
          txb.object(cetusPoolMap["CETUS-SUI"]),
          txb.object(cetusPoolMap[poolName]),
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else {
    throw new Error("No receipt found!");
  }

  return txb;
};

export async function getLiquidity(
  poolName: PoolName,
  a2b: boolean,
  amount: string,
) {
  const cetusInvestor = (await getInvestor(poolName, true)) as CetusInvestor &
    CommonInvestorFields;
  const cetus_pool = await getParentPool(poolName, true);
  //TODO
  //check if you calculate lower_tick, upper_tick like this only
  const upper_bound = 443636;
  let lower_tick = Number(cetusInvestor.content.fields.lower_tick);
  let upper_tick = Number(cetusInvestor.content.fields.upper_tick);

  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }

  // AlphaFi Mascot
  //
  //      a
  //    ~~|~~
  //     / \
  //
  /////////////////

  const current_sqrt_price = new BN(
    cetus_pool.content.fields.current_sqrt_price,
  );

  const liquidity = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
    lower_tick,
    upper_tick,
    new BN(`${Math.floor(parseFloat(amount))}`),
    a2b,
    false,
    0.5,
    current_sqrt_price,
  );
  return liquidity;
}

export async function getAmounts(
  poolName: PoolName,
  a2b: boolean,
  amount: string,
): Promise<[string, string] | undefined> {
  const liquidity = await getLiquidity(poolName, a2b, amount);
  if (liquidity) {
    const numA = liquidity.coinAmountA.toString();
    const numB = liquidity.coinAmountB.toString();

    return [numA, numB];
  }
}

export async function getCoinAmountsFromLiquidity(
  poolName: PoolName,
  liquidity: string,
): Promise<[string, string]> {
  const clmmPool = await getParentPool(poolName, true);
  const investor = (await getInvestor(poolName, true)) as (
    | CetusInvestor
    | BluefinInvestor
  ) &
    CommonInvestorFields;

  const upper_bound = 443636;
  let lower_tick = Number(investor!.content.fields.lower_tick);
  let upper_tick = Number(investor!.content.fields.upper_tick);

  if (lower_tick > upper_bound) {
    lower_tick = -~(lower_tick - 1);
  }
  if (upper_tick > upper_bound) {
    upper_tick = -~(upper_tick - 1);
  }
  if (clmmPool) {
    const liquidityInt = Math.floor(parseFloat(liquidity));
    const coin_amounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
      new BN(`${liquidityInt}`),
      new BN(clmmPool.content.fields.current_sqrt_price),
      TickMath.tickIndexToSqrtPriceX64(lower_tick),
      TickMath.tickIndexToSqrtPriceX64(upper_tick),
      true,
    );
    return [coin_amounts.coinA.toString(), coin_amounts.coinB.toString()];
  } else {
    return ["0", "0"];
  }
}
