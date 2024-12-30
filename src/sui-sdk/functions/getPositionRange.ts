import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { poolInfo, getInvestor, doubleAssetPoolCoinMap } from "../../index.js";
import { coinsList } from "../../common/coins.js";
import {
  PoolName,
  Investor,
  CetusInvestor,
  CommonInvestorFields,
  BluefinInvestor,
} from "../../common/types.js";

export async function getPositionRanges(poolNames: PoolName[] = []) {
  const res = new Map<PoolName, { lowerPrice: string; upperPrice: string }>();

  // Use Promise.all to handle multiple promises in parallel
  await Promise.all(
    poolNames.map(async (poolName) => {
      if (
        poolName == "ALPHA" ||
        !["CETUS", "BLUEFIN"].includes(
          poolInfo[poolName.toString()].parentProtocolName,
        )
      ) {
        return;
      }
      let investor: Investor;
      if (poolInfo[poolName.toString()].parentProtocolName == "CETUS") {
        investor = (await getInvestor(
          poolName as PoolName,
          false,
        )) as CetusInvestor & CommonInvestorFields;
      } else {
        investor = (await getInvestor(
          poolName as PoolName,
          false,
        )) as BluefinInvestor & CommonInvestorFields;
      }
      const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
      const coinA = coinsList[coinAName];
      const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
      const coinB = coinsList[coinBName];
      if (investor) {
        const upperBound = 443636;
        let lowerTick = Number(investor.content.fields.lower_tick);
        let upperTick = Number(investor.content.fields.upper_tick);
        if (lowerTick > upperBound) {
          lowerTick = -~(lowerTick - 1);
        }
        if (upperTick > upperBound) {
          upperTick = -~(upperTick - 1);
        }
        const lowerPrice = TickMath.tickIndexToPrice(
          lowerTick,
          coinA.expo,
          coinB.expo,
        );
        const upperPrice = TickMath.tickIndexToPrice(
          upperTick,
          coinA.expo,
          coinB.expo,
        );
        res.set(poolName, {
          lowerPrice: lowerPrice.toString(),
          upperPrice: upperPrice.toString(),
        });
      }
    }),
  );
  return res;
}

export async function getPositionRange(
  ignoreCache: boolean,
): Promise<Map<PoolName, { lowerPrice: string; upperPrice: string }>> {
  const res = new Map<PoolName, { lowerPrice: string; upperPrice: string }>();
  for (const poolNameString of Object.keys(poolInfo)) {
    const poolName = poolNameString as PoolName;
    if (
      poolName == "ALPHA" ||
      !["CETUS", "BLUEFIN"].includes(
        poolInfo[poolNameString].parentProtocolName,
      )
    ) {
      continue;
    }
    let investor: Investor;
    if (poolInfo[poolNameString].parentProtocolName == "CETUS") {
      investor = (await getInvestor(
        poolName as PoolName,
        ignoreCache,
      )) as CetusInvestor & CommonInvestorFields;
    } else {
      investor = (await getInvestor(
        poolName as PoolName,
        ignoreCache,
      )) as BluefinInvestor & CommonInvestorFields;
    }
    const coinAName = doubleAssetPoolCoinMap[poolName].coin1;
    const coinA = coinsList[coinAName];
    const coinBName = doubleAssetPoolCoinMap[poolName].coin2;
    const coinB = coinsList[coinBName];
    if (investor) {
      const upperBound = 443636;
      let lowerTick = Number(investor.content.fields.lower_tick);
      let upperTick = Number(investor.content.fields.upper_tick);
      if (lowerTick > upperBound) {
        lowerTick = -~(lowerTick - 1);
      }
      if (upperTick > upperBound) {
        upperTick = -~(upperTick - 1);
      }
      const lowerPrice = TickMath.tickIndexToPrice(
        lowerTick,
        coinA.expo,
        coinB.expo,
      );
      const upperPrice = TickMath.tickIndexToPrice(
        upperTick,
        coinA.expo,
        coinB.expo,
      );
      res.set(poolName, {
        lowerPrice: lowerPrice.toString(),
        upperPrice: upperPrice.toString(),
      });
    }
  }
  return res;
}
