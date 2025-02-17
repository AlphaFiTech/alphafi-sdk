import { Transaction } from "@mysten/sui/transactions";
import { getConf } from "../common/constants.js";

export function updateSingleTokenPrice(
  pythPriceInfo: string,
  feedId: string,
  txb: Transaction,
) {
  txb.moveCall({
    target:
      "0xc2d49bf5e75d2258ee5563efa527feb6155de7ac6f6bf025a23ee88cd12d5a83::oracle_pro::update_single_price",
    arguments: [
      txb.object(getConf().CLOCK_PACKAGE_ID),
      txb.object(getConf().NAVI_ORACLE_CONFIG),
      txb.object(getConf().PRICE_ORACLE),
      txb.object(getConf().SUPRA_ORACLE_HOLDER),
      txb.object(pythPriceInfo),
      txb.pure.address(feedId),
    ],
  });
}
