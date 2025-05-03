// src/graphql/alphalend/client.ts

/* This file contains the setup for the Apollo Client, implemented as a singleton
 */

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";

// Lazy initialization for the Apollo Client instance
let clientInstance: ApolloClient<any> | undefined = undefined;
let apiUrl: string | undefined = undefined;

/**
 * Get the current API URL.
 * If no URL has been set, it defaults to the AlphaLend API URL.
 */
export function getApiUrl(): string {
  apiUrl = apiUrl ? apiUrl : "https://api.alphalend.xyz/graphql";
  return apiUrl;
}

/**
 * Get the Apollo Client instance.
 * If a new URL has been set via setApiUrl, it will create a new instance with the updated URL.
 */
export function getClient(url?: string): ApolloClient<any> {
  if (url) {
    setApiUrl(url);
  }
  if (!clientInstance) {
    const currentUrl = getApiUrl();
    clientInstance = new ApolloClient({
      link: new HttpLink({
        uri: currentUrl,
      }),
      cache: new InMemoryCache(),
    });
  }
  return clientInstance;
}

/**
 * Set a new API URL.
 * This will invalidate the current Apollo Client instance, ensuring that
 * the next call to getClient returns a new instance with the updated URL.
 *
 * @param url - The new API URL for the Apollo client.
 */
export function setApiUrl(url: string) {
  if (apiUrl !== url) {
    apiUrl = url;
    clientInstance = undefined; // Invalidate the current instance to allow creating a new one
  }
}

/**
 * Set a custom Apollo Client instance.
 * This function directly assigns the provided Apollo Client instance to the global variable.
 *
 * @param client - The custom Apollo Client instance to be set.
 */
export function setCustomClient(client: ApolloClient<any>) {
  clientInstance = client;
}
