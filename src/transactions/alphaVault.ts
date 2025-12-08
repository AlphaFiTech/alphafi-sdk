import { Transaction } from "@mysten/sui/transactions";
import { getConf } from "../common/constants.js";
import { poolInfo } from "../common/maps.js";
import { coinsList } from "../common/coins.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { getPool, getReceipts } from "../sui-sdk/functions/getReceipts.js";
import { Decimal } from "decimal.js";
import { AlphaPoolType } from "../common/types.js";

export async function depositAlphaTx(
  amount: string,
  address: string,
  suiClient: SuiClient,
): Promise<Transaction> {
  const tx = new Transaction();
  const poolinfo = poolInfo["ALPHA"];

  // Fetch ALPHA coins from the user's wallet
  const coin = await getCoinFromWallet(
    tx,
    suiClient,
    address,
    poolinfo.assetTypes[0],
  );
  const [depositCoin] = tx.splitCoins(coin, [amount]);

  // Transfer remaining coins back to user
  tx.transferObjects([coin], address);

  // Get receipts
  const receipts = await getReceipts("ALPHA", address, true);
  const receipt = receipts.length > 0 ? receipts[0] : undefined;
  const alphafiReceipt = await getAlphaFiReceipt(address, suiClient);

  if (alphafiReceipt.length === 0) {
    // Create new AlphaFi receipt
    const alphafiReceiptObj = createAlphaFiReceipt(tx);

    // Convert alpha receipt to ember position if alpha receipt exists
    if (receipt) {
      tx.moveCall({
        target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
        typeArguments: [getConf().ALPHA_COIN_TYPE],
        arguments: [
          tx.object(getConf().ALPHA_EMBER_VERSION),
          tx.object(getConf().ALPHAFI_EMBER_POOL),
          alphafiReceiptObj,
          tx.object(receipt.objectId),
          tx.object(getConf().ALPHA_POOL),
        ],
      });
    }

    // Deposit to ember pool
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::user_deposit`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        alphafiReceiptObj,
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        depositCoin,
        tx.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });

    tx.moveCall({
      target: `${getConf().ALPHAFI_RECEIPT_PACKAGE_ID}::alphafi_receipt::transfer_receipt_to_new_owner`,
      arguments: [
        alphafiReceiptObj,
        tx.pure.address(address),
        tx.object(getConf().ALPHAFI_RECEIPT_WHITELISTED_ADDRESSES),
      ],
    });
  } else {
    const existingReceipt = alphafiReceipt[0];

    // Convert alpha receipt to ember position if needed
    if (receipt) {
      const isPresent = isPositionPresent(
        existingReceipt,
        getConf().ALPHAFI_EMBER_POOL,
      );

      if (!isPresent) {
        tx.moveCall({
          target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
          typeArguments: [getConf().ALPHA_COIN_TYPE],
          arguments: [
            tx.object(getConf().ALPHA_EMBER_VERSION),
            tx.object(getConf().ALPHAFI_EMBER_POOL),
            tx.object(existingReceipt.id),
            tx.object(receipt.objectId),
            tx.object(getConf().ALPHA_POOL),
          ],
        });
      }
    }

    // Deposit to ember pool
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::user_deposit`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        tx.object(existingReceipt.id),
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        depositCoin,
        tx.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }

  return tx;
}

export async function initiateWithdrawAlpha(
  amount: string,
  withdrawMax: boolean,
  address: string,
  suiClient: SuiClient,
): Promise<Transaction> {
  let xtokens = 0;
  const alphaPool = (await getPool("ALPHA", true)) as AlphaPoolType;
  if (withdrawMax) {
    const alphafiReceipts = await getAlphaFiReceipt(address, suiClient);
    const receipts = await getReceipts("ALPHA", address, true);
    const receipt = receipts.length > 0 ? receipts[0] : undefined;
    if (alphafiReceipts.length === 0 && !receipt) {
      throw new Error(
        `No AlphaFi receipts or receit found for address ${address}`,
      );
    }
    if (alphafiReceipts.length === 0 && receipt) {
      xtokens = Number(receipt.content.fields.xTokenBalance);
    } else {
      let positionUpdate =
        alphaPool.content.fields.recently_updated_alphafi_receipts.fields.contents.find(
          (item) => item.fields.key === alphafiReceipts[0].id,
        );
      xtokens =
        Number(await getAlphaTotalShares(suiClient, alphafiReceipts[0])) -
        (positionUpdate
          ? Number(positionUpdate.fields.value.fields.xtokens_to_remove) -
            Number(positionUpdate.fields.value.fields.xtokens_to_add)
          : 0);
    }
  } else {
    xtokens = new Decimal(amount)
      .div(
        new Decimal(
          alphaPool.content.fields.current_exchange_rate.fields.value,
        ).div(1e18),
      )
      .ceil()
      .toNumber();
  }
  return initiateWithdrawAlphaTx(xtokens.toString(), address, suiClient);
}

