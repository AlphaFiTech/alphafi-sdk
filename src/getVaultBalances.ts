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
  const balance = await buildAlphaVaultBalance(address, vaultsData);
  return balance;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildDoubleAssetVaultBalance(
    address,
    vaultsData,
    poolName,
  );
  return balance;
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance> {
  const vaultsData = await fetchUserVaultBalances(address);
  const balance = await buildSingleAssetVaultBalance(
    address,
    vaultsData,
    poolName,
  );
  return balance;
}

async function buildAlphaVaultBalance(address: string, vaultsData: any) {
  const receipt = await buildReceipt(
    address,
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
  address: string,
  vaultsData: any,
  poolName: PoolName,
) {
  const allObjects = [
    ...vaultsData.owner.alphaSuiObjects.nodes,
    ...vaultsData.owner.usdtUsdcObjects.nodes,
    ...vaultsData.owner.usdcWbtcObjects.nodes,
  ];

  const receipt = await buildReceipt(address, allObjects, poolName);
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
  address: string,
  vaultsData: any,
  poolName: PoolName,
) {
  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.owner.alphaObjects.nodes,
    ...vaultsData.owner.naviObjects.nodes,
  ];

  const receipt = await buildReceipt(address, allObjects, poolName);
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

async function buildReceipt(
  address: string,
  allObjects: any[],
  poolName: PoolName,
) {
  const receiptArr = allObjects.map((o) => {
    const poolNameFromQuery: PoolName =
      poolIdPoolNameMap[o.contents.json.pool_id];
    const addressFromQuery = o.contents.json.owner;
    const pool = poolInfo[poolName];
    // match both poolName and owner address
    if (poolName === poolNameFromQuery && address === addressFromQuery) {
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
  // get the first receipt because we support only one receipt from one pool
  const receipt = receiptArr.find((r) => {
    if (r) return true;
  });
  return receipt;
}
