import { conf, CONF_ENV } from "./constants.js";
import {
  AlphaPoolType,
  CetusInvestor,
  CetusPoolType,
  CoinName,
  CoinType,
  DoubleAssetPoolNames,
  ParentProtocolName,
  PoolName,
  PoolReceipt,
  PoolType,
  SingleAssetPoolNames,
  StrategyType,
} from "./types.js";
import { PythPriceIdPair } from "./pyth.js";
import { getSuiClient } from "../sui-sdk/client.js";
import { Decimal } from "decimal.js";
import { getLatestTokenPricePairs } from "../utils/prices.js";
import { multiGetNaviInvestor } from "../sui-sdk/functions/getReceipts.js";

export const stableCoins = [
  "USDT",
  "WUSDT",
  "USDC",
  "WUSDC",
  "USDY",
  "WUSDY",
  "AUSD",
  "BUCK",
];

export const cetusInvestorMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_CETUS_INVESTOR,
  "USDT-WUSDC": conf[CONF_ENV].USDT_WUSDC_CETUS_INVESTOR,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_CETUS_INVESTOR,
  "USDY-WUSDC": conf[CONF_ENV].USDY_WUSDC_CETUS_INVESTOR,
  "WUSDC-SUI": conf[CONF_ENV].WUSDC_SUI_CETUS_INVESTOR,
  "WETH-WUSDC": conf[CONF_ENV].WETH_WUSDC_CETUS_INVESTOR,
  "WUSDC-WBTC": conf[CONF_ENV].WUSDC_WBTC_CETUS_INVESTOR,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_CETUS_INVESTOR,
  "BUCK-WUSDC": conf[CONF_ENV].BUCK_WUSDC_CETUS_INVESTOR,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_CETUS_INVESTOR,
};

export const poolMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL,
  "USDT-WUSDC": conf[CONF_ENV].WUSDC_USDT_POOL,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_POOL,
  "USDY-WUSDC": conf[CONF_ENV].USDY_WUSDC_POOL,
  "WUSDC-SUI": conf[CONF_ENV].WUSDC_SUI_POOL,
  "WETH-WUSDC": conf[CONF_ENV].WETH_WUSDC_POOL,
  "WUSDC-WBTC": conf[CONF_ENV].WUSDC_WBTC_POOL,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_POOL,
  "BUCK-WUSDC": conf[CONF_ENV].BUCK_WUSDC_POOL,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_POOL,
};

