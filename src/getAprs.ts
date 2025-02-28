import {
  calculateAprForPools,
  fetchAutoCompoundingEvents,
} from "./sui-sdk/events/fetchAutoCompoundingEvents.js";
import {
  Allocator,
  BluefinInvestor,
  CetusInvestor,
  CommonInvestorFields,
  MemberType,
  NaviInvestor,
  PoolName,
} from "./common/types.js";
import {
  doubleAssetPoolCoinMap,
  poolInfo,
  singleAssetPoolCoinMap,
} from "./common/maps.js";
import { Decimal } from "decimal.js";
import { getConf } from "./common/constants.js";
import {
  getCetusPool,
  getDistributor,
  getInvestor,
  getMultiCetusPool,
  getMultiInvestor,
  getMultiParentPool,
  getMultiPool,
  getParentPool,
  getPool,
} from "./sui-sdk/functions/getReceipts.js";
import { getLatestPrices, getMultiLatestPrices } from "./utils/prices.js";
import { PythPriceIdPair } from "./common/pyth.js";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import { coinsList } from "./common/coins.js";

export async function getApr(poolName: PoolName): Promise<number> {
  const aprMap = await getAprs([poolName]);
  const apr = aprMap[poolName];
  return apr;
}

export async function getAprs(
  poolNames?: PoolName[],
): Promise<Record<string, number>> {
  const endTime = Date.now();
  const startTime = endTime - 24 * 60 * 60 * 1000; // timestamp for 24 hours ago

  const events = await fetchAutoCompoundingEvents({
    startTime: startTime,
    endTime: endTime,
    poolNames: poolNames,
  });

  const aprMap = await calculateAprForPools(events);

  for (const pool of Object.keys(poolInfo)) {
    const poolName = pool as PoolName;
    if (!(poolName in aprMap)) {
      aprMap[poolName] = 0;
    }
  }

  return aprMap;
}

export async function getRewardAprs(
  poolNames?: PoolName[],
): Promise<Record<string, number>> {
  await Promise.all([
    getMultiPool(),
    getMultiCetusPool(),
    getMultiInvestor(),
    getMultiParentPool(),
    getMultiLatestPrices(),
  ]);
  const aprMap: Record<string, number> = {};

  if (poolNames) {
    poolNames.forEach(async (pool) => {
      aprMap[pool] = await fetchRewardAPR(pool as PoolName, false);
    });
  } else {
    for (const pool of Object.keys(poolInfo)) {
      aprMap[pool] = await fetchRewardAPR(pool as PoolName, false);
    }
  }
  return aprMap;
}

export async function getApy(poolName: PoolName): Promise<number> {
  const apy = convertAprToApy(await getApr(poolName));
  return apy;
}

export async function getApys(
  poolNames?: PoolName[],
): Promise<Record<string, number>> {
  const aprMap = await getAprs(poolNames);
  const rewardAprMap = await getRewardAprs(poolNames);
  // console.log(aprMap);
  // Convert each APR to APY
  const apyMap: Record<string, number> = {};
  for (const poolName in aprMap) {
    if (aprMap.hasOwnProperty(poolName)) {
      apyMap[poolName] = convertAprToApy(
        aprMap[poolName] + rewardAprMap[poolName],
      );
    }
  }

  return apyMap;
}

/**
 * Converts APR to APY with compounding 6 times a day
 * @param apr - The annual percentage rate (APR) as a decimal
 * @returns The annual percentage yield (APY) as a decimal
 */
function convertAprToApy(apr: number): number {
  const n = 6 * 365; // 6 times a day
  const apy = 100 * (Math.pow(1 + apr / 100 / n, n) - 1);
  return apy;
}

