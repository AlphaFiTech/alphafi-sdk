import type { LendingReward } from "@naviprotocol/lending";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { normalizeStructTag } from "@mysten/sui/utils";
import { getSuiClient } from "../sui-sdk/client.js";

const nativeFetch = globalThis.fetch.bind(globalThis);
const NAVI_DOMAIN_REGEX = /\.naviprotocol\.io$/i;
const NAVI_HEADER_OVERRIDES: Record<string, string> = {
  Host: "app.naviprotocol.io",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  Referer: "https://app.naviprotocol.io/",
  Origin: "app.naviprotocol.io",
};
const NAVI_DEFAULT_ENV = "prod";
const NAVI_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };

type ExtendedLendingReward = LendingReward & {
  asset_coin_type: string;
  reward_coin_type: string;
  user_claimable_reward: number;
  rule_ids: string[];
  asset_id: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

interface NaviConfigResponse {
  data: {
    uiGetter: string;
    storage: string;
    incentiveV3: string;
    oracle: {
      feeds: NaviPriceFeed[];
    };
  };
}

interface NaviPriceFeed {
  coinType: string;
  priceDecimal: number;
}

interface NaviPoolsResponse {
  data: NaviPool[];
}

interface NaviPool {
  id: number;
  coinType: string;
}

interface NaviRewardVectors {
  assetCoinTypes: string[];
  rewardCoinTypes: string[];
  options: number[];
  ruleIds: Array<string | string[]>;
  rawRewards: Array<string | number | bigint>;
}

function isRequest(input: any): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function applyNaviHeaders(request: Request): Request {
  const url = new URL(request.url);
  if (!NAVI_DOMAIN_REGEX.test(url.hostname)) {
    return request;
  }

  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(NAVI_HEADER_OVERRIDES)) {
    if (!headers.has(key)) {
      try {
        headers.set(key, value);
      } catch {
        // Ignore headers that cannot be set (e.g. forbidden headers in some environments)
      }
    }
  }

  return new Request(request, { headers });
}

async function fetchWithNaviHeaders(
  input: Parameters<typeof globalThis.fetch>[0],
  init?: Parameters<typeof globalThis.fetch>[1],
) {
  const request = isRequest(input) ? input : new Request(input, init);
  const finalRequest = applyNaviHeaders(request);
  return nativeFetch(finalRequest);
}

async function fetchCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const existing = inFlightRequests.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }
  const pending = loader()
    .then((value) => {
      cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
      inFlightRequests.delete(key);
      return value;
    })
    .catch((error) => {
      inFlightRequests.delete(key);
      throw error;
    });
  inFlightRequests.set(key, pending);
  return pending;
}

