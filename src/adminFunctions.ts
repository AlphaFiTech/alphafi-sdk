import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import {
  Allocator,
  BluefinPoolType,
  CetusInvestor,
  CetusPoolType,
  CommonInvestorFields,
  MemberType,
  PoolName,
  CoinName,
  PoolWeightDistribution,
  PoolData,
} from "./common/types.js";
import {
  getDistributor,
  getInvestor,
  getParentPool,
} from "./sui-sdk/functions/getReceipts.js";
import BN from "bn.js";
import { coinsList } from "./common/coins.js";
import {
  doubleAssetPoolCoinMap,
  poolIdPoolNameMap,
  poolInfo,
} from "./common/maps.js";
import { Decimal } from "decimal.js";
import { Transaction } from "@mysten/sui/transactions";
import { conf, CONF_ENV } from "./common/constants.js";
import { getSuiClient } from "./index.js";

export async function getCurrentTick(poolName: PoolName) {
  const parentPool = await getParentPool(poolName, false);
  const current_sqrt_price = parentPool.content.fields.current_sqrt_price;
  const tick = TickMath.sqrtPriceX64ToTickIndex(new BN(current_sqrt_price));
  return tick;
}

export async function getPositionTicks(poolName: PoolName) {
  const upperBound = 443636;
  const investor = (await getInvestor(poolName, false)) as CetusInvestor &
    CommonInvestorFields;
  let lowerTick = Number(investor.content.fields.lower_tick);
  let upperTick = Number(investor.content.fields.upper_tick);
  if (lowerTick > upperBound) {
    lowerTick = -~(lowerTick - 1);
  }
  if (upperTick > upperBound) {
    upperTick = -~(upperTick - 1);
  }
  return [lowerTick, upperTick];
}

export function getTickToPrice(poolName: PoolName, tick: number) {
  const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
  const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
  const price = TickMath.tickIndexToPrice(
    tick,
    coinsList[coinAName].expo,
    coinsList[coinBName].expo,
  );
  return price.toString();
}

export function getPriceToTick(
  poolName: PoolName,
  price: string,
  tickSpacing: number,
  isUpper: boolean = false,
) {
  const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
  const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
  let tick = TickMath.priceToTickIndex(
    new Decimal(price),
    coinsList[coinAName].expo,
    coinsList[coinBName].expo,
  );
  if (tick % tickSpacing) {
    if (isUpper === tick > 0) {
      tick = tick + tickSpacing - (tick % tickSpacing);
    } else {
      tick = tick - (tick % tickSpacing);
    }
  }
  return tick;
}

export async function getTickSpacing(poolName: PoolName) {
  const parentPool = await getParentPool(poolName, false);
  let tickSpacing = 1;
  if (poolInfo[poolName].parentProtocolName === "CETUS") {
    tickSpacing = (parentPool as CetusPoolType).content.fields.tick_spacing;
  } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
    tickSpacing = (parentPool as BluefinPoolType).content.fields.ticks_manager
      .fields.tick_spacing;
  }
  return tickSpacing;
}

export const setWeights = async (
  poolIdNames: string[],
  weightsString: string[],
  setWeightCoinType: CoinName,
  address: string,
) => {
  const poolIds: string[] = [];
  const txb = new Transaction();
  poolIdNames.forEach((poolName) => {
    poolIds.push(poolInfo[poolName].poolId);
  });
  const adminCap = await getSuiClient().getOwnedObjects({
    owner: address,
    filter: {
      StructType:
        "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::distributor::AdminCap",
    },
    options: {
      showContent: true,
    },
  });
  if (!adminCap.data || adminCap.data.length === 0) {
    throw new Error("No adminCap data found.");
  }

  if (!adminCap.data[0].data) {
    throw new Error("adminCap.data[0].data is undefined.");
  }

  const objectId = adminCap.data[0].data.objectId;
  txb.moveCall({
    target: `${conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID}::distributor::set_weights`,
    typeArguments: [coinsList[setWeightCoinType].type],
    arguments: [
      txb.object(objectId),
      txb.object(conf[CONF_ENV].ALPHA_DISTRIBUTOR),
      txb.object(conf[CONF_ENV].VERSION),
      txb.pure.vector("id", poolIds),
      txb.pure.vector("u64", weightsString),
      txb.object(conf[CONF_ENV].CLOCK_PACKAGE_ID),
    ],
  });

  // executeTransactionBlock(txb);
  // dryRunTransactionBlock(txb);
  return txb;
};

export async function getPoolsWeightDistribution(
  coinTypetoSetWeight: CoinName,
  ignoreCache: boolean,
): Promise<PoolWeightDistribution> {
  const distributor = await getDistributor(ignoreCache);
  if (!distributor || !distributor.content.fields.pool_allocator) {
    throw new Error("Distributor or pool allocator not found");
  }
  const allocator: Allocator = distributor.content.fields.pool_allocator;
  const members: MemberType[] = allocator.fields.members.fields.contents;

  const totalWeightArr = allocator.fields.total_weights.fields.contents;
  let totalWeight = 0;
  totalWeightArr.forEach((entry) => {
    if (
      entry.fields.key.fields.name ===
      coinsList[coinTypetoSetWeight].type.substring(2)
    ) {
      totalWeight = Number(entry.fields.value);
    }
  });

  const poolIdmap = poolIdPoolNameMap;

  const poolDataArray: PoolData[] = [];

  for (const member of members) {
    const poolId = member.fields.key;
    const poolName = poolIdmap[poolId];
    if (!poolInfo[poolName]) {
      continue;
    }
    const imageUrl1 = poolInfo[poolName].imageUrl1;
    const imageUrl2 = poolInfo[poolName].imageUrl2;
    const lockIcon = poolInfo[poolName].lockIcon;

    let weight = 0;
    if (member.fields.value.fields) {
      const poolData = member.fields.value.fields.pool_data.fields.contents;
      poolData.forEach((entry) => {
        if (
          entry.fields.key.fields.name ===
          coinsList[coinTypetoSetWeight].type.substring(2)
        ) {
          weight = Number(entry.fields.value.fields.weight);
        }
      });
    }

    poolDataArray.push({
      weight: weight,
      imageUrl1: imageUrl1,
      imageUrl2: imageUrl2,
      lockIcon: lockIcon,
      poolName: poolName,
    });
  }
  return {
    data: poolDataArray,
    totalWeight: totalWeight,
    coinType: coinTypetoSetWeight,
  };
}
