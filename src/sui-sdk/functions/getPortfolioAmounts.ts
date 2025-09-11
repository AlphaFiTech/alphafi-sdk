import { SuiClient } from "@mysten/sui/client";
import { Decimal } from "decimal.js";
import {
  PoolName,
  NaviInvestor,
  CommonInvestorFields,
  poolInfo,
  loopingPoolCoinMap,
  getSuiClient,
  LoopingDebt,
  cetusPoolMap,
  getParentPool,
  getCoinAmountsFromLiquidity,
  CoinName,
} from "../../index.js";
import {
  getPool,
  getPoolExchangeRate,
  getReceipts,
  fetchVoloExchangeRate,
  getInvestor,
} from "./getReceipts.js";
import { coinsList } from "../../common/coins.js";
import {
  singleAssetPoolCoinMap,
  doubleAssetPoolCoinMap,
} from "../../common/maps.js";
import { PythPriceIdPair } from "../../common/pyth.js";
import { getAlphaPrice } from "../../utils/clmm/prices.js";
import { getLatestPrices } from "../../utils/prices.js";
import { TickMath } from "@cetusprotocol/cetus-sui-clmm-sdk";
import BN from "bn.js";
import { stSuiExchangeRate, getConf as getStSuiConf } from "@alphafi/stsui-sdk";

export async function getAlphaPortfolioAmount(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean,
) {
  const receipts = await getReceipts(poolName, options.address, ignoreCache);
  const pool = await getPool(poolName, ignoreCache);
  if (!pool) {
    throw new Error("Pool not found");
  }

  const exchangeRate = await getPoolExchangeRate(poolName, ignoreCache);
  let totalXTokens = new Decimal(0);
  if (!exchangeRate) {
    return "0"; // if pool has 0 xtokens
  }
  if (options.isLocked === true) {
    receipts.forEach(async (receipt) => {
      const xTokens = new Decimal(receipt.content.fields.xTokenBalance);
      const bal = new Decimal(
        Number(receipt.content.fields.unlocked_xtokens) *
          exchangeRate.toNumber(),
      );
      totalXTokens = totalXTokens.add(xTokens.sub(bal));
    });
  } else if (options.isLocked === false) {
    receipts.forEach((receipt) => {
      const bal = new Decimal(
        Number(receipt.content.fields.unlocked_xtokens) *
          exchangeRate.toNumber(),
      );
      totalXTokens = totalXTokens.add(bal);
    });
  } else {
    receipts.forEach((receipt) => {
      const xTokens = receipt.content.fields.xTokenBalance;
      totalXTokens = totalXTokens.add(xTokens);
    });
  }
  if (totalXTokens.gt(0)) {
    const poolExchangeRate = await getPoolExchangeRate(poolName, ignoreCache);
    if (poolExchangeRate) {
      const tokens = totalXTokens.div(1e9).mul(poolExchangeRate);
      return `${tokens}`;
    } else {
      console.error(`Could not get poolExchangeRate for poolName: ${poolName}`);
    }
  } else {
    return "0";
  }
}

export async function getAlphaPortfolioAmountInUSD(
  poolName: PoolName,
  options: { suiClient: SuiClient; address: string; isLocked?: boolean },
  ignoreCache: boolean,
) {
  const tokens = await getAlphaPortfolioAmount(poolName, options, ignoreCache);
  const priceOfAlpha = await getAlphaPrice();
  if (priceOfAlpha && tokens) {
    let amount = new Decimal(tokens);
    amount = amount.mul(priceOfAlpha);
    return amount.toString();
  }
}