export const receiptNameMap: { [key in string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
  "USDT-WUSDC": conf[CONF_ENV].USDT_WUSDC_POOL_RECEIPT_NAME,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT_NAME,
  "USDY-WUSDC": conf[CONF_ENV].USDY_WUSDC_POOL_RECEIPT_NAME,
  "WUSDC-SUI": conf[CONF_ENV].WUSDC_SUI_POOL_RECEIPT_NAME,
  "WETH-WUSDC": conf[CONF_ENV].WETH_WUSDC_POOL_RECEIPT_NAME,
  "WUSDC-WBTC": conf[CONF_ENV].WUSDC_WBTC_POOL_RECEIPT_NAME,
  "BUCK-WUSDC": conf[CONF_ENV].BUCK_WUSDC_POOL_RECEIPT_NAME,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT_NAME,
  "NAVI-VSUI": conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT_NAME,
  "NAVI-SUI": conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT_NAME,
  "NAVI-HASUI": conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT_NAME,
};

export const poolCoinPairMap: Record<
  DoubleAssetPoolNames,
  { coinA: CoinName; coinB: CoinName }
> = {
  "USDT-WUSDC": { coinA: "USDT", coinB: "WUSDC" },
  "ALPHA-SUI": { coinA: "ALPHA", coinB: "SUI" },
  "HASUI-SUI": { coinA: "HASUI", coinB: "SUI" },
  "USDY-WUSDC": { coinA: "USDY", coinB: "WUSDC" },
  "WUSDC-SUI": { coinA: "WUSDC", coinB: "SUI" },
  "WETH-WUSDC": { coinA: "WETH", coinB: "WUSDC" },
  "WUSDC-WBTC": { coinA: "WUSDC", coinB: "WBTC" },
  "NAVX-SUI": { coinA: "NAVX", coinB: "SUI" },
  "BUCK-WUSDC": { coinA: "BUCK", coinB: "WUSDC" },
  "CETUS-SUI": { coinA: "CETUS", coinB: "SUI" },
  "ALPHA-WUSDC": { coinA: "ALPHA", coinB: "WUSDC" },
  "WSOL-WUSDC": { coinA: "WSOL", coinB: "WUSDC" },
  "FUD-SUI": { coinA: "FUD", coinB: "SUI" },
  "BLUB-SUI": { coinA: "BLUB", coinB: "SUI" },
  "SCA-SUI": { coinA: "SCA", coinB: "SUI" },
  "USDC-SUI": { coinA: "USDC", coinB: "SUI" },
  "USDC-USDT": { coinA: "USDC", coinB: "USDT" },
  "ALPHA-USDC": { coinA: "ALPHA", coinB: "USDC" },
  "USDC-WUSDC": { coinA: "USDC", coinB: "WUSDC" },
  "USDC-ETH": { coinA: "USDC", coinB: "ETH" },
  "DEEP-SUI": { coinA: "DEEP", coinB: "SUI" },
  "BUCK-SUI": { coinA: "BUCK", coinB: "SUI" },
  "BLUEFIN-SUI-USDC": { coinA: "SUI", coinB: "USDC" },
  "BLUEFIN-USDT-USDC": { coinA: "USDT", coinB: "USDC" },
};

export const poolCoinMap: Record<SingleAssetPoolNames, CoinName> = {
  ALPHA: "ALPHA",
  "NAVI-VSUI": "VSUI",
  "NAVI-SUI": "SUI",
  "NAVI-WETH": "WETH",
  "NAVI-WUSDC": "WUSDC",
  "NAVI-USDT": "USDT",
  "NAVI-HASUI": "HASUI",
  "NAVI-LOOP-SUI-VSUI": "SUI",
  "NAVI-LOOP-USDC-USDT": "USDC",
  "NAVI-USDC": "USDC",
  "BUCKET-BUCK": "BUCK",
  "NAVI-USDY": "USDY",
  "NAVI-AUSD": "AUSD",
  "NAVI-ETH": "ETH",
  "NAVI-LOOP-HASUI-SUI": "HASUI",
  "NAVI-LOOP-USDT-USDC": "USDT",
};

// FUNCTION OVERLOADS!
// verify if there is event_type anywhere else
export function coinsInPool(
  poolName: DoubleAssetPoolNames,
  event?: { type: string; event_type?: number },
): { coinA: CoinName; coinB: CoinName };
export function coinsInPool(
  poolName: SingleAssetPoolNames,
  event?: { type: string; event_type?: number },
): CoinName;
export function coinsInPool(
  poolName: SingleAssetPoolNames | DoubleAssetPoolNames,
  event?: { type: string; event_type?: number },
): { coinA: CoinName; coinB: CoinName } | CoinName {
  // Special case for "NAVI-LOOP-SUI-VSUI"
  if (poolName === "NAVI-LOOP-SUI-VSUI") {
    if (
      event &&
      event.type ===
        conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT &&
      event.event_type === 0
    ) {
      return "SUI";
    }
    return "VSUI";
  }
  const singleAsset = poolCoinMap[poolName as SingleAssetPoolNames];
  const doubleAsset = poolCoinPairMap[poolName as DoubleAssetPoolNames];
  if (singleAsset) {
    return singleAsset;
  }
  if (doubleAsset) {
    return doubleAsset;
  }
  console.error("poolName: ", poolName);
  throw new Error("Pool not found in poolCoinMap or poolCoinPairMap");
}

export const poolInfo: {
  [key: string]: {
    parentProtocolName: ParentProtocolName;
    parentPoolId: string;
    poolId: string;
    investorId: string;
    receiptName: string;
    receiptType: PoolReceipt;
    autoCompoundingEventType: string;
    rebalanceEventType: string | undefined;
    liquidityChangeEventType: string;
    withdrawV2EventType?: string;
    afterTransactionEventType?: string;
    strategyType?: StrategyType;
  };
} = {
  "NAVI-LOOP-USDT-USDC": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_USDT_USDC_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_USDT_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDT_USDC_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_USDT_USDC_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
  },
  "BLUEFIN-USDT-USDC": {
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_USDT_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-SUI-USDC": {
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "NAVI-LOOP-HASUI-SUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_HASUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_HASUI_SUI_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_HASUI_SUI_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
  },
  "NAVI-USDY": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDY_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDY_POOL,
    investorId: conf[CONF_ENV].NAVI_USDY_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDY_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDY_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-AUSD": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_AUSD_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_AUSD_POOL,
    investorId: conf[CONF_ENV].NAVI_AUSD_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_AUSD_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_AUSD_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-ETH": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_ETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_ETH_POOL,
    investorId: conf[CONF_ENV].NAVI_ETH_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_ETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_ETH_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BUCKET-BUCK": {
    parentProtocolName: "BUCKET",
    parentPoolId: conf[CONF_ENV].BUCKET_PROTOCOL,
    poolId: conf[CONF_ENV].BUCKET_BUCK_POOL,
    investorId: conf[CONF_ENV].BUCKET_BUCK_INVESTOR,
    receiptName: conf[CONF_ENV].BUCKET_BUCK_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCKET_BUCK_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCKET_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BUCK-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].BUCK_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].BUCK_SUI_POOL,
    investorId: conf[CONF_ENV].BUCK_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].BUCK_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCK_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCK_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-ETH": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_ETH_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_ETH_POOL,
    investorId: conf[CONF_ENV].USDC_ETH_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_ETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_ETH_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_ETH_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "DEEP-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].DEEP_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].DEEP_SUI_POOL,
    investorId: conf[CONF_ENV].DEEP_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].DEEP_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].DEEP_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].DEEP_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "ALPHA-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHA_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_WUSDC_POOL,
    investorId: conf[CONF_ENV].USDC_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_SUI_POOL,
    investorId: conf[CONF_ENV].USDC_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-USDT": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_USDT_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDC_USDT_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_USDT_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_USDT_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_USDT_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-USDC": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDC_POOL,
    investorId: conf[CONF_ENV].NAVI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-LOOP-USDC-USDT": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_USDC_USDT_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_USDC_USDT_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDC_USDT_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_USDC_USDT_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
  },
  "NAVI-LOOP-SUI-VSUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_SUI_VSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_SUI_VSUI_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
  },
  "NAVI-SUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_SUI_POOL,
    investorId: conf[CONF_ENV].NAVI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-VSUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_VSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-WETH": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_WETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_WETH_POOL,
    investorId: conf[CONF_ENV].NAVI_WETH_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-USDT": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDT_POOL,
    investorId: conf[CONF_ENV].NAVI_USDT_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-WUSDC": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_WUSDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_WUSDC_POOL,
    investorId: conf[CONF_ENV].NAVI_WUSDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-HASUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_HASUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_HASUI_POOL,
    investorId: conf[CONF_ENV].NAVI_HASUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_HASUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_HASUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_HASUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  ALPHA: {
    parentProtocolName: "ALPHAFI",
    parentPoolId: conf[CONF_ENV].ALPHA_POOL,
    poolId: conf[CONF_ENV].ALPHA_POOL,
    investorId: conf[CONF_ENV].ALPHA_POOL,
    receiptName: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_POOL_RECEIPT,
    autoCompoundingEventType: conf[CONF_ENV].ALPHA_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType: conf[CONF_ENV].ALPHA_POOL_LIQUIDITY_CHANGE_EVENT,
    withdrawV2EventType: conf[CONF_ENV].ALPHA_POOL_WITHDRAW_V2_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_POOL_AFTER_TRANSACTION_EVENT,
  },
  "ALPHA-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "HASUI-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].HASUI_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].HASUI_SUI_POOL,
    investorId: conf[CONF_ENV].HASUI_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].HASUI_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].HASUI_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "USDT-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDT_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDT_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDT_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDT_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDT_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "USDY-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDY_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDY_WUSDC_POOL,
    investorId: conf[CONF_ENV].USDY_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDY_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDY_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDY_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDY_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDY_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].USDY_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "WUSDC-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WUSDC_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_SUI_POOL,
    investorId: conf[CONF_ENV].WUSDC_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WUSDC_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WUSDC_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "WETH-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WETH_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WETH_WUSDC_POOL,
    investorId: conf[CONF_ENV].WETH_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WETH_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WETH_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WETH_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "WUSDC-WBTC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WUSDC_WBTC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_WBTC_POOL,
    investorId: conf[CONF_ENV].WUSDC_WBTC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WUSDC_WBTC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WUSDC_WBTC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_WBTC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVX-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].NAVX_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].NAVX_SUI_POOL,
    investorId: conf[CONF_ENV].NAVX_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].NAVX_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "BUCK-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].BUCK_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].BUCK_WUSDC_POOL,
    investorId: conf[CONF_ENV].BUCK_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].BUCK_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCK_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCK_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCK_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCK_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].BUCK_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "CETUS-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].CETUS_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].CETUS_SUI_POOL,
    investorId: conf[CONF_ENV].CETUS_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].CETUS_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "ALPHA-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_WUSDC_POOL,
    investorId: conf[CONF_ENV].ALPHA_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "WSOL-WUSDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WSOL_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WSOL_WUSDC_POOL,
    investorId: conf[CONF_ENV].WSOL_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WSOL_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WSOL_WUSDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WSOL_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "FUD-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].FUD_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].FUD_SUI_POOL,
    investorId: conf[CONF_ENV].FUD_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].FUD_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].FUD_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].FUD_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].FUD_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].FUD_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BLUB-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].BLUB_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].BLUB_SUI_POOL,
    investorId: conf[CONF_ENV].BLUB_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].BLUB_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BLUB_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].BLUB_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BLUB_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BLUB_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "SCA-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].SCA_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].SCA_SUI_POOL,
    investorId: conf[CONF_ENV].SCA_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].SCA_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].SCA_SUI_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].SCA_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].SCA_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].SCA_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
};

