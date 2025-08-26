import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  dryRunTransactionBlock,
  getExecStuff,
  simulateTransactionBlock,
} from "./utils";
import dotenv from "dotenv";
import { PoolName, SwapOptions } from "../src/common/types";
import { Decimal } from "decimal.js";
import { SevenKGateway } from "../src/transactions/7k";
import { poolInfo } from "../src/common/maps";
import { coinsList } from "../src/common/coins";
import { BN } from "bn.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { zapDepositTxb1 } from "../src";

dotenv.config();

async function getCoinObject(
  coinType: string,
  tx: Transaction,
  suiClient: SuiClient,
  address: string,
): Promise<TransactionObjectArgument> {
  let currentCursor: string | null | undefined = null;
  let coins1: CoinStruct[] = [];
  do {
    const response = await suiClient.getCoins({
      owner: address,
      coinType,
      cursor: currentCursor,
    });
    coins1 = coins1.concat(response.data);
    if (response.hasNextPage && response.nextCursor) {
      currentCursor = response.nextCursor;
    } else break;
  } while (true);

  const [coin] = tx.splitCoins(tx.object(coins1[0].coinObjectId), [0]);
  tx.mergeCoins(
    coin,
    coins1.map((c) => c.coinObjectId),
  );
  return coin;
}

async function runTest() {
  const { address, suiClient, keypair } = getExecStuff();
  const txb = await zapDepositTxb1(
    100_000n,
    false,
    "BLUEFIN-SUIUSDT-USDC",
    0.01,
    address,
  );
  //   const txb = new Transaction();
  //   const coinObject = await getCoinObject(
  //     coinsList["USDC"].type,
  //     txb,
  //     suiClient,
  //     address,
  //   );
  //   const coinIn = txb.splitCoins(coinObject, [3246n]);
  //   const swapOptions: SwapOptions = {
  //     pair: {
  //       coinA: coinsList["USDC"],
  //       coinB: coinsList["USDT"],
  //     },
  //     senderAddress: address,
  //     slippage: 0.01,
  //     inAmount: new BN(3246n),
  //   };
  //   const swapResult = await zapSwap(
  //     swapOptions,
  //     txb,
  //     "BLUEFIN-SUIUSDT-USDC",
  //     coinIn,
  //   );
  //   txb.transferObjects([coinObject], address);
  //   if (swapResult) txb.transferObjects([swapResult.coinOut], address);
  if (txb) {
    txb.setGasBudget(1_000_000_000n);
    await suiClient
      .signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
        requestType: "WaitForLocalExecution",
        options: {
          showEffects: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        },
      })
      .then((res) => {
        console.log(JSON.stringify(res, null, 2));
      })
      .catch((error) => {
        console.error(error);
      });
    // await simulateTransactionBlock(txb);
  }
}

runTest();
