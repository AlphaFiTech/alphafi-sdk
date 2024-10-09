import {
  fetchUserWalletData,
  fetchPortfolioData,
  deposit,
  withdraw,
  collectRewards,
  fetchProtocolData,
} from "./index.js";

/* Here’s how users of your SDK might use the higher-level APIs:
 */

export async function loadUserData() {
  const address = "0xUserWalletAddress";
  const walletData = await fetchUserWalletData(address);
  const protocolData = await fetchProtocolData();
  const portfolioData = await fetchPortfolioData(address);

  console.log("User Wallet Data:", walletData);
  console.log("Protocol Data:", protocolData);
  console.log("Portfolio Data:", portfolioData);
}

// loadUserData();

/* When a user performs actions like deposit, withdraw, or collect
   rewards, you can selectively refetch only the necessary data:
 */

export async function handleUserAction(
  action: "deposit" | "withdraw" | "collectRewards",
  address: string,
  amount?: number,
  poolId?: string,
) {
  if (action === "deposit" && amount && poolId) {
    await deposit(amount, poolId);
    const portfolioData = await fetchPortfolioData(address);
    console.log("Updated Portfolio Data:", portfolioData);
  } else if (action === "withdraw" && amount && poolId) {
    await withdraw(amount, poolId);
    const portfolioData = await fetchPortfolioData(address);
    console.log("Updated Portfolio Data:", portfolioData);
  } else if (action === "collectRewards" && poolId) {
    await collectRewards(poolId);
    const portfolioData = await fetchPortfolioData(address);
    console.log("Updated Portfolio Data:", portfolioData);
  }

  const walletData = await fetchUserWalletData(address);
  console.log("Updated Wallet Data:", walletData);
}

// Example usage
// handleUserAction('deposit', '0xUserWalletAddress', 100, '0xPoolId');