async function getAlphaTotalShares(
  suiClient: SuiClient,
  alphafiReceipt: AlphaFiReceiptType,
): Promise<string> {
  let entry = alphafiReceipt.position_pool_map.find(
    (item) => item.value.pool_id === poolInfo["ALPHA"].poolId,
  );
  if (!entry) {
    console.error("no position for pool id found");
    return "0";
  }
  const position = await suiClient.getObject({
    id: entry.key,
    options: {
      showContent: true,
    },
  });
  return (position.data?.content as any).fields.xtokens.toString();
}

async function initiateWithdrawAlphaTx(
  xTokens: string,
  address: string,
  suiClient: SuiClient,
): Promise<Transaction> {
  const tx = new Transaction();

  const receipts = await getReceipts("ALPHA", address, true);
  const receipt = receipts.length > 0 ? receipts[0] : undefined;
  const alphafiReceipt = await getAlphaFiReceipt(address, suiClient);
  if (alphafiReceipt.length === 0) {
    // Create new AlphaFi receipt
    const alphafiReceiptObj = createAlphaFiReceipt(tx);

    if (!receipt) {
      throw new Error("No alphafi receipt and no alpha receipt found");
    }

    // Convert alpha receipt to ember position
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        alphafiReceiptObj,
        tx.object(receipt.objectId),
        tx.object(getConf().ALPHA_POOL),
      ],
    });

    // Initiate withdrawal
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::user_initiate_withdraw`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        alphafiReceiptObj,
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        tx.pure.u64(xTokens),
        tx.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });

    tx.moveCall({
      target: `${getConf().ALPHAFI_RECEIPT_PACKAGE_ID}::alphafi_receipt::transfer_receipt_to_new_owner`,
      arguments: [
        alphafiReceiptObj,
        tx.pure.address(address),
        tx.object(getConf().ALPHAFI_RECEIPT_WHITELISTED_ADDRESSES),
      ],
    });
  } else {
    const existingReceipt = alphafiReceipt[0];
    const isPresent = isPositionPresent(
      existingReceipt,
      getConf().ALPHAFI_EMBER_POOL,
    );

    if (!isPresent && !receipt) {
      throw new Error("No position or old alpha receipt found");
    }

    // Convert alpha receipt to ember position if needed
    if (!isPresent && receipt) {
      tx.moveCall({
        target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
        typeArguments: [getConf().ALPHA_COIN_TYPE],
        arguments: [
          tx.object(getConf().ALPHA_EMBER_VERSION),
          tx.object(getConf().ALPHAFI_EMBER_POOL),
          tx.object(existingReceipt.id),
          tx.object(receipt.objectId),
          tx.object(getConf().ALPHA_POOL),
        ],
      });
    }

    // Initiate withdrawal
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::user_initiate_withdraw`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        tx.object(existingReceipt.id),
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        tx.pure.u64(xTokens),
        tx.object(getConf().CLOCK_PACKAGE_ID),
      ],
    });
  }

  return tx;
}

