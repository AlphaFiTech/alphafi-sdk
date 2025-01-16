import {
  buildTx,
  getQuote,
  QuoteResponse,
  setSuiClient,
} from "@7kprotocol/sdk-ts";
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { SwapOptions } from "../common/types.js";
import { getSuiClient } from "../sui-sdk/client.js";

export type sevenKSwapOptions = SwapOptions;

export class SevenKGateway {
  constructor() {
    const suiClient = getSuiClient();
    setSuiClient(suiClient);
  }

  async getQuote(options: sevenKSwapOptions, excludedPools?: string[]) {
    const { pair, inAmount } = options;
    if (inAmount) {
      const quoteResponse = await getQuote({
        tokenIn: pair.coinA.type,
        tokenOut: pair.coinB.type,
        amountIn: inAmount.toString(),
        excludedPools: excludedPools,
      });
      return quoteResponse;
    }
  }

  // getTransactionBlock returns a transaction and also returns a coinOut argument which is some coins left out that we have to transfer to the user seperately.
  async getTransactionBlock(
    options: sevenKSwapOptions,
    quoteResponse: QuoteResponse,
    transaction: Transaction | undefined = undefined,
  ): Promise<{
    tx: Transaction;
    coinOut: TransactionObjectArgument | undefined;
  }> {
    let txb = new Transaction();
    const { senderAddress, slippage } = options;
    if (transaction) txb = transaction;
    const commissionPartnerAddress =
      "0x401c29204828bed9a2f9f65f9da9b9e54b1e43178c88811e2584e05cf2c3eb6f";
    const { tx, coinOut } = await buildTx({
      quoteResponse,
      accountAddress: senderAddress,
      slippage: slippage, // 1%
      commission: {
        partner: commissionPartnerAddress,
        commissionBps: 0,
      },
      extendTx: {
        tx: txb,
      },
    });
    return { tx, coinOut };
  }
}
