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
  "SUIUSDT",
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
  "BLUEFIN-BLUE-SUI": { coin1: "BLUE", coin2: "SUI" },
  "BLUEFIN-BLUE-USDC": { coin1: "BLUE", coin2: "USDC" },
  "BLUEFIN-SEND-USDC": { coin1: "SEND", coin2: "USDC" },
  "BLUEFIN-WBTC-SUI": { coin1: "WBTC", coin2: "SUI" },
  "BLUEFIN-DEEP-SUI": { coin1: "DEEP", coin2: "SUI" },
  "BLUEFIN-STSUI-SUI": { coin1: "STSUI", coin2: "SUI" },
  "BLUEFIN-STSUI-USDC": { coin1: "STSUI", coin2: "USDC" },
  "BLUEFIN-STSUI-ETH": { coin1: "STSUI", coin2: "ETH" },
  "BLUEFIN-STSUI-WSOL": { coin1: "STSUI", coin2: "WSOL" },
  "BLUEFIN-ALPHA-STSUI": { coin1: "ALPHA", coin2: "STSUI" },
  "BLUEFIN-AUTOBALANCE-USDT-USDC": { coin1: "USDT", coin2: "USDC" },
  "BLUEFIN-AUTOBALANCE-SUI-USDC": { coin1: "SUI", coin2: "USDC" },
  "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC": { coin1: "SUIUSDT", coin2: "USDC" },
  "BLUEFIN-SUIUSDT-USDC": { coin1: "SUIUSDT", coin2: "USDC" },
  "BLUEFIN-AUTOBALANCE-DEEP-BLUE": { coin1: "DEEP", coin2: "BLUE" },
  "BLUEFIN-AUTOBALANCE-DEEP-SUI": { coin1: "DEEP", coin2: "SUI" },
  "BLUEFIN-AUTOBALANCE-BLUE-SUI": { coin1: "BLUE", coin2: "SUI" },
  "BLUEFIN-STSUI-BUCK": { coin1: "STSUI", coin2: "BUCK" },
  "BLUEFIN-STSUI-MUSD": { coin1: "STSUI", coin2: "MUSD" },
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
  "NAVI-NAVX": { coin: "NAVX" },
  "NAVI-STSUI": { coin: "STSUI" },
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
  STSUI: "20",
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
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
  "NAVX-VSUI": conf[CONF_ENV].NAVX_VSUI_CETUS_POOL_ID,
  "BLUE-SUI": conf[CONF_ENV].BLUE_SUI_CETUS_POOL_ID,
  "BLUE-USDC": conf[CONF_ENV].BLUE_USDC_CETUS_POOL_ID,
  "USDC-SEND": conf[CONF_ENV].USDC_SEND_CETUS_POOL_ID,
  "WBTC-SUI": conf[CONF_ENV].WBTC_SUI_CETUS_POOL_ID,
  "STSUI-SUI": conf[CONF_ENV].STSUI_SUI_CETUS_POOL_ID,
  // "USDC-STSUI": conf[CONF_ENV].USDC_STSUI_CETUS_POOL_ID,
  // "STSUI-ETH": conf[CONF_ENV].STSUI_ETH_CETUS_POOL_ID,
  // "STSUI-WSOL": conf[CONF_ENV].STSUI_WSOL_CETUS_POOL_ID,
  "USDC-SUIUSDT": conf[CONF_ENV].USDC_SUIUSDT_CETUS_POOL_ID,
  "BLUE-DEEP": conf[CONF_ENV].BLUE_DEEP_CETUS_POOL_ID,
  "ETH-SUI": conf[CONF_ENV].ETH_SUI_CETUS_POOL_ID,
  "WSOL-SUI": conf[CONF_ENV].WSOL_SUI_CETUS_POOL_ID,
  "MUSD-SUI": conf[CONF_ENV].MUSD_SUI_CETUS_POOL_ID,
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
  "BLUE-SUI": conf[CONF_ENV].BLUEFIN_BLUE_SUI_POOL,
  "BLUE-USDC": conf[CONF_ENV].BLUEFIN_BLUE_USDC_POOL,
  "BLUE-SUI-AUTOCOMPOUND": conf[CONF_ENV].BLUEFIN_BLUE_SUI_POOL_AUTOCOMPOUND,
  "SEND-USDC": conf[CONF_ENV].BLUEFIN_SEND_USDC_POOL,
  "WBTC-SUI": conf[CONF_ENV].BLUEFIN_WBTC_SUI_POOL,
  "STSUI-SUI": conf[CONF_ENV].BLUEFIN_STSUI_SUI_POOL,
  "STSUI-USDC": conf[CONF_ENV].BLUEFIN_STSUI_USDC_POOL,
  "STSUI-ETH": conf[CONF_ENV].BLUEFIN_STSUI_ETH_POOL,
  "STSUI-WSOL": conf[CONF_ENV].BLUEFIN_STSUI_WSOL_POOL,
  "ALPHA-STSUI": conf[CONF_ENV].BLUEFIN_ALPHA_STSUI_POOL,
  "SUI-ALPHA": conf[CONF_ENV].BLUEFIN_SUI_ALPHA_POOL,
  "SUIUSDT-USDC": conf[CONF_ENV].BLUEFIN_SUIUSDT_USDC_POOL,
  "DEEP-BLUE": conf[CONF_ENV].BLUEFIN_DEEP_BLUE_POOL,
  "SUI-ETH": conf[CONF_ENV].BLUEFIN_SUI_ETH_POOL,
  "SUI-WSOL": conf[CONF_ENV].BLUEFIN_SUI_WSOL_POOL,
  "SUI-MUSD": conf[CONF_ENV].BLUEFIN_SUI_MUSD_POOL,
  "STSUI-MUSD": conf[CONF_ENV].BLUEFIN_STSUI_MUSD_POOL,
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
    assetTypes: string[];
    autoCompoundingEventType: string;
    rebalanceEventType: string | undefined;
    liquidityChangeEventType: string;
    withdrawV2EventType?: string;
    afterTransactionEventType?: string;
    strategyType?: StrategyType;
    checkRatioEventType?: string;
    imageUrl1?: string | undefined;
    imageUrl2?: string | undefined;
    lockIcon?: string | undefined;
  };
} = {
  "BLUEFIN-STSUI-MUSD": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_MUSD_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, coinsList["MUSD"].type],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_MUSD_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-STSUI-BUCK": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_BUCK_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, conf[CONF_ENV].BUCK_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "NAVI-STSUI": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_STSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_STSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_STSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_STSUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_STSUI_POOL_RECEIPT,
    assetTypes: [coinsList["STSUI"].type],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_STSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_STSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/navi_token.svg",
  },
  "BLUEFIN-AUTOBALANCE-DEEP-SUI": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_DEEP_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_RECEIPT,
    assetTypes: [coinsList["DEEP"].type, coinsList["SUI"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
  },
  "BLUEFIN-AUTOBALANCE-BLUE-SUI": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_BLUE_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_RECEIPT,
    assetTypes: [coinsList["BLUE"].type, coinsList["SUI"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_BLUE_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
  },
  "BLUEFIN-AUTOBALANCE-DEEP-BLUE": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_DEEP_BLUE_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_RECEIPT,
    assetTypes: [coinsList["DEEP"].type, coinsList["BLUE"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_DEEP_BLUE_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
  },
  "BLUEFIN-SUIUSDT-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUIUSDT_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_RECEIPT,
    assetTypes: [coinsList["SUIUSDT"].type, coinsList["USDC"].type],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUIUSDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-AUTOBALANCE-SUIUSDT-USDC": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUIUSDT_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_POOL,
    investorId:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_RECEIPT_NAME,
    receiptType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_RECEIPT,
    assetTypes: [coinsList["SUIUSDT"].type, coinsList["USDC"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_SUIUSDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
  },
  "BLUEFIN-AUTOBALANCE-SUI-USDC": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SUI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_RECEIPT,
    assetTypes: [coinsList["SUI"].type, coinsList["USDC"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC_IC.png",
  },
  "BLUEFIN-AUTOBALANCE-USDT-USDC": {
    packageId: conf[CONF_ENV].ALPHA_BLUEFIN_AUTOBALANCE_LATEST_PACKAGE_ID,
    packageNumber: 7,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_USDT_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_INVESTOR,
    receiptName:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_RECEIPT,
    assetTypes: [coinsList["USDT"].type, coinsList["USDC"].type],
    autoCompoundingEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV]
        .ALPHAFI_BLUEFIN_AUTOBALANCE_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "AUTOBALANCE-LIQUIDITY-POOL",
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDT.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC_IC.png",
  },
  "BLUEFIN-ALPHA-STSUI": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_ALPHA_STSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_RECEIPT,
    assetTypes: [coinsList["ALPHA"].type, coinsList["STSUI"].type],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_STSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/stsui.svg",
  },
  "BLUEFIN-STSUI-WSOL": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_WSOL_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, conf[CONF_ENV].WSOL_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_WSOL_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-STSUI-ETH": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_ETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, conf[CONF_ENV].ETH_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
  },
  "BLUEFIN-STSUI-USDC": {
    packageId: conf[CONF_ENV].ALPHA_STSUI_LATEST_PACKAGE_ID,
    packageNumber: 6,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, conf[CONF_ENV].USDC_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/stsui.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
  },
  "BLUEFIN-STSUI-SUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_STSUI_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_RECEIPT,
    assetTypes: [coinsList["STSUI"].type, conf[CONF_ENV].SUI_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_STSUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/stsui.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
  },
  "BLUEFIN-DEEP-SUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_DEEP_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_RECEIPT,
    assetTypes: [conf[CONF_ENV].DEEP_COIN_TYPE, conf[CONF_ENV].SUI_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/deep.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
  },
  "BLUEFIN-WBTC-SUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_WBTC_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_RECEIPT,
    assetTypes: [conf[CONF_ENV].WBTC_COIN_TYPE, conf[CONF_ENV].SUI_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/BTCB.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
  },
  "BLUEFIN-SEND-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_SEND_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_RECEIPT,
    assetTypes: [conf[CONF_ENV].SEND_COIN_TYPE, conf[CONF_ENV].USDC_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SEND_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "", // add send image here
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
  },
  "BLUEFIN-BLUE-SUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_BLUE_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_RECEIPT,
    assetTypes: [conf[CONF_ENV].BLUE_COIN_TYPE, conf[CONF_ENV].SUI_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/send.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
  },
  "BLUEFIN-BLUE-USDC": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_BLUE_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_RECEIPT,
    assetTypes: [conf[CONF_ENV].BLUE_COIN_TYPE, conf[CONF_ENV].USDC_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_BLUE_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/send.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
  },
  "NAVI-NAVX": {
    packageId: conf[CONF_ENV].ALPHA_3_LATEST_PACKAGE_ID,
    packageNumber: 3,
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_NAVX_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_NAVX_POOL,
    investorId: conf[CONF_ENV].NAVI_NAVX_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_NAVX_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_NAVX_POOL_RECEIPT,
    assetTypes: [conf[CONF_ENV].NAVX_COIN_TYPE],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_NAVX_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_NAVX_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/navi_token.svg",
  },
  "BLUEFIN-NAVX-VSUI": {
    packageId: conf[CONF_ENV].ALPHA_4_LATEST_PACKAGE_ID,
    packageNumber: 4,
    parentProtocolName: "BLUEFIN",
    parentPoolId: conf[CONF_ENV].BLUEFIN_NAVX_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL,
    investorId: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_RECEIPT,
    assetTypes: [
      "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
      "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_NAVX_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/vsui.png",
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
    assetTypes: [
      "0x2::sui::SUI",
      "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/ausd.png",
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
    assetTypes: [
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_WBTC_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/BTCB.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_NS_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_NS_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/ns.svg",
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
    assetTypes: [
      "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_AUSD_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/ausd.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0x2::sui::SUI",
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/buck.svg",
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
    assetTypes: [
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_USDT_USDC_POOL_CHECK_RATIO_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDT.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDT.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0x2::sui::SUI",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHAFI_BLUEFIN_SUI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    // add strategy type
    imageUrl1: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_HASUI_SUI_POOL_CHECK_RATIO_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/hasui.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDY_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/usdy.svg",
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
    assetTypes: [
      "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_AUSD_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/ausd.png",
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
    assetTypes: [
      "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/eth 2.png",
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
    assetTypes: [
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCKET_BUCK_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCKET_BUCK_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/bucket_protocol.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/buck.svg",
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
    assetTypes: [
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCK_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCK_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/buck.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_ETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_ETH_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_ETH_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDC.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/eth 2.png",
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
    assetTypes: [
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].DEEP_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].DEEP_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/deep.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDC.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDC.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_USDT_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDC.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDT.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDC.svg",
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
    assetTypes: [
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_USDC_USDT_POOL_CHECK_RATIO_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDC.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDT.svg",
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
    assetTypes: ["0x2::sui::SUI"],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    strategyType: "LOOPING",
    checkRatioEventType:
      conf[CONF_ENV].NAVI_LOOP_SUI_VSUI_POOL_CHECK_RATIO_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/vsui.png",
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
    assetTypes: ["0x2::sui::SUI"],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_SUI_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_VSUI_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/vsui.png",
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
    assetTypes: [
      "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WETH_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_USDT_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/USDT.svg",
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
    assetTypes: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVI_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
    ],
    autoCompoundingEventType: conf[CONF_ENV].ALPHA_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: undefined,
    liquidityChangeEventType: conf[CONF_ENV].ALPHA_POOL_LIQUIDITY_CHANGE_EVENT,
    withdrawV2EventType: conf[CONF_ENV].ALPHA_POOL_WITHDRAW_V2_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    lockIcon: "https://images.alphafi.xyz/adminweb/lock.svg",
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
    assetTypes: [
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].ALPHA_SUI_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDT_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].USDT_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/USDT.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_SUI_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
    imageUrl1: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WETH_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WETH_WUSDC_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/weth.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      "0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WUSDC_WBTC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].WUSDC_WBTC_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/BTCB.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].NAVX_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    afterTransactionEventType:
      conf[CONF_ENV].NAVX_SUI_POOL_AFTER_TRANSACTION_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/navi_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].CETUS_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].CETUS_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/cetus_token.svg",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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
    assetTypes: [
      "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].ALPHA_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].ALPHA_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/logo192.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WSOL_WUSDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WSOL_WUSDC_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/wsol.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/wusdc.svg",
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
    assetTypes: [
      "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD",
      "0x2::sui::SUI",
    ],
    autoCompoundingEventType:
      conf[CONF_ENV].FUD_SUI_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].FUD_SUI_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].FUD_SUI_POOL_LIQUIDITY_CHANGE_EVENT,
    imageUrl1: "https://images.alphafi.xyz/adminweb/fud.png",
    imageUrl2: "https://images.alphafi.xyz/adminweb/sui-logo1.svg",
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

export function getInvestorPoolMap(): Map<string, PoolName> {
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

export const ignoredWalletsForDailyRevenue = [
  "0x86ea77da52e41820e21f525a497a3d3760c41410bb76da121547a5ff674dec50",
  "0xee5360c5fa13555cbf355cb5015b865d742040e42ff90c324e11f0c63e504545",
  "0x3ce65c03642dfea704a031b28fffc850a6e3def8ee126ccc3a209f5314986279",
  conf[CONF_ENV].TREASURY_ADDRESS,
  "0xb0615e458f9b5f6e563515fa5192d1311fbc7fd4f93025b327510fbf72bc5c20",
  "0x5a9fac4148605191b8e0de25a6671ba8008c344c1558bbaac73a947bd6c903b1",
  "0x6b3a7df97bcad34c277106fef70444fa26e2bfbcd711c9c26f824869a66bb70a",
  "0xff9c536c8f78e28ad4c9f0d916ea98980c3c3be32b91461eaa8fbd6ac0b737aa",
  "0x6a498c57c18306e0af942442a5d20e5b2940939b4937ed52f4b17e3fa99972f5",
  "0xbdaee7c803e5db14b6571d78d05e152057b72bace936566b8403b760d5d228e8",
];
