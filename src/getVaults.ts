import { poolInfo } from "./common/maps";
import {
  getFullnodeUrl,
  SuiClient,
} from "../node_modules/@mysten/sui/dist/cjs/client/index";
import { getReceipts } from "./functions";

export async function getVaults(
  address: string,
): Promise<string[] | undefined> {
  const vaultsArr = [];
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address) {
    for (const pool of Object.keys(poolInfo)) {
      const receipt = await getReceipts(pool, { address, suiClient });
      if (receipt.length > 0) {
        const name = receipt[0].content.fields.name;
        let res;
        if (poolInfo[pool].parentProtocolName === "NAVI") {
          res = name.replace(/^AlphaFi-/, "").replace(/ Receipt$/, "");
        } else {
          res = name.replace(/^AlphaFi /, "").replace(/ Receipt$/, "");
        }
        vaultsArr.push(res);
      }
    }
    return vaultsArr;
  }
  return undefined;
}
