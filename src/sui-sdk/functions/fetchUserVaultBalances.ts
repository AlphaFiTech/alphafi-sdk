import { poolInfo } from "../../common/maps";
import { AlphaFiVaultBalance, PoolName } from "../../common/types";
import suiClient from "../client";
import {
  getAlphaPortfolioAmount,
  getAlphaPortfolioAmountInUSD,
  getPortfolioAmount,
  getPortfolioAmountInUSD,
  getSingleAssetPortfolioAmount,
  getSingleAssetPortfolioAmountInUSD,
} from "./getPortfolioAmounts";

export async function fetchUserVaultBalances(
  address: string,
  poolName: PoolName,
): Promise<AlphaFiVaultBalance | undefined> {
  let vaultBalance;
  if (poolInfo[poolName].parentProtocolName === "ALPHAFI") {
    const lockedPortfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
      isLocked: true,
    });
    const lockedPortfolioAmountInUSD = await getAlphaPortfolioAmountInUSD(
      "ALPHA",
      { suiClient, address, isLocked: true },
    );
    const unlockedPortfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
      isLocked: false,
    });
    const unlockedPortfolioAmountInUSD = await getAlphaPortfolioAmountInUSD(
      "ALPHA",
      { suiClient, address, isLocked: false },
    );
    const portfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
    });
    const portfolioAmountInUSD = await getAlphaPortfolioAmountInUSD("ALPHA", {
      suiClient,
      address,
    });
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
    const portfolioAmount = await getPortfolioAmount(poolName as PoolName, {
      suiClient,
      address,
    });
    const portfolioAmountInUSD = await getPortfolioAmountInUSD(
      poolName as PoolName,
      { suiClient, address },
    );
    if (portfolioAmount !== undefined && portfolioAmountInUSD !== undefined) {
      const res: AlphaFiVaultBalance = {
        coinA: portfolioAmount[0].toString(),
        coinB: portfolioAmount[1].toString(),
        valueInUSD: portfolioAmountInUSD,
      };
      vaultBalance = res;
    }
  } else if (poolInfo[poolName].parentProtocolName === "NAVI") {
    const portfolioAmount = await getSingleAssetPortfolioAmount(
      poolName as PoolName,
      {
        suiClient,
        address,
      },
    );
    const portfolioAmountInUSD = await getSingleAssetPortfolioAmountInUSD(
      poolName as PoolName,
      {
        suiClient,
        address,
      },
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
