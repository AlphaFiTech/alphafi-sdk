import {
  getFullnodeUrl,
  SuiClient,
} from "../node_modules/@mysten/sui/dist/cjs/client/index";
import { PoolName } from "./common/types";
import {
  getAlphaPortfolioAmount,
  getAlphaPortfolioAmountInUSD,
  getPortfolioAmount,
  getPortfolioAmountInUSD,
} from "./portfolioAmount";

export async function getVaultBalance(address: string, poolName: PoolName) {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  if (address && poolName) {
    if (poolName === "ALPHA") {
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
      console.log("Locked coins - ", lockedPortfolioAmount);
      console.log("Locked Amount In USD - ", lockedPortfolioAmountInUSD);
      console.log("Unlocked coins - ", unlockedPortfolioAmount);
      console.log("Unlocked Amount In USD - ", unlockedPortfolioAmountInUSD);
      console.log("Total coins - ", portfolioAmount);
      console.log("Total Amount In USD - ", portfolioAmountInUSD);
    } else {
      const portfolioAmount = await getPortfolioAmount(poolName as PoolName, {
        suiClient,
        address,
      });
      const portfolioAmountInUSD = await getPortfolioAmountInUSD(
        poolName as PoolName,
        { suiClient, address },
      );
      if (portfolioAmount && portfolioAmountInUSD) {
        console.log("coin1 - ", portfolioAmount[0]);
        console.log("coin2 - ", portfolioAmount[1]);
        console.log("Amount In USD - ", portfolioAmountInUSD);
      }
    }
  }
}

export async function getSingleVaultBalance(
  address: string,
  poolName: PoolName,
) {
  const suiClient = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });
  const portfolioAmount = await getPortfolioAmount(poolName as PoolName, {
    suiClient,
    address,
  });
  const portfolioAmountInUSD = await getPortfolioAmountInUSD(
    poolName as PoolName,
    { suiClient, address },
  );
  if (portfolioAmount && portfolioAmountInUSD) {
    console.log("coins - ", portfolioAmount);
    console.log("Amount In USD - ", portfolioAmountInUSD);
  }
}
