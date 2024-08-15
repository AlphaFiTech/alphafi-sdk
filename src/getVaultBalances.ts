import { poolIdPoolNameMap, poolInfo } from "./common/maps";
import {
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  SingleAssetVaultBalance,
  PoolName,
  Receipt,
  AlphaReceipt,
} from "./common/types";

import { fetchUserVaultBalances } from "./graphql/fetchData";

export async function getAlphaVaultBalance(
  address: string,
): Promise<AlphaVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildAlphaVaultBalance(vaultsData);
  return balance;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildDoubleAssetVaultBalance(vaultsData, poolName);
  return balance;
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildSingleAssetVaultBalance(vaultsData, poolName);
  return balance;
}

async function buildAlphaVaultBalance(vaultsData: any) {
  const receipt = await buildReceipt(
    vaultsData.owner.alphaObjects.nodes,
    "ALPHA",
  );
  if (receipt) {
    // TODO: fill data
    console.log("receipt", "ALPHA", receipt);
    const balance: AlphaVaultBalance = {
      lockedAlphaCoins: null,
      lockedAlphaCoinsInUSD: null,
      unlockedAlphaCoins: null,
      unlockedAlphaCoinsInUSD: null,
      totalAlphaCoins: null,
      totalAlphaCoinsInUSD: null,
    };
    return balance;
  } else {
    return {
      lockedAlphaCoins: null,
      lockedAlphaCoinsInUSD: null,
      unlockedAlphaCoins: null,
      unlockedAlphaCoinsInUSD: null,
      totalAlphaCoins: null,
      totalAlphaCoinsInUSD: null,
    };
  }
}

async function buildDoubleAssetVaultBalance(
  vaultsData: any,
  poolName: PoolName,
) {
  const allObjects = [
    ...vaultsData.owner.alphaSuiObjects.nodes,
    ...vaultsData.owner.usdtUsdcObjects.nodes,
    ...vaultsData.owner.usdcWbtcObjects.nodes,
  ];

  const receipt = await buildReceipt(allObjects, poolName);
  if (receipt) {
    // TODO: fill data
    console.log("receipt", poolName, receipt);
    const balance: DoubleAssetVaultBalance = {
      coinA: null,
      coinB: null,
      valueInUSD: null,
    };
    return balance;
  } else {
    return {
      coinA: null,
      coinB: null,
      valueInUSD: null,
    };
  }
}

async function buildSingleAssetVaultBalance(
  vaultsData: any,
  poolName: PoolName,
) {
  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.owner.alphaObjects.nodes,
    ...vaultsData.owner.naviObjects.nodes,
  ];

  const receipt = await buildReceipt(allObjects, poolName);
  if (receipt) {
    // TODO: fill data
    console.log("receipt", poolName, receipt);
    const balance: SingleAssetVaultBalance = {
      coin: null,
      valueInUSD: null,
    };
    return balance;
  } else {
    return { coin: null, valueInUSD: null };
  }
}

async function buildReceipt(allObjects: any[], poolName: PoolName) {
  const receiptArr = allObjects.map((o) => {
    const poolNameFromQuery: PoolName =
      poolIdPoolNameMap[o.contents.json.pool_id];
    const pool = poolInfo[poolName];
    if (poolName === poolNameFromQuery) {
      if (pool.parentProtocolName === "ALPHAFI") {
        const receipt: AlphaReceipt = {
          lockedBalance: (
            BigInt(o.contents.json.xTokenBalance) -
            BigInt(o.contents.json.unlocked_xtokens)
          ).toString(),
          unlockedBalance: o.contents.json.unlocked_xtokens,
          balance: o.contents.json.xTokenBalance,
        };
        return receipt;
      } else if (
        pool.parentProtocolName === "CETUS" ||
        pool.parentProtocolName === "NAVI"
      ) {
        const receipt: Receipt = {
          balance: o.contents.json.xTokenBalance,
        };
        return receipt;
      }
    }
  });
  const receipt = receiptArr.find((r) => {
    if (r) return true;
  });
  return receipt;
}
