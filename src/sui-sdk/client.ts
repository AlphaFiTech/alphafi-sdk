// src/sui-sdk/client.ts

/* This file contains the setup for the Sui Client, implemented as a singleton
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

//import { NetworkType } from "./types";

// Lazy initialization for the SuiClient instance
let suiClientInstance: SuiClient | null = null;

export function getSuiNodeUrl(): string {
  const url = getFullnodeUrl("mainnet");
  return url;
}

export function getSuiClient(rpcNodeUrl?: string): SuiClient {
  if (!suiClientInstance) {
    suiClientInstance = new SuiClient({
      url: rpcNodeUrl ? rpcNodeUrl : getSuiNodeUrl(),
    });
  }
  return suiClientInstance;
}

export function setSuiClient(rpcNodeUrl?: string) {
  suiClientInstance = new SuiClient({
    url: rpcNodeUrl ? rpcNodeUrl : getSuiNodeUrl(),
  });
}
