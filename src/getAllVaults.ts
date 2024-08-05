import { poolInfo } from "./common/maps";

export async function getAllVaults(): Promise<string[]> {
  const vaultsArr = [];
  for (const pool of Object.keys(poolInfo)) {
    vaultsArr.push(pool);
  }
  return vaultsArr;
}

export async function getAllSingleAssetVaults(): Promise<string[]> {
  const vaultsArr = [];
  for (const pool of Object.keys(poolInfo)) {
    if (poolInfo[pool].parentProtocolName === "NAVI") {
      vaultsArr.push(pool);
    }
  }
  return vaultsArr;
}

export async function getAllDoubleAssetVaults(): Promise<string[]> {
  const vaultsArr = [];
  for (const pool of Object.keys(poolInfo)) {
    if (poolInfo[pool].parentProtocolName === "CETUS") {
      vaultsArr.push(pool);
    }
  }
  return vaultsArr;
}
