<!-- # @alphafi/alphafi-sdk

## `getVaults`

## `getAlphaVaultBalance`

## `getSingleAssetVaultBalance`

## `getDoubleAssetVaultBalance` -->

# ALPHAFI TypeScript SDK

## Installation

```bash
npm i @alphafi/alphafi-sdk
```

## `getVaults`

Call this to get all Vaults that a particular user has deposited in.

```typescript
import { getVaults, AlphaFiVault } from "alphafi-sdk";

const vaults: AlphaFiVault = await getVaults(address);
```

## `getAlphaVaultBalance`

Call this to get user balance in Alpha Vault.

```typescript
import { getAlphaVaultBalance, AlphaVaultBalance } from "alphafi-sdk";

const balance: AlphaVaultBalance = await getAlphaVaultBalance(address);
```

## `getSingleAssetVaultBalance`

Call this to get user balance in Single Asset Vaults.

```typescript
import { getSingleAssetVaultBalance, SingleAssetVaultBalance } from "alphafi-sdk";

const balance: SingleAssetVaultBalance = await getSingleAssetVaultBalance(address, poolName);
```

## `getDoubleAssetVaultBalance`

Call this to get user balance in Double Asset Vaults.

```typescript
import { getDoubleAssetVaultBalance, DoubleAssetVaultBalance } from "alphafi-sdk";

const balance: DoubleAssetVaultBalance = await getDoubleAssetVaultBalance(address, poolName);
```