async function fetchNaviConfig(
  env: string,
): Promise<NaviConfigResponse["data"]> {
  const url = `https://open-api.naviprotocol.io/api/navi/config?env=${env}`;
  return fetchCached(`config:${env}`, NAVI_CACHE_TTL_MS, async () => {
    const response = await fetchWithNaviHeaders(
      new Request(url, { method: "GET" }),
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Navi config: ${response.status} ${response.statusText}`,
      );
    }
    const payload = (await response.json()) as NaviConfigResponse;
    return payload.data;
  });
}

async function fetchNaviPools(env: string): Promise<NaviPool[]> {
  const url = `https://open-api.naviprotocol.io/api/navi/pools?env=${env}`;
  return fetchCached(`pools:${env}`, NAVI_CACHE_TTL_MS, async () => {
    const response = await fetchWithNaviHeaders(
      new Request(url, { method: "GET" }),
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Navi pools: ${response.status} ${response.statusText}`,
      );
    }
    const payload = (await response.json()) as NaviPoolsResponse;
    return payload.data;
  });
}

function parseDevInspectRewards(result: any): NaviRewardVectors | null {
  if (
    !result ||
    !Array.isArray(result.results) ||
    !result.results[0] ||
    !Array.isArray(result.results[0].returnValues)
  ) {
    if (result?.error) {
      console.warn(`Failed to parse devInspect response: ${result.error}`);
    }
    return null;
  }

  const returnValues = result.results[0].returnValues;
  if (!returnValues.length) {
    return null;
  }

  const parsers = [
    bcs.vector(bcs.string()),
    bcs.vector(bcs.string()),
    bcs.vector(bcs.u8()),
    bcs.vector(bcs.Address),
    bcs.vector(bcs.u256()),
  ];

  const parsed = parsers.map((parser, index) => {
    const value = returnValues[index] ?? returnValues[0];
    return parser.parse(Uint8Array.from(value[0]));
  }) as [
    string[],
    string[],
    number[],
    Array<string | string[]>,
    Array<string | number | bigint>,
  ];

  const [assetCoinTypes, rewardCoinTypes, options, ruleIds, rawRewards] =
    parsed;

  return {
    assetCoinTypes,
    rewardCoinTypes,
    options,
    ruleIds,
    rawRewards,
  };
}

function toRuleIds(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  return [String(value)];
}

function normalizeCoinType(coinType: string): string {
  return normalizeStructTag(coinType);
}

function toClaimableAmount(raw: string | number | bigint, decimals: number) {
  const numeric =
    typeof raw === "bigint" ? Number(raw) : Number.parseFloat(String(raw));
  return numeric / Math.pow(10, decimals || 0);
}

export async function getAvailableRewards(address: string) {
  const env = NAVI_DEFAULT_ENV;
  const [config, pools] = await Promise.all([
    fetchNaviConfig(env),
    fetchNaviPools(env),
  ]);
  const priceFeeds = config.oracle?.feeds ?? [];

  const txb = new Transaction();
  txb.moveCall({
    target: `${config.uiGetter}::incentive_v3_getter::get_user_atomic_claimable_rewards`,
    arguments: [
      txb.object("0x06"),
      txb.object(config.storage),
      txb.object(config.incentiveV3),
      txb.pure.address(address),
    ],
  });

  const devInspectResult = await getSuiClient().devInspectTransactionBlock({
    transactionBlock: txb,
    sender: address,
  });

  const parsed = parseDevInspectRewards(devInspectResult);
  const rewardsByAsset: Record<string, ExtendedLendingReward[]> = {};

  if (!parsed) {
    return rewardsByAsset;
  }

  const totalRewards = parsed.assetCoinTypes.length;

  for (let index = 0; index < totalRewards; index++) {
    const assetCoinType = normalizeCoinType(parsed.assetCoinTypes[index]);
    const rewardCoinType = normalizeCoinType(parsed.rewardCoinTypes[index]);
    const pool = pools.find(
      (candidate) => normalizeCoinType(candidate.coinType) === assetCoinType,
    );
    const priceFeed = priceFeeds.find(
      (feed) => normalizeCoinType(feed.coinType) === rewardCoinType,
    );

    if (!pool || !priceFeed) {
      continue;
    }

    const reward: ExtendedLendingReward = {
      assetId: pool.id,
      assetCoinType,
      rewardCoinType,
      option: Number(parsed.options[index]),
      ruleIds: toRuleIds(parsed.ruleIds[index] ?? []),
      userClaimableReward: toClaimableAmount(
        parsed.rawRewards[index],
        priceFeed.priceDecimal,
      ),
      asset_id: pool.id,
      asset_coin_type: assetCoinType,
      reward_coin_type: rewardCoinType,
      user_claimable_reward: toClaimableAmount(
        parsed.rawRewards[index],
        priceFeed.priceDecimal,
      ),
      rule_ids: toRuleIds(parsed.ruleIds[index] ?? []),
    };

    if (!rewardsByAsset[assetCoinType]) {
      rewardsByAsset[assetCoinType] = [];
    }
    rewardsByAsset[assetCoinType].push(reward);
  }

  return rewardsByAsset;
}
