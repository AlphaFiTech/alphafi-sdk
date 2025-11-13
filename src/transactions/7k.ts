import { buildTx, getQuote, QuoteResponse } from "@7kprotocol/sdk-ts";
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

export class SevenKGateway {
  constructor() {}

  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    excludedPools?: string[],
  ) {
    const quoteResponse = await getQuote({
      tokenIn,
      tokenOut,
      amountIn,
      excludedPools,
    });
    return quoteResponse;
  }

  async getTransactionBlock(
    tx: Transaction,
    address: string,
    quoteResponse: QuoteResponse,
    slippage: number,
    coinIn?: TransactionObjectArgument,
  ): Promise<TransactionObjectArgument | undefined> {
    const { coinOut } = await buildTx({
      quoteResponse,
      accountAddress: address,
      slippage,
      commission: {
        partner: address, // Use the user's address as partner
        commissionBps: 0, // 0 basis points = no commission
      },
      extendTx: {
        tx,
        coinIn,
      },
    });

    return coinOut;
  }
}
