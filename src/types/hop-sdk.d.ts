declare module "@hop.ag/sdk" {
  export interface HopApiOptions {
    api_key: string;
    fee_bps: number;
    charge_fees_in_sui?: boolean;
    fee_wallet?: string;
    hop_server_url?: string;
  }

  export interface GammaTrade {
    [key: string]: any;
  }

  export interface GetQuoteParams {
    token_in: string;
    token_out: string;
    amount_in: bigint;
  }

  export interface GetQuoteResponse {
    amount_out_with_fee: bigint;
    trade: GammaTrade;
  }

  export interface GetTxParams {
    trade: GammaTrade;
    sui_address: string;
    gas_budget?: number;
    max_slippage_bps?: number;
    sponsored?: boolean;
    base_transaction?: any;
    input_coin_argument?: any;
    return_output_coin_argument?: boolean;
  }

  export interface GetTxResponse {
    transaction: any;
    output_coin: any;
  }

  export class HopApi {
    readonly client: any;
    readonly options: HopApiOptions;
    readonly use_v2: boolean;

    constructor(rpc_endpoint: string, options: HopApiOptions, use_v2?: boolean);

    fetchQuote(quote: GetQuoteParams): Promise<GetQuoteResponse>;
    fetchTx(tx: GetTxParams): Promise<GetTxResponse>;
    fetchTokens(): Promise<any>;
    fetchPrice(price: any): Promise<any>;
  }
}
