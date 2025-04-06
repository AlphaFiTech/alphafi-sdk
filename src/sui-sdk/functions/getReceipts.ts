import { PaginatedObjectsResponse } from "@mysten/sui/client";
import {
  AlphaPoolType,
  CetusInvestor,
  NaviInvestor,
  CommonInvestorFields,
  CetusPoolType,
  PoolName,
  PoolType,
  Receipt,
  NaviVoloData,
  Investor,
  BluefinInvestor,
  BucketInvestor,
  SingleAssetPoolNames,
  fetchMultiReceipts,
  ReceiptGQL,
  cetusPoolMap,
  bluefinPoolMap,
  Distributor,
  getConf,
  BluefinPoolType,
} from "../../index.js";
import { poolInfo } from "../../common/maps.js";
import { Decimal } from "decimal.js";
import { getSuiClient } from "../client.js";
import { SimpleCache } from "../../utils/simpleCache.js";

export function convertReceiptGQLToReceipt(receipts: ReceiptGQL[]): Receipt[] {
  const res = receipts.map((receipt) => {
    return {
      objectId: receipt.address,
      version: receipt.version,
      digest: receipt.digest,
      content: {
        dataType: "moveObject", // Assuming a fixed value as it's not available in ReceiptA
        type: receipt.contents.type.repr,
        hasPublicTransfer: receipt.hasPublicTransfer,
        fields: {
          id: { id: receipt.contents.json.id },
          image_url: receipt.contents.json.image_url,
          last_acc_reward_per_xtoken: {
            type: "unknown", // Assuming fixed value
            fields: {
              contents:
                receipt.contents.json.last_acc_reward_per_xtoken.contents.map(
                  (item) => ({
                    type: "unknown", // Assuming fixed value
                    fields: {
                      value: item.value,
                      key: {
                        type: "unknown", // Assuming fixed value
                        fields: {
                          name: item.key.name,
                        },
                      },
                    },
                  }),
                ),
            },
          },
          locked_balance: receipt.contents.json.locked_balance
            ? {
                type: "unknown", // Assuming fixed value
                fields: {
                  head: receipt.contents.json.locked_balance.head,
                  id: { id: receipt.contents.json.locked_balance.id },
                  size: receipt.contents.json.locked_balance.size,
                  tail: receipt.contents.json.locked_balance.tail,
                },
              }
            : undefined,
          name: receipt.contents.json.name,
          owner: receipt.contents.json.owner,
          pending_rewards: {
            type: "unknown", // Assuming fixed value
            fields: {
              contents: receipt.contents.json.pending_rewards.contents.map(
                (item) => ({
                  type: "unknown", // Assuming fixed value
                  fields: {
                    key: {
                      type: "unknown", // Assuming fixed value
                      fields: {
                        name: item.key.name,
                      },
                    },
                    value: item.value,
                  },
                }),
              ),
            },
          },
          pool_id: receipt.contents.json.pool_id,
          xTokenBalance: receipt.contents.json.xTokenBalance,
          unlocked_xtokens: receipt.contents.json.unlocked_xtokens ?? undefined,
        },
      },
    };
  });
  return res;
}

const receiptsCache = new SimpleCache<Receipt[]>(3600000);
const receiptsPromiseCache = new SimpleCache<Promise<Receipt[]>>(3600000);

export async function getMultiReceipts(address: string) {
  try {
    const receiptMap = await fetchMultiReceipts(address);
    for (const pool of Object.keys(poolInfo)) {
      const cacheKey = `getReceipts-${poolInfo[pool].receiptName}-${address}`;
      let receipt: Receipt[] = [];
      if (receiptMap.has(poolInfo[pool].receiptName)) {
        receipt = convertReceiptGQLToReceipt(
          receiptMap.get(poolInfo[pool].receiptName) as ReceiptGQL[],
        );
      }
      receiptsCache.set(cacheKey, receipt);
    }
  } catch (error) {
    console.error("Error fetching receipts from graphQL:", error);
    // get receipts individually
    const pools = Object.keys(poolInfo);
    const receiptPromises = pools.map((pool) => {
      return getReceipts(pool as PoolName, address, true);
    });
    const receipts = await Promise.all(receiptPromises);
    receipts.forEach((receipt, index) => {
      const cacheKey = `getReceipts-${poolInfo[pools[index]].receiptName}-${address}`;
      receiptsCache.set(cacheKey, receipt);
    });
  }
}

