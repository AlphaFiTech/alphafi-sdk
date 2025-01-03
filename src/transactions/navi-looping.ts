import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { getConf } from "../common/constants.js";
import { getSuiClient } from "../sui-sdk/client.js";
import {
  cetusPoolMap,
  poolInfo,
  singleAssetPoolCoinMap,
} from "../common/maps.js";
import { PoolName, Receipt } from "../common/types.js";
import { coinsList } from "../common/coins.js";
import { getReceipts } from "../sui-sdk/functions/getReceipts.js";

export async function loopingDeposit(
  poolName: PoolName,
  amount: string,
  options: { address: string },
) {
  let txb = new Transaction();
  if (poolName === "NAVI-LOOP-HASUI-SUI") {
    txb = await naviHasuiSuiLoopDepositTx(amount, options);
  } else if (poolName === "NAVI-LOOP-SUI-VSUI") {
    txb = await naviSuiVsuiLoopDepositTx(amount, options);
  } else if (poolName === "NAVI-LOOP-USDC-USDT") {
    txb = await naviUsdcUsdtLoopDepositTx(amount, options);
  } else if (poolName === "NAVI-LOOP-USDT-USDC") {
    txb = await naviUsdtUsdcLoopDepositTx(amount, options);
  }
  return txb;
}

export async function loopingWithdraw(
  poolName: PoolName,
  xTokens: string,
  options: { address: string },
) {
  let txb = new Transaction();
  if (poolName === "NAVI-LOOP-HASUI-SUI") {
    txb = await naviHasuiSuiLoopWithdrawTx(xTokens, options);
  } else if (poolName === "NAVI-LOOP-SUI-VSUI") {
    txb = await naviSuiVsuiLoopWithdrawTx(xTokens, options);
  } else if (poolName === "NAVI-LOOP-USDC-USDT") {
    txb = await naviUsdcUsdtLoopWithdrawTx(xTokens, options);
  } else if (poolName === "NAVI-LOOP-USDT-USDC") {
    txb = await naviUsdtUsdcLoopWithdrawTx(xTokens, options);
  }
  return txb;
}

export async function naviHasuiSuiLoopDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-HASUI-SUI"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-HASUI-SUI" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-HASUI-SUI"].coin].type,
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

    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_hasui_sui_pool::user_deposit`, // change package id for testing
      typeArguments: [C.NAVX_COIN_TYPE],
      arguments: [
        txb.object(C.ALPHA_2_VERSION), // change version object id for testing
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_HASUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["HASUI-SUI"]),
        txb.object(C.HAEDEL_STAKING),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviSuiVsuiLoopDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-SUI-VSUI"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-SUI-VSUI" as PoolName,
    address,
    true,
  );

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

  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_vsui_pool::user_deposit`,
    typeArguments: [coinsList["NAVX"].type],
    arguments: [
      txb.object(C.ALPHA_2_VERSION),
      txb.object(C.VERSION),
      someReceipt,
      txb.object(poolData.poolId),
      depositCoin,
      txb.object(poolData.investorId),
      txb.object(C.ALPHA_DISTRIBUTOR),
      txb.object(C.PRICE_ORACLE),
      txb.object(C.NAVI_STORAGE),
      txb.object(C.NAVI_VSUI_POOL),
      txb.object(C.NAVI_SUI_POOL),
      txb.object(C.NAVI_INCENTIVE_V1),
      txb.object(C.NAVI_INCENTIVE_V2),
      txb.object(C.NAVI_NAVX_FUNDS_POOL),
      txb.object(C.NAVI_VSUI_FUNDS_POOL),
      txb.object(C.CETUS_GLOBAL_CONFIG_ID),
      txb.object(cetusPoolMap["NAVX-SUI"]),
      txb.object(cetusPoolMap["VSUI-SUI"]),
      txb.object(C.VOLO_NATIVE_POOL),
      txb.object(C.VOLO_METADATA),
      txb.object(C.SUI_SYSTEM_STATE),
      txb.object(C.KRIYA_VSUI_SUI_POOL),
      txb.object(C.KRIYA_VERSION),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });

  return txb;
}

export async function naviUsdcUsdtLoopDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-USDC-USDT"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDC-USDT" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-USDC-USDT"].coin].type,
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

    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::user_deposit_v2`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.BLUEFIN_USDT_USDC_POOL),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviUsdtUsdcLoopDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-USDT-USDC"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDT-USDC" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType:
        coinsList[singleAssetPoolCoinMap["NAVI-LOOP-USDT-USDC"].coin].type,
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

    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_usdt_usdc_pool::user_deposit`,
      typeArguments: [coinsList["NAVX"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function naviHasuiSuiLoopWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-HASUI-SUI"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-HASUI-SUI" as PoolName,
    address,
    true,
  );

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

    const [hasuiCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_hasui_sui_pool::user_withdraw`, // change package id for testing
      typeArguments: [C.NAVX_COIN_TYPE],
      arguments: [
        txb.object(C.ALPHA_2_VERSION), // change  version object id for testing
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
        txb.object(C.NAVI_HASUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["HASUI-SUI"]),
        txb.object(C.HAEDEL_STAKING),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["HASUI"].type}>`],
      arguments: [hasuiCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-HASUI-SUI"} Receipt`);
  }

  return txb;
}

export async function naviSuiVsuiLoopWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-SUI-VSUI"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-SUI-VSUI" as PoolName,
    address,
    true,
  );

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

    const [vsui_coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_vsui_pool::user_withdraw`,
      typeArguments: [coinsList["NAVX"].type],
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
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
        txb.object(C.NAVI_VSUI_POOL),
        txb.object(C.NAVI_SUI_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(C.VOLO_NATIVE_POOL),
        txb.object(C.VOLO_METADATA),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.KRIYA_VSUI_SUI_POOL),
        txb.object(C.KRIYA_VERSION),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["VSUI"].type}>`],
      arguments: [vsui_coin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-SUI-VSUI"} Receipt`);
  }

  return txb;
}

export async function naviUsdcUsdtLoopWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-USDC-USDT"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDC-USDT" as PoolName,
    address,
    true,
  );

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

    const [usdcCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_native_usdc_usdt_pool::user_withdraw_v2`,
      arguments: [
        txb.object(C.ALPHA_2_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u256(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.BLUEFIN_USDT_USDC_POOL),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["USDC"].type}>`],
      arguments: [usdcCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-USDC-USDT"} Receipt`);
  }

  return txb;
}

export async function naviUsdtUsdcLoopWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();

  const poolData = poolInfo["NAVI-LOOP-USDT-USDC"];

  const receipt: Receipt[] = await getReceipts(
    "NAVI-LOOP-USDT-USDC" as PoolName,
    address,
    true,
  );

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

    const [usdtCoin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_usdt_usdc_pool::user_withdraw`,
      typeArguments: [coinsList["NAVX"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u256(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.PRICE_ORACLE),
        txb.object(C.NAVI_STORAGE),
        txb.object(C.NAVI_USDT_POOL),
        txb.object(C.NAVI_USDC_POOL),
        txb.object(C.NAVI_INCENTIVE_V1),
        txb.object(C.NAVI_INCENTIVE_V2),
        txb.object(C.NAVI_VSUI_FUNDS_POOL),
        txb.object(C.NAVI_NAVX_FUNDS_POOL),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(cetusPoolMap["VSUI-SUI"]),
        txb.object(cetusPoolMap["USDC-USDT"]),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(cetusPoolMap["NAVX-SUI"]),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["USDT"].type}>`],
      arguments: [usdtCoin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"NAVI-LOOP-USDT-USDC"} Receipt`);
  }

  return txb;
}
