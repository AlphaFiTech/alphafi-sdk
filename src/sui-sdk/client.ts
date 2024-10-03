// src/sui-sdk/client.ts

/* This file contains the setup for the Sui Client, implemented as a singleton
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// Lazy initialization for the SuiClient instance
let suiClientInstance: SuiClient | null = null;
let suiNodeUrl: string | undefined = undefined;

/**
 * Get the current Sui node URL.
 * If no URL has been set, it defaults to the mainnet full node URL.
 */
export function getSuiNodeUrl(): string {
  suiNodeUrl = suiNodeUrl ? suiNodeUrl : getFullnodeUrl("mainnet");
  return suiNodeUrl;
}

/**
 * Get the SuiClient instance.
 * If a new URL has been set via setSuiNodeUrl, it will create a new instance with the updated URL.
 */
export function getSuiClient(): SuiClient {
  if (!suiClientInstance) {
    suiClientInstance = new SuiClient({
      url: getSuiNodeUrl(),
    });
  }
  return suiClientInstance;
}

/**
 * Set a new Sui node URL.
 * This will invalidate the current SuiClient instance, ensuring that
 * the next call to getSuiClient returns a new instance with the updated URL.
 *
 * @param rpcNodeUrl - The new RPC URL for the Sui client.
 */
export function setSuiNodeUrl(rpcNodeUrl: string) {
  if (suiNodeUrl !== rpcNodeUrl) {
    suiNodeUrl = rpcNodeUrl;
    suiClientInstance = null; // Invalidate the current instance to allow creating a new one
  }
}