export async function getInvestorPoolMap(): Promise<Map<string, PoolName>> {
  const investorIdToPoolNameMap = new Map<string, PoolName>();

  for (const poolName in poolInfo) {
    if (poolInfo.hasOwnProperty(poolName)) {
      const { investorId } = poolInfo[poolName];
      if (
        investorId !== undefined &&
        investorId !== null &&
        investorId !== ""
      ) {
        investorIdToPoolNameMap.set(investorId, poolName as PoolName);
      }
    }
  }

  return investorIdToPoolNameMap;
}

export const poolIdPoolNameMap = ((): {
  [key: string]: PoolName;
} => {
  const res: {
    [key: string]: PoolName;
  } = {};
  Object.entries(poolInfo).map(([poolName, info]) => {
    const poolId = info.poolId;
    res[poolId] = poolName as PoolName;
  });
  delete res[""]; //deletes unlaunched pools
  return res;
})();

export const coinNameTypeMap: { [key in CoinName]: CoinType } = {
  ALPHA: conf[CONF_ENV].ALPHA_COIN_TYPE as CoinType,
  SUI: "0x2::sui::SUI",
  WUSDC:
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
  VSUI: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
  NAVX: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
  SCA: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
  CETUS:
    "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  AFSUI:
    "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI",
  WETH: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
  APT: "0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN",
  WSOL: "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
  SLP: "0xc44d97a4bc4e5a33ca847b72b123172c88a6328196b71414f32c3070233604b2::slp::SLP",
  WBTC: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
  CELO: "0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN",
  TURBOS:
    "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS",
  HASUI:
    "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
  USDY: "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",
  BUCK: "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
  FUD: conf[CONF_ENV].FUD_COIN_TYPE as CoinType,
  BLUB: conf[CONF_ENV].BLUB_COIN_TYPE as CoinType,
  ETH: conf[CONF_ENV].ETH_COIN_TYPE as CoinType,
  DEEP: conf[CONF_ENV].DEEP_COIN_TYPE as CoinType,
  AUSD: conf[CONF_ENV].AUSD_COIN_TYPE as CoinType,
};

