import { CoinName, CoinPair } from "../../common/types";
import BN from "bn.js";

export type CetusSwapOptions = SwapOptions;

export type TickSpacing = 2 | 10 | 60 | 200;

export type CreatePoolOptions = {
  tickSpacing: TickSpacing;
  initializePrice: number;
  imageUrl: string;
  coinNameA: CoinName;
  coinNameB: CoinName;
  amount: number;
  isAmountA: boolean;
};

export type SwapOptions = {
  pair: CoinPair;
  senderAddress: string;
  slippage: number;
} & ({ inAmount: BN; outAmount?: never } | { outAmount: BN; inAmount?: never });
