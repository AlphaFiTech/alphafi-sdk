import { conf, CONF_ENV } from "./constants";
import {
  AlphaPoolType,
  CetusInvestor,
  CetusPoolType,
  CoinName,
  CoinType,
  ParentProtocolName,
  PoolName,
  PoolReceipt,
  PoolType,
} from "./types";
import { PythPriceIdPair } from "./pyth";
import { getLatestPrice } from "../utils/prices";
import suiClient from "../sui-sdk/client";
import Decimal from "decimal.js";

export const cetusPoolMap: { [key: string]: string } = {
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_CETUS_POOL_ID,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_CETUS_POOL_ID,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_CETUS_POOL_ID,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_CETUS_POOL_ID,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_CETUS_POOL_ID,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
  "VSUI-SUI": conf[CONF_ENV].VSUI_SUI_CETUS_POOL_ID,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_CETUS_POOL_ID,
  "USDC-CETUS": conf[CONF_ENV].USDC_CETUS_CETUS_POOL_ID,
  "BUCK-USDC": conf[CONF_ENV].BUCK_USDC_CETUS_POOL_ID,
};

export const cetusInvestorMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_CETUS_INVESTOR,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_CETUS_INVESTOR,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_CETUS_INVESTOR,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_CETUS_INVESTOR,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_CETUS_INVESTOR,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_CETUS_INVESTOR,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_CETUS_INVESTOR,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_CETUS_INVESTOR,
  "BUCK-USDC": conf[CONF_ENV].BUCK_USDC_CETUS_INVESTOR,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_CETUS_INVESTOR,
};

export const poolMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL,
  "USDT-USDC": conf[CONF_ENV].USDC_USDT_POOL,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_POOL,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_POOL,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_POOL,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_POOL,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_POOL,
  "NAVX-SUI": conf[CONF_ENV].NAVX_SUI_POOL,
  "BUCK-USDC": conf[CONF_ENV].BUCK_USDC_POOL,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_POOL,
};

export const receiptNameMap: { [key in string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_POOL_RECEIPT_NAME,
  "HASUI-SUI": conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT_NAME,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_POOL_RECEIPT_NAME,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_POOL_RECEIPT_NAME,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_POOL_RECEIPT_NAME,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT_NAME,
  "BUCK-USDC": conf[CONF_ENV].BUCK_USDC_POOL_RECEIPT_NAME,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_POOL_RECEIPT_NAME,
  "NAVI-VSUI": conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT_NAME,
  "NAVI-SUI": conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT_NAME,
  "NAVI-HASUI": conf[CONF_ENV].NAVI_HASUI_POOL_RECEIPT_NAME,
};

export const poolCoinPairMap: Record<
  Exclude<
    PoolName,
    "NAVI-VSUI" | "NAVI-SUI" | "NAVI-WETH" | "NAVI-USDC" | "NAVI-USDT" | "ALPHA"
  >,
  { coinA: CoinName; coinB: CoinName }
> = {
  "USDT-USDC": { coinA: "USDT", coinB: "USDC" },
  "ALPHA-SUI": { coinA: "ALPHA", coinB: "SUI" },
  "HASUI-SUI": { coinA: "HASUI", coinB: "SUI" },
  "USDY-USDC": { coinA: "USDY", coinB: "USDC" },
  "USDC-SUI": { coinA: "USDC", coinB: "SUI" },
  "WETH-USDC": { coinA: "WETH", coinB: "USDC" },
  "USDC-WBTC": { coinA: "USDC", coinB: "WBTC" },
  "NAVX-SUI": { coinA: "NAVX", coinB: "SUI" },
  "BUCK-USDC": { coinA: "BUCK", coinB: "USDC" },
  "CETUS-SUI": { coinA: "CETUS", coinB: "SUI" },
};

export const poolCoinMap: Record<
  Extract<
    PoolName,
    "NAVI-VSUI" | "NAVI-SUI" | "NAVI-WETH" | "NAVI-USDC" | "NAVI-USDT" | "ALPHA"
  >,
  CoinName
> = {
  ALPHA: "ALPHA",
  "NAVI-VSUI": "VSUI",
  "NAVI-SUI": "SUI",
  "NAVI-WETH": "WETH",
  "NAVI-USDC": "USDC",
  "NAVI-USDT": "USDT",
};

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
  };
} = {
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
  },
  "USDT-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDT_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDT_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDT_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDT_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDT_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDT_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDT_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDY-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDY_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDY_USDC_POOL,
    investorId: conf[CONF_ENV].USDY_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDY_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDY_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDY_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDY_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDY_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
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
  "WETH-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WETH_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WETH_USDC_POOL,
    investorId: conf[CONF_ENV].WETH_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WETH_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WETH_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].WETH_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].WETH_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].WETH_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
  },
  "USDC-WBTC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_WBTC_POOL,
    investorId: conf[CONF_ENV].USDC_WBTC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].USDC_WBTC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].USDC_WBTC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].USDC_WBTC_POOL_LIQUIDITY_CHANGE_EVENT,
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
  },
  "BUCK-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].BUCK_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].BUCK_USDC_POOL,
    investorId: conf[CONF_ENV].BUCK_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].BUCK_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].BUCK_USDC_POOL_RECEIPT,
    autoCompoundingEventType:
      conf[CONF_ENV].BUCK_USDC_POOL_AUTO_COMPOUNDING_EVENT,
    rebalanceEventType: conf[CONF_ENV].BUCK_USDC_POOL_REBALANCE_EVENT,
    liquidityChangeEventType:
      conf[CONF_ENV].BUCK_USDC_POOL_LIQUIDITY_CHANGE_EVENT,
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

