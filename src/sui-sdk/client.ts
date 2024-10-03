// src/sui-sdk/client.ts

/* This file contains the setup for the Sui Client, implemented as a singleton
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

//import { NetworkType } from "./types";

// Lazy initialization for the SuiClient instance
let suiClientInstance: SuiClient | null = null;
let suiNodeUrl: string | undefined = undefined;

export function getSuiNodeUrl(): string {
  suiNodeUrl = suiNodeUrl ? suiNodeUrl : getFullnodeUrl("mainnet");
  return suiNodeUrl;
}

export function getSuiClient(): SuiClient {
  if (!suiClientInstance) {
    suiClientInstance = new SuiClient({
      url: getSuiNodeUrl(),
    });
  }
  return suiClientInstance;
}

export function setSuiNodeUrl(rpcNodeUrl: string) {
  suiNodeUrl = rpcNodeUrl;
}
