// src/graphql/fetchData.ts

/* This file will contain functions that use the Apollo Client to
/* execute the queries and return data.
 */

import client from "./client";
import {
  GET_USER_WALLET_DATA,
  GET_PROTOCOL_DATA,
  GET_PORTFOLIO_DATA,
  GET_CHAIN_IDENTIFIER,
  GET_USER_VAULTS,
} from "./queries";

export async function fetchUserWalletData(address: string) {
  const { data } = await client.query({
    query: GET_USER_WALLET_DATA,
    variables: { address },
  });
  return data.userWallet;
}

export async function fetchProtocolData() {
  const { data } = await client.query({
    query: GET_PROTOCOL_DATA,
  });
  return data.protocolData;
}

export async function fetchPortfolioData(address: string) {
  const { data } = await client.query({
    query: GET_PORTFOLIO_DATA,
    variables: { address },
  });
  return data.portfolio;
}

export async function fetchChainIdentifier() {
  const { data } = await client.query({
    query: GET_CHAIN_IDENTIFIER,
  });
  return data.chainIdentifier;
}

export async function fetchUserVaults(walletAddress: string) {
  const { data } = await client.query({
    query: GET_USER_VAULTS,
    variables: {
      address: walletAddress,
    },
  });
  return data.owner;
}

// Add more functions for other data fetching requirements
