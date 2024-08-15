import {
  poolIdPoolNameMap,
  poolInfo,
  poolCoinMap,
  poolCoinPairMap,
} from "./common/maps";
import {
  AlphaFiSingleAssetVault,
  AlphaFiDoubleAssetVault,
  PoolName,
} from "./common/types";

import { fetchUserVaults } from "./graphql/fetchData";

export async function getVaults(
  address: string,
): Promise<(AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault)[]> {
  const vaultsArr: (AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault)[] = [];

  const vaultsData = await fetchUserVaults(address);

  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.alphaObjects.nodes,
    ...vaultsData.alphaSuiObjects.nodes,
    ...vaultsData.usdtUsdcObjects.nodes,
    ...vaultsData.usdcWbtcObjects.nodes,
    ...vaultsData.naviObjects.nodes,
  ];

  const vaults = await buildVaultsArray(allObjects);
  vaults.forEach((v) =>
    vaultsArr.push(v as AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault),
  );

  return vaultsArr;
}

export async function getSingleAssetVaults(
  address: string,
): Promise<AlphaFiSingleAssetVault[]> {
  const vaultsArr: AlphaFiSingleAssetVault[] = [];

  const vaultsData = await fetchUserVaults(address);

  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.alphaObjects.nodes,
    ...vaultsData.naviObjects.nodes,
  ];

  const vaults = await buildVaultsArray(allObjects);
  vaults.forEach((v) => vaultsArr.push(v as AlphaFiSingleAssetVault));

  return vaultsArr;
}

export async function getDoubleAssetVaults(
  address: string,
): Promise<AlphaFiDoubleAssetVault[]> {
  const vaultsArr: AlphaFiDoubleAssetVault[] = [];
  const vaultsData = await fetchUserVaults(address);

  // Combine all objects into a single array
  const allObjects = [
    ...vaultsData.alphaSuiObjects.nodes,
    ...vaultsData.usdtUsdcObjects.nodes,
    ...vaultsData.usdcWbtcObjects.nodes,
  ];

  const vaults = await buildVaultsArray(allObjects);
  vaults.forEach((v) => vaultsArr.push(v as AlphaFiDoubleAssetVault));

  return vaultsArr;
}

async function buildVaultsArray(allObjects: any[]) {
  const vaultsArr = allObjects.map((o) => {
    const poolName: PoolName = poolIdPoolNameMap[o.contents.json.pool_id];
    const pool = poolInfo[poolName];
    if (
      pool.parentProtocolName === "ALPHAFI" ||
      pool.parentProtocolName === "NAVI"
    ) {
      const vault: AlphaFiSingleAssetVault = {
        poolId: pool.poolId,
        poolName: poolName,
        receiptName: pool.receiptName,
        receiptType: pool.receiptType,
        coinType: poolCoinMap[poolName as keyof typeof poolCoinMap],
      };
      return vault;
    } else if (pool.parentProtocolName === "CETUS") {
      const vault: AlphaFiDoubleAssetVault = {
        poolId: pool.poolId,
        poolName: poolName,
        receiptName: pool.receiptName,
        receiptType: pool.receiptType,
        coinTypeA:
          poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinA,
        coinTypeB:
          poolCoinPairMap[poolName as keyof typeof poolCoinPairMap].coinB,
      };
      return vault;
    }
  });
  return vaultsArr;
}
