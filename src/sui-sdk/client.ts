// src/sui-sdk/client.ts

/* This file will contain the setup for the Sui Client:
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SuiNetwork } from "../common/types";
import { conf, CONF_ENV } from "../common/constants";

const suiClient = new SuiClient({
  url: getFullnodeUrl(conf[CONF_ENV].SUI_NETWORK as SuiNetwork),
  // url: "https://mainnet-rpc.sui.chainbase.online" as SuiNetwork,
});

export default suiClient;
