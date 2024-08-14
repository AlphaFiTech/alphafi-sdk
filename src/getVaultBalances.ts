import {
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  SingleAssetVaultBalance,
  PoolName,
} from "./common/types";

export async function getAlphaVaultBalance(
  address: string,
): Promise<AlphaVaultBalance> {
  const balance: AlphaVaultBalance = {
    lockedAlphaCoins: null,
    lockedAlphaCoinsInUSD: null,
    unlockedAlphaCoins: null,
    unlockedAlphaCoinsInUSD: null,
    totalAlphaCoins: null,
    totalAlphaCoinsInUSD: null,
  };

  console.log(address);

  return balance;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance> {
  const balance: DoubleAssetVaultBalance = {
    coinA: null,
    coinB: null,
    valueInUSD: null,
  };

  console.log(address, poolName);

  return balance;
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance> {
  const balance: SingleAssetVaultBalance = { coin: null, valueInUSD: null };

  console.log(address, poolName);

  return balance;
}