export async function getReceipts(
  poolName: PoolName,
  address: string,
  ignoreCache: boolean,
): Promise<Receipt[]> {
  const suiClient = getSuiClient();
  const receiptsCacheKey = `getReceipts-${poolInfo[poolName].receiptName}-${address}`;
  if (ignoreCache) {
    receiptsCache.delete(receiptsCacheKey);
    receiptsPromiseCache.delete(receiptsCacheKey);
  }
  const cachedResponse = receiptsCache.get(receiptsCacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  //
  const nfts: Receipt[] = [];
  if (poolInfo[poolName].receiptType == "") {
    return nfts;
  }
  let cachedPromise = receiptsPromiseCache.get(receiptsCacheKey);
  if (!cachedPromise) {
    cachedPromise = (async (): Promise<Receipt[]> => {
      // const first_package = getConf().ALPHA_FIRST_PACKAGE_ID;
      let currentCursor: string | null | undefined = null;
      while (true) {
        const paginatedObjects: PaginatedObjectsResponse =
          await suiClient.getOwnedObjects({
            owner: address,
            cursor: currentCursor,
            filter: {
              // StructType: `${first_package}::${module}::Receipt`,
              StructType: poolInfo[poolName].receiptType,
            },
            options: {
              showContent: true,
            },
          });
        // Traverse the current page data and push to coins array
        paginatedObjects.data.forEach((obj) => {
          const o = obj.data as Receipt;
          if (o) {
            if (poolInfo[poolName].receiptName === o.content.fields.name) {
              nfts.push(o);
            }
          }
        });
        // Check if there's a next page
        if (paginatedObjects.hasNextPage && paginatedObjects.nextCursor) {
          currentCursor = paginatedObjects.nextCursor;
        } else {
          // No more pages available
          // console.log("No more receipts available.");
          break;
        }
      }
      receiptsCache.set(receiptsCacheKey, nfts);
      receiptsPromiseCache.delete(receiptsCacheKey);
      return nfts;
    })().catch((error) => {
      receiptsPromiseCache.delete(receiptsCacheKey); // Remove the promise from cache
      throw error;
    });
    // const data = await cachedPromise;
    // console.log("received cached data", data);
    receiptsPromiseCache.set(receiptsCacheKey, cachedPromise);
  }
  return cachedPromise;
}

const poolCache = new SimpleCache<PoolType | AlphaPoolType>();
const poolPromiseCache = new SimpleCache<Promise<PoolType | AlphaPoolType>>();

export async function getMultiPool() {
  let pools = Object.keys(poolInfo);
  pools = pools.filter((pool) => {
    return poolInfo[pool].poolId !== "";
  });
  const poolIds = pools.map((pool) => {
    return poolInfo[pool].poolId;
  });
  const batchSize = 49; // Set the desired batch size

  // Create an array to hold the batches
  const batches: string[][] = [];
  //const batches = [];
  // Loop through the entries array and create batches
  for (let i = 0; i < poolIds.length; i += batchSize) {
    const batchEntries: string[] = poolIds.slice(i, i + batchSize);
    batches.push(batchEntries); // Convert to object before pushing
  }
  for (const poolIdsBatch of batches) {
    try {
      const o = await getSuiClient().multiGetObjects({
        ids: poolIdsBatch,
        options: {
          showContent: true,
        },
      });
      for (let i = 0; i < poolIdsBatch.length; i = i + 1) {
        const poolData = o[i].data as AlphaPoolType | PoolType;
        const cacheKey = `pool_${poolIdsBatch[i]}`;
        poolCache.set(cacheKey, poolData);
      }
    } catch (error) {
      console.error(`Error getting multiPools - ${error}`);
    }
  }
}

export async function getPool(
  poolName: string,
  ignoreCache: boolean,
): Promise<PoolType | AlphaPoolType> {
  const suiClient = getSuiClient();
  const cacheKey = `pool_${poolInfo[poolName].poolId}`;

  if (ignoreCache) {
    poolCache.delete(cacheKey);
    poolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = poolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let poolPromise = poolPromiseCache.get(cacheKey);
  if (poolPromise) {
    return poolPromise;
  }
  // If not, create a new promise and cache it
  poolPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: poolInfo[poolName].poolId,
        options: {
          showContent: true,
        },
      });

      const poolData =
        poolName === "ALPHA" ? (o.data as AlphaPoolType) : (o.data as PoolType);

      // Cache the pool object
      poolCache.set(cacheKey, poolData);
      return poolData;
    } catch (err) {
      console.error(`Error in getPool; poolName => ${poolName}`);
      throw err;
    } finally {
      // Remove the promise from the cache after it resolves
      poolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  poolPromiseCache.set(cacheKey, poolPromise);
  return poolPromise;
}

