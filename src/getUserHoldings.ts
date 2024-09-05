import Decimal from "decimal.js";
import { getPoolExchangeRateMap, poolIdPoolNameMap } from "./common/maps";
import { getHolders } from "./getHolders";
import { getReceipts } from "./utils/getReceipts";

import { SuiObjectResponse } from "@mysten/sui/client";
import { PoolName } from "./common/types";
import { GetUserTokensParams, AlphaReceiptFields, OtherReceiptFields } from "./types";

export async function getUserTokens(params?: GetUserTokensParams): Promise<[string, string, string][]> {
  let owners: string[];
  if (params?.owners) {
    console.log("in if");
    owners = params.owners;
  } else {
    console.log("in else");
    owners = await getHolders(params);
  }
  const receipts = await getReceipts({
    poolNames: params?.poolNames,
    owners: owners,
  });
  const userTokens = parseTokensFromReceipts(receipts);
  return userTokens;
}

async function parseTokensFromReceipts(
  receipts: SuiObjectResponse[],
): Promise<[string, string, string][]> {
  let userTokens: [string, string, string][] = [];

  for (const receipt of receipts) {
    const nftData = receipt.data?.content;
    if (nftData?.dataType === "moveObject") {
      const fields = nftData.fields as AlphaReceiptFields | OtherReceiptFields;
      const owner = fields.owner;
      const pool = poolIdPoolNameMap[fields.pool_id] as string;
      const xTokens = fields.xTokenBalance;
      userTokens.push([owner, pool, xTokens]);
    }
  }
  // fs.writeFileSync("./see.json", JSON.stringify(userTokens));
  const conversionMap = await getPoolExchangeRateMap();
  userTokens = userTokens.map(([owner, pool, xTokens]) => {
    const conversion = new Decimal(
      conversionMap.get(pool as PoolName) as string,
    );
    const tokens = new Decimal(xTokens).mul(conversion).toFixed(4).toString();
    return [owner, pool, tokens];
  });

  return userTokens;
}
