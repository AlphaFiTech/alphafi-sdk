import { poolInfo } from "./common/maps";
import {
  getFullnodeUrl,
  SuiClient,
} from "../node_modules/@mysten/sui/dist/cjs/client/index";
import { getReceipts } from "./functions";
import { AlphaFiVault } from "./common/types";
import { getPool } from "./portfolioAmount";

function extractCoinTypes(input: string): {
  coinTypeA: string | null;
  coinTypeB: string | null;
} {
  let regex = /Pool<([^,>]+),\s*([^>]+)>/;
  let match = input.match(regex);
  if (!match) {
    regex = /Pool<([^,>]+)>/;
    match = input.match(regex);
    if (!match) {
      return { coinTypeA: null, coinTypeB: null };
    }
  }
  const coinTypeA = match[1] || null;
  const coinTypeB = match[2] || null;
  return { coinTypeA, coinTypeB };
}

export async function getVaults(
  address: string,
): Promise<AlphaFiVault[] | undefined> {
  const vaultsArr = [];
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address) {
    for (const pool of Object.keys(poolInfo)) {
      const receipt = await getReceipts(pool, { address, suiClient });
      const poolObject = await getPool(pool, { suiClient });
      if (receipt.length > 0 && poolObject) {
        const name = receipt[0].content.fields.name;
        const res: AlphaFiVault = {
          poolId: poolInfo[pool].poolId,
          poolName: null,
          receiptName: name,
          receiptType: receipt[0].content.type,
          coinTypeA: extractCoinTypes(poolObject.content.type).coinTypeA,
          coinTypeB: extractCoinTypes(poolObject.content.type).coinTypeB,
        };
        if (poolInfo[pool].parentProtocolName === "NAVI") {
          res.poolName = name
            .replace(/^AlphaFi-NAVI /, "")
            .replace(/ Receipt$/, "");
        } else if (poolInfo[pool].parentProtocolName === "ALPHAFI") {
          res.poolName = name.replace(/^AlphaFi /, "").replace(/ Receipt$/, "");
        } else {
          res.poolName = name.replace(/^AlphaFi /, "").replace(/ Receipt$/, "");
        }
        vaultsArr.push(res);
      }
    }
    return vaultsArr;
  }
  return undefined;
}
