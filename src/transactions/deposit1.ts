// import { Transaction } from "@mysten/sui/transactions";
// import { doubleAssetPoolCoinMap, poolInfo } from "../common/maps.js";
// import { depositAlphaTxb } from "./alpha.js";
// import { naviDepositTx } from "./navi.js";
// import { bucketDepositTx } from "./bucket.js";
// import {
//   depositCetusAlphaSuiTxb,
//   depositCetusSuiTxb,
//   depositCetusTxb,
// } from "./cetus.js";
// import {
//   depositBluefinSuiFirstTxb,
//   depositBluefinType1Txb,
// } from "./bluefin.js";
// import {
//   DepositParams,
//   DoubleAssetDepositParams,
//   SingleAssetDepositParams,
// } from "./types.js";

// export async function depositTxb(params: DepositParams) {
//   let txb = new Transaction();
//   if (poolInfo[params.poolName].assetType.length === 1) {
//     txb = await depositSingleAssetTxb(params as SingleAssetDepositParams);
//   } else if (poolInfo[params.poolName].assetType.length === 1) {
//     txb = await depositDoubleAssetTxb(params as DoubleAssetDepositParams);
//   }
//   return txb;
// }

// export async function depositSingleAssetTxb(params: SingleAssetDepositParams) {
//   let txb = new Transaction();
//   const { poolName, address, amount } = params;
//   if (poolInfo[poolName].parentProtocolName === "ALPHAFI") {
//     txb = await depositAlphaTxb(amount, address);
//   } else if (poolInfo[poolName].parentProtocolName === "NAVI") {
//     txb = await naviDepositTx(Number(amount), poolName, { address });
//   } else if (poolInfo[poolName].parentProtocolName === "BUCKET") {
//     txb = await bucketDepositTx(Number(amount), { address });
//   }
//   return txb;
// }

// export async function depositDoubleAssetTxb(params: DoubleAssetDepositParams) {
//   let txb = new Transaction();
//   const { poolName, address, amount, isAmountA } = params;
//   if (poolInfo[poolName].parentProtocolName === "CETUS") {
//     const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
//     const coin2 = doubleAssetPoolCoinMap[poolName].coin2;
//     if (coin1 === "CETUS" && coin2 === "SUI") {
//       txb = await depositCetusSuiTxb(amount, poolName, isAmountA, { address });
//     } else if (coin2 === "SUI") {
//       txb = await depositCetusAlphaSuiTxb(amount, poolName, isAmountA, {
//         address,
//       });
//     } else {
//       txb = await depositCetusTxb(amount, poolName, isAmountA, { address });
//     }
//   } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
//     const coin1 = doubleAssetPoolCoinMap[poolName].coin1;
//     if (coin1 === "SUI") {
//       txb = await depositBluefinSuiFirstTxb(amount, poolName, isAmountA, {
//         address,
//       });
//     } else {
//       txb = await depositBluefinType1Txb(amount, poolName, isAmountA, {
//         address,
//       });
//     }
//   }
//   return txb;
// }

// function extractXTokensAmount(transaction: Transaction): string {
//   const inputWithPure = transaction
//     .getData()
//     .inputs.find((input) => input.Pure !== undefined);
//   if (!inputWithPure || !inputWithPure.Pure?.bytes) {
//     throw new Error("Unable to extract xTokensAmount from inputs");
//   }

//   const bytes = inputWithPure.Pure.bytes;
//   console.log(bytes);
//   const parsedU128 = bcs.u128().parse(fromB64(bytes));
//   const parsedBytes = bcs.bytes(4).parse(fromB64(bytes));
//   console.log("u128", parsedU128);
//   console.log("bytes", parsedBytes);
//   return new BigNumber(toHEX(fromB64(bytes)), 16).toString();
// }
