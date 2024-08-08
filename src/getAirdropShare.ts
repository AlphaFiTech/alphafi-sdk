import { SuiClient } from "@mysten/sui/client";
import { fetchAirdropReserves, getDistributor } from "./functions";
import { getAlphaPrice } from "./price";
import Decimal from "decimal.js";
import { getPool } from "./portfolioAmount";
import { getAlphaVaultBalance } from "./getVaultBalances";

export async function getAirdropShare(
  address: string,
  options: {
    suiClient: SuiClient;
  }
): Promise<string | undefined> {
  const airdropReserve = await fetchAirdropReserves();

  const pool = await getPool("ALPHA", options);
  const distributor = await getDistributor(options);
  const priceOfAlpha = await getAlphaPrice();
  const alphaTotalBalance = await getAlphaVaultBalance(address);
  const alphaTotalBalanceInUSD = alphaTotalBalance?.totalAlphaCoinsInUSD;

  if (pool && distributor && priceOfAlpha && alphaTotalBalanceInUSD) {
    const tokensInvested = new Decimal(pool.content.fields.tokensInvested);
    const alphaPoolTvl = tokensInvested.div(1e9).mul(new Decimal(priceOfAlpha));
    const airdropShare =
      parseFloat(airdropReserve.toString()) *
      (parseFloat(alphaTotalBalanceInUSD.toString()) /
        parseFloat(alphaPoolTvl.toString()));

    return airdropShare.toString();
  }
}
