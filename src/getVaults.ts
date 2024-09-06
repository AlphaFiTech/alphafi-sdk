import {
  AlphaFiSingleAssetVault,
  AlphaFiDoubleAssetVault,
  AlphaFiVault,
} from "./common/types";
import { fetchUserVaults } from "./sui-sdk/functions/fetchUserVaults";

export async function getVaults(address: string): Promise<AlphaFiVault[]> {
  const vaultsArr: AlphaFiVault[] = await fetchUserVaults(address);
  return vaultsArr;
}

export async function getSingleAssetVaults(
  address: string,
): Promise<AlphaFiSingleAssetVault[]> {
  const vaultsArr: AlphaFiSingleAssetVault[] = [];

  const vaultsData = await fetchUserVaults(address);
  vaultsData.forEach((v) => {
    const data = v as AlphaFiSingleAssetVault;
    if (data.coinName) vaultsArr.push(data);
  });
  return vaultsArr;
}

export async function getDoubleAssetVaults(
  address: string,
): Promise<AlphaFiDoubleAssetVault[]> {
  const vaultsArr: AlphaFiDoubleAssetVault[] = [];
  const vaultsData = await fetchUserVaults(address);
  vaultsData.forEach((v) => {
    const data = v as AlphaFiDoubleAssetVault;
    if (data.coinNameA) vaultsArr.push(data);
  });
  return vaultsArr;
}
