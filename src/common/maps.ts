import { conf, CONF_ENV } from "./constants";
import { PoolReceipt } from "./types";

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

export const poolPairMap: {
  [key in string]: { pool1: string; pool2: string };
} = {
  "USDT-USDC": { pool1: "USDT", pool2: "USDC" },
  "ALPHA-SUI": { pool1: "ALPHA", pool2: "SUI" },
  "HASUI-SUI": { pool1: "HASUI", pool2: "SUI" },
  "USDY-USDC": { pool1: "USDY", pool2: "USDC" },
  "USDC-SUI": { pool1: "USDC", pool2: "SUI" },
  "WETH-USDC": { pool1: "WETH", pool2: "USDC" },
  "USDC-WBTC": { pool1: "USDC", pool2: "WBTC" },
  "NAVX-SUI": { pool1: "NAVX", pool2: "SUI" },
  "BUCK-USDC": { pool1: "BUCK", pool2: "USDC" },
  "CETUS-SUI": { pool1: "CETUS", pool2: "SUI" },
};

export const poolInfo: {
  [key: string]: {
    parentProtocolName: string;
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
  }
};