export async function getPortfolioAmount(
  poolName: PoolName,
  address: string,
  ignoreCache: boolean,
): Promise<[string, string] | undefined> {
  let portfolioAmount: [string, string] = ["0", "0"];
  let totalXTokens = new Decimal(0);
  if (poolName.toString().includes("-FUNGIBLE-")) {
    const tokenBalance = await getTokenBalance(
      poolInfo[poolName].receiptName as CoinName,
      address,
    );
    if (tokenBalance) {
      totalXTokens = new Decimal(tokenBalance);
    } else {
      console.error(
        "could not fetch fungible token balance for getPortfolioAmount",
      );
    }
  } else {
    const receipts = await getReceipts(poolName, address, ignoreCache);
    if (receipts && receipts.length > 0) {
      const xTokens = receipts[0].content.fields.xTokenBalance;
      totalXTokens = totalXTokens.add(xTokens);
    }
  }

  if (totalXTokens.gt(0)) {
    const poolExchangeRate = await getPoolExchangeRate(poolName, ignoreCache);
    if (poolExchangeRate) {
      const tokens = totalXTokens.mul(poolExchangeRate);
      const poolTokenAmounts = await getCoinAmountsFromLiquidity(
        poolName,
        tokens.toString(),
        ignoreCache,
      );
      portfolioAmount = poolTokenAmounts;
    } else {
      console.error(`Could not get poolExchangeRate for poolName: ${poolName}`);
    }
  }
  return portfolioAmount;
}

export async function getDoubleAssetPortfolioAmountInUSD(
  poolName: PoolName,
  address: string,
  ignoreCache: boolean,
): Promise<string | undefined> {
  if (poolInfo[poolName].assetTypes.length === 2) {
    const amounts = await getPortfolioAmount(poolName, address, ignoreCache);
    if (amounts) {
      const ten = new Decimal(10);
      const pool1 = doubleAssetPoolCoinMap[poolName].coin1;
      const pool2 = doubleAssetPoolCoinMap[poolName].coin2;

      const amount0 = new Decimal(amounts[0]).div(
        ten.pow(coinsList[pool1].expo),
      );
      const amount1 = new Decimal(amounts[1]).div(
        ten.pow(coinsList[pool2].expo),
      );
      const [priceOfCoin0, priceOfCoin1] = await getLatestPrices(
        [`${pool1}/USD` as PythPriceIdPair, `${pool2}/USD` as PythPriceIdPair],
        ignoreCache,
      );
      const amount = amount0.mul(priceOfCoin0).add(amount1.mul(priceOfCoin1));
      return amount.toString();
    } else {
      console.error(
        `getPortfolioAmountInUSD is not implemented for poolName: ${poolName}`,
      );
    }
    return "0";
  }
}

export async function getNaviLoopingPoolDebt(
  poolName: PoolName,
): Promise<string | undefined> {
  const debt = (
    (
      await getSuiClient().getDynamicFieldObject({
        parentId: poolInfo[poolName].investorId,
        name: {
          type: "vector<u8>",
          value: "debt".split("").map((char) => char.charCodeAt(0)),
        },
      })
    ).data as LoopingDebt
  ).content.fields.value.toString();
  return debt;
}

