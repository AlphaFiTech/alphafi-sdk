import {
  getFullnodeUrl,
  SuiClient,
} from "../node_modules/@mysten/sui/dist/cjs/client/index";
import {
  AlphaVaultBalance,
  DoubleAssetVaultBalance,
  PoolName,
  SingleAssetVaultBalance,
} from "./common/types";
import {
  getAlphaPortfolioAmount,
  getAlphaPortfolioAmountInUSD,
  getPortfolioAmount,
  getPortfolioAmountInUSD,
  getSingleAssetPortfolioAmount,
  getSingleAssetPortfolioAmountInUSD,
} from "./portfolioAmount";

export async function getAlphaVaultBalance(
  address: string,
): Promise<AlphaVaultBalance | undefined> {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address) {
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
      lockedPortfolioAmount &&
      lockedPortfolioAmountInUSD &&
      unlockedPortfolioAmount &&
      unlockedPortfolioAmountInUSD &&
      portfolioAmount &&
      portfolioAmountInUSD
    ) {
      const res: AlphaVaultBalance = {
        lockedAlphaCoins: lockedPortfolioAmount,
        lockedAlphaCoinsInUSD: lockedPortfolioAmountInUSD,
        unlockedAlphaCoins: unlockedPortfolioAmount,
        unlockedAlphaCoinsInUSD: unlockedPortfolioAmountInUSD,
        totalAlphaCoins: portfolioAmount,
        totalAlphaCoinsInUSD: portfolioAmountInUSD,
      };
      return res;
    }
  }
  return undefined;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<DoubleAssetVaultBalance | undefined> {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address && poolName) {
    const portfolioAmount = await getPortfolioAmount(poolName as PoolName, {
      suiClient,
      address,
    });
    const portfolioAmountInUSD = await getPortfolioAmountInUSD(
      poolName as PoolName,
      { suiClient, address },
    );
    if (portfolioAmount && portfolioAmountInUSD) {
      const res: DoubleAssetVaultBalance = {
        coinA: portfolioAmount[0].toString(),
        coinB: portfolioAmount[1].toString(),
        valueInUSD: portfolioAmountInUSD,
      };
      return res;
    }
  }
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<SingleAssetVaultBalance | undefined> {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
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
  if (portfolioAmount && portfolioAmountInUSD) {
    const res: SingleAssetVaultBalance = {
      coin: portfolioAmount.toString(),
      valueInUSD: portfolioAmountInUSD,
    };
    return res;
  }
  return undefined;
}
