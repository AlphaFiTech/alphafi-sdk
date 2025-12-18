import { AggregatorClient, RouterDataV3 } from "@cetusprotocol/aggregator-sdk";
// import { getFullnodeUrl } from '@mysten/sui/client/network.js';
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import BN from "bn.js";

// Re-export RouterDataV3 type for external use
export type { RouterDataV3 } from "@cetusprotocol/aggregator-sdk";

export class CetusSwap {
  network: "mainnet" | "testnet" | "devnet" | "localnet";
  client: AggregatorClient;
  cetusRouterDataV3: RouterDataV3 | null;

  constructor(network: "mainnet" | "testnet" | "devnet" | "localnet") {
    this.network = network;
    this.client = new AggregatorClient({});
    this.cetusRouterDataV3 = null;
  }

  async getCetusSwapQuote(
    from: string,
    target: string,
    amount: string,
    poolIds?: string[],
  ): Promise<RouterDataV3 | undefined> {
    try {
      // const providers = getAllProviders();

      const router = await this.client.findRouters({
        from,
        target,
        amount,
        byAmountIn: true, // `true` means fix input amount, `false` means fix output amount
        // providers: providers,
      });
      return router || undefined;
    } catch (error) {
      console.error("Error getting cetus swap quote", error);
      throw error;
    }
  }

  async cetusSwapTokensTxb(
    router: RouterDataV3,
    slippage: number,
    inputCoin?: TransactionObjectArgument,
    address?: string,
    existingTx?: Transaction,
  ): Promise<{ tx: Transaction; coinOut?: TransactionObjectArgument }> {
    try {
      if (!router) {
        throw new Error("No routers found");
      }

      // Use existing transaction if provided, otherwise create new one
      const txb = existingTx || new Transaction();

      if (inputCoin && address) {
        // Use routerSwapWithMaxAmountIn when explicit coin control is needed
        const coinOut = await this.client.routerSwapWithMaxAmountIn({
          router,
          txb,
          inputCoin,
          slippage: slippage || 0.01,
          maxAmountIn: new BN(router.amountIn.toString()),
        });

        // Return both transaction and target coin for use in zap deposits
        return { tx: txb, coinOut };
      } else {
        // Use fastRouterSwap for simple swaps
        await this.client.fastRouterSwap({
          router,
          txb,
          slippage: slippage || 0.01,
        });

        return { tx: txb };
      }
    } catch (error) {
      console.error("Error swapping tokens in cetus swap", error);
      throw error;
    }
  }
}