export async function getSingleAssetPortfolioAmount(
  poolName: PoolName,
  address: string,
  ignoreCache: boolean,
) {
  let portfolioAmount: number = 0;
  const receipts = await getReceipts(poolName, address, ignoreCache);
  let totalXTokens = new Decimal(0);
  if (receipts) {
    receipts.forEach((receipt) => {
      const xTokens = receipt.content.fields.xTokenBalance;
      totalXTokens = totalXTokens.add(xTokens);
    });
  }
  if (totalXTokens.gt(0)) {
    let pool;
    let investor;
    if (
      poolInfo[poolName].parentProtocolName == "NAVI" ||
      poolInfo[poolName].parentProtocolName === "ALPHALEND"
    ) {
      pool = await getPool(poolName, ignoreCache);
      investor = (await getInvestor(poolName, ignoreCache)) as NaviInvestor &
        CommonInvestorFields;
    }
    if (
      poolName == "NAVI-LOOP-USDC-USDT" ||
      poolName == "NAVI-LOOP-USDT-USDC"
    ) {
      const supplyCoin = loopingPoolCoinMap[poolName].supplyCoin;
      const borrowCoin = loopingPoolCoinMap[poolName].borrowCoin;
      if (pool && investor) {
        let tokensInvested = new Decimal(0);
        const currentDebt = await getNaviLoopingPoolDebt(poolName);

        const currentSupply =
          investor.content.fields.tokensDeposited.toString();
        if (
          cetusPoolMap[supplyCoin + "-" + borrowCoin] &&
          currentDebt &&
          currentSupply
        ) {
          const cetusPool = await getParentPool(
            supplyCoin + "-" + borrowCoin,
            ignoreCache,
          );
          if (cetusPool) {
            const sqrtPrice = cetusPool?.content.fields.current_sqrt_price;
            const price = TickMath.sqrtPriceX64ToPrice(
              new BN(sqrtPrice!),
              coinsList[supplyCoin].expo,
              coinsList[borrowCoin].expo,
            );
            const currentDebtInSupplyCoin = new Decimal(currentDebt).div(price);
            tokensInvested = new Decimal(currentSupply).minus(
              currentDebtInSupplyCoin,
            );
          } else {
            console.error(`couldnt fetch cetus pool`);
          }
        } else if (
          cetusPoolMap[borrowCoin + "-" + supplyCoin] &&
          currentDebt !== undefined &&
          currentSupply !== undefined
        ) {
          const cetusPool = await getParentPool(
            borrowCoin + "-" + supplyCoin,
            ignoreCache,
          );
          if (cetusPool) {
            const sqrtPrice = cetusPool?.content.fields.current_sqrt_price;
            const price = TickMath.sqrtPriceX64ToPrice(
              new BN(sqrtPrice!),
              coinsList[borrowCoin].expo,
              coinsList[supplyCoin].expo,
            );
            const currentDebtInSupplyCoin = new Decimal(currentDebt).mul(price);
            tokensInvested = new Decimal(currentSupply).minus(
              currentDebtInSupplyCoin,
            );
          } else {
            console.error(`couldnt fetch cetus pool`);
          }
        } else {
          console.error(
            `one or more of these are possibly undefined: currentDebt:${currentDebt}, currentSupply: ${currentSupply}, cetusPoolMap[supplyCoin+'-'+borrowCoin]:${cetusPoolMap[supplyCoin + "-" + borrowCoin]}, cetusPoolMap[borrowCoin+'-'+supplyCoin]: ${cetusPoolMap[borrowCoin + "-" + supplyCoin]}`,
          );
        }

        const xTokenSupplyInPool = new Decimal(
          pool.content.fields.xTokenSupply,
        );
        const userTokens = totalXTokens
          .mul(tokensInvested)
          .div(xTokenSupplyInPool);
        const tokens = userTokens.div(
          Math.pow(
            10,
            9 - coinsList[singleAssetPoolCoinMap[poolName].coin].expo,
          ),
        );
        portfolioAmount = Number(tokens);
      } else {
        console.error(`Could not get object for poolName: ${poolName}`);
      }
    } else if (
      poolName == "NAVI-LOOP-HASUI-SUI" ||
      poolName == "NAVI-LOOP-SUI-VSUI" ||
      poolName === "ALPHALEND-LOOP-SUI-STSUI"
    ) {
      if (pool && investor) {
        const liquidity = new Decimal(investor.content.fields.tokensDeposited);
        const debtToSupplyRatio = new Decimal(
          investor.content.fields.current_debt_to_supply_ratio,
        );
        const tokensInvested = liquidity.mul(
          new Decimal(1).minus(new Decimal(debtToSupplyRatio).div(1e20)),
        );
        const xTokenSupplyInPool = new Decimal(
          pool.content.fields.xTokenSupply,
        );
        const userTokens = totalXTokens
          .mul(tokensInvested)
          .div(xTokenSupplyInPool);
        const tokens = userTokens.div(
          Math.pow(
            10,
            9 - coinsList[singleAssetPoolCoinMap[poolName].coin].expo,
          ),
        );
        if (poolName == "NAVI-LOOP-SUI-VSUI") {
          // const { SevenKGateway } = await import("../");
          // const sevenKInstance = new SevenKGateway();
          // const numberOfTokensInSui = (await sevenKInstance.getQuote({
          //   slippage: 1,
          //   senderAddress: options.address,
          //   pair: { coinA: coins["VSUI"], coinB: coins["SUI"] },
          //   inAmount: new BN(tokens.toNumber()),
          // })) as QuoteResponse;
          const voloExchRate = await fetchVoloExchangeRate(false);
          portfolioAmount = Number(
            tokens.mul(parseFloat(voloExchRate.data.exchangeRate)),
          );
        } else if (poolName == "ALPHALEND-LOOP-SUI-STSUI") {
          // const { SevenKGateway } = await import("../");
          // const sevenKInstance = new SevenKGateway();
          // const numberOfTokensInSui = (await sevenKInstance.getQuote({
          //   slippage: 1,
          //   senderAddress: options.address,
          //   pair: { coinA: coins["VSUI"], coinB: coins["SUI"] },
          //   inAmount: new BN(tokens.toNumber()),
          // })) as QuoteResponse;
          const suiTostSuiExchangeRate = await stSuiExchangeRate(
            getStSuiConf().LST_INFO,
            ignoreCache,
          );
          portfolioAmount = Number(
            tokens.mul(parseFloat(suiTostSuiExchangeRate)),
          );
        } else {
          portfolioAmount = Number(tokens);
        }
      } else {
        console.error(`Could not get object for poolName: ${poolName}`);
      }
    } else {
      const poolExchangeRate = await getPoolExchangeRate(poolName, ignoreCache);
      if (poolExchangeRate) {
        let tokens = totalXTokens.mul(poolExchangeRate);
        if (poolInfo[poolName].parentProtocolName == "NAVI") {
          tokens = tokens.div(
            Math.pow(
              10,
              9 - coinsList[singleAssetPoolCoinMap[poolName].coin].expo,
            ),
          );
        }
        portfolioAmount = tokens.toNumber();
      } else {
        console.error(
          `Could not get poolExchangeRate for poolName: ${poolName}`,
        );
      }
    }
  }
  return portfolioAmount;
}

