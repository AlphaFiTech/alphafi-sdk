// src/sui-sdk/client.ts

/* This file will contain the setup for the Sui Client:
 */

import { SuiClient } from "@mysten/sui/client";
// import { CONF_ENV, conf } from "../common/constants";
import { SuiNetwork } from "../common/types";

const suiClient = new SuiClient({
  url: "https://mainnet-rpc.sui.chainbase.online" as SuiNetwork,
});

export default suiClient;
