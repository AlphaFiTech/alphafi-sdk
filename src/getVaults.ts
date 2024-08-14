import {
  AlphaFiSingleAssetVault,
  AlphaFiDoubleAssetVault,
} from "./common/types";

export async function getVaults(
  address: string,
): Promise<(AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault)[]> {
  const vaultsArr: (AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault)[] = [];
  console.log(address);
  return vaultsArr;
}

export async function getSingleAssetVaults(
  address: string,
): Promise<AlphaFiSingleAssetVault[]> {
  const vaultsArr: AlphaFiSingleAssetVault[] = [];
  console.log(address);
  return vaultsArr;
}

export async function getDoubleAssetVaults(
  address: string,
): Promise<AlphaFiDoubleAssetVault[]> {
  const vaultsArr: AlphaFiDoubleAssetVault[] = [];
  console.log(address);
  return vaultsArr;
}
