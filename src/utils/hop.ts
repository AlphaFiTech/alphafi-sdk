import { GetTxParams, HopApi, HopApiOptions } from "@hop.ag/sdk";
import {
  GetQuoteParams,
  GetQuoteResponse,
} from "@hop.ag/sdk/dist/cjs/sdk/routes/quote";
import { SwapOptions } from "../common/types";
import { conf, CONF_ENV } from "../common/constants";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiNodeUrl } from "../sui-sdk/client";
import { coins } from "../common/coins";
import { getLatestPrice } from "./prices";
import BN from "bn.js";

export type HopSwapOptions = SwapOptions;

export const hopSDKOptions: HopApiOptions = {
  api_key: conf[CONF_ENV].HOP_API_KEY,
  fee_bps: conf[CONF_ENV].HOP_FEE_BPS,
  fee_wallet: conf[CONF_ENV].HOP_QUERY_WALLET,
};

export class HopGateway {
  private hopAPI: HopApi;

  constructor(sdkOptions: HopApiOptions) {
    const rpc_url = getSuiNodeUrl();
    this.hopAPI = new HopApi(rpc_url, sdkOptions);
  }

  async getQuote(
    options: HopSwapOptions,
    debug: boolean = false,
  ): Promise<GetQuoteResponse> {
    const { pair, inAmount, outAmount } = options;
    let amount: BN = new BN(0);
    if (inAmount) {
      amount = inAmount;
    } else if (outAmount) {
      amount = outAmount;
    }

    const params: GetQuoteParams = {
      token_in: pair.coinA.type,
      token_out: pair.coinB.type,
      amount_in: BigInt(amount.toString()),
    };

    if (debug) {
      console.debug("fetchQuote Params:");
      console.debug(params);
    }
    const quote = await this.hopAPI.fetchQuote(params);
    return quote;
  }

  async getTransactionBlock(
    options: HopSwapOptions,
    quote: GetQuoteResponse,
    debug: boolean = false,
    transaction: Transaction | undefined = undefined,
  ): Promise<Transaction> {
    const { senderAddress, slippage } = options;
    const splippageBPS = slippage * 100;

    let params: GetTxParams;
    if (transaction) {
      params = {
        trade: quote.trade,
        sui_address: senderAddress,
        max_slippage_bps: splippageBPS,
        base_transaction: transaction,
      };
    } else {
      params = {
        trade: quote.trade,
        sui_address: senderAddress,
        max_slippage_bps: splippageBPS,
      };
    }

    if (debug) {
      console.debug("fetchTx Params:");
      console.debug(params);
    }
    const trade = await this.hopAPI.fetchTx(params);

    return trade.transaction;
  }
}

export async function getBlubPrice(): Promise<number | undefined> {
  // return 1;
  const hopGateway = new HopGateway(hopSDKOptions);

  const swapOptions: HopSwapOptions = {
    pair: { coinA: coins.BLUB, coinB: coins.USDC },
    senderAddress:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e",
    inAmount: new BN(1_000_000_000),
    slippage: 1,
  };

  const res = await hopGateway.getQuote(swapOptions);
  const latestUSDCPrice = await getLatestPrice("USDC/USD");
  if (latestUSDCPrice) {
    return (
      Number(res.amount_out_with_fee) * Number(latestUSDCPrice) * 1e-6 * 1e-7
    );
  } else {
    return undefined;
  }
}

export async function getFudPrice(): Promise<number | undefined> {
  const hopGateway = new HopGateway(hopSDKOptions);

  const swapOptions: HopSwapOptions = {
    pair: { coinA: coins.FUD, coinB: coins.USDC },
    senderAddress:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e",
    inAmount: new BN(1_000_000_000_000),
    slippage: 1,
  };

  const res = await hopGateway.getQuote(swapOptions);
  const latestUSDCPrice = await getLatestPrice("USDC/USD");
  if (latestUSDCPrice) {
    return (
      Number(res.amount_out_with_fee) * Number(latestUSDCPrice) * 1e-6 * 1e-7
    );
  } else {
    return undefined;
  }
}
export async function getWsolPrice(): Promise<number | undefined> {
  const hopGateway = new HopGateway(hopSDKOptions);

  const swapOptions: HopSwapOptions = {
    pair: { coinA: coins.WSOL, coinB: coins.USDC },
    senderAddress:
      "0x4260738f0f7341adc79a8edaa62f8a4681ebd27c595aecab1f322f47bfc52c5e",
    inAmount: new BN(1_000_000_00),
    slippage: 1,
  };

  const res = await hopGateway.getQuote(swapOptions);
  const latestUSDCPrice = await getLatestPrice("USDC/USD");
  if (latestUSDCPrice) {
    return Number(res.amount_out_with_fee) * Number(latestUSDCPrice) * 1e-6;
  } else {
    return undefined;
  }
}
