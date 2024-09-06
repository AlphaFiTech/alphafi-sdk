import {
  AlphaFiVaultBalance,
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  PoolName,
  SingleAssetVaultBalance,
} from "./common/types";
import { fetchUserVaultBalances } from "./sui-sdk/functions/fetchUserVaultBalances";

export async function getVaultBalance(
  address: string,
  poolName: PoolName
): Promise<AlphaFiVaultBalance | undefined> {
  const vaultBalance = await fetchUserVaultBalances(address, poolName);
  return vaultBalance;
}

export async function getAlphaVaultBalance(
  address: string,
  poolName: PoolName
): Promise<AlphaVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, poolName);
  return vaultBalance as AlphaVaultBalance;
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName
): Promise<SingleAssetVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, poolName);
  return vaultBalance as SingleAssetVaultBalance;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName
): Promise<DoubleAssetVaultBalance | undefined> {
  const vaultBalance = await getVaultBalance(address, poolName);
  return vaultBalance as DoubleAssetVaultBalance;
}
