import { poolMap } from "./common/maps";
import { Receipt } from "./common/types";
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
    const poolArr = Object.keys(poolMap);

    const receipts: Receipt[] = [];
    for (const pool of poolArr) {
      const receipt = await getReceipts(pool, { address, suiClient });
      if (receipt.length > 0) receipts.push(receipt[0]);
    }
    for (const receipt of receipts) {
      const name = receipt.content.fields.name;
      const res = name.replace(/^AlphaFi /, "").replace(/ Receipt$/, "");
      vaultsArr.push(res);
    }
    return vaultsArr;
  }
  return undefined;
}
