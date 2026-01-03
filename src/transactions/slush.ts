import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import {
  coinsList,
  collectRewardsAndSwapSlush,
  getConf,
  getSuiClient,
  loopingPoolCoinMap,
  poolInfo,
  singleAssetPoolCoinMap,
} from "../index.js";
import { PoolName } from "../common/types.js";
import { AlphalendClient } from "@alphafi/alphalend-sdk";
import { getCoinObject } from "./bluefin.js";
import { SuiClient } from "@mysten/sui/client";
export const alphalendClient = new AlphalendClient("mainnet", getSuiClient());
async function getSlushPositionCapId(
  address: string,
  suiClient: SuiClient,
): Promise<string | undefined> {
  const receipts = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: getConf().ALPHA_SLUSH_POSITION_CAP_TYPE,
    },
    options: {
      showContent: true,
    },
  });
  if (receipts.data.length > 0) {
    return receipts.data[0].data?.objectId;
  }
}
export async function getSlushUserTotalXtokens(
  poolName: PoolName,
  address: string,
) {
  let slushPositionCapId = await getSlushPositionCapId(address, getSuiClient());
  if (!slushPositionCapId) {
    return "0";
  }
  let positionCap = await getSuiClient().getObject({
    id: slushPositionCapId,
    options: { showContent: true },
  });
  if (!positionCap.data?.content) {
    throw new Error("Could not fetch slush position cap object");
  }
  const poolData = poolInfo[poolName];
  let entry = (
    positionCap.data.content as any
  ).fields.position_pool_map.fields.contents.find(
    (item: { fields: { value: string } }) => {
      return item.fields.value == poolData.poolId;
    },
  );
  if (!entry) {
    return "0";
  }
  let positionId = entry.fields.key;
  let position = await getSuiClient().getObject({
    id: positionId,
    options: { showContent: true },
  });
  if (!position.data?.content) {
    throw new Error("Could not fetch slush position object");
  }

  let xTokens = (position.data.content as any).fields.xtokens.toString();
  return xTokens;
}
export async function slushDeposit(
  poolName: PoolName,
  amount: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo[poolName];

  const coinName = singleAssetPoolCoinMap[poolName].coin;
  let positionCapId = await getSlushPositionCapId(address, getSuiClient());
  let totalCoin = await getCoinObject(coinsList[coinName].type, address, txb);
  if (!totalCoin) {
    throw new Error(`No ${coinName} coin found in wallet`);
  }
  const [depositCoin] = txb.splitCoins(totalCoin, [amount]);
  if (poolData.strategyType == "LENDING") {
    await alphalendClient.updatePrices(txb, [coinsList[coinName].type]);
    await collectRewardsAndSwapSlush(poolName, txb);
    if (!positionCapId) {
      let positionCap: any = createPositionCap(txb);
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::user_deposit`,
        typeArguments: [coinsList[coinName].type],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          positionCap,
          txb.object(poolData.poolId),
          depositCoin,
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(C.SUI_SYSTEM_STATE),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.transferObjects([positionCap], address);
    } else {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::user_deposit`,
        typeArguments: [coinsList[coinName].type],
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(positionCapId),
          txb.object(poolData.poolId),
          depositCoin,
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(C.SUI_SYSTEM_STATE),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    }
  } else if (poolName == "ALPHALEND-SLUSH-STSUI-LOOP") {
    let borrowCoin = loopingPoolCoinMap[poolName].borrowCoin;
    await alphalendClient.updatePrices(txb, [
      coinsList[coinName].type,
      coinsList[borrowCoin].type,
    ]);
    await collectRewardsAndSwapSlush(poolName, txb);
    if (!positionCapId) {
      let positionCap: any = createPositionCap(txb);
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphafi_slush_stsui_sui_loop_pool::user_deposit`,
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          positionCap,
          txb.object(poolData.poolId),
          depositCoin,
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(C.LST_INFO),
          txb.object(C.SUI_SYSTEM_STATE),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
      txb.transferObjects([positionCap], address);
    } else {
      txb.moveCall({
        target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphafi_slush_stsui_sui_loop_pool::user_deposit`,
        arguments: [
          txb.object(C.ALPHA_SLUSH_VERSION),
          txb.object(positionCapId),
          txb.object(poolData.poolId),
          depositCoin,
          txb.object(C.LENDING_PROTOCOL_ID),
          txb.object(C.LST_INFO),
          txb.object(C.SUI_SYSTEM_STATE),
          txb.object(C.CLOCK_PACKAGE_ID),
        ],
      });
    }
  }

  txb.transferObjects([totalCoin], address);
  return txb;
}
export async function slushWithdraw(
  poolName: PoolName,
  xTokens: string,
  options: { address: string },
): Promise<Transaction> {
  const C = getConf();
  const address = options.address;
  const txb = new Transaction();
  const poolData = poolInfo[poolName];

  const coinName = singleAssetPoolCoinMap[poolName].coin;

  const suiClient = getSuiClient();
  const positionCapId = await getSlushPositionCapId(address, suiClient);
  if (!positionCapId) {
    throw new Error(
      "No PositionCap found in wallet — cannot perform slush withdraw",
    );
  }
  let slushCoin: any;
  if (poolData.strategyType == "LENDING") {
    await alphalendClient.updatePrices(txb, [coinsList[coinName].type]);
    await collectRewardsAndSwapSlush(poolName, txb);
    slushCoin = txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::user_withdraw`,
      typeArguments: [coinsList[coinName].type],
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(positionCapId),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  } else if (poolName == "ALPHALEND-SLUSH-STSUI-LOOP") {
    await alphalendClient.updatePrices(txb, [
      coinsList[coinName].type,
      coinsList[loopingPoolCoinMap[poolName].borrowCoin].type,
    ]);
    await collectRewardsAndSwapSlush(poolName, txb);
    slushCoin = txb.moveCall({
      target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphafi_slush_stsui_sui_loop_pool::user_withdraw`,
      arguments: [
        txb.object(C.ALPHA_SLUSH_VERSION),
        txb.object(positionCapId),
        txb.object(poolData.poolId),
        txb.pure.u64(xTokens),
        txb.object(C.LENDING_PROTOCOL_ID),
        txb.object(C.LST_INFO),
        txb.object(C.SUI_SYSTEM_STATE),
        txb.object(C.CLOCK_PACKAGE_ID),
      ],
    });
  }

  txb.transferObjects([slushCoin], address);

  return txb;
}
function createPositionCap(txb: Transaction): TransactionResult {
  const C = getConf();
  const urlBytes = Array.from(
    new TextEncoder().encode(C.ALPHA_SLUSH_POSITION_CAP_IMAGE_URL),
  );

  const positionCap = txb.moveCall({
    target: `${C.ALPHA_SLUSH_LATEST_PACKAGE_ID}::alphalend_slush_pool::create_position_cap`,
    arguments: [txb.pure.vector("u8", urlBytes)],
  });

  return positionCap;
}
