import {
  getFullnodeUrl,
  SuiClient,
} from "../node_modules/@mysten/sui/dist/cjs/client/index";
import { PoolName } from "./common/types";
import {
  getAlphaPortfolioAmount,
  getPortfolioAmount,
  getSingleAssetPortfolioAmount,
} from "./portfolioAmount";

export async function getAlphaVaultBalance(
  address: string,
): Promise<[string, string, string] | undefined> {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address) {
    const lockedPortfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
      isLocked: true,
    });
    const unlockedPortfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
      isLocked: false,
    });
    const portfolioAmount = await getAlphaPortfolioAmount("ALPHA", {
      suiClient,
      address,
    });
    if (lockedPortfolioAmount && unlockedPortfolioAmount && portfolioAmount) {
      return [lockedPortfolioAmount, unlockedPortfolioAmount, portfolioAmount];
    }
  }
  return undefined;
}

export async function getDoubleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<[string, string] | undefined> {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address && poolName) {
    const portfolioAmount = await getPortfolioAmount(poolName as PoolName, {
      suiClient,
      address,
    });
    if (portfolioAmount) {
      return [portfolioAmount[0].toString(), portfolioAmount[1].toString()];
    }
  }
}

export async function getSingleAssetVaultBalance(
  address: string,
  poolName: PoolName,
): Promise<string | undefined> {
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
  if (portfolioAmount) {
    return portfolioAmount.toString();
  }
  return undefined;
}
