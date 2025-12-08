import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { getExecStuff, simulateTransactionBlock } from "./utils";
import dotenv from "dotenv";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import {
  zapDepositQuoteTxb,
  zapDepositTxb,
} from "../src/transactions/zapDeposit";
import { getConf, getWithdrawRequestsAndUnsuppliedAmount } from "../src";
import { getAvailableRewards } from "../src/transactions/get_navi_rewards";
import { naviDepositTx } from "../src/transactions/navi";

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

  if (coins1.length === 0) {
    throw new Error(`No coins found for ${coinType} for owner ${address}`);
  }

  const [coin] = tx.splitCoins(tx.object(coins1[0].coinObjectId), [0n]);
  tx.mergeCoins(
    coin,
    coins1.map((c) => c.coinObjectId),
  );
  return coin;
}

async function runTest() {
  const { address, suiClient, keypair } = getExecStuff();
  // zapDepositTxb 200000000n true BLUEFIN-STSUI-SUI 0.01 0x8983f49747f2c700a15dd22508a0af973b4f961c5c90fe7750188d8099e3fa1a
  // const tx = await zapDepositTxb(
  //   100_000_000n,
  //   true,
  //   "BLUEFIN-STSUI-SUI",
  //   0.01,
  //   address, // "0xdad8b77b746f38cbac5044eb7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
  // );
  const tx = await naviDepositTx("100000", "NAVI-VSUI", { address });
  // const quote = await zapDepositQuoteTxb(
  //   100_000n,
  //   false,
  //   "BLUEFIN-SUI-USDC",
  //   0.01,
  // );
  // console.log(quote);
  if (tx) {
    tx.setGasBudget(1_000_000_000n);
    // await suiClient
    //   .signAndExecuteTransaction({
    //     signer: keypair,
    //     transaction: tx,
    //     requestType: "WaitForLocalExecution",
    //     options: {
    //       showEffects: true,
    //       showBalanceChanges: true,
    //       showObjectChanges: true,
    //     },
    //   })
    //   .then((res) => {
    //     console.log(JSON.stringify(res, null, 2));
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
    await simulateTransactionBlock(tx);
  }
}
// runTest();

async function getAvailableRewardsTest() {
  const rewards = await getAvailableRewards(
    getConf().NAVI_VSUI_ACCOUNT_ADDRESS,
  );
  console.log("rewards", rewards);
}
// getAvailableRewardsTest();

async function getValue() {
  console.log("hi bro", await getWithdrawRequestsAndUnsuppliedAmount());
}
getValue();
