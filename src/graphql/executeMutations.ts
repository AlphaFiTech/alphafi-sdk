// src/graphql/executeMutations.ts
import client from "./client.js";
import {
  DEPOSIT_MUTATION,
  WITHDRAW_MUTATION,
  COLLECT_REWARDS_MUTATION,
} from "./mutations.js";

export async function deposit(amount: number, poolId: string) {
  const { data } = await client.mutate<{
    deposit: { success: boolean; message: string; updatedBalance: number };
  }>({
    mutation: DEPOSIT_MUTATION,
    variables: { amount, poolId },
  });
  if (!data) throw new Error("Deposit mutation returned no data");
  return data.deposit;
}

export async function withdraw(amount: number, poolId: string) {
  const { data } = await client.mutate<{
    withdraw: { success: boolean; message: string; updatedBalance: number };
  }>({
    mutation: WITHDRAW_MUTATION,
    variables: { amount, poolId },
  });
  if (!data) throw new Error("Withdraw mutation returned no data");
  return data.withdraw;
}

export async function collectRewards(poolId: string) {
  const { data } = await client.mutate<{
    collectRewards: {
      success: boolean;
      message: string;
      rewardsCollected: number;
    };
  }>({
    mutation: COLLECT_REWARDS_MUTATION,
    variables: { poolId },
  });
  if (!data) throw new Error("CollectRewards mutation returned no data");
  return data.collectRewards;
}
