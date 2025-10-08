import { Transaction } from "@mysten/sui/transactions";
import { doubleAssetPoolCoinMap, poolInfo } from "../common/maps.js";
import {
  BluefinInvestor,
  BluefinLyfInvestor,
  CetusInvestor,
  CommonInvestorFields,
  PoolName,
  PoolType,
} from "../common/types.js";
import { depositAlphaTxb } from "./alpha.js";
import { naviDepositTx } from "./navi.js";
import { bucketDepositTx } from "./bucket.js";
import {
  depositCetusAlphaSuiTxb,
  depositCetusSuiTxb,
  depositCetusTxb,
} from "./cetus.js";
import {
  depositBluefinFungibleTxb,
  depositBluefinStsuiTxb,
  depositBluefinSuiFirstTxb,
  depositBluefinSuiSecondTxb,
  depositBluefinType1Txb,
  depositBluefinType2Txb,
} from "./bluefin.js";
import { loopingDeposit } from "./navi-looping.js";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import {
  getInvestor,
  getParentPool,
  getPool,
} from "../sui-sdk/functions/getReceipts.js";
import { getSuiClient } from "../sui-sdk/client.js";
import {
  alphalendLoopingDeposit,
  alphalendSingleLoopDeposit,
} from "./alphalend.js";

export async function depositSingleAssetTxb(
  poolName: PoolName,
  address: string,
  amount: string,
) {
  let txb = new Transaction();
  if (poolInfo[poolName].parentProtocolName === "ALPHAFI") {
    txb = await depositAlphaTxb(amount, address);
  } else if (poolInfo[poolName].parentProtocolName === "BUCKET") {
    txb = await bucketDepositTx(amount, { address });
  } else if (poolInfo[poolName].parentProtocolName === "NAVI") {
    if (poolInfo[poolName].strategyType === "LOOPING") {
      txb = await loopingDeposit(poolName, amount, { address });
    } else {
      txb = await naviDepositTx(amount, poolName, { address });
    }
  } else if (poolInfo[poolName].parentProtocolName === "ALPHALEND") {
    if (poolInfo[poolName].strategyType === "LOOPING") {
      txb = await alphalendLoopingDeposit(poolName, amount, { address });
    } else if (poolInfo[poolName].strategyType === "SINGLE-LOOPING") {
      txb = await alphalendSingleLoopDeposit(poolName, amount, {
        address: address,
      });
    }
  }
  txb.setSender(address);
  const estimatedGasBudget = await getEstimatedGasBudget(txb, address);
  if (estimatedGasBudget) txb.setGasBudget(estimatedGasBudget);
  return txb;
}

export async function depositDoubleAssetTxb(
  poolName: PoolName,
  address: string,
  amount: string,
  isAmountA: boolean,
) {
  let txb = new Transaction();
  const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
  const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
  if (poolInfo[poolName].parentProtocolName === "CETUS") {
    if (coin1 === "CETUS" && coin2 === "SUI") {
      txb = await depositCetusSuiTxb(amount, poolName, isAmountA, { address });
    } else if (coin2 === "SUI") {
      txb = await depositCetusAlphaSuiTxb(amount, poolName, isAmountA, {
        address,
      });
    } else {
      txb = await depositCetusTxb(amount, poolName, isAmountA, { address });
    }
  } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
    if (poolName === "BLUEFIN-FUNGIBLE-STSUI-SUI") {
      txb = await depositBluefinFungibleTxb(amount, poolName, isAmountA, {
        address,
      });
    } else if (
      poolName === "BLUEFIN-NAVX-VSUI" ||
      poolName === "BLUEFIN-ALPHA-USDC" ||
      poolName === "BLUEFIN-BLUE-USDC"
    ) {
      txb = await depositBluefinType2Txb(amount, poolName, isAmountA, {
        address,
      });
    } else if (coin1 === "SUI") {
      txb = await depositBluefinSuiFirstTxb(amount, poolName, isAmountA, {
        address,
      });
    } else if (coin2 === "SUI") {
      txb = await depositBluefinSuiSecondTxb(amount, poolName, isAmountA, {
        address,
      });
    } else if (coin1 === "STSUI" || coin2 === "STSUI") {
      txb = await depositBluefinStsuiTxb(amount, poolName, isAmountA, {
        address,
      });
    } else {
      txb = await depositBluefinType1Txb(amount, poolName, isAmountA, {
        address,
      });
    }
  }
  txb.setSender(address);
  const estimatedGasBudget = await getEstimatedGasBudget(txb, address);
  if (estimatedGasBudget) txb.setGasBudget(estimatedGasBudget);
  return txb;
}

export async function getLiquidity(
  poolName: PoolName,
  a2b: boolean,
  amount: string,
  ignoreCache: boolean = true,
) {
  const cetusInvestor = (await getInvestor(
    poolName,
    ignoreCache,
  )) as CetusInvestor & CommonInvestorFields;
  const cetus_pool = await getParentPool(poolName, ignoreCache);
  //TODO
  //check if you calculate lower_tick, upper_tick like this only
  const upper_bound = 443636;
  let lower_tick = Number(cetusInvestor.content.fields.lower_tick);
  let upper_tick = Number(cetusInvestor.content.fields.upper_tick);
  if (poolInfo[poolName].strategyType === "LEVERAGE-YIELD-FARMING") {
    const pool = (await getPool(poolName, ignoreCache)) as PoolType;
    const investor = pool.content.fields.investor as BluefinLyfInvestor;
    lower_tick = Number(investor.fields.lower_tick);
    upper_tick = Number(investor.fields.upper_tick);
  }

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
  ignoreCache: boolean = true,
): Promise<[string, string]> {
  const liquidity = await getLiquidity(poolName, a2b, amount, ignoreCache);
  const numA = liquidity.coinAmountA.toString();
  const numB = liquidity.coinAmountB.toString();
  return [numA, numB];
}

export async function getCoinAmountsFromLiquidity(
  poolName: PoolName,
  liquidity: string,
  ignoreCache: boolean,
): Promise<[string, string]> {
  const clmmPool = await getParentPool(poolName, ignoreCache);
  const investor = (await getInvestor(poolName, ignoreCache)) as (
    | CetusInvestor
    | BluefinInvestor
  ) &
    CommonInvestorFields;

  const upper_bound = 443636;
  let lower_tick = 0;
  let upper_tick = 0;
  if (poolInfo[poolName].strategyType === "LEVERAGE-YIELD-FARMING") {
    const pool = (await getPool(poolName, ignoreCache)) as PoolType;
    const investor = pool.content.fields.investor as BluefinLyfInvestor;
    lower_tick = Number(investor.fields.lower_tick);
    upper_tick = Number(investor.fields.upper_tick);
  } else {
    lower_tick = Number(investor.content.fields.lower_tick);
    upper_tick = Number(investor.content.fields.upper_tick);
  }

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

export async function getEstimatedGasBudget(
  tx: Transaction,
  address: string,
): Promise<number | undefined> {
  const suiClient = getSuiClient();
  try {
    const simResult = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: address,
    });
    return (
      Number(simResult.effects.gasUsed.computationCost) +
      Number(simResult.effects.gasUsed.nonRefundableStorageFee) +
      1e8
    );
  } catch (err) {
    console.error(`Error estimating transaction gasBudget`, err);
  }
}
