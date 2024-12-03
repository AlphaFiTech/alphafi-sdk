import { poolInfo } from "../../common/maps.js";
import {
  AlphaFiVaultBalance,
  PoolName,
  SingleAssetPoolNames,
} from "../../common/types.js";
import { getSuiClient } from "../client.js";
import {
  getAlphaPortfolioAmount,
  getAlphaPortfolioAmountInUSD,
  getPortfolioAmount,
  getDoubleAssetPortfolioAmountInUSD,
  getSingleAssetPortfolioAmount,
  getSingleAssetPortfolioAmountInUSD,
} from "./getPortfolioAmounts.js";

export async function fetchUserVaultBalances(
  address: string,
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<AlphaFiVaultBalance | undefined> {
  const suiClient = getSuiClient();

  let vaultBalance: AlphaFiVaultBalance | undefined;
  if (poolInfo[poolName].parentProtocolName === "ALPHAFI") {
    const lockedPortfolioAmount = await getAlphaPortfolioAmount(
      "ALPHA",
      {
        suiClient,
        address,
        isLocked: true,
      },
      ignoreCache,
    );
    const lockedPortfolioAmountInUSD = await getAlphaPortfolioAmountInUSD(
      "ALPHA",
      { suiClient, address, isLocked: true },
      ignoreCache,
    );
    const unlockedPortfolioAmount = await getAlphaPortfolioAmount(
      "ALPHA",
      {
        suiClient,
        address,
        isLocked: false,
      },
      ignoreCache,
    );
    const unlockedPortfolioAmountInUSD = await getAlphaPortfolioAmountInUSD(
      "ALPHA",
      { suiClient, address, isLocked: false },
      ignoreCache,
    );
    const portfolioAmount = await getAlphaPortfolioAmount(
      "ALPHA",
      {
        suiClient,
        address,
      },
      ignoreCache,
    );
    const portfolioAmountInUSD = await getAlphaPortfolioAmountInUSD(
      "ALPHA",
      {
        suiClient,
        address,
      },
      ignoreCache,
    );
    if (
      lockedPortfolioAmount !== undefined &&
      lockedPortfolioAmountInUSD !== undefined &&
      unlockedPortfolioAmount !== undefined &&
      unlockedPortfolioAmountInUSD !== undefined &&
      portfolioAmount !== undefined &&
      portfolioAmountInUSD !== undefined
    ) {
      const res: AlphaFiVaultBalance = {
        lockedAlphaCoins: lockedPortfolioAmount,
        lockedAlphaCoinsInUSD: lockedPortfolioAmountInUSD,
        unlockedAlphaCoins: unlockedPortfolioAmount,
        unlockedAlphaCoinsInUSD: unlockedPortfolioAmountInUSD,
        totalAlphaCoins: portfolioAmount,
        totalAlphaCoinsInUSD: portfolioAmountInUSD,
      };
      vaultBalance = res;
    }
  } else if (poolInfo[poolName].parentProtocolName === "CETUS") {
    const portfolioAmount = await getPortfolioAmount(
      poolName as PoolName,
      address,
      ignoreCache,
    );
    const portfolioAmountInUSD = await getDoubleAssetPortfolioAmountInUSD(
      poolName as PoolName,
      address,
      ignoreCache,
    );
    if (portfolioAmount !== undefined && portfolioAmountInUSD !== undefined) {
      const res: AlphaFiVaultBalance = {
        coinA: portfolioAmount[0].toString(),
        coinB: portfolioAmount[1].toString(),
        valueInUSD: portfolioAmountInUSD,
      };
      vaultBalance = res;
    }
  } else if (
    poolInfo[poolName].parentProtocolName === "NAVI" ||
    poolInfo[poolName].parentProtocolName === "BUCKET"
  ) {
    const portfolioAmount = await getSingleAssetPortfolioAmount(
      poolName as SingleAssetPoolNames,
      address,
      ignoreCache,
    );
    const portfolioAmountInUSD = await getSingleAssetPortfolioAmountInUSD(
      poolName as SingleAssetPoolNames,
      address,
      ignoreCache,
    );
    if (portfolioAmount !== undefined && portfolioAmountInUSD !== undefined) {
      const res: AlphaFiVaultBalance = {
        coin: portfolioAmount.toString(),
        valueInUSD: portfolioAmountInUSD,
      };
      vaultBalance = res;
    }
  }
  return vaultBalance;
}
