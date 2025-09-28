// Fetch polyfill to bypass Cloudflare bot protection
(() => {
  if ((globalThis.fetch as any).isWraped) {
    return;
  }
  const _fetch = fetch;

  globalThis.fetch = async (input: any, init?: any) => {
    return _fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Host: "app.naviprotocol.io",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Referer: "https://app.naviprotocol.io/",
        origin: "app.naviprotocol.io",
      },
    });
  };
  (globalThis.fetch as any).isWraped = true;
})();
import { getUserAvailableLendingRewards } from "@naviprotocol/lending";

export async function getAvailableRewards(address: string) {
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
}
