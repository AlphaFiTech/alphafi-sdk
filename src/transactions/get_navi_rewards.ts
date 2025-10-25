/**
 * Fetches available Navi rewards for a given address via the integration API
 * This avoids the need to use the @naviprotocol/lending SDK directly
 * and prevents any fetch override issues.
 *
 * @param address - The Sui address to fetch rewards for
 * @returns A map of rewards organized by asset coin type
 */
export async function getAvailableRewards(
  address: string,
): Promise<Record<string, any[]>> {
  try {
    // Call the integration API
    const apiUrl = "https://api.alphafi.xyz";
    const response = await fetch(
      `${apiUrl}/navi-params/rewards?address=${encodeURIComponent(address)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Failed to fetch rewards: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // The API returns { address, rewards, timestamp }
    // We just need the rewards object
    return data.rewards || {};
  } catch (error: any) {
    console.error("Error fetching Navi rewards from API:", error);
    throw new Error(`Failed to fetch Navi rewards: ${error.message}`);
  }
}
