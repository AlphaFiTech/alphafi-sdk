import {
  AlphaFiVault,
  DoubleAssetPoolNames,
  PoolName,
  SingleAssetPoolNames,
} from "../..";
import {
  coinNameTypeMap,
  poolCoinMap,
  poolCoinPairMap,
  poolInfo,
} from "../../common/maps";
import { getReceipts } from "./getReceipts";

export async function fetchUserVaults(
  address: string,
): Promise<AlphaFiVault[]> {
  const vaultsArr: AlphaFiVault[] = [];
  await Promise.all(
    Object.keys(poolInfo).map(async (pool) => {
      const receipt = await getReceipts(pool, address);
      if (receipt.length > 0) {
        const name = receipt[0].content.fields.name;
        let res: AlphaFiVault | undefined = undefined;
        if (
          poolInfo[pool].parentProtocolName === "ALPHAFI" ||
          poolInfo[pool].parentProtocolName === "NAVI"
        ) {
          const coin = poolCoinMap[pool as SingleAssetPoolNames];
          res = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinName: coin,
            coinType: coinNameTypeMap[coin],
          };
        } else if (poolInfo[pool].parentProtocolName === "CETUS") {
          const coinA = poolCoinPairMap[pool as DoubleAssetPoolNames].coinA;
          const coinB = poolCoinPairMap[pool as DoubleAssetPoolNames].coinB;
          res = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinNameA: coinA,
            coinTypeA: coinNameTypeMap[coinA],
            coinNameB: coinB,
            coinTypeB: coinNameTypeMap[coinB],
          };
        }
        if (res) vaultsArr.push(res);
      }
    }),
  );
  return vaultsArr;
}
