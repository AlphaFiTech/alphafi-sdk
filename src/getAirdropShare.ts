import { SuiClient } from "@mysten/sui/client";

export async function getAirdropShare(
  address: string,
  options: {
    suiClient: SuiClient;
  },
): Promise<string> {
  const airdropReserve = "123";

  console.log(address, options);
  return airdropReserve;
}
