# AlphaFi TypeScript SDK

## Installation

```bash
npm i @alphafi/alphafi-sdk
```

## API Reference

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

## `claimRewardTxb`

Call this to withdraw from Vaults on AlphaFi Protocol.

```typescript
import { claimRewardTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await claimRewardTxb(address);
```

## `depositSingleAssetTxb`

Call this to deposit in Single Asset Vaults on AlphaFi Protocol.

```typescript
import { depositSingleAssetTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await depositSingleAssetTxb(
  poolName,
  address,
  amount,
);
```

## `depositDoubleAssetTxb`

Call this to deposit in Double Asset Vaults on AlphaFi Protocol.

```typescript
import { depositDoubleAssetTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await depositDoubleAssetTxb(
  poolName,
  address,
  amount,
  isAmountA,
);
```

## `withdrawTxb`

Call this to withdraw from Vaults on AlphaFi Protocol.
xTokensAmount can be calculated using coinAmountToXTokensSingleAsset or coinAmountToXTokensDoubleAsset function depending on whether the pool is singleAsset or doubleAsset.

```typescript
import { withdrawTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await withdrawTxb(xTokensAmount, poolName, address);
```

## `withdrawAlphaTxb`

Call this to withdraw from Alpha Vault on AlphaFi Protocol.
xTokensAmount can be calculated using coinAmountToXTokensSingleAsset function.
If you want to withdraw from locked alpha tokens then pass withdrawFromLocked as true, otherwise false.

```typescript
import { withdrawAlphaTxb } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await withdrawAlphaTxb(
  xTokensAmount,
  withdrawFromLocked,
  address,
);
```

## `coinAmountToXTokensSingleAsset`

Call this to convert coin amount to xTokenAmount for any Single Asset pool on AlphaFi Protocol.

```typescript
import { coinAmountToXTokensSingleAsset } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await coinAmountToXTokensSingleAsset(
  amount,
  poolName,
);
```

## `coinAmountToXTokensDoubleAsset`

Call this to convert coin amount to xTokenAmount for any Double Asset pool on AlphaFi Protocol.
isAmountA parameter is true if you have passed amount of 1st coin, otherwise its false.

```typescript
import { coinAmountToXTokensDoubleAsset } from "@alphafi/alphafi-sdk";
import { Transaction } from "@mysten/sui/transactions";

const vaults: Transaction = await coinAmountToXTokensDoubleAsset(
  amount,
  poolName,
  isAmountA,
);
```
