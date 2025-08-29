import { Transaction } from "@mysten/sui/transactions";
import {
  bluefinPoolMap,
  cetusPoolMap,
  coinsList,
  getConf,
  getReceipts,
  getSuiClient,
  loopingPoolCoinMap,
  poolInfo,
} from "../index.js";
import { PoolName, Receipt } from "../common/types.js";
import { AlphalendClient } from "@alphafi/alphalend-sdk";
import { getCoinObject } from "./bluefin.js";

export async function alphalendLoopingDeposit(
  poolName: PoolName,
  amount: string,
  options: { address: string },
) {
  let txb = new Transaction();

  if (poolName === "ALPHALEND-LOOP-SUI-STSUI") {
    txb = await alphalendSuiStsuiLoopDepositTx(amount, options);
  }
  return txb;
}
export async function alphalendLoopingWithdraw(
  poolName: PoolName,
  xTokens: string,
  options: { address: string },
) {
  let txb = new Transaction();

  if (poolName === "ALPHALEND-LOOP-SUI-STSUI") {
    txb = await alphalendSuiStsuiLoopWithdrawTx(xTokens, options);
  }
  return txb;
}
export const alphalendClient = new AlphalendClient("mainnet", getSuiClient());
export async function alphalendSuiStsuiLoopDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolName = "ALPHALEND-LOOP-SUI-STSUI";
  const poolData = poolInfo[poolName];

  await alphalendClient.updatePrices(txb, [
    coinsList["STSUI"].type,
    "0x2::sui::SUI",
  ]);
  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
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
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_one_swap`,
    typeArguments: [coinsList["ALPHA"].type],
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(poolData.investorId),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
      txb.object(C.BLUEFIN_GLOBAL_CONFIG),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap_v2`,
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(poolData.investorId),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_v2`,
    typeArguments: [coinsList["BLUE"].type],
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(poolData.investorId),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.LST_INFO),
      txb.object(C.SUI_SYSTEM_STATE),
      txb.object(cetusPoolMap[`BLUE-SUI`]),
      txb.object(C.CETUS_GLOBAL_CONFIG_ID),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::user_deposit_v3`,
    arguments: [
      txb.object(C.ALPHA_5_VERSION),
      txb.object(C.VERSION),
      someReceipt,
      txb.object(poolData.poolId),
      depositCoin,
      txb.object(poolData.investorId),
      txb.object(C.ALPHA_DISTRIBUTOR),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.LST_INFO),
      txb.object(C.SUI_SYSTEM_STATE),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });

  return txb;
}
export async function collectAndSwapRewardsSingleLoop(
  poolName: PoolName,
  tx?: Transaction,
): Promise<Transaction> {
  const txb = tx ? tx : new Transaction();
  const C = getConf();
  const poolData = poolInfo[poolName];
  if (poolName === "ALPHALEND-SINGLE-LOOP-TBTC") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["ALPHA"].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(false),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["STSUI"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`STSUI-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["SUI"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["TBTC"].type,
        coinsList["TBTC"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`TBTC-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-SUIBTC") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["ALPHA"].type,
        coinsList["STSUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(false),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["SUIBTC"].type,
        coinsList["SUI"].type,
        coinsList["SUIBTC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-SUIBTC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName === "ALPHALEND-SINGLE-LOOP-XAUM") {
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["ALPHA"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["DEEP"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`DEEP-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["BLUE"].type,
        coinsList["SUI"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`BLUE-SUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["SUI"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`SUI-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(true),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["XBTC"].type,
        coinsList["USDC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`XBTC-USDC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::collect_reward_and_swap_bluefin`,
      typeArguments: [
        coinsList["XAUM"].type,
        coinsList["XAUM"].type,
        coinsList["XBTC"].type,
      ],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`XAUM-XBTC`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.pure.bool(false),
        txb.pure.bool(true),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  }
  return txb;
}
export async function alphalendSingleLoopDeposit(
  poolName: PoolName,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo[poolName];

  const coinName = loopingPoolCoinMap[poolName].supplyCoin;

  await alphalendClient.updatePrices(txb, [coinsList[coinName].type]);
  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
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
  let totalCoin: any;
  if (coinName === "SUI") {
    totalCoin = txb.gas;
  } else {
    totalCoin = await getCoinObject(coinsList[coinName].type, address, txb);
  }
  const [depositCoin] = txb.splitCoins(totalCoin, [amount]);
  await collectAndSwapRewardsSingleLoop(poolName, txb);
  txb.moveCall({
    target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::user_deposit`,
    typeArguments: [coinsList[coinName].type],
    arguments: [
      txb.object(C.ALPHA_ALPHALEND_VERSION),
      txb.object(C.VERSION),
      someReceipt,
      txb.object(poolData.poolId),
      depositCoin,
      txb.object(poolData.investorId),
      txb.object(C.ALPHA_DISTRIBUTOR),
      txb.object(C.LENDING_PROTOCOL_ID),
      txb.object(C.CLOCK_PACKAGE_ID),
    ],
  });
  txb.transferObjects([totalCoin], address);
  return txb;
}

export async function alphalendSuiStsuiLoopWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolName = "ALPHALEND-LOOP-SUI-STSUI";
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  await alphalendClient.updatePrices(txb, [
    coinsList["STSUI"].type,
    "0x2::sui::SUI",
  ]);
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
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_one_swap`,
      typeArguments: [coinsList["ALPHA"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(bluefinPoolMap[`ALPHA-STSUI`]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_no_swap_v2`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::collect_v3_rewards_with_two_swaps_v2`,
      typeArguments: [coinsList["BLUE"].type],
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(cetusPoolMap[`BLUE-SUI`]),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    const [stsui_coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_navi_sui_stsui_pool::user_withdraw_v3`,
      arguments: [
        txb.object(C.ALPHA_5_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["SUI"].type}>`],
      arguments: [stsui_coin, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ALPHALEND-LOOP-SUI-STSUI Receipt`);
  }

  return txb;
}
export async function alphalendSingleLoopWithdraw(
  poolName: PoolName,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo[poolName];

  const receipt: Receipt[] = await getReceipts(
    poolName as PoolName,
    address,
    true,
  );

  const alphaReceipt: Receipt[] = await getReceipts("ALPHA", address, true);

  const coinName = loopingPoolCoinMap[poolName].supplyCoin;

  await alphalendClient.updatePrices(txb, [coinsList[coinName].type]);
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
    await collectAndSwapRewardsSingleLoop(poolName, txb);
    const [coin] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_alphalend_single_loop_pool::user_withdraw`,
      typeArguments: [coinsList[coinName].type],
      arguments: [
        txb.object(C.ALPHA_ALPHALEND_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error(`No ALPHALEND-LOOP-SUI-STSUI Receipt`);
  }

  return txb;
}
