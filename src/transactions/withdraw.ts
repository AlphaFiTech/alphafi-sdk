import { Transaction } from "@mysten/sui/transactions";
import { doubleAssetPoolCoinMap, poolInfo } from "../common/maps.js";
import { PoolName } from "../common/types.js";
import {
  withdrawCetusAlphaSuiTxb,
  withdrawCetusSuiTxb,
  withdrawCetusTxb,
} from "./cetus.js";
import {
  withdrawBluefinStsuiTxb,
  withdrawBluefinSuiFirstTxb,
  withdrawBluefinSuiSecondTxb,
  withdrawBluefinType1Txb,
  withdrawBluefinType2Txb,
} from "./bluefin.js";
import { naviWithdrawTx } from "./navi.js";
import { bucketWithdrawTx } from "./bucket.js";
import { getPoolExchangeRate } from "../sui-sdk/functions/getReceipts.js";
import { loopingWithdraw } from "./navi-looping.js";
import { getLiquidity } from "./deposit.js";

export async function withdrawTxb(
  xTokensAmount: string,
  poolName: PoolName,
  address: string,
) {
  let txb = new Transaction();
  if (poolInfo[poolName].parentProtocolName === "CETUS") {
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
    if (coin1 === "CETUS" && coin2 === "SUI") {
      txb = await withdrawCetusSuiTxb(xTokensAmount, poolName, {
        address,
      });
    } else if (coin2 === "SUI") {
      txb = await withdrawCetusAlphaSuiTxb(xTokensAmount, poolName, {
        address,
      });
    } else {
      txb = await withdrawCetusTxb(xTokensAmount, poolName, {
        address,
      });
    }
  } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
    if (
      poolName === "BLUEFIN-NAVX-VSUI" ||
      poolName === "BLUEFIN-ALPHA-USDC" ||
      poolName === "BLUEFIN-BLUE-USDC"
    ) {
      txb = await withdrawBluefinType2Txb(xTokensAmount, poolName, {
        address,
      });
    } else if (coin1 === "SUI") {
      txb = await withdrawBluefinSuiFirstTxb(xTokensAmount, poolName, {
        address,
      });
    } else if (coin2 === "SUI") {
      txb = await withdrawBluefinSuiSecondTxb(xTokensAmount, poolName, {
        address,
      });
    } else if (coin1 === "STSUI" || coin2 === "STSUI") {
      txb = await withdrawBluefinStsuiTxb(xTokensAmount, poolName, {
        address,
      });
    } else {
      txb = await withdrawBluefinType1Txb(xTokensAmount, poolName, {
        address,
      });
    }
  } else if (poolInfo[poolName].parentProtocolName === "NAVI") {
    if (poolInfo[poolName].strategyType === "LOOPING") {
      txb = await loopingWithdraw(poolName, xTokensAmount, { address });
    } else txb = await naviWithdrawTx(xTokensAmount, poolName, { address });
  } else if (poolInfo[poolName].parentProtocolName === "BUCKET") {
    txb = await bucketWithdrawTx(xTokensAmount, { address });
  }
  txb.setSender(address);
  return txb;
}

export async function coinAmountToXTokensSingleAsset(
  amount: string,
  poolName: PoolName,
): Promise<string> {
  const exchangeRate = await getPoolExchangeRate(poolName, true);
  const xTokens = Math.floor(parseFloat(amount) / exchangeRate.toNumber());
  return xTokens.toString();
}

export async function coinAmountToXTokensDoubleAsset(
  amount: string,
  poolName: PoolName,
  isAmountA: boolean,
): Promise<string> {
  const liquidity = await getLiquidity(poolName, isAmountA, amount);
  const exchangeRate = await getPoolExchangeRate(poolName, true);
  const xTokens = Math.floor(
    parseFloat(liquidity.liquidityAmount.toString()) / exchangeRate.toNumber(),
  );
  return xTokens.toString();
}
