// src/graphql/mutations.ts
import { gql } from "@apollo/client";

export const DEPOSIT_MUTATION = gql`
  mutation Deposit($amount: Float!, $poolId: String!) {
    deposit(amount: $amount, poolId: $poolId) {
      success
      message
      updatedBalance
    }
  }
`;

export const WITHDRAW_MUTATION = gql`
  mutation Withdraw($amount: Float!, $poolId: String!) {
    withdraw(amount: $amount, poolId: $poolId) {
      success
      message
      updatedBalance
    }
  }
`;

export const COLLECT_REWARDS_MUTATION = gql`
  mutation CollectRewards($poolId: String!) {
    collectRewards(poolId: $poolId) {
      success
      message
      rewardsCollected
    }
  }
`;
