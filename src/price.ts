import BN from "bn.js";
import { coins } from "./common/coins";
import CetusClmmSDK, {
  SdkOptions,
  Pool,
  Percentage,
  adjustForSlippage,
  CalculateRatesResult,
  ClmmPoolUtil,
  TickMath,
  d,
} from "../node_modules/@cetusprotocol/cetus-sui-clmm-sdk/dist/index";
import {
  CetusSwapOptions,
  Coin,
  CreatePoolOptions,
  SimpleCache,
} from "./common/types";
import { Transaction } from "../node_modules/@mysten/sui/dist/cjs/transactions/index";
import { cetusMainnetSDKOptions } from "./common/cetus_mainnet_config";
import axios from "../node_modules/axios/index";
import { PythPriceIdPair } from "./common/pyth";

export async function getLatestPrice(
  pair: PythPriceIdPair,
): Promise<string | undefined> {
  let price: string | undefined = undefined;

  if (pair === ("ALPHA/USD" as PythPriceIdPair)) {
    const alphaPrice = await getAlphaPrice();
    if (alphaPrice) {
      price = `${alphaPrice}`;
    }
  } else if (pair === ("USDY/USD" as PythPriceIdPair)) {
    const usdyPrice = await getUSDYPrice();
    if (usdyPrice) {
      price = `${usdyPrice}`;
    }
  } else {
    try {
      price = await fetchPriceFromAlphaAPI(pair);
      if (!price) {
        console.log(`Failed to get price for pair ${pair}`);
      }
    } catch (error) {
      console.error(`Error in getPrice for pair ${pair}:`, error);
    }
  }
  return price;
}

interface PythPricePair {
  pair: PythPriceIdPair;
  price: string;
}

async function fetchPriceFromAlphaAPI(
  pair: string,
): Promise<string | undefined> {
  let pythPricePair: PythPricePair | undefined = undefined;
  const cachedPromise = axios
    .get<PythPricePair>(`https://api.alphafi.xyz/alpha/fetchPrice?pair=${pair}`)
    .then((response) => {
      const data = response.data;
      return data;
    })
    .catch((error) => {
      throw error;
    });
  pythPricePair = await cachedPromise;

  if (pythPricePair) {
    return pythPricePair.price;
  } else {
    throw new Error(`Price not found for pair: ${pair}`);
  }
}

const alphaPricePromiseCache = new SimpleCache<Promise<number>>(60000);
const alphaPriceCache = new SimpleCache<number>(60000);

export async function getAlphaPrice(
  ignoreCache: boolean = false,
): Promise<number | undefined> {
  const cacheKey = `getAlphaPrice`;
  if (ignoreCache) {
    alphaPriceCache.delete(cacheKey);
    alphaPricePromiseCache.delete(cacheKey);
  }
  const cachedResponse = alphaPriceCache.get(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }
  let alphaPrice = 0;
  let cachedPromise = alphaPricePromiseCache.get(cacheKey);
  if (!cachedPromise) {
    cachedPromise = (async (): Promise<number> => {
      const cetusGateway = new CetusGateway(cetusMainnetSDKOptions);
      const swapOption: CetusSwapOptions = {
        pair: { coinA: coins.ALPHA, coinB: coins.SUI },
        senderAddress:
          "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e",
        slippage: 1,
        inAmount: new BN(1_000_000_000),
      };
      const res = await cetusGateway.getPrice(swapOption);
      const latestSuiPrice = await getLatestPrice("SUI/USD");
      if (latestSuiPrice) {
        alphaPrice =
          res.estimatedAmountOut.toNumber() * Number(latestSuiPrice) * 1e-9;
        alphaPriceCache.set(cacheKey, alphaPrice);
        alphaPricePromiseCache.delete(cacheKey); // Remove the promise from cache
      }
      return alphaPrice;
    })().catch((error) => {
      alphaPricePromiseCache.delete(cacheKey); // Remove the promise from cache
      throw error;
    });

    alphaPricePromiseCache.set(cacheKey, cachedPromise);
  }

  return cachedPromise;
}

export async function getUSDYPrice(): Promise<number | undefined> {
  const cetusGateway = new CetusGateway(cetusMainnetSDKOptions);
  const swapOption: CetusSwapOptions = {
    pair: { coinA: coins.USDY, coinB: coins.USDC },
    senderAddress:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e",
    slippage: 1,
    inAmount: new BN(1_000_000),
  };
  const res = await cetusGateway.getPrice(swapOption);
  const latestSuiPrice = await getLatestPrice("USDC/USD");
  if (latestSuiPrice) {
    return res.estimatedAmountOut.toNumber() * Number(latestSuiPrice) * 1e-6;
  }
}

