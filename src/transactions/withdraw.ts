import { Transaction } from "@mysten/sui/transactions";
import { doubleAssetPoolCoinMap, poolInfo } from "../common/maps.js";
import { PoolName } from "../common/types.js";
import {
  withdrawCetusAlphaSuiTxb,
  withdrawCetusSuiTxb,
  withdrawCetusTxb,
} from "./cetus.js";
import {
  withdrawBluefinSuiFirstTxb,
  withdrawBluefinType1Txb,
} from "./bluefin.js";
import { naviWithdrawTx } from "./navi.js";
import { bucketWithdrawTx } from "./bucket.js";
import { withdrawAlphaTxb } from "./alpha.js";

export async function withdrawTxb(
  amount: string, // liquidity for doube-asset and xTokens for single-asset
  poolName: PoolName,
  address: string,
  withdrawFromLocked?: boolean, // needed for withdraw from alpha-vault
) {
  let txb = new Transaction();
  if (poolInfo[poolName].parentProtocolName === "CETUS") {
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
    if (coin1 === "CETUS" && coin2 === "SUI") {
      txb = await withdrawCetusSuiTxb(amount, poolName, { address });
    } else if (coin2 === "SUI") {
      txb = await withdrawCetusAlphaSuiTxb(amount, poolName, { address });
    } else {
      txb = await withdrawCetusTxb(amount, poolName, { address });
    }
  } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
    const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
    if (coin1 === "SUI") {
      txb = await withdrawBluefinSuiFirstTxb(amount, poolName, {
        address,
      });
    } else {
      txb = await withdrawBluefinType1Txb(amount, poolName, {
        address,
      });
    }
  } else if (poolInfo[poolName].parentProtocolName === "NAVI") {
    txb = await naviWithdrawTx(Number(amount), poolName, { address });
  } else if (poolInfo[poolName].parentProtocolName === "BUCKET") {
    txb = await bucketWithdrawTx(Number(amount), { address });
  } else if (
    poolInfo[poolName].parentProtocolName === "ALPHAFI" &&
    withdrawFromLocked
  ) {
    txb = await withdrawAlphaTxb(amount, withdrawFromLocked, address);
  }
  return txb;
}
