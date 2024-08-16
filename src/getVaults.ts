import {
  poolInfo,
  poolCoinPairMap,
  poolCoinMap,
  coinNameTypeMap,
} from "./common/maps";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { getReceipts } from "./functions";
import {
  AlphaFiSingleAssetVault,
  AlphaFiDoubleAssetVault,
  PoolName,
} from "./common/types";
import { getPool } from "./portfolioAmount";

export async function getVaults(
  address: string,
): Promise<(AlphaFiSingleAssetVault | AlphaFiDoubleAssetVault)[] | undefined> {
  const vaultsArr = [];
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address) {
    for (const pool of Object.keys(poolInfo)) {
      const receipt = await getReceipts(pool as PoolName, {
        address,
        suiClient,
      });
      const poolObject = await getPool(pool as PoolName, { suiClient });
      if (receipt.length > 0 && poolObject) {
        const name = receipt[0].content.fields.name;
        let vault:
          | AlphaFiSingleAssetVault
          | AlphaFiDoubleAssetVault
          | undefined;
        if (
          poolInfo[pool].parentProtocolName === "NAVI" ||
          poolInfo[pool].parentProtocolName === "ALPHAFI"
        ) {
          vault = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinName: poolCoinMap[pool as keyof typeof poolCoinMap],
            coinType:
              coinNameTypeMap[poolCoinMap[pool as keyof typeof poolCoinMap]],
          };
        } else if (poolInfo[pool].parentProtocolName === "CETUS") {
          vault = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinTypeA:
              coinNameTypeMap[
                poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinA
              ],
            coinTypeB:
              coinNameTypeMap[
                poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinB
              ],
            coinNameA:
              poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinA,
            coinNameB:
              poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinB,
          };
        }
        if (vault) {
          vaultsArr.push(vault);
        }
      }
    }
    return vaultsArr;
  }
  return undefined;
}

export async function getSingleAssetVaults(
  address: string,
): Promise<AlphaFiSingleAssetVault[] | undefined> {
  const vaultsArr = await getVaults(address);

  if (vaultsArr) {
    const singleAssetVaults = vaultsArr.filter(
      (vault): vault is AlphaFiSingleAssetVault => {
        return (vault as AlphaFiSingleAssetVault).coinType !== undefined;
      },
    );

    return singleAssetVaults.length > 0 ? singleAssetVaults : undefined;
  }

  return undefined;
}

export async function getDoubleAssetVaults(
  address: string,
): Promise<AlphaFiDoubleAssetVault[] | undefined> {
  const vaultsArr = await getVaults(address);

  if (vaultsArr) {
    const doubleAssetVaults = vaultsArr.filter(
      (vault): vault is AlphaFiDoubleAssetVault => {
        const v = vault as AlphaFiDoubleAssetVault;
        return v.coinTypeA !== undefined && v.coinTypeB !== undefined;
      },
    );

    return doubleAssetVaults.length > 0 ? doubleAssetVaults : undefined;
  }

  return undefined;
}
