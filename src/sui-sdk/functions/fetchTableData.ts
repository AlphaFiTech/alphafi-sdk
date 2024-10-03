import { getSuiClient } from "../client";
import { Decimal } from "decimal.js";
import { getPoolExchangeRate } from "./getReceipts";

export interface LockedAlphaObject {
  name: { type: string; value: string };
  bcsName: string;
  type: string;
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

export interface LockedAlphaItem {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: {
    ObjectOwner: string;
  };
  previousTransaction: string;
  storageRebate: string;
  content: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: {
        id: string;
      };
      name: string;
      value: {
        type: string;
        fields: { next: string; prev: string; value: string };
      };
    };
  };
}

export type AlphaUnlocks = {
  address: string;
  tokens: string;
  timestampMs: number;
};

const suiClient = getSuiClient();

export async function getTableDataXtokens(
  owner: string,
  table: string,
): Promise<AlphaUnlocks[] | undefined> {
  let locked_alpha_pos_arr: LockedAlphaObject[] = [];

  let currentCursor: string | null | undefined = null;
  do {
    const response = await suiClient.getDynamicFields({
      parentId: table,
      cursor: currentCursor,
    });

    locked_alpha_pos_arr = locked_alpha_pos_arr.concat(
      response.data as LockedAlphaObject[],
    );

    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      break;
    }
  } while (true);

  if (locked_alpha_pos_arr.length > 0) {
    const promises = locked_alpha_pos_arr.map(
      async (locked_obj: LockedAlphaObject) => {
        const locked_item1: any = await suiClient.getDynamicFieldObject({
          parentId: table,
          name: locked_obj.name,
        });
        if (locked_item1 && locked_item1.data) {
          const locked_item_object: LockedAlphaItem = locked_item1.data;
          const value = locked_item_object.content.fields.value.fields.value;
          return {
            value: value,
            timestamp: locked_item_object.content.fields.name,
          };
        }
        // If no data, return undefined or handle as needed
        return undefined;
      },
    );
    const results = (await Promise.all(promises)).filter(
      (result) => result !== undefined,
    );
    const unlocks: AlphaUnlocks[] = results.map((o) => {
      return {
        address: owner,
        timestampMs: Number(o.timestamp),
        tokens: o.value,
      };
    });
    return unlocks;
  }
  return undefined;
}

export async function getUnlocksData(
  owner_table: [string, string][],
): Promise<AlphaUnlocks[]> {
  let allUnlocksData: AlphaUnlocks[] = [];
  const alphaExchangeRate = await getPoolExchangeRate("ALPHA", true);
  for (const entry of owner_table) {
    const [owner, table] = entry;
    const unlocksXtokens = await getTableDataXtokens(owner, table);
    if (unlocksXtokens) {
      const unlocks: AlphaUnlocks[] = unlocksXtokens?.map((o) => {
        const tokens = new Decimal(o.tokens)
          .mul(alphaExchangeRate as Decimal)
          .div(1e9)
          .toString();
        return {
          address: o.address,
          timestampMs: o.timestampMs,
          tokens: tokens,
        };
      });
      allUnlocksData = allUnlocksData.concat(unlocks);
    }
  }
  return allUnlocksData;
}