export async function getSingleAssetPortfolioAmountInUSD(
  poolName: PoolName,
  address: string,
  ignoreCache: boolean,
): Promise<string | undefined> {
  const amounts = await getSingleAssetPortfolioAmount(
    poolName,
    address,
    ignoreCache,
  );

  if (amounts !== undefined) {
    let coinName = singleAssetPoolCoinMap[poolName].coin;
    if (
      poolName == "NAVI-LOOP-SUI-VSUI" ||
      poolName === "ALPHALEND-LOOP-SUI-STSUI"
    ) {
      coinName = "SUI";
    }
    const amount = new Decimal(amounts).div(
      new Decimal(Math.pow(10, coinsList[coinName].expo)),
    );
    const [priceOfCoin] = await getLatestPrices(
      [`${coinName}/USD` as PythPriceIdPair],
      ignoreCache,
    );
    if (priceOfCoin) {
      const amountInUSD = amount.mul(priceOfCoin);
      return amountInUSD.toString();
    }
  } else {
    console.error(
      `getSingleAssetPortfolioAmountInUSD is not implemented for poolName: ${poolName}`,
    );
  }
  return "0";
}

export async function getTokenBalance(
  tokenName: CoinName,
  address: string,
): Promise<string | undefined> {
  const suiClient = getSuiClient();
  let balance = "0";
  try {
    const coinBalance = await suiClient.getBalance({
      owner: address,
      coinType: coinsList[tokenName].type,
    });

    const balanceInt = parseInt(coinBalance.totalBalance);
    balance = `${balanceInt}`;
    return balance;
  } catch {
    console.error(`Could not get Balance for token: ${tokenName}`);
  }
}
