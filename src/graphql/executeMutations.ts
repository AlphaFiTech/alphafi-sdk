// src/graphql/executeMutations.ts
import client from "./client";
import {
  DEPOSIT_MUTATION,
  WITHDRAW_MUTATION,
  COLLECT_REWARDS_MUTATION,
} from "./mutations";

export async function deposit(amount: number, poolId: string) {
  const { data } = await client.mutate({
    mutation: DEPOSIT_MUTATION,
    variables: { amount, poolId },
  });
  return data.deposit;
}

export async function withdraw(amount: number, poolId: string) {
  const { data } = await client.mutate({
    mutation: WITHDRAW_MUTATION,
    variables: { amount, poolId },
  });
  return data.withdraw;
}

export async function collectRewards(poolId: string) {
  const { data } = await client.mutate({
    mutation: COLLECT_REWARDS_MUTATION,
    variables: { poolId },
  });
  return data.collectRewards;
}
