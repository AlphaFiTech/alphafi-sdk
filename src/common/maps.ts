import { conf, CONF_ENV } from "./constants.js";
import {
  AlphaPoolType,
  CetusInvestor,
  CetusPoolType,
  CoinName,
  CommonInvestorFields,
  DoubleAssetPoolNames,
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
import { coinsList } from "./coins.js";

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

export const doubleAssetPoolCoinMap: {
  [key in string]: { coin1: CoinName; coin2: CoinName };
} = {
  "USDT-WUSDC": { coin1: "USDT", coin2: "WUSDC" },
  "ALPHA-SUI": { coin1: "ALPHA", coin2: "SUI" },
  "HASUI-SUI": { coin1: "HASUI", coin2: "SUI" },
  "USDY-WUSDC": { coin1: "USDY", coin2: "WUSDC" },
  "WUSDC-SUI": { coin1: "WUSDC", coin2: "SUI" },
  "WETH-WUSDC": { coin1: "WETH", coin2: "WUSDC" },
  "WUSDC-WBTC": { coin1: "WUSDC", coin2: "WBTC" },
  "NAVX-SUI": { coin1: "NAVX", coin2: "SUI" },
  "BUCK-WUSDC": { coin1: "BUCK", coin2: "WUSDC" },
  "CETUS-SUI": { coin1: "CETUS", coin2: "SUI" },
  "ALPHA-WUSDC": { coin1: "ALPHA", coin2: "WUSDC" },
  "WSOL-WUSDC": { coin1: "WSOL", coin2: "WUSDC" },
  "SCA-SUI": { coin1: "SCA", coin2: "SUI" },
  "USDC-SUI": { coin1: "USDC", coin2: "SUI" },
  "USDC-USDT": { coin1: "USDC", coin2: "USDT" },
  "ALPHA-USDC": { coin1: "ALPHA", coin2: "USDC" },
  "USDC-WUSDC": { coin1: "USDC", coin2: "WUSDC" },
  "FUD-SUI": { coin1: "FUD", coin2: "SUI" },
  "USDC-ETH": { coin1: "USDC", coin2: "ETH" },
  "DEEP-SUI": { coin1: "DEEP", coin2: "SUI" },
  "BUCK-SUI": { coin1: "BUCK", coin2: "SUI" },
  "BLUEFIN-SUI-USDC": { coin1: "SUI", coin2: "USDC" },
  "BLUEFIN-USDT-USDC": { coin1: "USDT", coin2: "USDC" },
  "BLUEFIN-SUI-BUCK": { coin1: "SUI", coin2: "BUCK" },
  "BLUEFIN-AUSD-USDC": { coin1: "AUSD", coin2: "USDC" },
  "BLUEFIN-SUI-AUSD": { coin1: "SUI", coin2: "AUSD" },
  "BLUEFIN-ALPHA-USDC": { coin1: "ALPHA", coin2: "USDC" },
  "BLUEFIN-WBTC-USDC": { coin1: "WBTC", coin2: "USDC" },
  "BLUEFIN-NAVX-VSUI": { coin1: "NAVX", coin2: "VSUI" },
};

export const singleAssetPoolCoinMap: {
  [key in string]: { coin: CoinName };
} = {
  ALPHA: { coin: "ALPHA" },
  "NAVI-SUI": { coin: "SUI" },
  "NAVI-VSUI": { coin: "VSUI" },
  "NAVI-WETH": { coin: "WETH" },
  "NAVI-USDT": { coin: "USDT" },
  "NAVI-WUSDC": { coin: "WUSDC" },
  "NAVI-USDC": { coin: "USDC" },
  "NAVI-HASUI": { coin: "HASUI" },
  "NAVI-LOOP-SUI-VSUI": { coin: "VSUI" },
  "NAVI-LOOP-USDC-USDT": { coin: "USDC" },
  "BUCKET-BUCK": { coin: "BUCK" },
  "NAVI-USDY": { coin: "USDY" },
  "NAVI-AUSD": { coin: "AUSD" },
  "NAVI-ETH": { coin: "ETH" },
  "NAVI-LOOP-HASUI-SUI": { coin: "HASUI" },
  "NAVI-LOOP-USDT-USDC": { coin: "USDT" },
  "NAVI-NS": { coin: "NS" },
};

export const loopingPoolCoinMap: {
  [key in string]: { supplyCoin: CoinName; borrowCoin: CoinName };
} = {
  "NAVI-LOOP-HASUI-SUI": { supplyCoin: "HASUI", borrowCoin: "SUI" },
  "NAVI-LOOP-USDT-USDC": { supplyCoin: "USDT", borrowCoin: "USDC" },
  "NAVI-LOOP-SUI-VSUI": { supplyCoin: "VSUI", borrowCoin: "SUI" },
  "NAVI-LOOP-USDC-USDT": { supplyCoin: "USDC", borrowCoin: "USDT" },
};

export const naviAssetMap: {
  [key in string]: string;
} = {
  SUI: "0",
  WUSDC: "1",
  USDT: "2",
  WETH: "3",
  CETUS: "4",
  VSUI: "5",
  HASUI: "6",
  NAVX: "7",
  USDC: "10",
  USDY: "12",
  AUSD: "9",
  ETH: "11",
  NS: "13",
};

export const cetusPoolMap: { [key: string]: string } = {
  "WUSDC-SUI": conf[CONF_ENV].WUSDC_SUI_CETUS_POOL_ID,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
  "USDC-USDT": conf[CONF_ENV].USDC_USDT_CETUS_POOL_ID,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_CETUS_POOL_ID,
  "USDT-WUSDC": conf[CONF_ENV].USDT_WUSDC_CETUS_POOL_ID,
  "USDY-WUSDC": conf[CONF_ENV].USDY_WUSDC_CETUS_POOL_ID,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_CETUS_POOL_ID,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
  "WETH-WUSDC": conf[CONF_ENV].WETH_WUSDC_CETUS_POOL_ID,
  "WUSDC-WBTC": conf[CONF_ENV].WUSDC_WBTC_CETUS_POOL_ID,
  "VSUI-SUI": conf[CONF_ENV].VSUI_SUI_CETUS_POOL_ID,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_CETUS_POOL_ID,
  "WUSDC-CETUS": conf[CONF_ENV].WUSDC_CETUS_CETUS_POOL_ID,
  "BUCK-WUSDC": conf[CONF_ENV].BUCK_WUSDC_CETUS_POOL_ID,
  "ALPHA-WUSDC": conf[CONF_ENV].ALPHA_WUSDC_CETUS_POOL_ID,
  "WSOL-WUSDC": conf[CONF_ENV].WSOL_WUSDC_CETUS_POOL_ID,
  "SCA-SUI": conf[CONF_ENV].SCA_SUI_CETUS_POOL_ID,
  "ALPHA-USDC": conf[CONF_ENV].ALPHA_USDC_CETUS_POOL_ID,
  "USDC-WUSDC": conf[CONF_ENV].USDC_WUSDC_CETUS_POOL_ID,
  "FUD-SUI": conf[CONF_ENV].FUD_SUI_CETUS_POOL_ID,
  "USDC-ETH": conf[CONF_ENV].USDC_ETH_CETUS_POOL_ID,
  "DEEP-SUI": conf[CONF_ENV].DEEP_SUI_CETUS_POOL_ID,
  "BUCK-SUI": conf[CONF_ENV].BUCK_SUI_CETUS_POOL_ID,
  "USDC-BUCK": conf[CONF_ENV].USDC_BUCK_CETUS_POOL_ID,
  "USDC-AUSD": conf[CONF_ENV].USDC_AUSD_CETUS_POOL_ID,
  "NS-SUI": conf[CONF_ENV].NS_SUI_CETUS_POOL_ID,
  "AUSD-SUI": conf[CONF_ENV].AUSD_SUI_CETUS_POOL_ID,
  USDC_WBTC: conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
  "NAVX-VSUI": conf[CONF_ENV].NAVX_VSUI_CETUS_POOL_ID,
};

export const bluefinPoolMap: { [key: string]: string } = {
  "SUI-USDC": conf[CONF_ENV].BLUEFIN_SUI_USDC_POOL,
  "DEEP-SUI": conf[CONF_ENV].BLUEFIN_DEEP_SUI_POOL,
  "USDT-USDC": conf[CONF_ENV].BLUEFIN_USDT_USDC_POOL,
  "SUI-BUCK": conf[CONF_ENV].BLUEFIN_SUI_BUCK_POOL,
  "AUSD-USDC": conf[CONF_ENV].BLUEFIN_AUSD_USDC_POOL,
  "SUI-AUSD": conf[CONF_ENV].BLUEFIN_SUI_AUSD_POOL,
  "ALPHA-USDC": conf[CONF_ENV].BLUEFIN_ALPHA_USDC_POOL,
  "WBTC-USDC": conf[CONF_ENV].BLUEFIN_WBTC_USDC_POOL,
  "NAVX-VSUI": conf[CONF_ENV].BLUEFIN_NAVX_VSUI_POOL,
};

export const loopingAccountAddresses: { [key: string]: string } = {
  "NAVI-LOOP-USDC-USDT": conf[CONF_ENV].NAVI_USDC_USDT_LOOP_ACCOUNT_ADDRESS,
  "NAVI-LOOP-USDT-USDC": conf[CONF_ENV].NAVI_USDT_USDC_LOOP_ACCOUNT_ADDRESS,
  "NAVI-LOOP-SUI-VSUI": conf[CONF_ENV].NAVI_SUI_VSUI_LOOP_ACCOUNT_ADDRESS,
  "NAVI-LOOP-HASUI-SUI": conf[CONF_ENV].NAVI_HASUI_SUI_LOOP_ACCOUNT_ADDRESS,
};

export const poolInfo: {
  [key: string]: {
    packageId: string;
    packageNumber: number;
    parentProtocolName: string;
    parentPoolId: string;
    poolId: string;
    investorId: string;
    receiptName: string;
    receiptType: PoolReceipt;
    numberOfAssets: number;
    autoCompoundingEventType: string;
    rebalanceEventType: string | undefined;
    liquidityChangeEventType: string;
    withdrawV2EventType?: string;
    afterTransactionEventType?: string;
    strategyType?: StrategyType;
    checkRatioEventType?: string;
  };
} = {
  "BLUEFIN-NAVX-VSUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_NAVX_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-SUI-AUSD": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUI_AUSD_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-ALPHA-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_ALPHA_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-WBTC-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_WBTC_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "NAVI-NS": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_NS_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_NS_POOL,
    investorId: conf[CONF_ENV].NAVI_NS_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_NS_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_NS_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_NS_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_NS_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BLUEFIN-AUSD-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_AUSD_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-SUI-BUCK": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUI_BUCK_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "NAVI-LOOP-USDT-USDC": {
    packageId: conf[CONF_ENV].ALPHA_5_LATEST_PACKAGE_ID,
    packageNumber: 5,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_USDT_USDC_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_USDT_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDT_USDC_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_USDT_USDC_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_CHECK_RATIO_EVENT,
  },
  "BLUEFIN-USDT-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_USDT_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-SUI-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "NAVI-LOOP-HASUI-SUI": {
    packageId: conf[CONF_ENV].ALPHA_2_LATEST_PACKAGE_ID,
    packageNumber: 2,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_HASUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_HASUI_SUI_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_HASUI_SUI_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_CHECK_RATIO_EVENT,
  },
  "NAVI-USDY": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDY_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDY_POOL,
    investorId: conf[CONF_ENV].NAVI_USDY_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDY_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDY_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-AUSD": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_AUSD_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_AUSD_POOL,
    investorId: conf[CONF_ENV].NAVI_AUSD_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_AUSD_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_AUSD_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-ETH": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_ETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_ETH_POOL,
    investorId: conf[CONF_ENV].NAVI_ETH_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_ETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_ETH_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BUCKET-BUCK": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "BUCKET",
    parentPoolId: conf[CONF_ENV].BUCKET_PROTOCOL,
    poolId: conf[CONF_ENV].BUCKET_BUCK_POOL,
    investorId: conf[CONF_ENV].BUCKET_BUCK_INVESTOR,
    receiptName: conf[CONF_ENV].BUCKET_BUCK_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCKET_BUCK_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCKET_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "BUCK-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].BUCK_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].BUCK_SUI_POOL,
    investorId: conf[CONF_ENV].BUCK_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].BUCK_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCK_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCK_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-ETH": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_ETH_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_ETH_POOL,
    investorId: conf[CONF_ENV].USDC_ETH_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_ETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_ETH_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_ETH_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "DEEP-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].DEEP_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].DEEP_SUI_POOL,
    investorId: conf[CONF_ENV].DEEP_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].DEEP_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].DEEP_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].DEEP_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "ALPHA-USDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHA_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_USDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_WUSDC_POOL,
    investorId: conf[CONF_ENV].USDC_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_WUSDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_SUI_POOL,
    investorId: conf[CONF_ENV].USDC_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-USDT": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_USDT_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDC_USDT_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_USDT_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_USDT_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_USDT_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-USDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDC_POOL,
    investorId: conf[CONF_ENV].NAVI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "NAVI-LOOP-USDC-USDT": {
    packageId: conf[CONF_ENV].ALPHA_2_LATEST_PACKAGE_ID,
    packageNumber: 2,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_USDC_USDT_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_USDC_USDT_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDC_USDT_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_USDC_USDT_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_CHECK_RATIO_EVENT,
  },
  "NAVI-LOOP-SUI-VSUI": {
    packageId: conf[CONF_ENV].ALPHA_2_LATEST_PACKAGE_ID,
    packageNumber: 2,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_LOOP_SUI_VSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_SUI_VSUI_LOOP_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_CHECK_RATIO_EVENT,
  },
  "NAVI-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_SUI_POOL,
    investorId: conf[CONF_ENV].NAVI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-VSUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_VSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-WETH": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_WETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_WETH_POOL,
    investorId: conf[CONF_ENV].NAVI_WETH_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-USDT": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDT_POOL,
    investorId: conf[CONF_ENV].NAVI_USDT_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVI-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_WUSDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_WUSDC_POOL,
    investorId: conf[CONF_ENV].NAVI_WUSDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_WUSDC_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  // "NAVI-HASUI": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "NAVI",
  //   parentPoolId: conf[CONF_ENV].NAVI_HASUI_POOL,
  //   poolId: conf[CONF_ENV].ALPHAFI_NAVI_HASUI_POOL,
  //   investorId: conf[CONF_ENV].NAVI_HASUI_INVESTOR,
  //   receiptName: conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].NAVI_HASUI_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: undefined,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].NAVI_HASUI_POOL_LIQUIDITY_CHANGE_EVENT,
  //   afterTransactionEventType:
  //     conf[CONF_ENV].NAVI_HASUI_POOL_AFTER_TRANSACTION_EVENT,
  // },
  ALPHA: {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "ALPHAFI",
    parentPoolId: conf[CONF_ENV].ALPHA_POOL,
    poolId: conf[CONF_ENV].ALPHA_POOL,
    investorId: conf[CONF_ENV].ALPHA_POOL,
    receiptName: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_POOL_RECEIPT,
    numberOfAssets: 1,
    autoCompoundingEventType: conf[CONF_ENV].ALPHA_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType: conf[CONF_ENV].ALPHA_POOL_LIQUIDITY_CHANGE_EVENT,
    withdrawV2EventType: conf[CONF_ENV].ALPHA_POOL_WITHDRAW_V2_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_POOL_AFTER_TRANSACTION_EVENT,
  },
  "ALPHA-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  // "HASUI-SUI": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "CETUS",
  //   parentPoolId: conf[CONF_ENV].HASUI_SUI_CETUS_POOL_ID,
  //   poolId: conf[CONF_ENV].HASUI_SUI_POOL,
  //   investorId: conf[CONF_ENV].HASUI_SUI_CETUS_INVESTOR,
  //   receiptName: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: conf[CONF_ENV].HASUI_SUI_POOL_REBALANCE_EVENT,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  //   afterTransactionEventType:
  //     conf[CONF_ENV].HASUI_SUI_POOL_AFTER_TRANSACTION_EVENT,
  // },
  "USDT-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDT_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDT_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDT_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDT_WUSDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDT_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  // "USDY-WUSDC": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "CETUS",
  //   parentPoolId: conf[CONF_ENV].USDY_WUSDC_CETUS_POOL_ID,
  //   poolId: conf[CONF_ENV].USDY_WUSDC_POOL,
  //   investorId: conf[CONF_ENV].USDY_WUSDC_CETUS_INVESTOR,
  //   receiptName: conf[CONF_ENV].USDY_WUSDC_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].USDY_WUSDC_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].USDY_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: conf[CONF_ENV].USDY_WUSDC_POOL_REBALANCE_EVENT,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].USDY_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  //   afterTransactionEventType:
  //     conf[CONF_ENV].USDY_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  // },
  "WUSDC-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WUSDC_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_SUI_POOL,
    investorId: conf[CONF_ENV].WUSDC_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WUSDC_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WUSDC_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  "WETH-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WETH_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WETH_WUSDC_POOL,
    investorId: conf[CONF_ENV].WETH_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WETH_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WETH_WUSDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WETH_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "WUSDC-WBTC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WUSDC_WBTC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WUSDC_WBTC_POOL,
    investorId: conf[CONF_ENV].WUSDC_WBTC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WUSDC_WBTC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WUSDC_WBTC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_WBTC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AFTER_TRANSACTION_EVENT,
  },
  "NAVX-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].NAVX_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].NAVX_SUI_POOL,
    investorId: conf[CONF_ENV].NAVX_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].NAVX_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AFTER_TRANSACTION_EVENT,
  },
  // "BUCK-WUSDC": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "CETUS",
  //   parentPoolId: conf[CONF_ENV].BUCK_WUSDC_CETUS_POOL_ID,
  //   poolId: conf[CONF_ENV].BUCK_WUSDC_POOL,
  //   investorId: conf[CONF_ENV].BUCK_WUSDC_CETUS_INVESTOR,
  //   receiptName: conf[CONF_ENV].BUCK_WUSDC_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].BUCK_WUSDC_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].BUCK_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: conf[CONF_ENV].BUCK_WUSDC_POOL_REBALANCE_EVENT,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].BUCK_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  //   afterTransactionEventType:
  //     conf[CONF_ENV].BUCK_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
  // },
  "CETUS-SUI": {
    packageId: conf[CONF_ENV].ALPHA_2_LATEST_PACKAGE_ID,
    packageNumber: 2,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].CETUS_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].CETUS_SUI_POOL,
    investorId: conf[CONF_ENV].CETUS_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].CETUS_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "ALPHA-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_WUSDC_POOL,
    investorId: conf[CONF_ENV].ALPHA_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_WUSDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "WSOL-WUSDC": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WSOL_WUSDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WSOL_WUSDC_POOL,
    investorId: conf[CONF_ENV].WSOL_WUSDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WSOL_WUSDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WSOL_WUSDC_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WSOL_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "FUD-SUI": {
    packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
    packageNumber: 1,
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].FUD_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].FUD_SUI_POOL,
    investorId: conf[CONF_ENV].FUD_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].FUD_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].FUD_SUI_POOL_RECEIPT,
    numberOfAssets: 2,
    autoCompoundingEventType:
      conf[CONF_ENV].FUD_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].FUD_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].FUD_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  // "BLUB-SUI": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "CETUS",
  //   parentPoolId: conf[CONF_ENV].BLUB_SUI_CETUS_POOL_ID,
  //   poolId: conf[CONF_ENV].BLUB_SUI_POOL,
  //   investorId: conf[CONF_ENV].BLUB_SUI_CETUS_INVESTOR,
  //   receiptName: conf[CONF_ENV].BLUB_SUI_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].BLUB_SUI_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].BLUB_SUI_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: conf[CONF_ENV].BLUB_SUI_POOL_REBALANCE_EVENT,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].BLUB_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  // },
  // "SCA-SUI": {
  //   packageId: conf[CONF_ENV].ALPHA_LATEST_PACKAGE_ID,
  //   packageNumber: 1,
  //   parentProtocolName: "CETUS",
  //   parentPoolId: conf[CONF_ENV].SCA_SUI_CETUS_POOL_ID,
  //   poolId: conf[CONF_ENV].SCA_SUI_POOL,
  //   investorId: conf[CONF_ENV].SCA_SUI_CETUS_INVESTOR,
  //   receiptName: conf[CONF_ENV].SCA_SUI_POOL_RECEIPT_NAME,
  //   receiptType: conf[CONF_ENV].SCA_SUI_POOL_RECEIPT,
  //   autoCompoundingEventType:
  //     conf[CONF_ENV].SCA_SUI_POOL_AUTO_COMPOUNDING_EVENT,
  //   rebalanceEventType: conf[CONF_ENV].SCA_SUI_POOL_REBALANCE_EVENT,
  //   liquidityChangeEventType:
  //     conf[CONF_ENV].SCA_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
  // },
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
  const singleAsset = singleAssetPoolCoinMap[poolName];
  const doubleAsset = doubleAssetPoolCoinMap[poolName];
  if (singleAsset) {
    return singleAsset.coin;
  }
  if (doubleAsset) {
    return { coinA: doubleAsset.coin1, coinB: doubleAsset.coin2 };
  }
  console.error("poolName: ", poolName);
  throw new Error("Pool not found in poolCoinMap or poolCoinPairMap");
}

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
// DEPRECATED
export async function getCetusSqrtPriceMap(): Promise<Map<PoolName, string>> {
  const sqrtPriceMap = await getLiquidityPoolSqrtPriceMap();
  return sqrtPriceMap;
}