export const poolIdPoolNameMap: {
  [key: string]: PoolName;
} = {
  [conf[CONF_ENV].ALPHAFI_NAVI_SUI_POOL]: "NAVI-SUI",
  [conf[CONF_ENV].ALPHAFI_NAVI_VSUI_POOL]: "NAVI-VSUI",
  [conf[CONF_ENV].ALPHAFI_NAVI_WETH_POOL]: "NAVI-WETH",
  [conf[CONF_ENV].ALPHAFI_NAVI_USDT_POOL]: "NAVI-USDT",
  [conf[CONF_ENV].ALPHAFI_NAVI_USDC_POOL]: "NAVI-USDC",
  [conf[CONF_ENV].ALPHA_POOL]: "ALPHA",
  [conf[CONF_ENV].ALPHA_SUI_POOL]: "ALPHA-SUI",
  [conf[CONF_ENV].HASUI_SUI_POOL]: "HASUI-SUI",
  [conf[CONF_ENV].USDC_USDT_POOL]: "USDT-USDC",
  [conf[CONF_ENV].USDY_USDC_POOL]: "USDY-USDC",
  [conf[CONF_ENV].USDC_SUI_POOL]: "USDC-SUI",
  [conf[CONF_ENV].WETH_USDC_POOL]: "WETH-USDC",
  [conf[CONF_ENV].USDC_WBTC_POOL]: "USDC-WBTC",
  [conf[CONF_ENV].NAVX_SUI_POOL]: "NAVX-SUI",
  [conf[CONF_ENV].CETUS_SUI_POOL]: "CETUS-SUI",
  [conf[CONF_ENV].BUCK_USDC_POOL]: "BUCK-USDC",
};

export const coinNameTypeMap: { [key in CoinName]: CoinType } = {
  ALPHA: conf[CONF_ENV].ALPHA_COIN_TYPE as CoinType,
  SUI: "0x2::sui::SUI",
  USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
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
  SOL: "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
  SLP: "0xc44d97a4bc4e5a33ca847b72b123172c88a6328196b71414f32c3070233604b2::slp::SLP",
  WBTC: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
  CELO: "0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN",
  TURBOS:
    "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS",
  HASUI:
    "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
  USDY: "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",
  BUCK: "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
};

export const poolIdQueryPoolMap: { [key: string]: string } = {
  // alpha pool
  "0x6ee8f60226edf48772f81e5986994745dae249c2605a5b12de6602ef1b05b0c1":
    "alphaPool",
  // cetus pools
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiPool",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "usdcUsdtPool",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyUsdcPool",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiUsdcPool",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethUsdcPool",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcUsdcPool",
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
    "usdcPool",
};

export const poolIdQueryCetusPoolMap: { [key: string]: string } = {
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiCetusPool",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "usdcUsdtCetusPool",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyUsdcCetusPool",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiUsdcCetusPool",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethUsdcCetusPool",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcUsdcCetusPool",
  "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0":
    "navxSuiCetusPool",
};

export const poolIdQueryInvestorMap: { [key: string]: string } = {
  "0x594f13b8f287003fd48e4264e7056e274b84709ada31e3657f00eeedc1547e37":
    "alphaSuiInvestor",
  "0x30066d9879374276dc01177fbd239a9377b497bcd347c82811d75fcda35b18e5":
    "usdcUsdtInvestor",
  "0xa7239a0c727c40ee3a139689b16b281acfd0682a06c23531b184a61721ece437":
    "usdyUsdcInvestor",
  "0xee6f6392cbd9e1997f6e4cf71db0c1ae1611f1f5f7f23f90ad2c64b8f23cceab":
    "suiUsdcInvestor",
  "0xbdf4f673b34274f36be284bca3f765083380fefb29141f971db289294bf679c6":
    "wethUsdcInvestor",
  "0x676fc5cad79f51f6a7d03bfa3474ecd3c695d322380fc68e3d4f61819da3bf8a":
    "wbtcUsdcInvestor",
  "0x045e4e3ccd383bedeb8fda54c39a7a1b1a6ed6a9f66aec4998984373558f96a0":
    "navxSuiInvestor",
};

// Pagination needed for more than 50 pools
export async function getPoolExchangeRateMap(): Promise<Map<PoolName, string>> {
  const poolNameToConversionRateMap = new Map<PoolName, string>();

  const poolIds = Object.keys(poolIdPoolNameMap);
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
    const conversionRate = (xTokenSupply !== 0) ? (tokensInvested.div(xTokenSupply).toString()) : "0";
    poolNameToConversionRateMap.set(poolIdPoolNameMap[poolId], conversionRate);
  }

  return poolNameToConversionRateMap;
}

// Pagination needed for more than 50 pools
export async function getCetusSqrtPriceMap(): Promise<Map<PoolName, string>> {
  const poolNameToSqrtPriceMap = new Map<PoolName, string>();

  const cetusPools = Object.values(cetusPoolMap);
  const res = await suiClient.multiGetObjects({
    ids: cetusPools,
    options: {
      showContent: true,
    },
  });
  for (const poolRawData of res) {
    const poolDetails = poolRawData.data as CetusPoolType;
    const poolId = poolDetails.objectId;
    const pool = Object.keys(cetusPoolMap).find(
      (key) => cetusPoolMap[key] === poolId,
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
  for (const coin of coins) {
    const priceOfCoin = (await getLatestPrice(
      `${coin}/USD` as PythPriceIdPair,
    )) as string;
    coinNameToPriceMap.set(coin, priceOfCoin);
  }

  return coinNameToPriceMap;
}
