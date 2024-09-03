import Decimal from "decimal.js";
import { getPoolConversionMap, poolIdPoolNameMap } from "./common/maps";
import { getHolders } from "./getHolders";
import { getReceipts } from "./utils/getReceipts";

import { SuiObjectResponse } from "@mysten/sui/client";
import { PoolName } from "./common/types";

export async function getUserTokens(params?: {
  pools?: string[];
  startTime?: number;
  endTime?: number;
  owners?: string[];
}): Promise<[string, string, string][]> {
  let owners: string[];
  if (params?.owners) {
    owners = params.owners;
  } else {
    owners = await getHolders(params);
  }
  const receipts = await getReceipts({
    pools: params?.pools,
    owners: owners,
  });
  const userTokens = parseTokensFromReceipts(receipts);
  return userTokens;
}

type alphaReceiptFields = {
  id: { id: string };
  image_url: string;
  last_acc_reward_per_xtoken: {
    type: string;
    fields: {
      contents: [
        {
          type: string;
          fields: {
            key: {
              type: string;
              fields: {
                name: string;
              };
            };
            value: string;
          };
        },
      ];
    };
  };
  locked_balance: {
    type: string;
    fields: {
      head: string;
      id: {
        id: string;
      };
      size: string;
      tail: string;
    };
  };
  name: string;
  owner: string;
  pending_rewards: {
    type: string;
    fields: {
      contents: [
        {
          type: string;
          fields: {
            key: {
              type: string;
              fields: {
                name: string;
              };
            };
            value: string;
          };
        },
      ];
    };
  };
  pool_id: string;
  unlocked_xtokens: string;
  xTokenBalance: string;
};

type otherRecceiptFields = {
  id: { id: string };
  image_url: string;
  last_acc_reward_per_xtoken: {
    fields: {
      contents: [
        {
          fields: {
            key: {
              fields: {
                name: string;
              };
              type: string;
            };
            value: string;
          };
          type: string;
        },
      ];
    };
    type: string;
  };
  name: string;
  owner: string;
  pending_rewards: {
    fields: {
      contents: [
        {
          fields: {
            key: {
              fields: {
                name: string;
              };
              type: string;
            };
            value: string;
          };
          type: string;
        },
      ];
    };
    type: string;
  };
  pool_id: string;
  xTokenBalance: string;
};

// import fs from "fs";
async function parseTokensFromReceipts(
  receipts: SuiObjectResponse[],
): Promise<[string, string, string][]> {
  let userTokens: [string, string, string][] = [];

  for (const receipt of receipts) {
    const nftData = receipt.data?.content;
    if (nftData?.dataType === "moveObject") {
      const fields = nftData.fields as alphaReceiptFields | otherRecceiptFields;
      const owner = fields.owner;
      const pool = poolIdPoolNameMap[fields.pool_id] as string;
      const xTokens = fields.xTokenBalance;
      userTokens.push([owner, pool, xTokens]);
    }
  }
  // fs.writeFileSync("./see.json", JSON.stringify(userTokens));
  const conversionMap = await getPoolConversionMap();
  userTokens = userTokens.map(([owner, pool, xTokens]) => {
    const conversion = new Decimal(
      conversionMap.get(pool as PoolName) as string,
    );
    const tokens = new Decimal(xTokens).mul(conversion).toFixed(4).toString();
    return [owner, pool, tokens];
  });

  return userTokens;
}

// function mergeDuplicateHoldings(
//   userTokens: [string, string, string][],
// ): [string, string, string][] {
//   const map = new Map<string, number>();
//   userTokens.forEach(([address, pool, value]) => {
//     const key = `${address}~${pool}`;
//     const numericValue = parseFloat(value);
//     if (map.has(key)) {
//       map.set(key, map.get(key)! + numericValue);
//     } else {
//       map.set(key, numericValue);
//     }
//   });
//   return Array.from(map.entries()).map(([key, value]) => {
//     const [address, pool] = key.split("~");
//     return [address, pool, value.toString()];
//   });
// }
