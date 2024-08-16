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

const balance: AlphaVaultBalance | undefined = await getAlphaVaultBalance(address);
```

## `getSingleAssetVaultBalance`

Call this to get user balance in Single Asset Vaults.

```typescript
import { getSingleAssetVaultBalance, SingleAssetVaultBalance } from "@alphafi/alphafi-sdk";

const balance: SingleAssetVaultBalance | undefined = await getSingleAssetVaultBalance(address, poolName);
```

## `getDoubleAssetVaultBalance`

Call this to get user balance in Double Asset Vaults.

```typescript
import { getDoubleAssetVaultBalance, DoubleAssetVaultBalance } from "@alphafi/alphafi-sdk";

const balance: DoubleAssetVaultBalance | undefined = await getDoubleAssetVaultBalance(address, poolName);
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
