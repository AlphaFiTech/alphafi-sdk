import { SuiObjectResponse } from "@mysten/sui/client";
import suiClient from "../sui-sdk/client";
const recieptTypes = {
  ALPHA:
    "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::Receipt",
  "ALPHA-SUI":
    "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt",
  "USDT-USDC":
    "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt",
  NAVI: "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt",
  "WBTC-USDC":
    "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt",
  "CETUS-SUI":
    "0x1a22b26f139b34c9de9718cf7e53159b2b939ec8f46f4c040776b7a3d580dd28::alphafi_cetus_sui_pool::Receipt",
};

export async function getReceipts(params: {
  pools?: string[];
  owners: string[];
}) {
  let receipts: SuiObjectResponse[] = [];
  for (const userAddress of params?.owners) {
    let hasNextPage: boolean = true;
    let nextCursor: null | string | undefined = null;
    while (hasNextPage) {
      const res = await suiClient.getOwnedObjects({
        cursor: nextCursor,
        owner: userAddress,
        options: {
          showContent: true,
        },
        filter: {
          MatchAny: [
            { StructType: recieptTypes["ALPHA"] },
            { StructType: recieptTypes["ALPHA-SUI"] },
            { StructType: recieptTypes["USDT-USDC"] },
            { StructType: recieptTypes["NAVI"] },
            { StructType: recieptTypes["WBTC-USDC"] },
            { StructType: recieptTypes["CETUS-SUI"] },
          ],
        },
      });
      receipts = receipts.concat(res.data);
      nextCursor = res.nextCursor;
      hasNextPage = res.hasNextPage;
    }
  }
  return receipts;
}