// Pagination needed for more than 50 pools
// DEPRECATED
export async function getCetusInvestorTicksMap(): Promise<{
  [pool in PoolName]?: { lower: string; upper: string };
}> {
  const investorTicksMap = getLiquidityPoolInvestorTicksMap();
  return investorTicksMap;
}

export async function getLiquidityPoolSqrtPriceMap(): Promise<
  Map<DoubleAssetPoolNames, string>
> {
  const poolNameToSqrtPriceMap = new Map<DoubleAssetPoolNames, string>();

  const liquidityPools = Object.keys(poolInfo)
    .filter((poolName) =>
      ["CETUS", "BLUEFIN"].includes(poolInfo[poolName].parentProtocolName),
    )
    .map((poolName) => parentPoolMap[poolName]);
  const suiClient = getSuiClient();
  const res = await suiClient.multiGetObjects({
    ids: liquidityPools,
    options: {
      showContent: true,
    },
  });
  for (const poolRawData of res) {
    const poolDetails = poolRawData.data as CetusPoolType; // BLUEFIN pool type same as cetus pool type
    const poolId = poolDetails.objectId;
    const poolName = Object.keys(parentPoolMap).find(
      (key) => parentPoolMap[key] === poolId,
    );
    const sqrtPrice = poolDetails.content.fields.current_sqrt_price;
    poolNameToSqrtPriceMap.set(poolName as DoubleAssetPoolNames, sqrtPrice);
  }
  return poolNameToSqrtPriceMap;
}

export async function getLiquidityPoolInvestorTicksMap(): Promise<{
  [pool in DoubleAssetPoolNames]?: { lower: string; upper: string };
}> {
  const investorIdToTicksMap: {
    [pool in DoubleAssetPoolNames]?: { lower: string; upper: string };
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
    const investorDetails = investorRawData.data as unknown as CetusInvestor &
      CommonInvestorFields; // BLUEFIN investor same as cetus investor
    const lower_tick = investorDetails.content.fields.lower_tick;
    const upper_tick = investorDetails.content.fields.upper_tick;
    const pool = investorPoolMap.get(investorDetails.objectId) as string;
    investorIdToTicksMap[pool as DoubleAssetPoolNames] = {
      lower: lower_tick,
      upper: upper_tick,
    };
  }

  return investorIdToTicksMap;
}

export async function getTokenPriceMap(): Promise<Map<CoinName, string>> {
  const coinNameToPriceMap = new Map<CoinName, string>();
  const coins = Object.keys(coinsList);
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

export const defunctPoolsSet = (() => {
  const defunctPools = conf[CONF_ENV].DEFUNCT_POOLS;
  return new Set<string>(defunctPools);
})();
