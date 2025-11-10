import { Transaction } from "@mysten/sui/transactions";
import { getConf } from "../common/constants.js";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { SuiClient } from "@mysten/sui/client";

export async function updateSingleTokenPrice(
  suiClient: SuiClient,
  pythPriceInfo: string,
  feedId: string,
  txb: Transaction,
) {
  const PYTH_STATE_ID =
    "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";
  const WORMHOLE_STATE_ID =
    "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
  const pythClient = new SuiPythClient(
    suiClient,
    PYTH_STATE_ID,
    WORMHOLE_STATE_ID,
  );
  const pythConnection = new SuiPriceServiceConnection(
    "https://hermes.pyth.network",
  );

  const priceFeedUpdateData = await pythConnection.getPriceFeedsUpdateData([
    pythPriceInfo,
  ]);
  const priceInfoObjectIds = await pythClient.updatePriceFeeds(
    txb,
    priceFeedUpdateData,
    [pythPriceInfo],
  );

  txb.moveCall({
    target:
      "0xc2d49bf5e75d2258ee5563efa527feb6155de7ac6f6bf025a23ee88cd12d5a83::oracle_pro::update_single_price",
    arguments: [
      txb.object(getConf().CLOCK_PACKAGE_ID),
      txb.object(getConf().NAVI_ORACLE_CONFIG),
      txb.object(getConf().PRICE_ORACLE),
      txb.object(getConf().SUPRA_ORACLE_HOLDER),
      txb.object(priceInfoObjectIds[0]),
      txb.pure.address(feedId),
    ],
  });
}
