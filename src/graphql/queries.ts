// src/graphql/queries.ts

/* This file will contain the GraphQL queries for fetching user wallet
/* data, protocol data, and portfolio data.
 */

import { readFileSync } from "fs";
import { gql } from "@apollo/client/core";
import * as path from "path";

// Load GraphQL queries as strings
const userVaults = readFileSync(
  path.resolve(__dirname, "./queries/userVaults.graphql"),
  "utf-8",
);

const userVaultBalances = readFileSync(
  path.resolve(__dirname, "./queries/userVaultBalances.graphql"),
  "utf-8",
);

const pools = readFileSync(
  path.resolve(__dirname, "./queries/pools.graphql"),
  "utf-8",
);

const investors = readFileSync(
  path.resolve(__dirname, "./queries/investors.graphql"),
  "utf-8",
);

const cetusPools = readFileSync(
  path.resolve(__dirname, "./queries/cetusPools.graphql"),
  "utf-8",
);

const autoCompoundEvents = readFileSync(
  path.resolve(__dirname, "./queries/autoCompoundEvents.graphql"),
  "utf-8",
);

const nftHolders = readFileSync(
  path.resolve(__dirname, "./queries/nftHolders.graphql"),
  "utf-8",
);

const receiptData = readFileSync(
  path.resolve(__dirname, "./queries/receiptData.graphql"),
  "utf-8",
);

const lockedTableDataFragment = readFileSync(
  path.resolve(__dirname, "./queries/lockedTableDataFragment.graphql"),
  "utf-8",
);

const lockedTableData = readFileSync(
  path.resolve(__dirname, "./queries/lockedTableData.graphql"),
  "utf-8",
);

// Query to fetch user wallet data
export const GET_USER_WALLET_DATA = gql`
  query GetUserWalletData($address: String!) {
    userWallet(address: $address) {
      coins {
        name
        amount
      }
    }
  }
`;

// Query to fetch protocol data
export const GET_PROTOCOL_DATA = gql`
  query GetProtocolData {
    protocolData {
      totalValueLocked
      pools {
        name
        tvl
      }
    }
  }
`;

// Query to fetch portfolio data
export const GET_PORTFOLIO_DATA = gql`
  query GetPortfolioData($address: String!) {
    portfolio(address: $address) {
      poolName
      investment
    }
  }
`;

export const GET_CHAIN_IDENTIFIER = gql`
  query {
    chainIdentifier
  }
`;

export const GET_USER_VAULTS = gql`
  ${userVaults}
`;

export const GET_USER_VAULT_BALANCES = gql`
  ${userVaultBalances}
`;

export const GET_POOLS = gql`
  ${pools}
`;

export const GET_CETUS_POOLS = gql`
  ${cetusPools}
`;

export const GET_INVESTORS = gql`
  ${investors}
`;

export const GET_AUTOCOMPOUND_EVENTS = gql`
  ${autoCompoundEvents}
`;

export const GET_NFT_HOLDERS = gql`
  ${nftHolders}
`;

export const GET_RECEIPT_DATA = gql`
  ${receiptData}
`;

export const GET_LOCKED_TABLE_DATA_FRAGMENT = gql`
  ${lockedTableDataFragment}
`;

export const GET_LOCKED_TABLE_DATA = gql`
  ${lockedTableData}
`;
