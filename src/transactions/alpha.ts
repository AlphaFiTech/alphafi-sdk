import { Transaction } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { getConf, getReceipts, getSuiClient, Receipt } from "../index.js";

export const depositAlphaTxb = async (
  amount: string,
  address: string,
): Promise<Transaction> => {
  const suiClient = getSuiClient();
  const txb = new Transaction();

  let coins: CoinStruct[] = [];

  const receipt: Receipt[] = await getReceipts("ALPHA", address, true);

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: getConf().ALPHA_COIN_TYPE,
      cursor: currentCursor,
    });

    coins = coins.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      // console.log("No more receipts available.");
      break;
    }
  } while (true);

  let coin: any;

  if (coins.length >= 1) {
    [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins.map((c) => c.coinObjectId),
    );
    const [depositCoin] = txb.splitCoins(coin, [amount]);
    txb.transferObjects([coin], address);

    if (receipt.length == 0) {
      const [receipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [getConf().ALPHA_POOL_RECEIPT],
        arguments: [],
      });
      txb.moveCall({
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphapool::user_deposit`,
        typeArguments: [getConf().ALPHA_COIN_TYPE],
        arguments: [
          txb.object(getConf().VERSION),
          receipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          depositCoin,
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    } else {
      const [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [getConf().ALPHA_POOL_RECEIPT],
        arguments: [txb.object(receipt[0].objectId)],
      });
      txb.moveCall({
        target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphapool::user_deposit`,
        typeArguments: [getConf().ALPHA_COIN_TYPE],
        arguments: [
          txb.object(getConf().VERSION),
          someReceipt,
          txb.object(getConf().ALPHA_POOL),
          txb.object(getConf().ALPHA_DISTRIBUTOR),
          depositCoin,
          txb.object(getConf().CLOCK_PACKAGE_ID),
        ],
      });
    }
    return txb;
  } else {
    throw new Error("No Alpha Coins");
  }
};

export const withdrawAlphaTxb = async (
  xTokens: string,
  withdrawFromLocked: boolean,
  address: string,
): Promise<Transaction> => {
  const txb = new Transaction();
  const receipt: Receipt[] = await getReceipts("ALPHA", address, true);
  if (receipt.length > 0) {
    txb.moveCall({
      target: `${getConf().ALPHA_LATEST_PACKAGE_ID}::alphapool::user_withdraw`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        txb.object(getConf().VERSION),
        txb.object(receipt[0].objectId),
        txb.object(getConf().ALPHA_POOL),
        txb.object(getConf().ALPHA_DISTRIBUTOR),
        txb.pure.u64(xTokens),
        txb.object(getConf().CLOCK_PACKAGE_ID),
        txb.pure.bool(withdrawFromLocked),
      ],
    });
    txb.setSender(address);
    return txb;
  } else {
    throw new Error("No receipt found!");
  }
};