const parentPoolCache = new SimpleCache<CetusPoolType | BluefinPoolType>();
const parentPoolPromiseCache = new SimpleCache<
  Promise<CetusPoolType | BluefinPoolType>
>();

export async function getMultiParentPool() {
  let pools = Object.keys(poolInfo);
  pools = pools.filter((pool) => {
    return poolInfo[pool].parentPoolId !== "";
  });
  const parentPoolIds = pools.map((pool) => {
    return poolInfo[pool].parentPoolId;
  });
  const poolsSet = new Set(parentPoolIds);
  const poolIds = [...poolsSet];
  const batchSize = 49;
  // Create an array to hold the batches
  const batches: string[][] = [];
  //const batches = [];
  // Loop through the entries array and create batches
  for (let i = 0; i < poolIds.length; i += batchSize) {
    const batchEntries: string[] = poolIds.slice(i, i + batchSize);
    batches.push(batchEntries); // Convert to object before pushing
  }

  for (const parentPoolIdsBatch of batches) {
    try {
      const o = await getSuiClient().multiGetObjects({
        ids: parentPoolIdsBatch,
        options: {
          showContent: true,
        },
      });
      for (let i = 0; i < parentPoolIdsBatch.length; i = i + 1) {
        const parentPoolData = o[i].data as CetusPoolType;
        const cacheKey = `parentPool_${parentPoolIdsBatch[i]}`;
        parentPoolCache.set(cacheKey, parentPoolData);
      }
    } catch (error) {
      console.error(`Error getting multiParentPools - ${error}`);
    }
  }
}

