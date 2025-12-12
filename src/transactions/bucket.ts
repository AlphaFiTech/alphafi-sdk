import { CoinStruct } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import {
  bluefinPoolMap,
  cetusPoolMap,
  coinsList,
  getConf,
  getReceipts,
  getSuiClient,
  poolInfo,
  PoolName,
  Receipt,
  singleAssetPoolCoinMap,
} from "../index.js";

export async function bucketDepositTx(
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const suiClient = getSuiClient();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo["BUCKET-BUCK"];

  const receipt: Receipt[] = await getReceipts(
    "BUCKET-BUCK" as PoolName,
    address,
    true,
  );
  let coins: CoinStruct[] = [];

  let currentCursor: string | null | undefined = null;

  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType: coinsList[singleAssetPoolCoinMap["BUCKET-BUCK"].coin].type,
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

  if (coins.length >= 1) {
    const [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [0]);
    txb.mergeCoins(
      coin,
      coins.map((c) => c.coinObjectId),
    );
    const [depositCoin] = txb.splitCoins(coin, [amount]);
    let someReceipt: any;
    if (receipt.length == 0) {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::none`,
        typeArguments: [poolData.receiptType],
        arguments: [],
      });
    } else {
      [someReceipt] = txb.moveCall({
        target: `0x1::option::some`,
        typeArguments: [receipt[0].content.type],
        arguments: [txb.object(receipt[0].objectId)],
      });
    }
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_bucket_investor_v1::collect_and_convert_reward_to_buck`,
      arguments: [
        txb.object(C.ALPHA_3_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.BUCKET_PROTOCOL),
        txb.object(C.FOUNTAIN),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_bucket_pool_v1::user_deposit`,
      arguments: [
        txb.object(C.ALPHA_3_VERSION),
        txb.object(C.VERSION),
        someReceipt,
        txb.object(poolData.poolId),
        depositCoin,
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.BUCKET_PROTOCOL),
        txb.object(C.FOUNTAIN),
        txb.object(C.FLASK),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.transferObjects([coin], address);
  } else {
    throw new Error("No coin");
  }
  return txb;
}

export async function bucketWithdrawTx(
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = await getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo["BUCKET-BUCK"];

  const receipt: Receipt[] = await getReceipts(
    "BUCKET-BUCK" as PoolName,
    address,
    true,
  );

  if (receipt.length > 0) {
    let alpha_receipt = txb.moveCall({
      target: `0x1::option::none`,
      typeArguments: [C.ALPHA_POOL_RECEIPT],
      arguments: [],
    });
    txb.moveCall({
      target: `${poolData.packageId}::alphafi_bucket_investor_v1::collect_and_convert_reward_to_buck`,
      arguments: [
        txb.object(C.ALPHA_3_VERSION),
        txb.object(poolData.investorId),
        txb.object(C.BUCKET_PROTOCOL),
        txb.object(C.FOUNTAIN),
        txb.object(bluefinPoolMap["SUI-USDC"]),
        txb.object(C.BLUEFIN_GLOBAL_CONFIG),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    const [buck] = txb.moveCall({
      target: `${poolData.packageId}::alphafi_bucket_pool_v1::user_withdraw`,
      arguments: [
        txb.object(C.ALPHA_3_VERSION),
        txb.object(C.VERSION),
        txb.object(receipt[0].objectId),
        alpha_receipt,
        txb.object(C.ALPHA_POOL),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(poolData.investorId),
        txb.object(C.ALPHA_DISTRIBUTOR),
        txb.object(C.BUCKET_PROTOCOL),
        txb.object(C.FOUNTAIN),
        txb.object(C.FLASK),
        txb.object(cetusPoolMap["USDC-SUI"]),
        txb.object(C.CETUS_GLOBAL_CONFIG_ID),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
    txb.moveCall({
      target: `0x2::transfer::public_transfer`,
      typeArguments: [`0x2::coin::Coin<${coinsList["BUCK"].type}>`],
      arguments: [buck, txb.pure.address(address)],
    });
  } else {
    throw new Error(`No ${"BUCKET-BUCK"} Receipt`);
  }

  return txb;
}