export const poolIdQueryPoolMap: { [key: string]: string } = {
  // alpha pool
  "0x6ee8f60226edf48772f81e5986994745dae249c2605a5b12de6602ef1b05b0c1":
    "alphaPool",
  // cetus pools
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiPool",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "wusdcUsdtPool",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyWusdcPool",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiWusdcPool",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethWusdcPool",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcWusdcPool",
  "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0":
    "navxSuiPool",
  // navi pools
  "0x643f84e0a33b19e2b511be46232610c6eb38e772931f582f019b8bbfb893ddb3":
    "suiPool",
  "0x0d9598006d37077b4935400f6525d7f1070784e2d6f04765d76ae0a4880f7d0a":
    "vsuiPool",
  "0xe4eef7d4d8cafa3ef90ea486ff7d1eec347718375e63f1f778005ae646439aad":
    "wethPool",
  "0xc696ca5b8f21a1f8fcd62cff16bbe5a396a4bed6f67909cfec8269eb16e60757":
    "usdtPool",
  "0x01493446093dfcdcfc6c16dc31ffe40ba9ac2e99a3f6c16a0d285bff861944ae":
    "wusdcPool",
};

export const poolIdQueryCetusPoolMap: { [key: string]: string } = {
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiCetusPool",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "wusdcUsdtCetusPool",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyWusdcCetusPool",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiWusdcCetusPool",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethWusdcCetusPool",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcWusdcCetusPool",
  "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0":
    "navxSuiCetusPool",
};

