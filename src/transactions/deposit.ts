import { Transaction } from "@mysten/sui/transactions";
import { doubleAssetPoolCoinMap, poolInfo } from "../common/maps.js";
import { PoolName } from "../common/types.js";
import { depositAlphaTxb } from "./alpha.js";
import { naviDepositTx } from "./navi.js";
import { bucketDepositTx } from "./bucket.js";
import {
  depositCetusAlphaSuiTxb,
  depositCetusSuiTxb,
  depositCetusTxb,
} from "./cetus.js";
import {
  depositBluefinSuiFirstTxb,
  depositBluefinType1Txb,
  depositBluefinType2Txb,
} from "./bluefin.js";
import { loopingDeposit } from "./navi-looping.js";

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
    } else txb = await naviDepositTx(amount, poolName, { address });
  }
  return txb;
}

export async function depositDoubleAssetTxb(
  poolName: PoolName,
  address: string,
  amount: string,
  isAmountA: boolean,
) {
  let txb = new Transaction();
  if (poolInfo[poolName].parentProtocolName === "CETUS") {
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
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
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    if (poolName === "BLUEFIN-NAVX-VSUI" || poolName === "BLUEFIN-ALPHA-USDC") {
      txb = await depositBluefinType2Txb(amount, poolName, isAmountA, {
        address,
      });
    } else if (coin1 === "SUI") {
      txb = await depositBluefinSuiFirstTxb(amount, poolName, isAmountA, {
        address,
      });
    } else {
      txb = await depositBluefinType1Txb(amount, poolName, isAmountA, {
        address,
      });
    }
  }
  return txb;
}
