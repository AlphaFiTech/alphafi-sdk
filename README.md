# AlphaFi TypeScript SDK

## Installation

```bash
npm i @alphafi/alphafi-sdk
```

## `getVaults`

Call this to get all Vaults that a particular user has deposited in.

```typescript
import { getVaults, AlphaFiVault } from "@alphafi/alphafi-sdk";

const vaults: AlphaFiVault[] | undefined = await getVaults(address);
```

## `getSingleAssetVaults`

Call this to get all Single Asset Vaults that a particular user has deposited in.

```typescript
import { getSingleAssetVaults, AlphaFiVault } from "@alphafi/alphafi-sdk";

const vaults: AlphaFiVault[] | undefined = await getSingleAssetVaults(address);
```

## `getDoubleAssetVaults`

Call this to get all Double Asset Vaults that a particular user has deposited in.

```typescript
import { getDoubleAssetVaults, AlphaFiVault } from "@alphafi/alphafi-sdk";

const vaults: AlphaFiVault[] | undefined = await getDoubleAssetVaults(address);
```

## `getAlphaVaultBalance`

Call this to get user balance in Alpha Vault.

```typescript
import { getAlphaVaultBalance, AlphaVaultBalance } from "@alphafi/alphafi-sdk";

const balance: AlphaVaultBalance | undefined =
  await getAlphaVaultBalance(address);
```

## `getSingleAssetVaultBalance`

Call this to get user balance in Single Asset Vaults.

```typescript
import {
  getSingleAssetVaultBalance,
  SingleAssetVaultBalance,
} from "@alphafi/alphafi-sdk";

const balance: SingleAssetVaultBalance | undefined =
  await getSingleAssetVaultBalance(address, poolName);
```

## `getDoubleAssetVaultBalance`

Call this to get user balance in Double Asset Vaults.

```typescript
import {
  getDoubleAssetVaultBalance,
  DoubleAssetVaultBalance,
} from "@alphafi/alphafi-sdk";

const balance: DoubleAssetVaultBalance | undefined =
  await getDoubleAssetVaultBalance(address, poolName);
```

## `getAllVaultBalances`

Call this to get user balance for all vaults.

```typescript
import {
  PoolName,
  AlphaFiVaultBalance,
  getAllVaultBalances,
} from "@alphafi/alphafi-sdk";

const balance: Map<PoolName, AlphaFiVaultBalance> =
  await getAllVaultBalances(address);
```

## `getAllVaults`

Call this to get all Vaults on AlphaFi Protocol.

```typescript
import { getAllVaults } from "@alphafi/alphafi-sdk";

const vaults: string[] = await getAllVaults();
```

## `getAllSingleAssetVaults`

Call this to get all Single Asset Vaults on AlphaFi Protocol.

```typescript
import { getAllSingleAssetVaults } from "@alphafi/alphafi-sdk";

const vaults: string[] = await getAllSingleAssetVaults();
```

## `getAllDoubleAssetVaults`

Call this to get all Double Asset Vaults on AlphaFi Protocol.

```typescript
import { getAllDoubleAssetVaults } from "@alphafi/alphafi-sdk";

const vaults: string[] = await getAllDoubleAssetVaults();
```

## `depsoitSingleAssetTxb`

Call this to deposit in Single Asset Vaults on AlphaFi Protocol.

```typescript
import { depsoitSingleAssetTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await depsoitSingleAssetTxb(
  poolName,
  address,
  amount,
);
```

## `depsoitDoubleAssetTxb`

Call this to deposit in Double Asset Vaults on AlphaFi Protocol.

```typescript
import { depsoitDoubleAssetTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await depsoitDoubleAssetTxb(
  poolName,
  address,
  amount,
  isAmountA,
);
```

## `withdrawTxb`

Call this to withdraw from Vaults on AlphaFi Protocol.

```typescript
import { withdrawTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await withdrawTxb(poolName, address, amount);
```

## `claimRewardTxb`

Call this to withdraw from Vaults on AlphaFi Protocol.

```typescript
import { claimRewardTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await claimRewardTxb(address);
```