export const poolIdQueryInvestorMap: { [key: string]: string } = {
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiInvestor",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "wusdcUsdtInvestor",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyWusdcInvestor",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiWusdcInvestor",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethWusdcInvestor",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcWusdcInvestor",
  "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0":
    "navxSuiInvestor",
};

// Pagination needed for more than 50 pools
export async function getPoolExchangeRateMap(): Promise<Map<PoolName, string>> {
  const poolNameToConversionRateMap = new Map<PoolName, string>();

  const poolIds = Object.keys(poolIdPoolNameMap);
  const suiClient = getSuiClient();
  const res = await suiClient.multiGetObjects({
    ids: poolIds,
    options: {
      showContent: true,
    },
  });
  for (const poolRawData of res) {
    const poolDetails = poolRawData.data as PoolType | AlphaPoolType;
    const poolId = poolDetails.objectId;
    const xTokenSupply = new Decimal(poolDetails.content.fields.xTokenSupply);
    const tokensInvested = new Decimal(
      poolDetails.content.fields.tokensInvested,
    );
    const conversionRate =
      Number(xTokenSupply) !== 0
        ? tokensInvested.div(xTokenSupply).toString()
        : "0";
    poolNameToConversionRateMap.set(poolIdPoolNameMap[poolId], conversionRate);
  }

  // Looping pools
  const loopingPoolNames = Object.keys(poolInfo).filter(
    (poolName) => poolInfo[poolName].strategyType === "LOOPING",
  );
  const loopingPoolsMap: { [poolName: string]: PoolType } = {};
  res
    .filter((poolRawData) => {
      const poolDetails = poolRawData.data as PoolType | AlphaPoolType;
      const poolId = poolDetails.objectId;
      return poolInfo[poolIdPoolNameMap[poolId]].strategyType === "LOOPING"
        ? true
        : false;
    })
    .map((poolRawData) => {
      const poolDetails = poolRawData.data as PoolType | AlphaPoolType;
      const poolId = poolDetails.objectId;
      const poolName = poolIdPoolNameMap[poolId];
      loopingPoolsMap[poolName] = poolRawData.data as PoolType;
    });

  const naviInvestors = await multiGetNaviInvestor(
    loopingPoolNames as SingleAssetPoolNames[],
    false,
  );

  for (const poolName of loopingPoolNames) {
    const pool = loopingPoolsMap[poolName];
    const investor = naviInvestors[poolName as SingleAssetPoolNames];
    if (investor) {
      const liquidity = new Decimal(investor.content.fields.tokensDeposited);
      const debtToSupplyRatio = new Decimal(
        investor.content.fields.current_debt_to_supply_ratio,
      );
      const tokensInvested = liquidity.mul(
        new Decimal(1).minus(new Decimal(debtToSupplyRatio).div(1e20)),
      );
      const xTokenSupplyInPool = new Decimal(pool.content.fields.xTokenSupply);
      const exchangeRate = tokensInvested.div(xTokenSupplyInPool);
      poolNameToConversionRateMap.set(
        poolName as PoolName,
        exchangeRate.toString(),
      );
    } else {
      console.error("investor not found for poolName: ", poolName);
    }
  }

  return poolNameToConversionRateMap;
}

