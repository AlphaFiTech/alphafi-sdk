// src/sui-sdk/client.ts

/* This file contains the setup for the Sui Client, implemented as a singleton
 */

import { SuiClient } from "@mysten/sui/client";

//import { NetworkType } from "./types";

// Lazy initialization for the SuiClient instance
let suiClientInstance: SuiClient | null = null;

export function getSuiNodeUrl(): string {
  const url =
    "https://api.shinami.com/node/v1/sui_mainnet_53aeba16fc07edd3c1ec5110550c8189";
  // const url = getFullnodeUrl("mainnet");
  //const url = "https://mainnet.suiet.app";
  //const url = "https://sui-mainnet-endpoint.blockvision.org";
  return url;
}

export function getSuiClient(): SuiClient {
  if (!suiClientInstance) {
    suiClientInstance = new SuiClient({
      url: getSuiNodeUrl(),
    });
  }
  return suiClientInstance;
}