export async function claimAirdropTx(
  address: string,
  suiClient: SuiClient,
): Promise<Transaction> {
  const tx = new Transaction();
  let airdropCoin;
  const receipts = await getReceipts("ALPHA", address, true);
  const receipt = receipts.length > 0 ? receipts[0] : undefined;
  const alphafiReceipt = await getAlphaFiReceipt(address, suiClient);
  if (alphafiReceipt.length === 0) {
    // Create new AlphaFi receipt
    const alphafiReceiptObj = createAlphaFiReceipt(tx);

    if (!receipt) {
      throw new Error("No alphafi receipt and no alpha receipt found");
    }

    // Convert alpha receipt to ember position
    tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
      typeArguments: [getConf().ALPHA_COIN_TYPE],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        tx.object(getConf().ALPHAFI_EMBER_POOL),
        alphafiReceiptObj,
        tx.object(receipt.objectId),
        tx.object(getConf().ALPHA_POOL),
      ],
    });

    // Get user rewards
    airdropCoin = tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::get_user_rewards`,
      typeArguments: [getConf().ALPHA_COIN_TYPE, coinsList["SUI"].type],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        alphafiReceiptObj,
        tx.object(getConf().ALPHAFI_EMBER_POOL),
      ],
    });

    tx.moveCall({
      target: `${getConf().ALPHAFI_RECEIPT_PACKAGE_ID}::alphafi_receipt::transfer_receipt_to_new_owner`,
      arguments: [
        alphafiReceiptObj,
        tx.pure.address(address),
        tx.object(getConf().ALPHAFI_RECEIPT_WHITELISTED_ADDRESSES),
      ],
    });
  } else {
    const existingReceipt = alphafiReceipt[0];
    const isPresent = isPositionPresent(
      existingReceipt,
      getConf().ALPHAFI_EMBER_POOL,
    );

    if (!isPresent && !receipt) {
      throw new Error("No position or old alpha receipt found");
    }

    // Convert alpha receipt to ember position if needed
    if (!isPresent && receipt) {
      tx.moveCall({
        target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::migrate_alpha_receipt_to_new_alpha_strategy`,
        typeArguments: [getConf().ALPHA_COIN_TYPE],
        arguments: [
          tx.object(getConf().ALPHA_EMBER_VERSION),
          tx.object(getConf().ALPHAFI_EMBER_POOL),
          tx.object(existingReceipt.id),
          tx.object(receipt.objectId),
          tx.object(getConf().ALPHA_POOL),
        ],
      });
    }

    // Get user rewards
    airdropCoin = tx.moveCall({
      target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::get_user_rewards`,
      typeArguments: [getConf().ALPHA_COIN_TYPE, coinsList["SUI"].type],
      arguments: [
        tx.object(getConf().ALPHA_EMBER_VERSION),
        tx.object(existingReceipt.id),
        tx.object(getConf().ALPHAFI_EMBER_POOL),
      ],
    });
  }
  tx.transferObjects([airdropCoin], address);
  return tx;
}

export async function claimWithdrawAlphaTx(
  ticketId: string,
  address: string,
  suiClient: SuiClient,
): Promise<Transaction> {
  const tx = new Transaction();
  const alphafiReceipt = await getAlphaFiReceipt(address, suiClient);

  if (alphafiReceipt.length === 0) {
    throw new Error("No Alphafi receipt found!");
  }
  let coin = tx.moveCall({
    target: `${getConf().ALPHA_EMBER_LATEST_PACKAGE_ID}::alphafi_ember_pool::user_claim_withdraw`,
    typeArguments: [getConf().ALPHA_COIN_TYPE],
    arguments: [
      tx.object(getConf().ALPHA_EMBER_VERSION),
      tx.object(alphafiReceipt[0].id),
      tx.object(getConf().ALPHAFI_EMBER_POOL),
      tx.pure.id(ticketId),
      tx.object(getConf().CLOCK_PACKAGE_ID),
    ],
  });
  tx.transferObjects([coin], address);
  return tx;
}

export async function getCoinFromWallet(
  tx: Transaction,
  suiClient: SuiClient,
  address: string,
  coinType: string,
) {
  if (
    coinType === "0x2::sui::SUI" ||
    coinType ===
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
  ) {
    return tx.gas;
  }
  let coins: CoinStruct[] = [];
  let currentCursor: string | null | undefined = null;
  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType,
      cursor: currentCursor,
    });
    coins = coins.concat(response.data);

    // Check if there's a next page
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else {
      // No more pages available
      break;
    }
  } while (true);

  let coin;
  [coin] = tx.splitCoins(tx.object(coins[0].coinObjectId), [0]);
  tx.mergeCoins(
    coin,
    coins.map((c) => c.coinObjectId),
  );

  return coin;
}

function isPositionPresent(
  alphafiReceipt: {
    position_pool_map: Array<{ key: string; value: { pool_id: string } }>;
  },
  poolId: string,
): boolean {
  return alphafiReceipt.position_pool_map.some(
    (item) =>
      `0x${item.value.pool_id}` === poolId ||
      item.value.pool_id === poolId ||
      item.value.pool_id === `0x${poolId}`,
  );
}

function createAlphaFiReceipt(tx: Transaction) {
  return tx.moveCall({
    target: `${getConf().ALPHAFI_RECEIPT_PACKAGE_ID}::alphafi_receipt::create_alphafi_receipt_v2`,
    arguments: [tx.pure.string(getConf().ALPHAFI_RECEIPT_IMAGE_URL)],
  });
}

async function getAlphaFiReceipt(
  address: string,
  suiClient: SuiClient,
): Promise<AlphaFiReceiptType[]> {
  const receipts = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: getConf().ALPHAFI_RECEIPT_TYPE,
    },
    options: {
      showContent: true,
    },
  });
  return receipts.data.map((receipt) =>
    parseAlphaFiReceipt(receipt.data as any),
  );
}

export function parseAlphaFiReceipt(query: any): AlphaFiReceiptType {
  return {
    id: query.content.fields.id.id,
    position_pool_map:
      query.content.fields.position_pool_map.fields.contents.map(
        (item: any) => ({
          key: item.fields.key,
          value: {
            pool_id: item.fields.value.fields.pool_id,
            partner_cap_id: item.fields.value.fields.partner_cap_id,
          },
        }),
      ),
    client_address: query.content.fields.client_address,
  };
}

export type AlphaFiReceiptType = {
  id: string;
  position_pool_map: {
    key: string;
    value: {
      pool_id: string;
      partner_cap_id: string;
    };
  }[];
  client_address: string;
};
