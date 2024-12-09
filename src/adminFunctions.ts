import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import {
  CetusInvestor,
  CommonInvestorFields,
  PoolName,
} from "./common/types.js";
import { getInvestor, getParentPool } from "./sui-sdk/functions/getReceipts.js";
import BN from "bn.js";
import { coinsList } from "./common/coins.js";
import { doubleAssetPoolCoinMap } from "./common/maps.js";
import { Decimal } from "decimal.js";

export async function getCurrentTick(poolName: PoolName) {
  const parentPool = await getParentPool(poolName, false);
  const current_sqrt_price = parentPool.content.fields.current_sqrt_price;
  const tick = TickMath.sqrtPriceX64ToTickIndex(new BN(current_sqrt_price));
  return tick.toString();
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
  return [lowerTick.toString(), upperTick.toString()];
}

export async function getTickToPrice(poolName: PoolName, tick: string) {
  const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
  const coinA = coinsList[coinAName];
  const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
  const coinB = coinsList[coinBName];
  const price = TickMath.tickIndexToPrice(Number(tick), coinA.expo, coinB.expo);
  return price.toString();
}

export async function getPriceToTick(poolName: PoolName, price: string) {
  const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
  const coinA = coinsList[coinAName];
  const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
  const coinB = coinsList[coinBName];
  const parentPool = await getParentPool(poolName, false);
  const tickSpacing = parentPool.content.fields.tick_spacing;
  const priceDecimal = new Decimal(price);
  const tick = TickMath.priceToInitializableTickIndex(
    priceDecimal,
    coinA.expo,
    coinB.expo,
    tickSpacing,
  );
  return tick.toString();
}