export async function getParentPool(
  poolName: string,
  ignoreCache: boolean,
): Promise<CetusPoolType | BluefinPoolType> {
  const suiClient = getSuiClient();
  const cacheKey = `parentPool_${poolInfo[poolName].parentPoolId}`;
  if (ignoreCache) {
    parentPoolCache.delete(cacheKey);
    parentPoolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = parentPoolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let parentPoolPromise = parentPoolPromiseCache.get(cacheKey);
  if (parentPoolPromise) {
    return parentPoolPromise;
  }
  // If not, create a new promise and cache it
  parentPoolPromise = (async () => {
    try {
      const id = poolInfo[poolName]
        ? poolInfo[poolName].parentPoolId
        : cetusPoolMap[poolName]
          ? cetusPoolMap[poolName]
          : bluefinPoolMap[poolName];
      const o = await suiClient.getObject({
        id: id,
        options: {
          showContent: true,
        },
      });
      const parentPool = o.data as CetusPoolType | BluefinPoolType;

      // Cache the pool object
      parentPoolCache.set(cacheKey, parentPool);
      return parentPool;
    } catch (err) {
      console.error(`getParentPool failed for poolName: ${poolName}`);
      throw err;
    } finally {
      // Remove the promise from the cache after it resolves
      parentPoolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  parentPoolPromiseCache.set(cacheKey, parentPoolPromise);
  return parentPoolPromise;
}

const cetusPoolCache = new SimpleCache<CetusPoolType | BluefinPoolType>();
const cetusPoolPromiseCache = new SimpleCache<
  Promise<CetusPoolType | BluefinPoolType | undefined>
>();

export async function getMultiCetusPool() {
  let pools = Object.keys(cetusPoolMap);
  pools = pools.filter((pool) => {
    return cetusPoolMap[pool] !== "";
  });
  const poolIds = pools.map((pool) => {
    return cetusPoolMap[pool];
  });
  const batchSize = 49;
  // Create an array to hold the batches
  const batches: string[][] = [];
  // Loop through the entries array and create batches
  for (let i = 0; i < poolIds.length; i += batchSize) {
    const batchEntries: string[] = poolIds.slice(i, i + batchSize);
    batches.push(batchEntries); // Convert to object before pushing
  }
  for (const cetusPoolIdsBatch of batches) {
    try {
      const o = await getSuiClient().multiGetObjects({
        ids: cetusPoolIdsBatch,
        options: {
          showContent: true,
        },
      });
      for (let i = 0; i < pools.length; i = i + 1) {
        const poolData = o[i].data as CetusPoolType;
        const cacheKey = `cetusPool_${cetusPoolMap[pools[i]]}`;
        cetusPoolCache.set(cacheKey, poolData);
      }
    } catch (e) {
      console.error(`Error getting multiCetusPools`, e);
    }
  }
}

export async function getCetusPool(
  poolName: string,
  ignoreCache: boolean,
): Promise<CetusPoolType | BluefinPoolType | undefined> {
  const suiClient = getSuiClient();
  const cacheKey = `cetusPool_${cetusPoolMap[poolName]}`;
  if (ignoreCache) {
    cetusPoolCache.delete(cacheKey);
    cetusPoolPromiseCache.delete(cacheKey);
  }

  // Check if the pool is already in the cache
  const cachedPool = cetusPoolCache.get(cacheKey);
  if (cachedPool) {
    return cachedPool;
  }

  // Check if there is already a promise in the cache
  let cetusPoolPromise = cetusPoolPromiseCache.get(cacheKey);
  if (cetusPoolPromise) {
    return cetusPoolPromise;
  }
  // If not, create a new promise and cache it
  cetusPoolPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: cetusPoolMap[poolName],
        options: {
          showContent: true,
        },
      });
      const cetusPool = o.data as CetusPoolType;

      // Cache the pool object
      cetusPoolCache.set(cacheKey, cetusPool);
      return cetusPool;
    } catch (e) {
      console.error(`getCetusPool failed for poolName: ${poolName}`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      cetusPoolPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  cetusPoolPromiseCache.set(cacheKey, cetusPoolPromise);
  return cetusPoolPromise;
}

const investorCache = new SimpleCache<Investor>();
const investorPromiseCache = new SimpleCache<Promise<Investor>>();

export async function getMultiInvestor() {
  let pools = Object.keys(poolInfo);
  pools = pools.filter((pool) => {
    return poolInfo[pool].investorId !== "";
  });
  const investorIds = pools.map((pool) => {
    return poolInfo[pool].investorId;
  });
  const batchSize = 49;
  // Create an array to hold the batches
  const batches: string[][] = [];
  //const batches = [];
  // Loop through the entries array and create batches
  for (let i = 0; i < investorIds.length; i += batchSize) {
    const batchEntries: string[] = investorIds.slice(i, i + batchSize);
    batches.push(batchEntries); // Convert to object before pushing
  }
  for (const investorIdsBatch of batches) {
    try {
      const o = await getSuiClient().multiGetObjects({
        ids: investorIdsBatch,
        options: {
          showContent: true,
        },
      });
      for (let i = 0; i < investorIdsBatch.length; i = i + 1) {
        const investorData = o[i].data as Investor;
        const cacheKey = `investor_${investorIdsBatch[i]}`;
        investorCache.set(cacheKey, investorData);
      }
    } catch (error) {
      console.error(`Error getting multiInvestor - ${error}`);
    }
  }
}

export async function getInvestor(
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<Investor> {
  const suiClient = getSuiClient();
  const cacheKey = `investor_${poolInfo[poolName].investorId}`;
  if (ignoreCache) {
    investorCache.delete(cacheKey);
    investorPromiseCache.delete(cacheKey);
  }
  // Check if the investor is already in the cache
  const cachedInvestor = investorCache.get(cacheKey);
  if (cachedInvestor) {
    return cachedInvestor;
  }

  // Check if there is already a promise in the cache
  let cetusInvestorPromise = investorPromiseCache.get(cacheKey);
  if (cetusInvestorPromise) {
    return cetusInvestorPromise;
  }
  // If not, create a new promise and cache it
  cetusInvestorPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: poolInfo[poolName].investorId,
        options: {
          showContent: true,
        },
      });
      let cetusInvestor: Investor;
      if (poolInfo[poolName].parentProtocolName == "NAVI") {
        cetusInvestor = o.data as NaviInvestor & CommonInvestorFields;
      } else if (poolInfo[poolName].parentProtocolName == "BUCKET") {
        cetusInvestor = o.data as BucketInvestor & CommonInvestorFields;
      } else if (poolInfo[poolName].parentProtocolName == "BLUEFIN") {
        cetusInvestor = o.data as BluefinInvestor & CommonInvestorFields;
      } else {
        cetusInvestor = o.data as CetusInvestor & CommonInvestorFields;
      }

      // Cache the investor object
      investorCache.set(cacheKey, cetusInvestor);
      return cetusInvestor;
    } catch (err) {
      console.error(`getInvestor failed for pool: ${poolName}`);
      throw err;
    } finally {
      // Remove the promise from the cache after it resolves
      investorPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  investorPromiseCache.set(cacheKey, cetusInvestorPromise);
  return cetusInvestorPromise;
}

const distributorCache = new SimpleCache<Distributor>();
const distributorPromiseCache = new SimpleCache<
  Promise<Distributor | undefined>
>();

export async function getDistributor(
  ignoreCache: boolean,
): Promise<Distributor | undefined> {
  const suiClient = getSuiClient();
  const cacheKey = `distributor_${getConf().ALPHA_DISTRIBUTOR}`;
  if (ignoreCache) {
    distributorCache.delete(cacheKey);
    distributorPromiseCache.delete(cacheKey);
  }
  // Check if the distributor is already in the cache
  const cachedDistributor = distributorCache.get(cacheKey);
  if (cachedDistributor) {
    return cachedDistributor;
  }

  // Check if there is already a promise in the cache
  let distributorPromise = distributorPromiseCache.get(cacheKey);
  if (distributorPromise) {
    return distributorPromise;
  }

  // If not, create a new promise and cache it
  distributorPromise = (async () => {
    try {
      const o = await suiClient.getObject({
        id: getConf().ALPHA_DISTRIBUTOR,
        options: {
          showContent: true,
        },
      });
      const distributor = o.data as Distributor;

      // Cache the distributor object
      distributorCache.set(cacheKey, distributor);
      return distributor;
    } catch (e) {
      console.error(`getDistributor failed`);
      return undefined;
    } finally {
      // Remove the promise from the cache after it resolves
      distributorPromiseCache.delete(cacheKey);
    }
  })();

  // Cache the promise
  distributorPromiseCache.set(cacheKey, distributorPromise);
  return distributorPromise;
}

export async function getPoolExchangeRate(
  poolName: PoolName,
  ignoreCache: boolean,
): Promise<Decimal> {
  let pool: PoolType | AlphaPoolType;
  try {
    pool = await getPool(poolName, ignoreCache);
    let xTokenSupply = new Decimal(0);
    if (
      poolName.toString().includes("-FUNGIBLE-") &&
      "treasury_cap" in pool.content.fields
    ) {
      xTokenSupply = new Decimal(
        pool.content.fields.treasury_cap.fields.total_supply.fields.value,
      );
    } else {
      xTokenSupply = new Decimal(pool.content.fields.xTokenSupply);
    }
    let tokensInvested = new Decimal(pool.content.fields.tokensInvested);
    if (poolName == "ALPHA") {
      tokensInvested = new Decimal(pool.content.fields.alpha_bal);
    } else if (poolInfo[poolName].parentProtocolName == "CETUS") {
      const investor = (await getInvestor(
        poolName,
        ignoreCache,
      )) as CetusInvestor & CommonInvestorFields;
      if (!investor) {
        throw new Error(`couldnt fetch investor object for pool: ${poolName}`);
      }
      tokensInvested = new Decimal(pool.content.fields.tokensInvested);
    }

    // Check for division by zero
    if (xTokenSupply.eq(0)) {
      console.error("Division by zero error: tokensInvested is zero.");
      return new Decimal(0);
    }
    const poolExchangeRate = tokensInvested.div(xTokenSupply);
    return poolExchangeRate;
  } catch (err) {
    console.log(
      `getPoolExchangeRate failed for poolName: ${poolName}, with error ${err}`,
    );
    throw err;
  }
}

const naviVoloExchangeRateCache = new SimpleCache<NaviVoloData>();
const naviVoloExchangeRatePromiseCache = new SimpleCache<
  Promise<NaviVoloData>
>();

export async function fetchVoloExchangeRate(
  ignoreCache: boolean,
): Promise<NaviVoloData> {
  const apiUrl = "https://open-api.naviprotocol.io/api/volo/stats";
  let NaviVoloDetails: NaviVoloData;
  if (ignoreCache) {
    naviVoloExchangeRateCache.clear();
    naviVoloExchangeRatePromiseCache.delete(apiUrl);
  }

  const cachedResponse = naviVoloExchangeRateCache.get(apiUrl);
  if (cachedResponse) {
    NaviVoloDetails = cachedResponse;
  } else {
    const default_volo_data: NaviVoloData = {
      data: {
        operatorBalance: "",
        collectableFee: "",
        pendingStakes: "",
        poolTotalRewards: "0",
        unstakeTicketSupply: "",
        totalStaked: "",
        activeStake: "",
        calcTotalRewards: "",
        currentEpoch: "",
        validators: {},
        exchangeRate: (1 / 0.973).toString(),
        totalSupply: "",
        apy: "",
        sortedValidators: [""],
        maxInstantUnstake: "",
        maxNoFeeUnstake: "",
      },
      code: 0,
    };
    try {
      let cachedPromise = naviVoloExchangeRatePromiseCache.get(apiUrl);

      if (!cachedPromise) {
        cachedPromise = fetch(apiUrl)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = (await response.json()) as NaviVoloData; // Parse the JSON response
            naviVoloExchangeRateCache.set(apiUrl, data); // Cache the response
            naviVoloExchangeRatePromiseCache.delete(apiUrl); // Remove the promise from the cache
            return data;
          })
          .catch((error) => {
            naviVoloExchangeRatePromiseCache.delete(apiUrl); // Ensure the promise is removed on error
            throw error;
          });
        naviVoloExchangeRatePromiseCache.set(apiUrl, cachedPromise);
        NaviVoloDetails = await cachedPromise;
        return cachedPromise;
      } else {
        NaviVoloDetails = default_volo_data;
        return Promise.resolve(default_volo_data);
      }
    } catch (error) {
      console.log("error in api", error);

      NaviVoloDetails = default_volo_data;
      return Promise.resolve(default_volo_data);
    }
  }

  return NaviVoloDetails;
}

export async function multiGetNaviInvestor(poolNames: SingleAssetPoolNames[]) {
  const results: {
    [poolName in SingleAssetPoolNames]?:
      | (NaviInvestor & CommonInvestorFields)
      | undefined;
  } = {};
  const poolInvestorIds: string[] = [];

  for (const poolName of poolNames) {
    poolInvestorIds.push(poolInfo[poolName].investorId);
  }
  try {
    const suiClient = getSuiClient();
    const objects = await suiClient.multiGetObjects({
      ids: poolInvestorIds,
      options: { showContent: true },
    });
    for (let i = 0; i < objects.length; i++) {
      const investor = objects[i].data as NaviInvestor & CommonInvestorFields;
      results[poolNames[i]] = investor;
    }
    return results;
  } catch (err) {
    //improve
    console.error(
      "multiGetNaviInvestor failed for poolNames: ",
      poolNames.join(", "),
    );
    throw err;
  }
}
/*
for the missing pools, add a promise, each of those promises waits for there respective object from a map, that map is populated all at once, 
problem with concurrency
*/
// ask how to deal with this kind of probem with high concurrency anf throughput