export async function fetchRewardAPR(
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<number> {
  let apr = 0;
  if (!(poolName in poolInfo)) {
    return 0;
  }
  try {
    if (poolName === "ALPHA") {
      const pool = await getPool("ALPHA", ignoreCache);
      const distributor = await getDistributor(ignoreCache);
      if (pool && distributor) {
        const allocator: Allocator = distributor.content.fields.pool_allocator;
        const tokensInvested = Number(pool.content.fields.tokensInvested);
        const target = Number(distributor.content.fields.target);
        const members: MemberType[] = allocator.fields.members.fields.contents;
        let alphaMember: MemberType | undefined = undefined;
        for (const member of members) {
          if (member.fields.key === getConf().ALPHA_POOL) {
            alphaMember = member;
          }
        }
        if (alphaMember) {
          const weight = Number(
            alphaMember.fields.value.fields.pool_data.fields.contents[0].fields
              .value.fields.weight,
          );
          const totalWeightArr = allocator.fields.total_weights.fields.contents;
          const totalWeight = Number(totalWeightArr[0].fields.value);

          if (totalWeight === 0 || tokensInvested === 0) return 0;

          apr =
            (((target / 100) * 365 * weight) / totalWeight / tokensInvested) *
            (2_750_000 / 4_250_000) *
            100;
        }
      }
    } else if (Object.keys(doubleAssetPoolCoinMap).includes(poolName)) {
      const distributor = await getDistributor(ignoreCache);
      let clmmPool;
      if (poolInfo[poolName].parentProtocolName == "CETUS") {
        clmmPool = await getCetusPool(poolName, ignoreCache);
      } else {
        clmmPool = await getParentPool(poolName, ignoreCache);
      }
      const pool = await getPool(poolName, ignoreCache);
      let investor;
      if (poolInfo[poolName].parentProtocolName == "CETUS") {
        investor = (await getInvestor(poolName, ignoreCache)) as CetusInvestor &
          CommonInvestorFields;
      } else {
        investor = (await getInvestor(
          poolName,
          ignoreCache,
        )) as BluefinInvestor & CommonInvestorFields;
      }
      const tokenA = doubleAssetPoolCoinMap[poolName].coin1;
      const tokenB = doubleAssetPoolCoinMap[poolName].coin2;

      if (distributor && clmmPool && investor && pool) {
        const allocator: Allocator = distributor.content.fields.pool_allocator;
        const members: MemberType[] = allocator.fields.members.fields.contents;

        let poolMember: MemberType | undefined = undefined;

        for (const member of members) {
          if (member.fields.key == poolInfo[poolName].poolId) {
            poolMember = member;
          }
        }

        if (poolMember) {
          try {
            const target = Number(distributor.content.fields.target);
            const weight = Number(
              poolMember.fields.value.fields.pool_data.fields.contents[0].fields
                .value.fields.weight,
            );
            const totalWeight = Number(
              allocator.fields.total_weights.fields.contents[0].fields.value,
            );

            if (totalWeight === 0) return 0;

            const [priceOfCoin0, priceOfCoin1] = await getLatestPrices(
              [
                `${tokenA}/USD` as PythPriceIdPair,
                `${tokenB}/USD` as PythPriceIdPair,
              ],
              ignoreCache,
            );
            const [priceOfAlpha] = await getLatestPrices(
              ["ALPHA/USD"],
              ignoreCache,
            );
            if (priceOfCoin0 && priceOfCoin1) {
              const liquidity = Math.floor(
                parseFloat(pool.content.fields.tokensInvested),
              ).toString();
              const current_sqrt_price = new BN(
                clmmPool.content.fields.current_sqrt_price,
              );
              const upperBound = 443636;
              let lowerTick = Number(investor.content.fields.lower_tick);
              let upperTick = Number(investor.content.fields.upper_tick);

              if (lowerTick > upperBound) {
                lowerTick = -~(lowerTick - 1);
              }
              if (upperTick > upperBound) {
                upperTick = -~(upperTick - 1);
              }
              const upper_sqrt_price =
                TickMath.tickIndexToSqrtPriceX64(upperTick);
              const lower_sqrt_price =
                TickMath.tickIndexToSqrtPriceX64(lowerTick);
              const { coinA, coinB } = ClmmPoolUtil.getCoinAmountFromLiquidity(
                new BN(liquidity),
                current_sqrt_price,
                lower_sqrt_price,
                upper_sqrt_price,
                false,
              );
              let amount0 = coinA;
              let amount1 = coinB;
              // amount0 = amount0 / 10 ** coins[tokenA as CoinName].expo;
              // amount1 = amount1 / 10 ** coins[tokenB as CoinName].expo;
              amount0 = amount0.div(new BN(10 ** coinsList[tokenA].expo));
              amount1 = amount1.div(new BN(10 ** coinsList[tokenB].expo));

              if (priceOfAlpha) {
                const amount0Big = new Decimal(amount0.toString());
                const targetBig = new Decimal(target);
                const weightBig = new Decimal(weight);
                const totalWeightBig = new Decimal(totalWeight);
                const priceOfAlphaBig = new Decimal(priceOfAlpha);
                const priceOfCoin0Big = new Decimal(priceOfCoin0);
                const amount1Big = new Decimal(amount1.toString());
                const priceOfCoin1Big = new Decimal(priceOfCoin1);

                if (
                  totalWeight === 0 ||
                  amount0Big
                    .mul(priceOfCoin0Big)
                    .add(amount1Big.mul(priceOfCoin1Big))
                    .isZero()
                ) {
                  return 0;
                }
                // apr =
                //   (((((target / (100 * 1_000_000_000)) * 365 * weight) /
                //     totalWeight) *
                //     parseFloat(priceOfAlpha)) /
                //     (amount0 * Number(priceOfCoin0) +
                //       amount1 * Number(priceOfCoin1))) *
                //   (2_750_000 / 4_250_000) *
                //   100;

                apr = targetBig
                  .div(new Decimal(100).mul(new Decimal(1000000000)))
                  .mul(new Decimal(365))
                  .mul(weightBig)
                  .div(totalWeightBig)
                  .mul(priceOfAlphaBig)
                  .div(
                    amount0Big
                      .mul(priceOfCoin0Big)
                      .add(amount1Big.mul(priceOfCoin1Big)),
                  )
                  .mul(new Decimal(2750000).div(new Decimal(4250000)))
                  .mul(new Decimal(100))
                  .toNumber();
              }
            }
          } catch (error) {
            console.log(
              `Error calculating Alpha APR for pool ${poolName}`,
              error,
            );
          }
        }
      }
    } else if (Object.keys(singleAssetPoolCoinMap).includes(poolName)) {
      const distributor = await getDistributor(ignoreCache);
      const pool = await getPool(poolName, ignoreCache);

      const token = singleAssetPoolCoinMap[poolName];

      if (distributor && pool) {
        const allocator: Allocator = distributor.content.fields.pool_allocator;
        const members: MemberType[] = allocator.fields.members.fields.contents;

        let poolMember: MemberType | undefined = undefined;

        for (const member of members) {
          if (member.fields.key == poolInfo[poolName].poolId) {
            poolMember = member;
          }
        }

        if (poolMember) {
          try {
            const target = Number(distributor.content.fields.target);
            const weight = Number(
              poolMember.fields.value.fields.pool_data.fields.contents[0].fields
                .value.fields.weight,
            );
            const totalWeight = Number(
              allocator.fields.total_weights.fields.contents[0].fields.value,
            );

            if (totalWeight === 0) return 0;

            const [priceOfCoin] = await getLatestPrices(
              [`${token.coin}/USD` as PythPriceIdPair],
              ignoreCache,
            );

            const [priceOfAlpha] = await getLatestPrices(
              ["ALPHA/USD"],
              ignoreCache,
            );
            if (priceOfCoin) {
              let tokensInvested = new Decimal(
                pool.content.fields.tokensInvested,
              );
              // dividing by 1e9 for every token because navi scales every token's liquidity to 1e9;
              if (
                poolName == "NAVI-LOOP-SUI-VSUI" ||
                poolName == "NAVI-LOOP-USDC-USDT" ||
                poolName == "NAVI-LOOP-HASUI-SUI" ||
                poolName == "NAVI-LOOP-USDT-USDC"
              ) {
                const investor = (await getInvestor(
                  poolName,
                  ignoreCache,
                )) as NaviInvestor & CommonInvestorFields;
                if (investor) {
                  const debtToSupplyRatio = new Decimal(
                    investor.content.fields.current_debt_to_supply_ratio,
                  );
                  tokensInvested = tokensInvested
                    .mul(
                      new Decimal(1).minus(
                        debtToSupplyRatio.div(new Decimal(1e20)),
                      ),
                    )
                    .div(new Decimal(1e9));
                } else {
                  tokensInvested = new Decimal(0);
                }
              } else {
                tokensInvested = tokensInvested.div(Math.pow(10, 9));
              }
              const liquidity = tokensInvested.toNumber();
              if (priceOfAlpha) {
                if (totalWeight === 0 || liquidity * Number(priceOfCoin) === 0)
                  return 0;

                apr =
                  (((((target / (100 * 1_000_000_000)) * 365 * weight) /
                    totalWeight) *
                    parseFloat(priceOfAlpha)) /
                    (liquidity * Number(priceOfCoin))) *
                  (2_750_000 / 4_250_000) *
                  100;
              }
            }
          } catch (e) {
            console.error("error in fetchRewardAPR", e);
          }
        }
      }
    } else {
      console.log("fetchRewardAPR not implemented for poolName: " + poolName);
    }
  } catch (e) {
    console.error("error in fetchRewardAPR", e);
  }

  if (!apr) {
    apr = 0;
  }
  return apr;
}
