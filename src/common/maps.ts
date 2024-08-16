import { conf, CONF_ENV } from "./constants";
import { CoinName, ParentProtocolName, PoolName, PoolReceipt } from "./types";

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
  };
} = {
  "NAVI-SUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_SUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_SUI_POOL,
    investorId: conf[CONF_ENV].NAVI_SUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_SUI_POOL_RECEIPT,
  },
  "NAVI-VSUI": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_VSUI_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_VSUI_POOL,
    investorId: conf[CONF_ENV].NAVI_VSUI_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_VSUI_POOL_RECEIPT,
  },
  "NAVI-WETH": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_WETH_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_WETH_POOL,
    investorId: conf[CONF_ENV].NAVI_WETH_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_WETH_POOL_RECEIPT,
  },
  "NAVI-USDT": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDT_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDT_POOL,
    investorId: conf[CONF_ENV].NAVI_USDT_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDT_POOL_RECEIPT,
  },
  "NAVI-USDC": {
    parentProtocolName: "NAVI",
    parentPoolId: conf[CONF_ENV].NAVI_USDC_POOL,
    poolId: conf[CONF_ENV].ALPHAFI_NAVI_USDC_POOL,
    investorId: conf[CONF_ENV].NAVI_USDC_INVESTOR,
    receiptName: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVI_USDC_POOL_RECEIPT,
  },
  ALPHA: {
    parentProtocolName: "ALPHAFI",
    parentPoolId: conf[CONF_ENV].ALPHA_POOL,
    poolId: conf[CONF_ENV].ALPHA_POOL,
    investorId: conf[CONF_ENV].ALPHA_POOL,
    receiptName: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_POOL_RECEIPT,
  },
  "ALPHA-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].ALPHA_SUI_POOL,
    investorId: conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT,
  },
  "HASUI-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].HASUI_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].HASUI_SUI_POOL,
    investorId: conf[CONF_ENV].HASUI_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].HASUI_SUI_POOL_RECEIPT,
  },
  "USDT-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDT_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_USDT_POOL,
    investorId: conf[CONF_ENV].USDT_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDT_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDT_USDC_POOL_RECEIPT,
  },
  "USDY-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDY_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDY_USDC_POOL,
    investorId: conf[CONF_ENV].USDY_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDY_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDY_USDC_POOL_RECEIPT,
  },
  "USDC-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_SUI_POOL,
    investorId: conf[CONF_ENV].USDC_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_SUI_POOL_RECEIPT,
  },
  "WETH-USDC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].WETH_USDC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].WETH_USDC_POOL,
    investorId: conf[CONF_ENV].WETH_USDC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].WETH_USDC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].WETH_USDC_POOL_RECEIPT,
  },
  "USDC-WBTC": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].USDC_WBTC_POOL,
    investorId: conf[CONF_ENV].USDC_WBTC_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT,
  },
  "NAVX-SUI": {
    parentProtocolName: "CETUS",
    parentPoolId: conf[CONF_ENV].NAVX_SUI_CETUS_POOL_ID,
    poolId: conf[CONF_ENV].NAVX_SUI_POOL,
    investorId: conf[CONF_ENV].NAVX_SUI_CETUS_INVESTOR,
    receiptName: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT_NAME,
    receiptType: conf[CONF_ENV].NAVX_SUI_POOL_RECEIPT,
  },
};

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