interface PoolData {
  pair: string;
  id: string;
  a2b: boolean;
}

const poolData: { [key: string]: PoolData } = {
  "SUI/USDC": {
    pair: "SUI/USDC",
    id: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
    a2b: false,
  },
  "USDC/SUI": {
    pair: "USDC/SUI",
    id: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
    a2b: true,
  },
  "SUI/USDT": {
    pair: "SUI/USDT",
    id: "0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3",
    a2b: false,
  },
  "USDT/SUI": {
    pair: "USDT/SUI",
    id: "0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3",
    a2b: true,
  },
  "USDC/USDT": {
    pair: "USDC/USDT",
    id: "0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20",
    a2b: false,
  },
  "USDT/USDC": {
    pair: "USDT/USDC",
    id: "0xc8d7a1503dc2f9f5b05449a87d8733593e2f0f3e7bffd90541252782e4d2ca20",
    a2b: true,
  },
  "SUI/VSUI": {
    pair: "SUI/VSUI",
    id: "0x6c545e78638c8c1db7a48b282bb8ca79da107993fcb185f75cedc1f5adb2f535",
    a2b: false,
  },
  "VSUI/SUI": {
    pair: "VSUI/SUI",
    id: "0x6c545e78638c8c1db7a48b282bb8ca79da107993fcb185f75cedc1f5adb2f535",
    a2b: true,
  },
  "SUI/NAVX": {
    pair: "SUI/NAVX",
    id: "0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703",
    a2b: false,
  },
  "NAVX/SUI": {
    pair: "NAVX/SUI",
    id: "0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703",
    a2b: true,
  },
  "ALPHA/SUI": {
    pair: "ALPHA/SUI",
    id: "0xda7347c3192a27ddac32e659c9d9cbed6f8c9d1344e605c71c8886d7b787d720",
    a2b: true,
  },
  "SUI/ALPHA": {
    pair: "ALPHA/SUI",
    id: "0xda7347c3192a27ddac32e659c9d9cbed6f8c9d1344e605c71c8886d7b787d720",
    a2b: false,
  },
  "USDY/USDC": {
    pair: "USDY/USDC",
    id: "0x0e809689d04d87f4bd4e660cd1b84bf5448c5a7997e3d22fc480e7e5e0b3f58d",
    a2b: true,
  },
  "USDC/USDY": {
    pair: "USDY/USDC",
    id: "0x0e809689d04d87f4bd4e660cd1b84bf5448c5a7997e3d22fc480e7e5e0b3f58d",
    a2b: false,
  },
};

export class CetusGateway {
  private cetusSDK: CetusClmmSDK;

  constructor(sdkOptions: SdkOptions) {
    this.cetusSDK = new CetusClmmSDK(sdkOptions);
    this.cetusSDK.senderAddress = sdkOptions.simulationAccount.address;
  }

  async getPools(pairs: { coinA?: Coin; coinB?: Coin }[]) {
    const allPools = await this.cetusSDK.Pool.getPoolsWithPage([]);
    const matchedPools: Pool[] = [];

    pairs.forEach((pair) => {
      const filteredPools: Pool[] = allPools.filter((pool) => {
        if (pair.coinA && pair.coinB) {
          return (
            (pool.coinTypeA === pair.coinA.type &&
              pool.coinTypeB === pair.coinB.type) ||
            (pool.coinTypeA === pair.coinB.type &&
              pool.coinTypeB === pair.coinA.type)
          );
        } else if (pair.coinA && !pair.coinB) {
          return (
            pool.coinTypeA === pair.coinA.type ||
            pool.coinTypeB === pair.coinA.type
          );
        } else if (!pair.coinA && pair.coinB) {
          return (
            pool.coinTypeB === pair.coinB.type ||
            pool.coinTypeB === pair.coinB.type
          );
        }
      });
      matchedPools.push(...filteredPools);
    });

    console.log(matchedPools);
    console.log(`Matched pools for specified pairs: ${matchedPools.length}`);
    console.log(`Total pools: ${allPools.length}`);
    return matchedPools;
  }

