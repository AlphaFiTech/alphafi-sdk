import { getUserAvailableLendingRewards } from "@naviprotocol/lending";

export async function getAvailableRewards(address: string) {
  const originalFetch = globalThis.fetch;
  const headerWrappedFetch = async (input: any, init?: any) => {
    try {
      const url = typeof input === "string" ? input : input?.url;
      const isNavi =
        typeof url === "string" &&
        /\.naviprotocol\.io$/i.test(new URL(url).hostname);
      if (!isNavi) {
        return originalFetch(input as any, init as any);
      }
      return originalFetch(
        input as any,
        {
          ...init,
          headers: {
            ...init?.headers,
            Host: "app.naviprotocol.io",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            Referer: "https://app.naviprotocol.io/",
            origin: "app.naviprotocol.io",
          },
        } as any,
      );
    } catch (_) {
      // Fallback: if URL parsing fails, just use the original fetch
      return originalFetch(input as any, init as any);
    }
  };

  // Override fetch only within this function's execution
  // and make sure to restore it.
  (globalThis as any).fetch = headerWrappedFetch as any;
  try {
    const rewards = await getUserAvailableLendingRewards(address);

    // Convert array to map organized by asset coin type (with 0x prefix)
    const rewardsByAsset: Record<string, any[]> = {};

    if (Array.isArray(rewards)) {
      for (const reward of rewards) {
        const assetKey = reward.assetCoinType;
        if (assetKey) {
          if (!rewardsByAsset[assetKey]) {
            rewardsByAsset[assetKey] = [];
          }
          rewardsByAsset[assetKey].push(reward);
        }
      }
    }

    return rewardsByAsset;
  } finally {
    (globalThis as any).fetch = originalFetch as any;
  }
}
