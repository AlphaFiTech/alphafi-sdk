import { poolInfo } from "./common/maps.js";

export async function getAllVaults(): Promise<string[]> {
  const vaultsArr: string[] = [];
  for (const pool of Object.keys(poolInfo)) {
    vaultsArr.push(pool);
  }
  return vaultsArr;
}

export async function getAllSingleAssetVaults(): Promise<string[]> {
  const vaultsArr: string[] = [];
  for (const pool of Object.keys(poolInfo)) {
    if (
      poolInfo[pool].parentProtocolName === "NAVI" ||
      poolInfo[pool].parentProtocolName === "BUCKET" ||
      poolInfo[pool].parentProtocolName === "ALPHAFI"
    ) {
      vaultsArr.push(pool);
    }
  }
  return vaultsArr;
}

export async function getAllDoubleAssetVaults(): Promise<string[]> {
  const vaultsArr: string[] = [];
  for (const pool of Object.keys(poolInfo)) {
    if (
      poolInfo[pool].parentProtocolName === "CETUS" ||
      poolInfo[pool].parentProtocolName === "BLUEFIN"
    ) {
      vaultsArr.push(pool);
    }
  }
  return vaultsArr;
}