  async getPrice(options: CetusSwapOptions): Promise<CalculateRatesResult> {
    const { pair, inAmount, outAmount } = options;
    const poolDatum = poolData[pair.coinA.name + "/" + pair.coinB.name];
    let amount: BN = new BN(0);
    let byAmountIn: boolean = true;
    if (inAmount) {
      byAmountIn = true;
      amount = inAmount;
    } else if (outAmount) {
      byAmountIn = false;
      amount = outAmount;
    }

    const pool = await this.cetusSDK.Pool.getPool(poolDatum.id);

    const swapTicks = await this.cetusSDK.Pool.fetchTicks({
      pool_id: pool.poolAddress,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
    });

    const res = this.cetusSDK.Swap.calculateRates({
      decimalsA: pair.coinA.expo,
      decimalsB: pair.coinB.expo,
      a2b: poolDatum.a2b,
      byAmountIn,
      amount,
      swapTicks,
      currentPool: pool,
    });

    return res;
  }

  async getTransaction(options: CetusSwapOptions): Promise<Transaction> {
    const res = await this.getPrice(options);

    const { pair, senderAddress, slippage, inAmount, outAmount } = options;
    const poolDatum = poolData[pair.coinA.name + "/" + pair.coinB.name];
    const poolID = poolDatum.id;
    const pool = await this.cetusSDK.Pool.getPool(poolID);

    let byAmountIn: boolean = true;
    if (inAmount) {
      byAmountIn = true;
    } else if (outAmount) {
      byAmountIn = false;
    }

    const slippagePercentage = new Percentage(
      new BN(Math.floor(slippage * 100).toString()),
      new BN(100),
    );
    const toAmount = byAmountIn
      ? res.estimatedAmountOut
      : res.estimatedAmountIn;
    const amountLimit = adjustForSlippage(
      toAmount,
      slippagePercentage,
      !byAmountIn,
    );
    // TransactionBlock
    this.cetusSDK.senderAddress = senderAddress;
    const txb = this.cetusSDK.Swap.createSwapTransactionPayload({
      pool_id: pool.poolAddress,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      a2b: poolDatum.a2b,
      by_amount_in: byAmountIn,
      amount: res.amount.toString(),
      amount_limit: amountLimit.toString(),
    });

    return txb;
  }

  async createPoolTransactionBlock(
    options: CreatePoolOptions,
  ): Promise<Transaction> {
    console.log(
      d(options.initializePrice),
      coins[options.coinNameA].expo,
      coins[options.coinNameB].expo,
    );

    const initializeSqrtPrice = TickMath.priceToSqrtPriceX64(
      d(options.initializePrice),
      coins[options.coinNameA].expo,
      coins[options.coinNameB].expo,
    ).toString();

    const current_tick_index = TickMath.sqrtPriceX64ToTickIndex(
      new BN(Math.floor(parseFloat(initializeSqrtPrice)).toString()),
    );

    // build tick range
    const lowerTick = TickMath.getPrevInitializableTickIndex(
      new BN(Math.floor(current_tick_index).toString()).toNumber(),
      new BN(options.tickSpacing.toString()).toNumber(),
    );
    const upperTick = TickMath.getNextInitializableTickIndex(
      new BN(Math.floor(current_tick_index).toString()).toNumber(),
      new BN(options.tickSpacing.toString()).toNumber(),
    );

    // slippage value 0.05 means 5%
    const slippage = 0.01;
    // Estimate liquidity and token amount from one amounts
    const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
      lowerTick,
      upperTick,
      new BN(options.amount.toString()),
      options.isAmountA,
      true,
      slippage,
      new BN(initializeSqrtPrice.toString()),
    );

    // Estimate  token a and token b amount
    const amount_a = options.isAmountA
      ? options.amount
      : liquidityInput.tokenMaxA.toNumber();
    const amount_b = options.isAmountA
      ? liquidityInput.tokenMaxB.toNumber()
      : options.amount;

    console.log({
      coinTypeA: coins[options.coinNameA].type,
      coinTypeB: coins[options.coinNameB].type,
      tick_spacing: options.tickSpacing,
      initialize_sqrt_price: `${initializeSqrtPrice}`,
      uri: options.imageUrl,
      amount_a: amount_a,
      amount_b: amount_b,
      fix_amount_a: options.isAmountA,
      tick_lower: lowerTick,
      tick_upper: upperTick,
    });

    // build creatPoolPayload Payload
    const txb = this.cetusSDK.Pool.creatPoolTransactionPayload({
      coinTypeA: coins[options.coinNameA].type,
      coinTypeB: coins[options.coinNameB].type,
      tick_spacing: options.tickSpacing,
      initialize_sqrt_price: `${initializeSqrtPrice}`,
      uri: options.imageUrl,
      amount_a: amount_a,
      amount_b: amount_b,
      fix_amount_a: options.isAmountA,
      tick_lower: lowerTick,
      tick_upper: upperTick,
    });

    return txb;
  }
}
