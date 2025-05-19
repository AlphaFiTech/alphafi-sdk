// src/sui-sdk/client.ts

/* This file contains the setup for the Sui Client, implemented as a singleton
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import {
  setSuiNodeUrl as setSuiNodeUrlStsuiSDK,
  setSuiClient as setSuiClientStsuiSDK,
  setCustomSuiClient as setCustomSuiClientStsuiSDK,
} from "@alphafi/stsui-sdk";

// Lazy initialization for the SuiClient instance
let suiClientInstance: SuiClient | undefined = undefined;
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
export function getSuiClient(rpcNodeUrl?: string): SuiClient {
  if (rpcNodeUrl) {
    setSuiNodeUrl(rpcNodeUrl);
  }
  if (!suiClientInstance) {
    const nodeUrl = getSuiNodeUrl();
    suiClientInstance = new SuiClient({
      url: nodeUrl,
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
  setSuiNodeUrlStsuiSDK(rpcNodeUrl);
  if (suiNodeUrl !== rpcNodeUrl) {
    suiNodeUrl = rpcNodeUrl;
    suiClientInstance = undefined; // Invalidate the current instance to allow creating a new one
  }
}

/**
 * Set a new SuiClient instance with the specified RPC node URL.
 * This function directly creates a new instance of the SuiClient, overriding the existing instance
 * and using the provided URL for future requests.
 *
 * If the RPC node URL is different from the currently stored URL, a new instance of SuiClient will
 * be created and assigned, allowing the client to communicate with a new Sui node.
 *
 * @param rpcNodeUrl - The new RPC URL to be used for the SuiClient.
 */
export function setSuiClient(rpcNodeUrl: string) {
  setSuiClientStsuiSDK(rpcNodeUrl);
  if (suiNodeUrl !== rpcNodeUrl) {
    suiNodeUrl = rpcNodeUrl;
    suiClientInstance = new SuiClient({
      url: rpcNodeUrl,
    });
  }
}

/**
 * Set a custom SuiClient instance.
 * This function directly assigns the provided SuiClient instance to the global variable,
 * allowing for direct manipulation of the client instance.
 *
 * @param suiClient - The custom SuiClient instance to be set.
 */
export const setCustomSuiClient = (suiClient: SuiClient) => {
  setCustomSuiClientStsuiSDK(suiClient);
  suiClientInstance = suiClient;
};
