// src/graphql/fetchData.ts

/* This file will contain functions that use the Apollo Client to
/* execute the queries and return data.
 */

import client from "./client.js";
import {
  GET_USER_WALLET_DATA,
  GET_PROTOCOL_DATA,
  GET_PORTFOLIO_DATA,
  GET_CHAIN_IDENTIFIER,
  GET_USER_VAULTS,
  GET_USER_VAULT_BALANCES,
  GET_POOLS,
  GET_INVESTORS,
  GET_CETUS_POOLS,
} from "./queries.js";

type UserWalletData = {
  userWallet: { coins: { name: string; amount: string }[] };
};
type ProtocolData = {
  protocolData: {
    totalValueLocked: unknown;
    pools: { name: string; tvl: unknown }[];
  };
};
type PortfolioData = { portfolio: { poolName: string; investment: unknown }[] };
type ChainIdentifier = { chainIdentifier: string };

export async function fetchUserWalletData(address: string) {
  const { data } = await client.query<UserWalletData>({
    query: GET_USER_WALLET_DATA,
    variables: { address },
  });
  return data?.userWallet;
}

export async function fetchProtocolData() {
  const { data } = await client.query<ProtocolData>({
    query: GET_PROTOCOL_DATA,
  });
  return data?.protocolData;
}

export async function fetchPortfolioData(address: string) {
  const { data } = await client.query<PortfolioData>({
    query: GET_PORTFOLIO_DATA,
    variables: { address },
  });
  return data?.portfolio;
}

export async function fetchChainIdentifier() {
  const { data } = await client.query<ChainIdentifier>({
    query: GET_CHAIN_IDENTIFIER,
  });
  return data?.chainIdentifier;
}

export async function fetchUserVaults(walletAddress: string) {
  const { data } = await client.query<{ owner: unknown }>({
    query: GET_USER_VAULTS,
    variables: {
      address: walletAddress,
    },
  });
  return (data as any)?.owner;
}

export async function fetchUserVaultBalances(walletAddress: string) {
  const { data: poolsData } = await client.query<Record<string, unknown>>({
    query: GET_POOLS,
  });
  const { data: cetusPoolsData } = await client.query<Record<string, unknown>>({
    query: GET_CETUS_POOLS,
  });
  const { data: investorsData } = await client.query<Record<string, unknown>>({
    query: GET_INVESTORS,
  });
  const { data: userVaultBalancesData } = await client.query<
    Record<string, unknown>
  >({
    query: GET_USER_VAULT_BALANCES,
    variables: {
      address: walletAddress,
    },
  });

  const data = {
    ...(poolsData ?? {}),
    ...(cetusPoolsData ?? {}),
    ...(investorsData ?? {}),
    ...(userVaultBalancesData ?? {}),
  };

  return data;
}

export async function fetchPools() {
  const { data } = await client.query<Record<string, unknown>>({
    query: GET_POOLS,
  });
  return data ?? {};
}

export async function fetchCetusPools() {
  const { data } = await client.query<Record<string, unknown>>({
    query: GET_CETUS_POOLS,
  });
  return data ?? {};
}

export {
  fetchAutoCompoundingEventsGql,
  AutoCompoundingEventNode,
} from "./fetchAutoCompoundingEventsGql.js";
export { fetchNftHolders } from "./fetchNftHolders.js";

// Add more functions for other data fetching requirements
