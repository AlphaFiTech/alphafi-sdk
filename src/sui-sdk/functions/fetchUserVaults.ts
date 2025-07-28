import {
  AlphaFiVault,
  coinsList,
  getMultiReceipts,
  PoolName,
} from "../../index.js";
import {
  singleAssetPoolCoinMap,
  doubleAssetPoolCoinMap,
  poolInfo,
} from "../../common/maps.js";
import { getReceipts } from "./getReceipts.js";

export async function fetchUserVaults(
  address: string,
): Promise<AlphaFiVault[]> {
  const vaultsArr: AlphaFiVault[] = [];
  await getMultiReceipts(address);
  await Promise.all(
    Object.keys(poolInfo).map(async (pool) => {
      const receipt = await getReceipts(pool as PoolName, address, false);
      if (receipt.length > 0) {
        const name = receipt[0].content.fields.name;
        let res: AlphaFiVault | undefined = undefined;
        if (
          poolInfo[pool].parentProtocolName === "ALPHAFI" ||
          poolInfo[pool].parentProtocolName === "NAVI" ||
          poolInfo[pool].parentProtocolName === "BUCKET" ||
          poolInfo[pool].parentProtocolName === "ALPHALEND"
        ) {
          const coin = singleAssetPoolCoinMap[pool].coin;
          res = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinName: coin,
            coinType: coinsList[coin].type,
          };
        } else if (
          poolInfo[pool].parentProtocolName === "CETUS" ||
          poolInfo[pool].parentProtocolName === "BLUEFIN"
        ) {
          const coinA = doubleAssetPoolCoinMap[pool].coin1;
          const coinB = doubleAssetPoolCoinMap[pool].coin2;
          res = {
            poolId: poolInfo[pool].poolId,
            poolName: pool as PoolName,
            receiptName: name,
            receiptType: receipt[0].content.type,
            coinNameA: coinA,
            coinTypeA: coinsList[coinA].type,
            coinNameB: coinB,
            coinTypeB: coinsList[coinB].type,
          };
        }
        if (res) vaultsArr.push(res);
      }
    }),
  );
  return vaultsArr;
}
