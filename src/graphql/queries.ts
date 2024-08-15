// src/graphql/queries.ts

/* This file will contain the GraphQL queries for fetching user wallet
/* data, protocol data, and portfolio data.
 */

import { gql } from "@apollo/client";

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
  query GetUserVaults($address: SuiAddress!) {
    owner(address: $address) {
      alphaObjects: objects(
        filter: {
          type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphapool::Receipt"
        }
      ) {
        ...ObjectFields
      }

      alphaSuiObjects: objects(
        filter: {
          type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_sui_pool::Receipt"
        }
      ) {
        ...ObjectFields
      }

      usdtUsdcObjects: objects(
        filter: {
          type: "0x9bbd650b8442abb082c20f3bc95a9434a8d47b4bef98b0832dab57c1a8ba7123::alphafi_cetus_pool::Receipt"
        }
      ) {
        ...ObjectFields
      }

      usdcWbtcObjects: objects(
        filter: {
          type: "0x2793db7aa0e0209afc84f0adb1b258973cf1c9da55c35ee85c18f2ed4912bb6f::alphafi_cetus_pool_base_a::Receipt"
        }
      ) {
        ...ObjectFields
      }

      naviObjects: objects(
        filter: {
          type: "0x8f7d2c35e19c65213bc2153086969a55ec207b5a25ebdee303a6d9edd9c053e3::alphafi_navi_pool::Receipt"
        }
      ) {
        ...ObjectFields
      }
    }
  }

  fragment ObjectFields on MoveObjectConnection {
    pageInfo {
      hasNextPage
    }
    nodes {
      contents {
        type {
          repr
        }
        json
      }
    }
  }
`;

// Add more queries as needed for other data fetching requirements.
/* For fetching event data (e.g., TVL over time, real-time APY), you
/* would add additional queries and functions similar to the ones
/* we’ve already set up. These queries would be designed to fetch
/* historical or real-time event data from the blockchain, which can
/* then be used to generate charts.
 */
