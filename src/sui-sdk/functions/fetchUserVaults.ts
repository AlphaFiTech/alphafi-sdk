import { AlphaFiVault, CoinName, PoolName } from "../..";
import { coinNameTypeMap, poolCoinPairMap, poolInfo } from "../../common/maps";
import { getReceipts } from "./getReceipts";

export async function fetchUserVaults(
  address: string,
): Promise<AlphaFiVault[]> {
  const vaultsArr = [];
  for (const pool of Object.keys(poolInfo)) {
    const receipt = await getReceipts(pool, address);
    if (receipt.length > 0) {
      const name = receipt[0].content.fields.name;
      let res;
      if (poolInfo[pool].parentProtocolName === "ALPHAFI") {
        const coin = "ALPHA" as CoinName;
        res = {
          poolId: poolInfo[pool].poolId,
          poolName: pool as PoolName,
          receiptName: name,
          receiptType: receipt[0].content.type,
          coinName: coin,
          coinType: coinNameTypeMap[coin],
        };
      } else if (poolInfo[pool].parentProtocolName === "CETUS") {
        const coinA =
          poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinA;
        const coinB =
          poolCoinPairMap[pool as keyof typeof poolCoinPairMap].coinB;
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
      } else if (poolInfo[pool].parentProtocolName === "NAVI") {
        const coin = pool.replace(/^NAVI-/, "") as CoinName;
        res = {
          poolId: poolInfo[pool].poolId,
          poolName: pool as PoolName,
          receiptName: name,
          receiptType: receipt[0].content.type,
          coinName: coin,
          coinType: coinNameTypeMap[coin],
        };
      }
      if (res !== undefined) vaultsArr.push(res);
    }
  }
  return vaultsArr;
}
