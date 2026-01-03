import {
  buildTx,
  getQuote,
  QuoteResponse,
  MetaAg,
  MetaQuote,
} from "@7kprotocol/sdk-ts";
import {
  coinWithBalance,
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

export class SevenKGateway {
  // metaAg: MetaAg;
  constructor() {
    // this.metaAg = new MetaAg();
  }

  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    excludedPools?: string[],
  ): Promise<MetaQuote> {
    // const quoteResponse = await getQuote({
    //   tokenIn,
    //   tokenOut,
    //   amountIn,
    //   excludedPools,
    // });
    const metaAg = new MetaAg();
    const quotes = await metaAg.quote({
      coinInType: tokenIn,
      coinOutType: tokenOut,
      amountIn,
      // excludedPools,
    });
    const bestQuote = quotes.sort(
      (a, b) =>
        Number(b.simulatedAmountOut || b.amountOut) -
        Number(a.simulatedAmountOut || a.amountOut),
    )[0];
    console.log("quoteResponse", bestQuote);
    return bestQuote;
  }

  async getTransactionBlock(
    tx: Transaction,
    address: string,
    quoteResponse: MetaQuote,
    slippage: number,
    coinIn?: TransactionObjectArgument,
  ): Promise<TransactionObjectArgument | undefined> {
    console.log(
      "quoteResponse",
      quoteResponse,
      slippage,
      coinIn,
      address,
      quoteResponse.amountIn.toString(),
    );
    const metaAg = new MetaAg({
      partner: address,
      partnerCommissionBps: 0,
    });
    const coinOut = await metaAg.swap(
      {
        quote: quoteResponse,
        signer: address,
        coinIn: coinWithBalance({
          balance: BigInt(quoteResponse.amountIn || "0"),
          type: quoteResponse.coinTypeIn,
        }),
        tx,
      },
      slippage * 100 || 100, //1%

      // slippage,
      // commission: {
      //   partner: address, // Use the user's address as partner
      //   commissionBps: 0, // 0 basis points = no commission
      // },
      // extendTx: {
      //   tx,
      //   coinIn,
      // },
    );
    console.log("coinOut", coinOut);
    console.log("coinIn", coinIn);
    if (coinIn === undefined) {
      tx.transferObjects([coinOut], address);
    }

    return coinOut;
  }
}