// Pagination needed for more than 50 pools
export async function getCetusSqrtPriceMap(): Promise<Map<PoolName, string>> {
  const poolNameToSqrtPriceMap = new Map<PoolName, string>();

  const cetusPools = Object.keys(poolInfo)
    .filter((poolName) => poolInfo[poolName].parentProtocolName === "CETUS")
    .map((poolName) => {
      return parentPoolMap[poolName];
    });
  const suiClient = getSuiClient();
  const res = await suiClient.multiGetObjects({
    ids: cetusPools,
    options: {
      showContent: true,
    },
  });
  for (const poolRawData of res) {
    const poolDetails = poolRawData.data as CetusPoolType;
    const poolId = poolDetails.objectId;
    const pool = Object.keys(parentPoolMap).find(
      (key) => parentPoolMap[key] === poolId,
    );
    const sqrtPrice = poolDetails.content.fields.current_sqrt_price;
    poolNameToSqrtPriceMap.set(pool as PoolName, sqrtPrice);
  }

  return poolNameToSqrtPriceMap;
}

// Pagination needed for more than 50 pools
export async function getCetusInvestorTicksMap(): Promise<{
  [pool in PoolName]?: { lower: string; upper: string };
}> {
  const investorIdToTicksMap: {
    [pool in PoolName]?: { lower: string; upper: string };
  } = {};

  const investorPoolMap = await getInvestorPoolMap();
  const investors = Array.from(investorPoolMap.keys());
  const suiClient = getSuiClient();
  const res = await suiClient.multiGetObjects({
    ids: investors,
    options: {
      showContent: true,
    },
  });
  for (const investorRawData of res) {
    const investorDetails = investorRawData.data as CetusInvestor;
    const lower_tick = investorDetails.content.fields.lower_tick;
    const upper_tick = investorDetails.content.fields.upper_tick;
    const pool = investorPoolMap.get(investorDetails.objectId) as string;
    investorIdToTicksMap[pool as PoolName] = {
      lower: lower_tick,
      upper: upper_tick,
    };
  }

  return investorIdToTicksMap;
}

export async function getTokenPriceMap(): Promise<Map<CoinName, string>> {
  const coinNameToPriceMap = new Map<CoinName, string>();

  const coinsSet = new Set<CoinName>(Object.values(poolCoinMap));
  Object.values(poolCoinPairMap).map(({ coinA: coin1, coinB: coin2 }) => {
    coinsSet.add(coin1);
    coinsSet.add(coin2);
  });
  const coins = Array.from(coinsSet);
  const pricePairs = coins.map((coinName) => {
    return `${coinName}/USD` as PythPriceIdPair;
  });
  const prices = await getLatestTokenPricePairs(pricePairs, false);
  Object.entries(prices).map(([pair, price]) => {
    const coin = pair.split("/")[0] as CoinName;
    if (price) {
      coinNameToPriceMap.set(coin, price);
    }
  });

  return coinNameToPriceMap;
}

export const parentPoolMap: { [key: string]: string } = (() => {
  const result: { [key: string]: string } = {};
  Object.entries(poolInfo).map(([poolName, info]) => {
    result[poolName] = info.parentPoolId;
  });
  return result;
})();

export const cetusPoolMap: { [key: string]: string } = (() => {
  const result: { [key: string]: string } = Object.fromEntries(
    Object.entries(parentPoolMap).filter(([poolName]) => {
      if (poolInfo[poolName].parentProtocolName === "CETUS") return true;
      return false;
    }),
  );
  return result;
})();

export const defunctPoolsSet = (() => {
  const defunctPools = conf[CONF_ENV].DEFUNCT_POOLS;
  return new Set<string>(defunctPools);
})();
