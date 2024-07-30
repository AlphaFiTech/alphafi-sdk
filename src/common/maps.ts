import { conf, CONF_ENV } from "./constants";

export const cetusPoolMap: { [key: string]: string } = {
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_CETUS_POOL_ID,
  "CETUS-SUI": conf[CONF_ENV].CETUS_SUI_CETUS_POOL_ID,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_CETUS_POOL_ID,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_CETUS_POOL_ID,
  "HASUI-SUI": conf[CONF_ENV].HaSUI_SUI_CETUS_POOL_ID,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_POOL_ID,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_CETUS_POOL_ID,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_CETUS_POOL_ID,
};

export const cetusInvestorMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_CETUS_INVESTOR,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_CETUS_INVESTOR,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_CETUS_INVESTOR,
  "HASUI-SUI": conf[CONF_ENV].HaSUI_SUI_CETUS_INVESTOR,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_CETUS_INVESTOR,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_CETUS_INVESTOR,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_CETUS_INVESTOR,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_CETUS_INVESTOR,
};

export const poolMap: { [key: string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL,
  "USDT-USDC": conf[CONF_ENV].USDC_USDT_POOL,
  "HASUI-SUI": conf[CONF_ENV].HaSUI_SUI_POOL,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_POOL,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_POOL,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_POOL,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_POOL,
};

export const receiptNameMap: { [key in string]: string } = {
  ALPHA: conf[CONF_ENV].ALPHA_POOL_RECEIPT_NAME,
  "ALPHA-SUI": conf[CONF_ENV].ALPHA_SUI_POOL_RECEIPT_NAME,
  "USDT-USDC": conf[CONF_ENV].USDT_USDC_POOL_RECEIPT_NAME,
  "HASUI-SUI": conf[CONF_ENV].HaSUI_SUI_POOL_RECEIPT_NAME,
  "USDY-USDC": conf[CONF_ENV].USDY_USDC_POOL_RECEIPT_NAME,
  "USDC-SUI": conf[CONF_ENV].USDC_SUI_POOL_RECEIPT_NAME,
  "WETH-USDC": conf[CONF_ENV].WETH_USDC_POOL_RECEIPT_NAME,
  "USDC-WBTC": conf[CONF_ENV].USDC_WBTC_POOL_RECEIPT_NAME,
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
};
