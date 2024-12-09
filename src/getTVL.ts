import { Decimal } from "decimal.js";
import {
  CetusInvestor,
  NaviInvestor,
  CommonInvestorFields,
  CetusPoolType,
  PoolName,
  BluefinInvestor,
  getPool,
  poolInfo,
  singleAssetPoolCoinMap,
  BluefinPoolType,
  coinsList,
  doubleAssetPoolCoinMap,
} from "./index.js";
import {
  getDistributor,
  getInvestor,
  getMultiInvestor,
  getMultiParentPool,
  getParentPool,
} from "./sui-sdk/functions/getReceipts.js";
import { getLatestPrices, getMultiLatestPrices } from "./utils/prices.js";
import { PythPriceIdPair } from "./common/pyth.js";
import BN from "bn.js";
import { ClmmPoolUtil, TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";

export async function getTVLs(): Promise<Map<PoolName, string>> {
  const tvlMap = new Map<PoolName, string>();
  await getMultiInvestor();
  await getMultiLatestPrices();
  await getMultiParentPool();
  //   await getMultiPool();
  const pools = Object.keys(poolInfo);
  for (const key of pools) {
    const tvl = await fetchTVL(key as PoolName, false);
    tvlMap.set(key as PoolName, tvl);
  }
  return tvlMap;
}

export async function fetchTVL(
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<string> {
  const pool = await getPool(poolName, ignoreCache);

  if (poolInfo[poolName].parentProtocolName == "NAVI") {
    const poolToken = singleAssetPoolCoinMap[poolName].coin;
    const [priceOfCoin] = await getLatestPrices(
      [`${poolToken}/USD` as PythPriceIdPair],
      ignoreCache,
    );
    let tvl = new Decimal(0);
    if (poolInfo[poolName].strategyType === "LOOPING") {
      const investor = (await getInvestor(
        poolName,
        ignoreCache,
      )) as NaviInvestor & CommonInvestorFields;
      const liquidity = new Decimal(investor.content.fields.tokensDeposited);
      const debtToSupplyRatio = new Decimal(
        investor.content.fields.current_debt_to_supply_ratio,
      );
      const tokensInvested = liquidity.mul(
        new Decimal(1).minus(debtToSupplyRatio.div(new Decimal(1e20))),
      );
      if (poolName == "NAVI-LOOP-SUI-VSUI") {
        const [vsuiPrice] = await getLatestPrices(
          [`VSUI/USD` as PythPriceIdPair],
          ignoreCache,
        );
        if (vsuiPrice) {
          tvl = new Decimal(tokensInvested).mul(vsuiPrice).div(1e9);
        }
      } else {
        tvl = tokensInvested.div(1e9).mul(priceOfCoin);
      }
    } else {
      const liquidity = new Decimal(pool.content.fields.tokensInvested);
      const tokensInvested = liquidity.div(new Decimal(Math.pow(10, 9)));
      tvl = tokensInvested.mul(priceOfCoin);
    }

    return tvl.toString();
  } else if (poolInfo[poolName].parentProtocolName == "BUCKET") {
    const poolToken = singleAssetPoolCoinMap[poolName].coin;
    const [priceOfCoin] = await getLatestPrices(
      [`${poolToken}/USD` as PythPriceIdPair],
      ignoreCache,
    );
    const liquidity = new Decimal(pool.content.fields.tokensInvested);
    const tokensInvested = liquidity.div(
      new Decimal(
        Math.pow(10, coinsList[singleAssetPoolCoinMap[poolName].coin].expo),
      ),
    );
    const tvl = tokensInvested.mul(priceOfCoin);

    return tvl.toString();
  } else if (poolInfo[poolName].parentProtocolName === "ALPHAFI") {
    const distributor = await getDistributor(ignoreCache);
    const [priceOfAlpha] = await getLatestPrices(["ALPHA/USD"], ignoreCache);
    if (pool && distributor && priceOfAlpha) {
      const tokensInvested = new Decimal(pool.content.fields.tokensInvested);
      const tvl = tokensInvested.div(1e9).mul(new Decimal(priceOfAlpha));

      return tvl.toString();
    }
  } else if (poolInfo[poolName].parentProtocolName === "CETUS") {
    const cetus_pool = (await getParentPool(
      poolName,
      ignoreCache,
    )) as CetusPoolType;
    const investor = (await getInvestor(
      poolName,
      ignoreCache,
    )) as CetusInvestor & CommonInvestorFields;

    return await fetchAlphafiV3PoolTVL(
      poolName,
      cetus_pool,
      investor,
      ignoreCache,
    );
  } else if (poolInfo[poolName].parentProtocolName === "BLUEFIN") {
    const bluefin_pool = (await getParentPool(
      poolName,
      ignoreCache,
    )) as BluefinPoolType;
    const investor = (await getInvestor(
      poolName,
      ignoreCache,
    )) as BluefinInvestor & CommonInvestorFields;

    return await fetchAlphafiV3PoolTVL(
      poolName,
      bluefin_pool,
      investor,
      ignoreCache,
    );
  }
  return "0";
}

export async function fetchAlphafiV3PoolTVL(
  poolName: PoolName,
  clmmPool: CetusPoolType | BluefinPoolType,
  investor: (CetusInvestor | BluefinInvestor) & CommonInvestorFields,
  ignoreCache: boolean,
): Promise<string> {
  const pool = await getPool(poolName, ignoreCache);
  const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
  const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

  const [priceOfCoin0, priceOfCoin1] = await getLatestPrices(
    [`${pool1}/USD` as PythPriceIdPair, `${pool2}/USD` as PythPriceIdPair],
    ignoreCache,
  );

  const liquidity = new BN(pool.content.fields.tokensInvested);
  const current_sqrt_price = new BN(clmmPool.content.fields.current_sqrt_price);
  let upper_tick = parseInt(investor.content.fields.upper_tick);
  let lower_tick = parseInt(investor.content.fields.lower_tick);
  if (Math.abs(lower_tick - Math.pow(2, 32)) < lower_tick) {
    lower_tick = lower_tick - Math.pow(2, 32);
  }
  if (Math.abs(upper_tick - Math.pow(2, 32)) < upper_tick) {
    upper_tick = upper_tick - Math.pow(2, 32);
  }
  const upper_sqrt_price = TickMath.tickIndexToSqrtPriceX64(upper_tick);
  const lower_sqrt_price = TickMath.tickIndexToSqrtPriceX64(lower_tick);
  const { coinA, coinB } = ClmmPoolUtil.getCoinAmountFromLiquidity(
    liquidity,
    current_sqrt_price,
    lower_sqrt_price,
    upper_sqrt_price,
    false,
  );
  let amount0 = new Decimal(coinA.toString());
  let amount1 = new Decimal(coinB.toString());

  const ten = new Decimal(10);
  amount0 = amount0.div(ten.pow(coinsList[pool1].expo));
  amount1 = amount1.div(ten.pow(coinsList[pool2].expo));

  const tvl = amount0.mul(priceOfCoin0).add(amount1.mul(priceOfCoin1));

  return tvl.toString();
}
